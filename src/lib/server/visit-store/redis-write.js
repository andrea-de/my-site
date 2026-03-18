import {
	getFinalBucket,
	getFinalMarkerKey,
	getVisitDateKey,
	normalizeField,
	REDIS_RECENT_VISITS_LIST_KEY,
	VISIT_TTL_SECONDS,
	VISIT_UNIQUE_VISITORS_PREFIX
} from './shared';

export async function storeRedisVisitSummary(redis, summary) {
	const visitKey = `visit:${summary.sessionId}`;
	const visitDate = getVisitDateKey(summary.startedAt);
	const dailyKey = `visit-stats:${visitDate}`;
	const breakdownBase = `visit-breakdown:${visitDate}`;
	const uniqueVisitorsKey = `${VISIT_UNIQUE_VISITORS_PREFIX}:${visitDate}`;
	const existing = Boolean(await redis.exists(visitKey));

	await redis.set(visitKey, summary, { ex: VISIT_TTL_SECONDS });
	await redis.lrem(REDIS_RECENT_VISITS_LIST_KEY, 0, summary.sessionId);
	await redis.lpush(REDIS_RECENT_VISITS_LIST_KEY, summary.sessionId);
	await redis.ltrim(REDIS_RECENT_VISITS_LIST_KEY, 0, 199);
	await redis.expire(REDIS_RECENT_VISITS_LIST_KEY, VISIT_TTL_SECONDS);

	if (!existing) {
		const statsUpdates = [
			redis.hincrby(dailyKey, 'visits_total', 1),
			redis.hincrby(`${breakdownBase}:landing`, normalizeField(summary.landingPath, '/'), 1),
			redis.hincrby(`${breakdownBase}:country`, normalizeField(summary.country), 1),
			redis.hincrby(`${breakdownBase}:device`, normalizeField(summary.device), 1),
			redis.hincrby(`${breakdownBase}:referrer`, normalizeField(summary.referrerHost, 'direct'), 1),
			redis.expire(dailyKey, VISIT_TTL_SECONDS),
			redis.expire(`${breakdownBase}:landing`, VISIT_TTL_SECONDS),
			redis.expire(`${breakdownBase}:country`, VISIT_TTL_SECONDS),
			redis.expire(`${breakdownBase}:device`, VISIT_TTL_SECONDS),
			redis.expire(`${breakdownBase}:referrer`, VISIT_TTL_SECONDS)
		];

		if (summary.visitorId) {
			statsUpdates.push(redis.sadd(uniqueVisitorsKey, summary.visitorId));
			statsUpdates.push(redis.expire(uniqueVisitorsKey, VISIT_TTL_SECONDS));
		}

		await Promise.all(statsUpdates);
	}

	let finalizedNow = false;
	if (summary.isFinal) {
		const finalMarkerResult = await redis.set(getFinalMarkerKey(summary.sessionId), '1', {
			ex: VISIT_TTL_SECONDS,
			nx: true
		});

		finalizedNow = Boolean(finalMarkerResult);
		if (finalizedNow) {
			const finalBucket = getFinalBucket(summary);
			const statUpdates = [
				redis.hincrby(dailyKey, `final_${finalBucket}`, 1),
				redis.expire(getFinalMarkerKey(summary.sessionId), VISIT_TTL_SECONDS)
			];

			if (summary.resumeClicks > 0) statUpdates.push(redis.hincrby(dailyKey, 'final_resume_clicks', 1));
			if (summary.projectClicks > 0) statUpdates.push(redis.hincrby(dailyKey, 'final_project_interest', 1));
			if (summary.sectionsViewed.includes('contact')) statUpdates.push(redis.hincrby(dailyKey, 'final_contact_views', 1));

			await Promise.all(statUpdates);
		}
	}

	return { mode: 'redis', inserted: !existing, finalizedNow };
}
