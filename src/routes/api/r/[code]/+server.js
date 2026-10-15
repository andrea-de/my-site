// One job link: read (with its visit log), update, delete. See README "Job links".
import { json } from '@sveltejs/kit';
import { isReferralsAuthorized, notFound, referralUrl } from '$lib/server/referrals/auth';
import {
	deleteReferral,
	getReferral,
	getReferralLog,
	normalizeCode,
	updateReferral
} from '$lib/server/referrals/store';
import { validateReferralInput } from '$lib/server/referrals/validate';

const missing = (code) => json({ error: `No job link "${code}".` }, { status: 404 });

export async function GET({ request, params }) {
	if (!isReferralsAuthorized(request)) return notFound();
	const code = normalizeCode(params.code);
	const record = code ? await getReferral(code) : null;
	if (!record) return missing(params.code);

	return json({ ...record, url: referralUrl(code), log: await getReferralLog(code) });
}

export async function PATCH({ request, params }) {
	if (!isReferralsAuthorized(request)) return notFound();
	const code = normalizeCode(params.code);
	if (!code) return missing(params.code);

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Body must be valid JSON.' }, { status: 400 });
	}

	const { fields, errors } = validateReferralInput(body, { partial: true });
	if (errors) return json({ error: errors.join(' '), errors }, { status: 400 });

	const record = await updateReferral(code, fields);
	if (!record) return missing(params.code);
	return json({ ...record, url: referralUrl(code) });
}

export async function DELETE({ request, params }) {
	if (!isReferralsAuthorized(request)) return notFound();
	const code = normalizeCode(params.code);
	if (!code || !(await deleteReferral(code))) return missing(params.code);
	return json({ deleted: code });
}
