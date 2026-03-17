import { dev } from '$app/environment';
import { readFile, writeFile } from 'node:fs/promises';
import { Redis } from '@upstash/redis';

const VISIT_TTL_SECONDS = 60 * 60 * 24 * 30;
const MEMORY_KEY = '__my_site_visit_store__';
const DEV_SNAPSHOT_PATH = '/tmp/my-site-visit-tracker.json';
const REDIS_RECENT_VISITS_KEY = 'visit-recent';
const VISIT_UNIQUE_VISITORS_PREFIX = 'visit-unique-visitors';

let warnedAboutMissingRedis = false;
let redisClient;

function getRedisClient() {
	if (redisClient) return redisClient;

	const hasUpstashPair = Boolean(
		process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
	);
	const hasKvPair = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
	const hasRedisEnv = hasUpstashPair || hasKvPair;

	if (!hasRedisEnv) return null;

	redisClient = Redis.fromEnv({ enableTelemetry: false });
	return redisClient;
}

function getMemoryStore() {
	if (!globalThis[MEMORY_KEY]) {
		globalThis[MEMORY_KEY] = {
			visits: new Map(),
			recent: []
		};
	}

	return globalThis[MEMORY_KEY];
}

function pushRecentVisit(summary) {
	const store = getMemoryStore();
	store.recent = [
		summary,
		...store.recent.filter((entry) => entry.sessionId !== summary.sessionId)
	].slice(0, 25);
}

async function persistDevSnapshot(recentVisits) {
	if (!dev) return;

	try {
		await writeFile(DEV_SNAPSHOT_PATH, JSON.stringify(recentVisits, null, 2), 'utf8');
	} catch (error) {
		console.warn('[VISIT STORE] Failed to persist local debug snapshot:', error);
	}
}

