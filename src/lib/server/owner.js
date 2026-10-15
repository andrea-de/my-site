// Andrea's own browsing: opening any page with ?ignore=true marks the browser with a
// cookie, and from then on its visits aren't counted and nothing is sent to Telegram.
// ?ignore=false clears it. Anyone could set it, but it only hides their own visits.
export const OWNER_COOKIE = 'owner';
const ON = /^(1|true|yes)$/i;
const OFF = /^(0|false|no)$/i;

/** Sets or clears the cookie when the URL asks; called from hooks.server.js. */
export function applyOwnerParam({ url, cookies }) {
	const asked = url.searchParams.get('ignore');
	if (asked === null) return;
	if (ON.test(asked)) {
		cookies.set(OWNER_COOKIE, '1', { path: '/', maxAge: 60 * 60 * 24 * 730, httpOnly: true, sameSite: 'lax' });
	} else if (OFF.test(asked)) {
		cookies.delete(OWNER_COOKIE, { path: '/' });
	}
}

/** True for Andrea's own browser, including the request that sets the cookie. */
export function isOwner({ url, cookies }) {
	const asked = url?.searchParams.get('ignore');
	if (asked !== null && asked !== undefined && OFF.test(asked)) return false;
	return cookies?.get(OWNER_COOKIE) === '1' || (asked != null && ON.test(asked));
}
