// Whether the job behind a link has actually been applied to. Agents POST here right after
// submitting an application (channel "ats"); a pitch email counts once it is sent (channel
// "email", also the dashboard's "Email sent" toggle). See README "Job links".
import { json } from '@sveltejs/kit';
import { isReferralsAuthorized, notFound, referralUrl } from '$lib/server/referrals/auth';
import {
	APPLIED_CHANNELS,
	getReferral,
	normalizeCode,
	setApplied
} from '$lib/server/referrals/store';

const missing = (code) => json({ error: `No job link "${code}".` }, { status: 404 });

async function readBody(request) {
	const text = await request.text();
	if (!text.trim()) return {};
	try {
		const body = JSON.parse(text);
		return body && typeof body === 'object' && !Array.isArray(body) ? body : null;
	} catch {
		return null;
	}
}

/** { channel, at?, note? } → the checked values, or an error sentence. */
function checkInput(body, { needsTime }) {
	if (!body) return { error: 'Body must be a JSON object.' };
	const unknown = Object.keys(body).filter((k) => !['channel', 'at', 'note'].includes(k));
	if (unknown.length)
		return { error: `Unknown field(s): ${unknown.join(', ')}. Allowed: channel, at, note.` };

	const channel = body.channel ?? 'ats';
	if (!APPLIED_CHANNELS.includes(channel))
		return { error: `"channel" must be one of: ${APPLIED_CHANNELS.join(', ')}.` };
	if (!needsTime) return { channel };

	let at = new Date().toISOString();
	if (body.at !== undefined) {
		const time = new Date(body.at);
		if (typeof body.at !== 'string' || Number.isNaN(time.getTime()))
			return { error: '"at" must be an ISO date-time.' };
		at = time.toISOString();
	}
	if (body.note !== undefined && (typeof body.note !== 'string' || body.note.length > 500)) {
		return { error: '"note" must be a string of at most 500 characters.' };
	}
	return { channel, at, note: body.note?.trim() || null };
}

async function answer(code) {
	const record = await getReferral(code);
	if (!record) return missing(code);
	const { jobDescription, ...rest } = record;
	return json({ ...rest, url: referralUrl(code) });
}

/** Marks the job applied to through `channel` (default "ats"). Repeating it only updates the time and note. */
export async function POST({ request, params }) {
	if (!isReferralsAuthorized(request)) return notFound();
	const code = normalizeCode(params.code);
	if (!code) return missing(params.code);

	const input = checkInput(await readBody(request), { needsTime: true });
	if (input.error) return json({ error: input.error }, { status: 400 });
	if (!(await setApplied(code, input.channel, { at: input.at, note: input.note })))
		return missing(params.code);
	return answer(code);
}

/** Clears one channel's mark, e.g. a mistaken one: DELETE with {"channel":"email"}. */
export async function DELETE({ request, params }) {
	if (!isReferralsAuthorized(request)) return notFound();
	const code = normalizeCode(params.code);
	if (!code) return missing(params.code);

	const input = checkInput(await readBody(request), { needsTime: false });
	if (input.error) return json({ error: input.error }, { status: 400 });
	if (!(await setApplied(code, input.channel, null))) return missing(params.code);
	return answer(code);
}
