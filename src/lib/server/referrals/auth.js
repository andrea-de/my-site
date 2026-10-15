import { env } from '$env/dynamic/private';
// @ts-ignore Node builtin types are not installed in this JS-only project.
import { createHash, timingSafeEqual } from 'node:crypto';

export const SITE_URL = (env.PUBLIC_SITE_URL || 'https://www.andreadecandia.com').replace(/\/+$/, '');

/** The public link for a code. */
export const referralUrl = (code) => `${SITE_URL}/r/${code}`;

/**
 * Whether the request carries the job-links token. With no token configured nothing is
 * authorized, not even in dev, since the dev server talks to the production Redis.
 * @param {Request} request
 */
export function isReferralsAuthorized(request) {
	const token = env.REFERRALS_API_TOKEN || '';
	if (!token) return false;
	const authorization = request.headers.get('authorization') || '';
	if (!authorization.toLowerCase().startsWith('bearer ')) return false;
	// Hashed first so the comparison takes the same time whatever was sent.
	const digest = (value) => createHash('sha256').update(value).digest();
	return timingSafeEqual(digest(authorization.slice(7).trim()), digest(token));
}

// The same answer as an unknown route, so the API doesn't advertise itself.
export const notFound = () => new Response('Not found', { status: 404 });
