// A link's activity (visit log and counters) can be cleared, keeping the link: for opens that
// turned out to be automated before the scanner filter existed. See README "Job links".
import { json } from '@sveltejs/kit';
import { isReferralsAuthorized, notFound } from '$lib/server/referrals/auth';
import { normalizeCode, resetReferralActivity } from '$lib/server/referrals/store';

export async function DELETE({ request, params }) {
	if (!isReferralsAuthorized(request)) return notFound();
	const code = normalizeCode(params.code);
	if (!code || !(await resetReferralActivity(code)))
		return json({ error: `No job link "${params.code}".` }, { status: 404 });
	return json({ reset: code });
}
