import {
	getFinalBucket,
	getFinalMarkerKey,
	getVisitDateKey,
	normalizeField,
	normalizeStoredVisit,
	REDIS_RECENT_VISITS_KEY,
	REDIS_RECENT_VISITS_LIST_KEY,
	scanKeysByPattern,
	sortVisitsByEndedAtDesc,
	VISIT_TTL_SECONDS,
	VISIT_UNIQUE_VISITORS_PREFIX
} from './shared';

async function rebuildRedisVisitIndexes(redis, visits, finalizedSessionIds = new Set()) {
	const keyGroups = await Promise.all([
		scanKeysByPattern(redis, 'visit-stats:*'),
		scanKeysByPattern(redis, 'visit-breakdown:*'),
		scanKeysByPattern(redis, `${VISIT_UNIQUE_VISITORS_PREFIX}:*`),
		scanKeysByPattern(redis, 'visit-finalized:*')
	]);
	const keysToDelete = Array.from(
		new Set([...keyGroups.flat(), REDIS_RECENT_VISITS_KEY, REDIS_RECENT_VISITS_LIST_KEY])
	).filter(Boolean);

	if (keysToDelete.length > 0) await redis.del(...keysToDelete);

	const recentVisits = sortVisitsByEndedAtDesc(visits).slice(0, 200);
	for (let index = recentVisits.length - 1; index >= 0; index -= 1) {
		await redis.lpush(REDIS_RECENT_VISITS_LIST_KEY, recentVisits[index].sessionId);
	}
	if (recentVisits.length > 0) await redis.expire(REDIS_RECENT_VISITS_LIST_KEY, VISIT_TTL_SECONDS);

	for (const visit of visits) {
		const visitDate = getVisitDateKey(visit.startedAt);
		const dailyKey = `visit-stats:${visitDate}`;
		const breakdownBase = `visit-breakdown:${visitDate}`;
		const uniqueVisitorsKey = `${VISIT_UNIQUE_VISITORS_PREFIX}:${visitDate}`;

		await redis.hincrby(dailyKey, 'visits_total', 1);
		await redis.hincrby(`${breakdownBase}:landing`, normalizeField(visit.landingPath, '/'), 1);
		await redis.hincrby(`${breakdownBase}:country`, normalizeField(visit.country), 1);
		await redis.hincrby(`${breakdownBase}:device`, normalizeField(visit.device), 1);
		await redis.hincrby(`${breakdownBase}:referrer`, normalizeField(visit.referrerHost, 'direct'), 1);
		await redis.expire(dailyKey, VISIT_TTL_SECONDS);
		await redis.expire(`${breakdownBase}:landing`, VISIT_TTL_SECONDS);
		await redis.expire(`${breakdownBase}:country`, VISIT_TTL_SECONDS);
		await redis.expire(`${breakdownBase}:device`, VISIT_TTL_SECONDS);
		await redis.expire(`${breakdownBase}:referrer`, VISIT_TTL_SECONDS);

		if (visit.visitorId) {
			await redis.sadd(uniqueVisitorsKey, visit.visitorId);
			await redis.expire(uniqueVisitorsKey, VISIT_TTL_SECONDS);
		}

		const isFinalized = finalizedSessionIds.has(visit.sessionId) || Boolean(visit.isFinal);
		if (!isFinalized) continue;

		await redis.set(getFinalMarkerKey(visit.sessionId), '1', { ex: VISIT_TTL_SECONDS });
		await redis.hincrby(dailyKey, `final_${getFinalBucket(visit)}`, 1);
		if (visit.resumeClicks > 0) await redis.hincrby(dailyKey, 'final_resume_clicks', 1);
		if (visit.projectClicks > 0) await redis.hincrby(dailyKey, 'final_project_interest', 1);
		if (visit.sectionsViewed.includes('contact')) await redis.hincrby(dailyKey, 'final_contact_views', 1);
	}
}

export async function wipeRedisVisitData(redis) {
	const keyGroups = await Promise.all([
		scanKeysByPattern(redis, 'visit:*'),
		scanKeysByPattern(redis, 'visit-stats:*'),
		scanKeysByPattern(redis, 'visit-breakdown:*'),
		scanKeysByPattern(redis, `${VISIT_UNIQUE_VISITORS_PREFIX}:*`)
	]);
	const keys = Array.from(
		new Set([...keyGroups.flat(), REDIS_RECENT_VISITS_KEY, REDIS_RECENT_VISITS_LIST_KEY])
	);

	if (keys.length > 0) await redis.del(...keys);
	return { mode: 'redis', deletedKeys: keys.length };
}

export async function deleteRedisVisitSummaries(redis, { sessionId = '', visitorId = '', deleteVisitor = false } = {}) {
	const [visitKeys, finalMarkerKeys] = await Promise.all([
		scanKeysByPattern(redis, 'visit:*'),
		scanKeysByPattern(redis, 'visit-finalized:*')
	]);
	const allVisits = (
		await Promise.all(visitKeys.map(async (key) => normalizeStoredVisit(await redis.get(key))))
	).filter(Boolean);
	const targetSessionIds = new Set(
		allVisits
			.filter((visit) =>
				deleteVisitor && visitorId ? visit.visitorId === visitorId : visit.sessionId === sessionId
			)
			.map((visit) => visit.sessionId)
	);

	if (targetSessionIds.size === 0) return { mode: 'redis', deletedSessions: 0 };

	const remainingVisits = allVisits.filter((visit) => !targetSessionIds.has(visit.sessionId));
	const remainingFinalizedSessionIds = new Set(
		finalMarkerKeys
			.map((key) => key.replace('visit-finalized:', ''))
			.filter((id) => id && !targetSessionIds.has(id))
	);
	const visitKeysToDelete = [...targetSessionIds].map((id) => `visit:${id}`);

	if (visitKeysToDelete.length > 0) await redis.del(...visitKeysToDelete);
	await rebuildRedisVisitIndexes(redis, remainingVisits, remainingFinalizedSessionIds);

	return { mode: 'redis', deletedSessions: targetSessionIds.size };
}