async function readDevSnapshot() {
	if (!dev) return [];

	try {
		const fileContents = await readFile(DEV_SNAPSHOT_PATH, 'utf8');
		const parsed = JSON.parse(fileContents);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function getVisitDateKey(startedAt) {
	const date = new Date(startedAt);
	return Number.isNaN(date.getTime())
		? new Date().toISOString().slice(0, 10)
		: date.toISOString().slice(0, 10);
}

function normalizeField(value, fallback = 'unknown') {
	if (!value) return fallback;
	return String(value).slice(0, 120);
}

function getFinalBucket(summary) {
	if (summary.hasFormSubmission) return 'contact';
	if (summary.hasAgentInteraction) return 'agent';
	return 'silent';
}

function isVisitsAdminLanding(summary) {
	return typeof summary?.landingPath === 'string' && summary.landingPath.startsWith('/api/visits');
}

function normalizeStoredVisit(payload) {
	if (!payload) return null;

	if (typeof payload === 'string') {
		try {
			return JSON.parse(payload);
		} catch {
			return null;
		}
	}

	return typeof payload === 'object' ? payload : null;
}

function toNumberHashEntries(hash = {}) {
	return Object.fromEntries(Object.entries(hash).map(([key, value]) => [key, Number(value) || 0]));
}

function sortHashEntries(hash = {}, limit = 8) {
	return Object.entries(toNumberHashEntries(hash))
		.sort((a, b) => b[1] - a[1])
		.slice(0, limit)
		.map(([label, count]) => ({ label, count }));
}

function countBreakdown(items, limit = 8) {
	return Object.entries(
		items.reduce((accumulator, item) => {
			if (!item) return accumulator;
			accumulator[item] = (accumulator[item] || 0) + 1;
			return accumulator;
		}, {})
	)
		.sort((a, b) => b[1] - a[1])
		.slice(0, limit)
		.map(([label, count]) => ({ label, count }));
}

function summarizeVisits(recentVisits) {
	const uniqueVisitors = new Set();
	const summary = recentVisits.reduce(
		(accumulator, visit) => {
			accumulator.totalVisits += 1;
			if (visit.visitType === 'silent') accumulator.finalSilent += 1;
			if (visit.visitType === 'agent') accumulator.finalAgent += 1;
			if (visit.visitType === 'contact') accumulator.finalContact += 1;
			if (visit.engagementScore >= 4) accumulator.highIntent += 1;
			if (visit.resumeClicks > 0) accumulator.resumeInterest += 1;
			if (visit.projectClicks > 0) accumulator.projectInterest += 1;
			if (visit.sectionsViewed.includes('contact')) accumulator.contactViews += 1;
			if (visit.visitorId) uniqueVisitors.add(visit.visitorId);
			return accumulator;
		},
		{
			totalVisits: 0,
			finalSilent: 0,
			finalAgent: 0,
			finalContact: 0,
			highIntent: 0,
			resumeInterest: 0,
			projectInterest: 0,
			contactViews: 0
		}
	);

	return {
		...summary,
		uniqueVisitors: uniqueVisitors.size
	};
}

async function scanKeysByPattern(redis, pattern) {
	let cursor = '0';
	const keys = new Set();

	do {
		const [nextCursor, batch] = await redis.scan(cursor, { match: pattern, count: 200 });
		cursor = nextCursor;

		for (const key of batch) {
			keys.add(key);
		}
	} while (cursor !== '0');

	return [...keys];
}

export function getVisitStorageMode() {
	if (getRedisClient()) return 'redis';
	return dev ? 'memory' : 'disabled';
}

export async function getRecentVisitSummaries(limit = 10) {
	const mode = getVisitStorageMode();

	if (mode === 'redis') {
		const redis = getRedisClient();
		const sessionIds = await redis.zrange(REDIS_RECENT_VISITS_KEY, 0, Math.max(0, limit - 1));
		const visitPayloads = await Promise.all(
			sessionIds.map((sessionId) => redis.get(`visit:${sessionId}`))
		);

		return visitPayloads
			.map((payload) => normalizeStoredVisit(payload))
			.filter(Boolean)
			.filter((summary) => !isVisitsAdminLanding(summary));
	}

	const memoryRecent = getMemoryStore().recent.slice(0, limit);
	if (memoryRecent.length > 0) {
		return memoryRecent.filter((summary) => !isVisitsAdminLanding(summary));
	}

	const fileRecent = await readDevSnapshot();
	return fileRecent.slice(0, limit).filter((summary) => !isVisitsAdminLanding(summary));
}

export async function getVisitDashboardData({
	limit = 20,
	date = new Date().toISOString().slice(0, 10)
} = {}) {
	const mode = getVisitStorageMode();
	const recentVisits = await getRecentVisitSummaries(limit);

	if (mode !== 'redis') {
		return {
			mode,
			date,
			recentVisits,
			summary: summarizeVisits(recentVisits),
			breakdowns: {
				landing: countBreakdown(recentVisits.map((visit) => visit.landingPath)),
				referrer: countBreakdown(recentVisits.map((visit) => visit.referrerHost || 'direct')),
				country: countBreakdown(recentVisits.map((visit) => visit.country)),
				device: countBreakdown(recentVisits.map((visit) => visit.device))
			}
		};
	}

	const redis = getRedisClient();
	const breakdownBase = `visit-breakdown:${date}`;
	const [
		rawDailyStats,
		rawLandingBreakdown,
		rawReferrerBreakdown,
		rawCountryBreakdown,
		rawDeviceBreakdown,
		uniqueVisitors
	] = await Promise.all([
		redis.hgetall(`visit-stats:${date}`),
		redis.hgetall(`${breakdownBase}:landing`),
		redis.hgetall(`${breakdownBase}:referrer`),
		redis.hgetall(`${breakdownBase}:country`),
		redis.hgetall(`${breakdownBase}:device`),
		redis.scard(`${VISIT_UNIQUE_VISITORS_PREFIX}:${date}`)
	]);

	return {
		mode,
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

export async function storeVisitSummary(summary) {
	const mode = getVisitStorageMode();

	if (mode === 'disabled') {
		if (!warnedAboutMissingRedis) {
			console.warn(
				'[VISIT STORE] Redis is not configured; visit summaries are disabled in production.'
			);
			warnedAboutMissingRedis = true;
		}

		return {
			mode,
			inserted: false,
			finalizedNow: false
		};
	}

	if (mode === 'memory') {
		const store = getMemoryStore();
		const existing = store.visits.has(summary.sessionId);
		const finalMarkerKey = `${summary.sessionId}:final`;
		const finalizedNow = Boolean(summary.isFinal && !store.visits.has(finalMarkerKey));

		store.visits.set(summary.sessionId, summary);
		if (finalizedNow) store.visits.set(finalMarkerKey, true);
		pushRecentVisit(summary);
		await persistDevSnapshot(store.recent);

		return {
			mode,
			inserted: !existing,
			finalizedNow
		};
	}

	const redis = getRedisClient();
	const visitKey = `visit:${summary.sessionId}`;
	const visitDate = getVisitDateKey(summary.startedAt);
	const dailyKey = `visit-stats:${visitDate}`;
	const breakdownBase = `visit-breakdown:${visitDate}`;
	const uniqueVisitorsKey = `${VISIT_UNIQUE_VISITORS_PREFIX}:${visitDate}`;
	const existing = Boolean(await redis.exists(visitKey));
	const recentScore = -new Date(summary.endedAt || summary.startedAt).getTime();

	await Promise.all([
		redis.set(visitKey, summary, { ex: VISIT_TTL_SECONDS }),
		redis.zadd(REDIS_RECENT_VISITS_KEY, {
			score: Number.isFinite(recentScore) ? recentScore : -Date.now(),
			member: summary.sessionId
		}),
		redis.expire(REDIS_RECENT_VISITS_KEY, VISIT_TTL_SECONDS)
	]);

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
		const finalMarkerKey = `visit-finalized:${summary.sessionId}`;
		const finalMarkerResult = await redis.set(finalMarkerKey, '1', {
			ex: VISIT_TTL_SECONDS,
			nx: true
		});

		finalizedNow = Boolean(finalMarkerResult);

		if (finalizedNow) {
			const finalBucket = getFinalBucket(summary);
			const statUpdates = [
				redis.hincrby(dailyKey, `final_${finalBucket}`, 1),
				redis.expire(finalMarkerKey, VISIT_TTL_SECONDS)
			];

			if (summary.resumeClicks > 0) {
				statUpdates.push(redis.hincrby(dailyKey, 'final_resume_clicks', 1));
			}

			if (summary.projectClicks > 0) {
				statUpdates.push(redis.hincrby(dailyKey, 'final_project_interest', 1));
			}

			if (summary.sectionsViewed.includes('contact')) {
				statUpdates.push(redis.hincrby(dailyKey, 'final_contact_views', 1));
			}

			await Promise.all(statUpdates);
		}
	}

	return {
		mode,
		inserted: !existing,
		finalizedNow
	};
}

export async function wipeVisitData() {
	const mode = getVisitStorageMode();

	if (mode === 'disabled') {
		return {
			mode,
			deletedKeys: 0
		};
	}

	if (mode === 'memory') {
		const store = getMemoryStore();
		const deletedKeys = store.visits.size + store.recent.length;
		store.visits.clear();
		store.recent = [];
		await persistDevSnapshot([]);

		return {
			mode,
			deletedKeys
		};
	}

	const redis = getRedisClient();
	const keyGroups = await Promise.all([
		scanKeysByPattern(redis, 'visit:*'),
		scanKeysByPattern(redis, 'visit-stats:*'),
		scanKeysByPattern(redis, 'visit-breakdown:*'),
		scanKeysByPattern(redis, `${VISIT_UNIQUE_VISITORS_PREFIX}:*`)
	]);
	const keys = Array.from(new Set([...keyGroups.flat(), REDIS_RECENT_VISITS_KEY]));

	if (keys.length > 0) {
		await redis.del(...keys);
	}

	return {
		mode,
		deletedKeys: keys.length
	};
}
