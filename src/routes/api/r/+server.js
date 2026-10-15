// Job links API for Andrea's job-hunting agents: create and list. See README "Job links".
import { json } from '@sveltejs/kit';
import { isReferralsAuthorized, notFound, referralUrl } from '$lib/server/referrals/auth';
import { createReferral, listReferrals } from '$lib/server/referrals/store';
import { validateReferralInput } from '$lib/server/referrals/validate';

export async function POST({ request }) {
	if (!isReferralsAuthorized(request)) return notFound();

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Body must be valid JSON.' }, { status: 400 });
	}

	const { fields, errors } = validateReferralInput(body);
	if (errors) return json({ error: errors.join(' '), errors }, { status: 400 });

	// Nulls only mean something on a PATCH.
	for (const key of Object.keys(fields)) if (fields[key] === null) delete fields[key];

	const record = await createReferral(fields);
	return json({ code: record.code, url: referralUrl(record.code), record }, { status: 201 });
}

export async function GET({ request }) {
	if (!isReferralsAuthorized(request)) return notFound();

	// The list stays light: no job descriptions.
	const links = (await listReferrals()).map(({ jobDescription, ...rest }) => ({
		...rest,
		url: referralUrl(rest.code)
	}));
	return json({ links });
}
