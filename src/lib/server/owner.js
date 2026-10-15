// Andrea's own browsing: logging in at /admin marks the browser with a cookie that outlasts
// the session, and from then on its visits aren't counted and nothing is sent to Telegram.
// "Count this browser again" on /admin clears it. Anyone could forge the mark, but it only
// hides their own visits.
import { hasAdminSession } from '$lib/server/admin';

export const OWNER_COOKIE = 'owner';
const OWNER_SECONDS = 60 * 60 * 24 * 730;

export function markOwner(cookies) {
	cookies.set(OWNER_COOKIE, '1', { path: '/', maxAge: OWNER_SECONDS, httpOnly: true, sameSite: 'lax' });
}

export function unmarkOwner(cookies) {
	cookies.delete(OWNER_COOKIE, { path: '/' });
}

/** True for Andrea's own browser: marked, or logged in. */
export function isOwner({ cookies }) {
	return cookies?.get(OWNER_COOKIE) === '1' || hasAdminSession(cookies);
}
