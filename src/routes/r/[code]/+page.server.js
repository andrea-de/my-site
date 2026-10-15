// A job link: the page Andrea's résumé points a company to. Unknown and closed codes go
// to the home page, the same as each other, so nothing says which codes exist.
import { redirect } from '@sveltejs/kit';
import { getReferral, normalizeCode } from '$lib/server/referrals/store';
import { logReferralPageLoad } from '$lib/server/referrals/visit';

export async function load({ params, request, setHeaders }) {
	setHeaders({ 'x-robots-tag': 'noindex, nofollow', 'cache-control': 'private, no-store' });

	const code = normalizeCode(params.code);
	let record = null;
	try {
		record = code ? await getReferral(code) : null;
	} catch (e) {
		console.error('[REFERRALS] Failed to load', code, e);
	}
	if (record?.status !== 'active') throw redirect(303, '/');

	try {
		await logReferralPageLoad(record, request);
	} catch (e) {
		console.warn('[REFERRALS] Failed to log visit for', code, e);
	}

	// Only what the page shows: never the job description or the private notes.
	return {
		code,
		company: record.company,
		role: record.role,
		region: record.region === 'eu' ? 'eu' : 'us',
		greeting: record.greeting || null,
		projects: record.projects || []
	};
}
