// The notes history of a job link: where notes between Andrea and Claude settle once handled.
// POST appends one entry (by "claude" unless said otherwise). See README "Job links".
import { json } from '@sveltejs/kit';
import { isReferralsAuthorized, notFound, referralUrl } from '$lib/server/referrals/auth';
import { appendHistory, normalizeCode } from '$lib/server/referrals/store';
import { readJsonObject, checkAuthor, checkText } from '$lib/server/referrals/notes-input';

const missing = (code) => json({ error: `No job link "${code}".` }, { status: 404 });

export async function POST({ request, params }) {
	if (!isReferralsAuthorized(request)) return notFound();
	const code = normalizeCode(params.code);
	if (!code) return missing(params.code);

	const body = await readJsonObject(request);
	if (!body) return json({ error: 'Body must be a JSON object.' }, { status: 400 });
	const unknown = Object.keys(body).filter((k) => !['text', 'by'].includes(k));
	if (unknown.length) return json({ error: `Unknown field(s): ${unknown.join(', ')}. Allowed: text, by.` }, { status: 400 });
	const text = checkText(body.text, { required: true });
	if (text.error) return json({ error: text.error }, { status: 400 });
	const by = checkAuthor(body.by);
	if (by.error) return json({ error: by.error }, { status: 400 });

	const record = await appendHistory(code, [{ by: by.value, text: text.value }]);
	if (!record) return missing(params.code);
	const { jobDescription, ...rest } = record;
	return json({ ...rest, url: referralUrl(code) });
}

