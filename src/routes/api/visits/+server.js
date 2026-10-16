import { dev } from '$app/environment';
import { json } from '@sveltejs/kit';
import {
	deleteVisitSummaries,
	getVisitDashboardData,
	storeVisitSummary,
	wipeVisitData
} from '$lib/server/visit-store';
import { isAuthorized } from '$lib/server/visits/auth';
import { dedupeRecentVisits } from '$lib/server/visits/dashboard-data';
import { renderDashboardHtml } from '$lib/server/visits/dashboard-render';
import { isVisitsAdminLanding, normalizeSummary } from '$lib/server/visits/normalize';
import { parseDashboardRequest, wantsJson } from '$lib/server/visits/request';
import { toShortString } from '$lib/server/visits/shared';
import { getSessionAiUsage } from '$lib/server/ai-cost';
import { isOwner } from '$lib/server/owner';
import { getJobLinksData } from '$lib/server/visits/job-links';
import {
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

async function handleAdminPost(request, url, cookies) {
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
	if (['jobStatus', 'jobDelete', 'jobReset', 'jobEmail'].includes(adminAction)) {
		const code = normalizeCode(formData.get('code'));
		if (!code) return json({ error: 'Missing or invalid job-link code' }, { status: 400 });

		// The "Email sent" toggle: on once Andrea has sent the pitch email for this job.
		if (adminAction === 'jobEmail') {
			const sent = toShortString(formData.get('sent')) === '1';
			const done = await setApplied(code, 'email', sent ? { at: new Date().toISOString() } : null);
			return redirectAfterJobAction(url, code, done ? (sent ? 'emailSent' : 'emailUnsent') : 'missing');
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

export async function POST({ request, url, cookies }) {
	try {
		const contentType = request.headers.get('content-type') || '';
		if (contentType.includes('application/x-www-form-urlencoded')) {
			return handleAdminPost(request, url, cookies);
		}

		const body = await request.json();
		const summary = normalizeSummary(body, request);
		if (!summary.sessionId) {
			return json({ error: 'Missing session id' }, { status: 400 });
		}

		if (isOwner({ cookies })) {
			return json({ success: true, skipped: true, reason: 'owner' });
		}

		if (summary.automated) {
			return json({ success: true, skipped: true, reason: 'automated' });
		}

		if (isVisitsAdminLanding(summary.landingPath)) {
			return json({ success: true, skipped: true, reason: 'visits-admin-route' });
		}

		try {
			const aiUsage = await getSessionAiUsage(summary.sessionId);
			if (aiUsage && aiUsage.totalTokens > 0) {
				summary.aiTokens = aiUsage.totalTokens;
				summary.aiCostUsd = aiUsage.totalCostUsd;
			}
		} catch (e) {
			// Non-blocking
		}

		const storageResult = await storeVisitSummary(summary);
		if (dev) {
			console.log('[VISIT TRACKER]', summary);
		}

		return json({
			success: true,
			mode: storageResult.mode,
			visitType: summary.visitType,
			engagementScore: summary.engagementScore
		});
	} catch (error) {
		console.error('[VISIT API] Failed to persist visit summary:', error);
		return json({ error: 'Failed to store visit summary' }, { status: 500 });
	}
}

export async function GET({ request, url, cookies }) {
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
