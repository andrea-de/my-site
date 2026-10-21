// /shorts/<code>: the shorts feed for one job link, whose cover greets the company. The same
// rules as /r/<code>: unknown, closed or not yet filled-in codes go to plain /shorts, all
// alike, so nothing says which codes exist. A visit is logged against the link, marked as
// the shorts page.
import { redirect } from '@sveltejs/kit';
import { getReferral, normalizeCode } from '$lib/server/referrals/store';
import { logReferralPageLoad } from '$lib/server/referrals/visit';
import { isOwner } from '$lib/server/owner';

export async function load({ params, request, setHeaders, cookies, url }) {
	setHeaders({ 'x-robots-tag': 'noindex, nofollow', 'cache-control': 'private, no-store' });

	const code = normalizeCode(params.code);
	let record = null;
	try {
		record = code ? await getReferral(code) : null;
	} catch (e) {
		console.error('[REFERRALS] Failed to load', code, e);
	}
	if (record?.status !== 'active' || !record.company) throw redirect(303, `/shorts${url.search}`);

	if (!isOwner({ cookies })) {
		try {
			await logReferralPageLoad(record, request, { page: 'shorts' });
		} catch (e) {
			console.warn('[REFERRALS] Failed to log visit for', code, e);
		}
	}

	return { code, company: record.company };
}
