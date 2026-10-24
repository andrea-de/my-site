import { redirect } from '@sveltejs/kit';
import { hasAdminSession } from '$lib/server/admin';

// admin.<site domain> opens the dashboard, or the login when signed out. Every other path
// works there as on www., so the login form and the dashboard's own links keep working.
export async function handle({ event, resolve }) {
	if (event.url.hostname.startsWith('admin.') && event.url.pathname === '/') {
		throw redirect(303, hasAdminSession(event.cookies) ? '/dashboard' : '/admin');
	}
	return resolve(event);
}
