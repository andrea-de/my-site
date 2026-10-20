// The admin login: a password for a 14-day session (see $lib/server/admin).
import { fail, redirect } from '@sveltejs/kit';
import {
	adminSessionExpiry,
	checkPassword,
	clearFailures,
	endAdminSession,
	isLockedOut,
	recordFailure,
	startAdminSession
} from '$lib/server/admin';
import { markOwner, OWNER_COOKIE, unmarkOwner } from '$lib/server/owner';

const DASHBOARD = '/api/visits';

export function load({ cookies, setHeaders }) {
	setHeaders({ 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex' });
	return {
		expiresAt: adminSessionExpiry(cookies),
		ownerMarked: cookies.get(OWNER_COOKIE) === '1'
	};
}

export const actions = {
	login: async ({ request, cookies, url, getClientAddress }) => {
		const address = getClientAddress();
		if (await isLockedOut(address)) {
			return fail(429, { error: 'Too many wrong passwords. Try again in 15 minutes.' });
		}
		const form = await request.formData();
		if (!checkPassword(form.get('password'))) {
			await recordFailure(address);
			return fail(401, { error: 'Wrong password.' });
		}
		await clearFailures(address);
		startAdminSession(cookies, url);
		// Logging in also stops this browser's visits being counted, for good.
		markOwner(cookies);
		throw redirect(303, DASHBOARD);
	},

	logout: ({ cookies, url }) => {
		endAdminSession(cookies, url);
		throw redirect(303, '/admin');
	},

	// Count this browser's visits again (also logs out, since a session counts as the owner).
	unmark: ({ cookies, url }) => {
		endAdminSession(cookies, url);
		unmarkOwner(cookies);
		throw redirect(303, '/admin');
	}
};
