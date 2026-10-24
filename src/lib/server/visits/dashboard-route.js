// The dashboard (/dashboard): its page, its JSON and its form posts. /api/visits answers the
// same JSON and posts (for the visit tracker and older links) and sends a browser here.
import { json } from '@sveltejs/kit';
import { deleteVisitSummaries, getVisitDashboardData, wipeVisitData } from '$lib/server/visit-store';
import { isAuthorized } from '$lib/server/visits/auth';
import { dedupeRecentVisits } from '$lib/server/visits/dashboard-data';
import { renderDashboardHtml } from '$lib/server/visits/dashboard-render';
import { parseDashboardRequest, wantsJson } from '$lib/server/visits/request';
import { toShortString } from '$lib/server/visits/shared';
import { getJobLinksData } from '$lib/server/visits/job-links';
import { NOTE_MAX, STAGES } from '$lib/server/referrals/validate';
import { hasAdminSession } from '$lib/server/admin';
import {
	archiveNotes,
	createReferral,
	deleteReferral,
	normalizeCode,
	resetReferralActivity,
	setApplied,
	updateReferral
} from '$lib/server/referrals/store';

// Back to the dashboard with the job link open and a notice of what happened to it.
function redirectAfterJobAction(url, code, result) {
	const redirectUrl = new URL(url);
	redirectUrl.searchParams.set('job', code);
	redirectUrl.searchParams.set('jobResult', result);
	const hash = result === 'deleted' || result === 'missing' ? '#jobs' : `#job-${code}`;
	return new Response(null, {
		status: 303,
		headers: { location: `${redirectUrl.pathname}?${redirectUrl.searchParams.toString()}${hash}` }
	});
}

/** The dashboard's form posts (visits, job links). */
export async function dashboardPost(request, url, cookies) {
	if (!isAuthorized(request, cookies)) {
		return new Response('Not found', { status: 404 });
	}

	const formData = await request.formData();
	const adminAction = toShortString(formData.get('adminAction'));
	if (adminAction === 'wipe') {
		await wipeVisitData();

		const redirectUrl = new URL(url);
		redirectUrl.searchParams.set('wiped', '1');
		return new Response(null, {
			status: 303,
			headers: {
				location: `${redirectUrl.pathname}?${redirectUrl.searchParams.toString()}#stats`
			}
		});
	}

	// Several rows at once, chosen in the Visits tab's select mode.
	if (adminAction === 'deleteMany') {
		const deleteVisitor = toShortString(formData.get('deleteMode')) === 'visitor';
		const sessionIds = formData.getAll('sessionId').map(toShortString);
		const visitorIds = formData.getAll('visitorId').map(toShortString);
		const targets = sessionIds
			.slice(0, 200)
			.map((sessionId, n) => ({ sessionId, visitorId: visitorIds[n] || '' }));
		if (targets.length) await deleteVisitSummaries({ targets, deleteVisitor });
		return new Response(null, {
			status: 303,
			headers: { location: `${url.pathname}?${url.searchParams.toString()}#visits` }
		});
	}

	if (adminAction === 'delete') {
		await deleteVisitSummaries({
			sessionId: toShortString(formData.get('sessionId')),
			visitorId: toShortString(formData.get('visitorId')),
			deleteVisitor: toShortString(formData.get('deleteMode')) === 'visitor'
		});

		return new Response(null, {
			status: 303,
			headers: {
				location: `${url.pathname}?${url.searchParams.toString()}#visits`
			}
		});
	}

	// Job links: the same store the bearer-token API uses, called directly so the page never
	// needs REFERRALS_API_TOKEN.
	// Notes and new jobs: only from Andrea's logged-in browser. Like every action here they come
	// as form posts, which SvelteKit refuses unless they come from the site's own origin.
	if (['jobCreate', 'jobNoteForClaude', 'jobDismissNote', 'jobNeedsDone'].includes(adminAction)) {
		if (!hasAdminSession(cookies)) return new Response('Not found', { status: 404 });
		const note = (name) => String(formData.get(name) || '').replace(/\r\n?/g, '\n').trim();

		// "+ New job": a posting Andrea found, with what Claude should do about it.
		if (adminAction === 'jobCreate') {
			const jobUrl = note('jobUrl');
			if (!/^https?:\/\/[^\s]+$/i.test(jobUrl) || jobUrl.length > 2000)
				return json({ error: 'The job URL must be an http(s) URL.' }, { status: 400 });
			const company = note('company').slice(0, 120);
			const role = note('role').slice(0, 160);
			const noteForClaude = note('noteForClaude').slice(0, NOTE_MAX);
			const now = new Date().toISOString();
			const record = await createReferral({
				jobUrl,
				...(company && { company }),
				...(role && { role }),
				foundBy: 'andrea',
				stage: 'not-started',
				...(noteForClaude && { noteForClaude, noteForClaudeAt: now })
			});
			return redirectAfterJobAction(url, record.code, 'created');
		}

		const code = normalizeCode(formData.get('code'));
		if (!code) return json({ error: 'Missing or invalid job-link code' }, { status: 400 });

		// The "For Claude" box: saving a note makes it Claude's turn; empty clears it.
		if (adminAction === 'jobNoteForClaude') {
			const text = note('noteForClaude');
			if (text.length > NOTE_MAX) return json({ error: `The note is too long (max ${NOTE_MAX} characters).` }, { status: 400 });
			const record = await updateReferral(code, { noteForClaude: text || null });
			return redirectAfterJobAction(url, code, record ? (text ? 'noteSaved' : 'noteCleared') : 'missing');
		}

		// "Dismiss" on the For you box (and the old "Done"): Claude's note settles into the history.
		const record = await archiveNotes(code, { only: 'noteForAndrea' });
		return redirectAfterJobAction(url, code, record ? 'noteDismissed' : 'missing');
	}

	if (['jobStatus', 'jobDelete', 'jobReset', 'jobEmail', 'jobStage'].includes(adminAction)) {
		const code = normalizeCode(formData.get('code'));
		if (!code) return json({ error: 'Missing or invalid job-link code' }, { status: 400 });

		// The "Email sent" toggle: on once Andrea has sent the pitch email for this job.
		if (adminAction === 'jobEmail') {
			const sent = toShortString(formData.get('sent')) === '1';
			const done = await setApplied(code, 'email', sent ? { at: new Date().toISOString() } : null);
			return redirectAfterJobAction(url, code, done ? (sent ? 'emailSent' : 'emailUnsent') : 'missing');
		}

		if (adminAction === 'jobStage') {
			const stage = toShortString(formData.get('stage'));
			if (!STAGES.includes(stage)) return json({ error: `Stage must be one of: ${STAGES.join(', ')}` }, { status: 400 });
			const record = await updateReferral(code, { stage });
			return redirectAfterJobAction(url, code, record ? 'stage' : 'missing');
		}

		if (adminAction === 'jobReset') {
			const reset = await resetReferralActivity(code);
			return redirectAfterJobAction(url, code, reset ? 'reset' : 'missing');
		}

		if (adminAction === 'jobDelete') {
			const deleted = await deleteReferral(code);
			return redirectAfterJobAction(url, code, deleted ? 'deleted' : 'missing');
		}

		const status = toShortString(formData.get('status'));
		if (status !== 'active' && status !== 'closed') {
			return json({ error: 'Status must be active or closed' }, { status: 400 });
		}
		const record = await updateReferral(code, { status });
		return redirectAfterJobAction(url, code, record ? status : 'missing');
	}

	return json({ error: 'Unknown admin action' }, { status: 400 });
}

