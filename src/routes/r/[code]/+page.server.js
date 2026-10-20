// A job link: the page Andrea's résumé points a company to. Unknown and closed codes go
// to the home page, the same as each other, so nothing says which codes exist.
import { redirect } from '@sveltejs/kit';
import { getReferral, normalizeCode } from '$lib/server/referrals/store';
import { logReferralPageLoad } from '$lib/server/referrals/visit';
import { isOwner } from '$lib/server/owner';

export async function load({ params, request, setHeaders, cookies }) {
	setHeaders({ 'x-robots-tag': 'noindex, nofollow', 'cache-control': 'private, no-store' });

	const code = normalizeCode(params.code);
	let record = null;
	try {
		record = code ? await getReferral(code) : null;
	} catch (e) {
		console.error('[REFERRALS] Failed to load', code, e);
	}
	// A job Andrea just added has no company yet: nothing to show until Claude fills it in.
	if (record?.status !== 'active' || !record.company) throw redirect(303, '/');

	// Andrea checking a link (logged in at /admin) sees the page without logging a visit.
	if (!isOwner({ cookies })) {
		try {
			await logReferralPageLoad(record, request);
		} catch (e) {
			console.warn('[REFERRALS] Failed to log visit for', code, e);
		}
	}

	// Only what the page shows: never the job description or the private notes.
	return {
		code,
		company: record.company,
		role: record.role,
		region: record.region === 'eu' ? 'eu' : 'us',
		greeting: record.greeting || null,
		fitPoints: record.fitPoints || []
	};
}
