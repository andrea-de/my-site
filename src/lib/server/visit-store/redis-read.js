import {
	REDIS_RECENT_VISITS_KEY,
	REDIS_RECENT_VISITS_LIST_KEY,
	VISIT_UNIQUE_VISITORS_PREFIX,
	isVisitsAdminLanding,
	normalizeStoredVisit
} from './shared';
import { sortHashEntries } from './summary';

export async function getRecentRedisVisitSummaries(redis, limit = 10) {
	const recentListSessionIds = await redis.lrange(REDIS_RECENT_VISITS_LIST_KEY, 0, 199);
	const dedupedSessionIds = [];
	const seenSessionIds = new Set();

	for (const sessionId of recentListSessionIds || []) {
		if (!sessionId || seenSessionIds.has(sessionId)) continue;
		seenSessionIds.add(sessionId);
		dedupedSessionIds.push(sessionId);
		if (dedupedSessionIds.length >= limit) break;
	}

	const sessionIds =
		dedupedSessionIds.length > 0
			? dedupedSessionIds
			: (await redis.zrange(REDIS_RECENT_VISITS_KEY, 0, Math.max(0, limit - 1))) || [];
	const visitPayloads = await Promise.all(sessionIds.map((sessionId) => redis.get(`visit:${sessionId}`)));

	return visitPayloads
		.map((payload) => normalizeStoredVisit(payload))
		.filter(Boolean)
		.filter((summary) => !isVisitsAdminLanding(summary));
}

export async function getRedisDashboardData(redis, { limit = 20, date }) {
	const recentVisits = await getRecentRedisVisitSummaries(redis, limit);
	const breakdownBase = `visit-breakdown:${date}`;
	const [rawDailyStats, rawLandingBreakdown, rawReferrerBreakdown, rawCountryBreakdown, rawDeviceBreakdown, uniqueVisitors] =
		await Promise.all([
			redis.hgetall(`visit-stats:${date}`),
			redis.hgetall(`${breakdownBase}:landing`),
			redis.hgetall(`${breakdownBase}:referrer`),
			redis.hgetall(`${breakdownBase}:country`),
			redis.hgetall(`${breakdownBase}:device`),
			redis.scard(`${VISIT_UNIQUE_VISITORS_PREFIX}:${date}`)
		]);

	return {
		mode: 'redis',
		date,
		recentVisits,
		summary: {
			uniqueVisitors: Number(uniqueVisitors || 0),
			totalVisits: Number(rawDailyStats?.visits_total || 0),
			finalSilent: Number(rawDailyStats?.final_silent || 0),
			finalAgent: Number(rawDailyStats?.final_agent || 0),
			finalContact: Number(rawDailyStats?.final_contact || 0),
			resumeInterest: Number(rawDailyStats?.final_resume_clicks || 0),
			projectInterest: Number(rawDailyStats?.final_project_interest || 0),
			contactViews: Number(rawDailyStats?.final_contact_views || 0)
		},
		breakdowns: {
			landing: sortHashEntries(rawLandingBreakdown),
			referrer: sortHashEntries(rawReferrerBreakdown),
			country: sortHashEntries(rawCountryBreakdown),
			device: sortHashEntries(rawDeviceBreakdown)
		}
	};
}