/** The dashboard page, or its data as JSON (format=json or Accept: application/json). */
export async function dashboardGet(request, url, cookies) {
	if (!isAuthorized(request, cookies)) {
		return new Response('Not found', { status: 404 });
	}

	const asJson = wantsJson(request, url);
	// The page shows 10 rows to start ("Show more" asks for more); JSON keeps its 20.
	const { limit, uniqueOnly, date, wasWiped, jobNotice, includeUncounted } = parseDashboardRequest(url, {
		defaultLimit: asJson ? 20 : 10
	});
	const now = Date.now();
	const [dashboard, jobLinks] = await Promise.all([
		getVisitDashboardData({ limit, date, includeUncounted }),
		getJobLinksData({ now })
	]);
	const totalRecentVisits = dashboard.recentVisits.length;

	if (uniqueOnly) {
		dashboard.recentVisits = dedupeRecentVisits(dashboard.recentVisits);
	}
	dashboard.wasWiped = wasWiped;

	if (asJson) {
		return json({
			mode: dashboard.mode,
			date: dashboard.date,
			limit,
			filters: { uniqueOnly, includeUncounted },
			hiddenUncounted: dashboard.hiddenUncounted || 0,
			summary: dashboard.summary,
			breakdowns: dashboard.breakdowns,
			recentVisits: dashboard.recentVisits,
			// Without the job descriptions, as in GET /api/r; the log is the newest entries.
			jobLinks: {
				summary: jobLinks.summary,
				...(jobLinks.error && { error: jobLinks.error }),
				links: jobLinks.links.map(({ jobDescription, ...link }) => link)
			}
		});
	}

	const html = renderDashboardHtml(dashboard, request, url, {
		limit,
		date,
		uniqueOnly,
		includeUncounted,
		totalRecentVisits,
		jobLinks,
		jobNotice,
		now
	});
	return new Response(html, {
		headers: {
			'content-type': 'text/html; charset=utf-8',
			'cache-control': 'private, no-store'
		}
	});
}
