// What a visitor on a job link does next (opens a project, the résumé, the chat), posted by
// the page. Public, so it takes only known events, only for active codes, and answers the
// same either way so it reveals nothing about which codes exist.
import { json } from '@sveltejs/kit';
import { countWithin, getReferral, normalizeCode, recordReferralEntry } from '$lib/server/referrals/store';
import { PROJECT_IDS } from '$lib/server/referrals/validate';
import { isOwner } from '$lib/server/owner';

// chat_question is a count only: the conversation itself is logged by the chat.
const EVENTS = ['project_open', 'resume_open', 'chat_open', 'chat_question'];
const MAX_EVENTS_PER_MINUTE = 30;

const accepted = () => new Response(null, { status: 204 });

export async function POST({ request, params, url, cookies }) {
	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Body must be valid JSON.' }, { status: 400 });
	}

	const type = body?.type;
	if (!EVENTS.includes(type)) {
		return json({ error: `"type" must be one of: ${EVENTS.join(', ')}.` }, { status: 400 });
	}
	const project = type === 'project_open' && PROJECT_IDS.includes(body.project) ? body.project : undefined;
	if (type === 'project_open' && !project) {
		return json({ error: '"project" must be a known project id.' }, { status: 400 });
	}

	const code = normalizeCode(params.code);
	if (!code || isOwner({ url, cookies })) return accepted();
	try {
		if ((await countWithin(`event:${code}`, 60)) > MAX_EVENTS_PER_MINUTE) return accepted();
		const record = await getReferral(code);
		if (record?.status !== 'active') return accepted();
		await recordReferralEntry(code, { type, ...(project && { project }) });
	} catch (e) {
		console.warn('[REFERRALS] Failed to record event:', e);
	}
	return accepted();
}
