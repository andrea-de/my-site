import { getRedisClient, getVisitStorageMode } from './visit-store/client';
import {
	deleteMemoryVisitSummaries,
	getMemoryRecentVisitSummaries,
	storeMemoryVisitSummary,
	wipeMemoryVisitData
} from './visit-store/memory';
import { getRedisDashboardData, getRecentRedisVisitSummaries } from './visit-store/redis-read';
import { deleteRedisVisitSummaries, wipeRedisVisitData } from './visit-store/redis-admin';
import { storeRedisVisitSummary } from './visit-store/redis-write';
import { countBreakdown, summarizeVisits } from './visit-store/summary';

let warnedAboutMissingRedis = false;

export { getVisitStorageMode };

export async function getRecentVisitSummaries(limit = 10) {
	const mode = getVisitStorageMode();
	if (mode === 'redis') return getRecentRedisVisitSummaries(getRedisClient(), limit);
	if (mode === 'memory') return getMemoryRecentVisitSummaries(limit);
	return [];
}

export async function getVisitDashboardData({
	limit = 20,
	date = new Date().toISOString().slice(0, 10)
} = {}) {
	const mode = getVisitStorageMode();
	if (mode === 'redis') return getRedisDashboardData(getRedisClient(), { limit, date });

	const recentVisits = await getRecentVisitSummaries(limit);
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

export async function storeVisitSummary(summary) {
	const mode = getVisitStorageMode();

	if (mode === 'disabled') {
		if (!warnedAboutMissingRedis) {
			console.warn('[VISIT STORE] Redis is not configured; visit summaries are disabled in production.');
			warnedAboutMissingRedis = true;
		}

		return { mode, inserted: false, finalizedNow: false };
	}

	if (mode === 'memory') return storeMemoryVisitSummary(summary);
	return storeRedisVisitSummary(getRedisClient(), summary);
}

export async function wipeVisitData() {
	const mode = getVisitStorageMode();
	if (mode === 'disabled') return { mode, deletedKeys: 0 };
	if (mode === 'memory') return wipeMemoryVisitData();
	return wipeRedisVisitData(getRedisClient());
}

export async function deleteVisitSummaries(args = {}) {
	const mode = getVisitStorageMode();
	if (mode === 'disabled') return { mode, deletedSessions: 0 };
	if (mode === 'memory') return deleteMemoryVisitSummaries(args);
	return deleteRedisVisitSummaries(getRedisClient(), args);
}
