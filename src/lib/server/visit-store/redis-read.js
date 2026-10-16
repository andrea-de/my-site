import {
	REDIS_RECENT_VISITS_KEY,
	REDIS_RECENT_VISITS_LIST_KEY,
	VISIT_UNIQUE_VISITORS_PREFIX,
	isVisitsAdminLanding,
	normalizeStoredVisit
} from './shared';
import { sortHashEntries } from './summary';

/**
 * The newest visits, newest first. Visits never counted (no sign of a person: see
 * redis-write) are left out unless asked for; `hidden` says how many were.
 */
export async function getRecentRedisVisitSummaries(redis, limit = 10, { includeUncounted = false } = {}) {
	const recentListSessionIds = await redis.lrange(REDIS_RECENT_VISITS_LIST_KEY, 0, 199);
	const sessionIds = [...new Set((recentListSessionIds || []).filter(Boolean))];
	if (sessionIds.length === 0) {
		const fallback = (await redis.zrange(REDIS_RECENT_VISITS_KEY, 0, Math.max(0, limit - 1))) || [];
		sessionIds.push(...fallback);
	}
	const payloads = sessionIds.length ? await redis.mget(...sessionIds.map((id) => `visit:${id}`)) : [];

	const visits = [];
	let hidden = 0;
	for (const payload of payloads) {
		const visit = normalizeStoredVisit(payload);
		if (!visit || isVisitsAdminLanding(visit)) continue;
		if (visit.counted === false && !includeUncounted) {
			hidden += 1;
			continue;
		}
		if (visits.length < limit) visits.push(visit);
	}
	return Object.assign(visits, { hidden });
}

export async function getRedisDashboardData(redis, { limit = 20, date, includeUncounted = false }) {
	const recentVisits = await getRecentRedisVisitSummaries(redis, limit, { includeUncounted });
	const breakdownBase = `visit-breakdown:${date}`;
	const [rawDailyStats, rawLandingBreakdown, rawReferrerBreakdown, rawCountryBreakdown, rawDeviceBreakdown, uniqueVisitors, rawAiStats] =
		await Promise.all([
			redis.hgetall(`visit-stats:${date}`),
			redis.hgetall(`${breakdownBase}:landing`),
			redis.hgetall(`${breakdownBase}:referrer`),
			redis.hgetall(`${breakdownBase}:country`),
			redis.hgetall(`${breakdownBase}:device`),
			redis.scard(`${VISIT_UNIQUE_VISITORS_PREFIX}:${date}`),
			redis.hgetall(`ai-stats:${date}`)
		]);

	return {
		mode: 'redis',
		date,
		recentVisits: [...recentVisits],
		hiddenUncounted: recentVisits.hidden,
		summary: {
			uniqueVisitors: Number(uniqueVisitors || 0),
			totalVisits: Number(rawDailyStats?.visits_total || 0),
			finalSilent: Number(rawDailyStats?.final_silent || 0),
			finalAgent: Number(rawDailyStats?.final_agent || 0),
			finalContact: Number(rawDailyStats?.final_contact || 0),
			resumeInterest: Number(rawDailyStats?.final_resume_clicks || 0),
			projectInterest: Number(rawDailyStats?.final_project_interest || 0),
			contactViews: Number(rawDailyStats?.final_contact_views || 0),
			totalAiTokens: Number(rawAiStats?.total_tokens || 0),
			totalAiCostUsd: Math.round(Number(rawAiStats?.total_cost_usd || 0) * 10000) / 10000
		},
		breakdowns: {
			landing: sortHashEntries(rawLandingBreakdown),
			referrer: sortHashEntries(rawReferrerBreakdown),
			country: sortHashEntries(rawCountryBreakdown),
			device: sortHashEntries(rawDeviceBreakdown)
		}
	};
}
