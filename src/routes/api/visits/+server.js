import { dev } from '$app/environment';
import { json } from '@sveltejs/kit';
import { getVisitDashboardData, storeVisitSummary, wipeVisitData } from '$lib/server/visit-store';
import { isAuthorized } from '$lib/server/visits/auth';
import { dedupeRecentVisits } from '$lib/server/visits/dashboard-data';
import { renderDashboardHtml } from '$lib/server/visits/dashboard-render';
import { isVisitsAdminLanding, normalizeSummary } from '$lib/server/visits/normalize';
import { parseDashboardRequest, wantsJson } from '$lib/server/visits/request';
import { toShortString } from '$lib/server/visits/shared';

async function handleAdminPost(request, url) {
	if (!isAuthorized(request, url)) {
		return new Response('Not found', { status: 404 });
	}

	const formData = await request.formData();
	const adminAction = toShortString(formData.get('adminAction'));
	if (adminAction !== 'wipe') {
		return json({ error: 'Unknown admin action' }, { status: 400 });
	}

	await wipeVisitData();

	const redirectUrl = new URL(url);
	redirectUrl.searchParams.set('wiped', '1');
	return new Response(null, {
		status: 303,
		headers: {
			location: `${redirectUrl.pathname}?${redirectUrl.searchParams.toString()}`
		}
	});
}

export async function POST({ request, url }) {
	try {
		const contentType = request.headers.get('content-type') || '';
		if (contentType.includes('application/x-www-form-urlencoded')) {
			return handleAdminPost(request, url);
		}

		const body = await request.json();
		const summary = normalizeSummary(body, request);
		if (!summary.sessionId) {
			return json({ error: 'Missing session id' }, { status: 400 });
		}

		if (isVisitsAdminLanding(summary.landingPath)) {
			return json({ success: true, skipped: true, reason: 'visits-admin-route' });
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

export async function GET({ request, url }) {
	if (!isAuthorized(request, url)) {
		return new Response('Not found', { status: 404 });
	}

	const { limit, uniqueOnly, date, wasWiped } = parseDashboardRequest(url);
	const dashboard = await getVisitDashboardData({ limit, date });
	const totalRecentVisits = dashboard.recentVisits.length;

	if (uniqueOnly) {
		dashboard.recentVisits = dedupeRecentVisits(dashboard.recentVisits);
	}
	dashboard.wasWiped = wasWiped;

	if (wantsJson(request, url)) {
		return json({
			mode: dashboard.mode,
			date: dashboard.date,
			limit,
			filters: { uniqueOnly },
			summary: dashboard.summary,
			breakdowns: dashboard.breakdowns,
			recentVisits: dashboard.recentVisits
		});
	}

	return new Response(renderDashboardHtml(dashboard, request, url, { limit, date, uniqueOnly, totalRecentVisits }), {
		headers: {
			'content-type': 'text/html; charset=utf-8',
			'cache-control': 'private, no-store'
		}
	});
}
