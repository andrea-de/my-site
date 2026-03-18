export const VISIT_TTL_SECONDS = 60 * 60 * 24 * 30;
export const MEMORY_KEY = '__my_site_visit_store__';
export const DEV_SNAPSHOT_PATH = '/tmp/my-site-visit-tracker.json';
export const REDIS_RECENT_VISITS_KEY = 'visit-recent';
export const REDIS_RECENT_VISITS_LIST_KEY = 'visit-recent-list';
export const VISIT_UNIQUE_VISITORS_PREFIX = 'visit-unique-visitors';

export function getVisitDateKey(startedAt) {
	const date = new Date(startedAt);
	return Number.isNaN(date.getTime())
		? new Date().toISOString().slice(0, 10)
		: date.toISOString().slice(0, 10);
}

export function normalizeField(value, fallback = 'unknown') {
	if (!value) return fallback;
	return String(value).slice(0, 120);
}

export function getFinalBucket(summary) {
	if (summary.hasFormSubmission) return 'contact';
	if (summary.hasAgentInteraction) return 'agent';
	return 'silent';
}

export function isVisitsAdminLanding(summary) {
	return typeof summary?.landingPath === 'string' && summary.landingPath.startsWith('/api/visits');
}

export function normalizeStoredVisit(payload) {
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

export function parseTimestamp(value) {
	const parsed = new Date(value).getTime();
	return Number.isNaN(parsed) ? 0 : parsed;
}

export function sortVisitsByEndedAtDesc(visits) {
	return [...visits].sort((a, b) => parseTimestamp(b.endedAt) - parseTimestamp(a.endedAt));
}

export function getFinalMarkerKey(sessionId) {
	return `visit-finalized:${sessionId}`;
}

export async function scanKeysByPattern(redis, pattern) {
	let cursor = '0';
	const keys = new Set();

	do {
		const [nextCursor, batch] = await redis.scan(cursor, { match: pattern, count: 200 });
		cursor = nextCursor;
		for (const key of batch) keys.add(key);
	} while (cursor !== '0');

	return [...keys];
}
