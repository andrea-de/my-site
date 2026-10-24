import { dev } from '$app/environment';
import { json, redirect } from '@sveltejs/kit';
import { storeVisitSummary } from '$lib/server/visit-store';
import { isVisitsAdminLanding, normalizeSummary } from '$lib/server/visits/normalize';
import { wantsJson } from '$lib/server/visits/request';
import { getSessionAiUsage } from '$lib/server/ai-cost';
import { isOwner } from '$lib/server/owner';
import { dashboardGet, dashboardPost } from '$lib/server/visits/dashboard-route';

// The visits API: the tracker posts each visit's summary here, and format=json (with the
// token or an admin session) returns the dashboard's data. The page itself is /dashboard.
export async function POST({ request, url, cookies }) {
	try {
		const contentType = request.headers.get('content-type') || '';
		if (contentType.includes('application/x-www-form-urlencoded')) {
			return dashboardPost(request, url, cookies);
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

// A browser asking for the page goes to /dashboard; JSON stays here.
export async function GET({ request, url, cookies }) {
	if (!wantsJson(request, url)) throw redirect(308, `/dashboard${url.search}`);
	return dashboardGet(request, url, cookies);
}
