// Archive: the notes on a job link have been handled. Each non-empty note moves into the
// history as its author's entry (noteForAndrea by claude, noteForClaude by andrea) and is
// cleared; an optional `text` adds Claude's entry saying what was done. `only` limits it to
// one note. See README "Job links".
import { json } from '@sveltejs/kit';
import { isReferralsAuthorized, notFound, referralUrl } from '$lib/server/referrals/auth';
import { archiveNotes, normalizeCode } from '$lib/server/referrals/store';
import { readJsonObject, checkText } from '$lib/server/referrals/notes-input';

const missing = (code) => json({ error: `No job link "${code}".` }, { status: 404 });
const NOTES = ['noteForAndrea', 'noteForClaude'];

export async function POST({ request, params }) {
	if (!isReferralsAuthorized(request)) return notFound();
	const code = normalizeCode(params.code);
	if (!code) return missing(params.code);

	const body = await readJsonObject(request);
	if (!body) return json({ error: 'Body must be a JSON object.' }, { status: 400 });
	const unknown = Object.keys(body).filter((k) => !['text', 'only'].includes(k));
	if (unknown.length) return json({ error: `Unknown field(s): ${unknown.join(', ')}. Allowed: text, only.` }, { status: 400 });
	if (body.only !== undefined && !NOTES.includes(body.only))
		return json({ error: `"only" must be one of: ${NOTES.join(', ')}.` }, { status: 400 });
	const text = checkText(body.text);
	if (text.error) return json({ error: text.error }, { status: 400 });

	const record = await archiveNotes(code, { only: body.only, text: text.value });
	if (!record) return missing(params.code);
	const { jobDescription, ...rest } = record;
	return json({ ...rest, url: referralUrl(code) });
}
