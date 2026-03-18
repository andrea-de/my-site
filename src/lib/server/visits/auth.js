import { dev } from '$app/environment';
import { env as privateEnv } from '$env/dynamic/private';

export function getAdminToken() {
	return privateEnv.VISITS_ADMIN_TOKEN || '';
}

export function getProvidedToken(request, url) {
	const queryToken = url.searchParams.get('token');
	if (queryToken) return queryToken;

	const headerToken = request.headers.get('x-visits-token');
	if (headerToken) return headerToken;

	const authorization = request.headers.get('authorization') || '';
	if (authorization.toLowerCase().startsWith('bearer ')) {
		return authorization.slice(7).trim();
	}

	return '';
}

export function isAuthorized(request, url) {
	const adminToken = getAdminToken();
	if (!adminToken) return dev;
	return getProvidedToken(request, url) === adminToken;
}
