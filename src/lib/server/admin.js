// Andrea's admin login: one password, then a signed cookie for a day. The password is
// ADMIN_PASSWORD, or the old dashboard token (VISITS_ADMIN_TOKEN) until that's set.
// Changing the password signs every browser out, since it is also the signing key.
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
// @ts-ignore Node builtin types are not installed in this JS-only project.
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { getRedisClient } from '$lib/server/visit-store/client';

export const ADMIN_COOKIE = 'admin';
export const SESSION_SECONDS = 60 * 60 * 24;

// Wrong passwords: 5 per address in 15 minutes, then the form refuses until they expire.
const MAX_FAILURES = 5;
const FAILURE_WINDOW_SECONDS = 15 * 60;
const memoryFailures = new Map();

const password = () => env.ADMIN_PASSWORD || env.VISITS_ADMIN_TOKEN || '';

// Hashed first so the comparison takes the same time whatever was sent.
const digest = (value) => createHash('sha256').update(String(value)).digest();
const sameSecret = (a, b) => timingSafeEqual(digest(a), digest(b));
const sign = (value) =>
	createHmac('sha256', `admin-session:${password()}`).update(value).digest('base64url');

export function checkPassword(given) {
	const expected = password();
	return Boolean(expected) && typeof given === 'string' && sameSecret(given, expected);
}

/** True while the browser holds an unexpired session signed with the current password. */
export function hasAdminSession(cookies) {
	if (!password()) return false;
	const [expires, signature] = (cookies?.get(ADMIN_COOKIE) || '').split('.');
	if (!expires || !signature || Number(expires) <= Date.now()) return false;
	return sameSecret(signature, sign(expires));
}

/** @returns {number} when the session ends, in ms */
export function startAdminSession(cookies) {
	const expires = String(Date.now() + SESSION_SECONDS * 1000);
	cookies.set(ADMIN_COOKIE, `${expires}.${sign(expires)}`, {
		path: '/',
		maxAge: SESSION_SECONDS,
		httpOnly: true,
		secure: !dev,
		sameSite: 'lax'
	});
	return Number(expires);
}

export function endAdminSession(cookies) {
	cookies.delete(ADMIN_COOKIE, { path: '/' });
}

/** When the current session ends (ms), or 0. */
export function adminSessionExpiry(cookies) {
	return hasAdminSession(cookies) ? Number(cookies.get(ADMIN_COOKIE).split('.')[0]) : 0;
}

const failureKey = (address) => `admin:failures:${address}`;

export async function isLockedOut(address) {
	const redis = getRedisClient();
	if (redis) return Number(await redis.get(failureKey(address))) >= MAX_FAILURES;
	const entry = memoryFailures.get(address);
	return Boolean(entry && entry.until > Date.now() && entry.count >= MAX_FAILURES);
}

export async function recordFailure(address) {
	const redis = getRedisClient();
	if (redis) {
		const count = await redis.incr(failureKey(address));
		if (count === 1) await redis.expire(failureKey(address), FAILURE_WINDOW_SECONDS);
		return;
	}
	const entry = memoryFailures.get(address);
	if (entry && entry.until > Date.now()) entry.count += 1;
	else memoryFailures.set(address, { count: 1, until: Date.now() + FAILURE_WINDOW_SECONDS * 1000 });
}

export async function clearFailures(address) {
	const redis = getRedisClient();
	if (redis) await redis.del(failureKey(address));
	else memoryFailures.delete(address);
}
