import { dev } from '$app/environment';
import { env as privateEnv } from '$env/dynamic/private';
import { hasAdminSession } from '$lib/server/admin';

export function getAdminToken() {
	return privateEnv.VISITS_ADMIN_TOKEN || '';
}

// Scripts send the token in a header; browsers log in at /admin. Never in the URL, where
// it would end up in history and logs.
export function getProvidedToken(request) {
	const headerToken = request.headers.get('x-visits-token');
	if (headerToken) return headerToken;

	const authorization = request.headers.get('authorization') || '';
	if (authorization.toLowerCase().startsWith('bearer ')) {
		return authorization.slice(7).trim();
	}

	return '';
}

export function isAuthorized(request, cookies) {
	if (hasAdminSession(cookies)) return true;
	const adminToken = getAdminToken();
	if (!adminToken) return dev;
	return getProvidedToken(request) === adminToken;
}
