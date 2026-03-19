import { dev } from '$app/environment';
// @ts-ignore Node builtin types are not installed in this JS-only project.
import { readFile, writeFile } from 'node:fs/promises';
import {
	DEV_SNAPSHOT_PATH,
	MEMORY_KEY,
	isVisitsAdminLanding,
	sortVisitsByEndedAtDesc
} from './shared';

export function getMemoryStore() {
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

function getStoredMemoryVisits() {
	const store = getMemoryStore();
	return [...store.visits.values()].filter(
		(entry) => entry && typeof entry === 'object' && typeof entry.sessionId === 'string'
	);
}

export async function getMemoryRecentVisitSummaries(limit = 10) {
	const memoryRecent = getMemoryStore().recent.slice(0, limit);
	if (memoryRecent.length > 0) {
		return memoryRecent.filter((summary) => !isVisitsAdminLanding(summary));
	}

	const fileRecent = await readDevSnapshot();
	return fileRecent.slice(0, limit).filter((summary) => !isVisitsAdminLanding(summary));
}

export async function storeMemoryVisitSummary(summary) {
	const store = getMemoryStore();
	const existing = store.visits.has(summary.sessionId);
	const finalMarkerKey = `${summary.sessionId}:final`;
	const finalizedNow = Boolean(summary.isFinal && !store.visits.has(finalMarkerKey));

	store.visits.set(summary.sessionId, summary);
	if (finalizedNow) store.visits.set(finalMarkerKey, true);
	pushRecentVisit(summary);
	await persistDevSnapshot(store.recent);

	return { mode: 'memory', inserted: !existing, finalizedNow };
}

export async function wipeMemoryVisitData() {
	const store = getMemoryStore();
	const deletedKeys = store.visits.size + store.recent.length;
	store.visits.clear();
	store.recent = [];
	await persistDevSnapshot([]);

	return { mode: 'memory', deletedKeys };
}

export async function deleteMemoryVisitSummaries({
	sessionId = '',
	visitorId = '',
	deleteVisitor = false
} = {}) {
	const store = getMemoryStore();
	const visits = getStoredMemoryVisits();
	const targetSessionIds = new Set(
		visits
			.filter((visit) =>
				deleteVisitor && visitorId ? visit.visitorId === visitorId : visit.sessionId === sessionId
			)
			.map((visit) => visit.sessionId)
	);

	for (const targetSessionId of targetSessionIds) {
		store.visits.delete(targetSessionId);
		store.visits.delete(`${targetSessionId}:final`);
	}

	store.recent = sortVisitsByEndedAtDesc(
		visits.filter((visit) => !targetSessionIds.has(visit.sessionId))
	).slice(0, 25);
	await persistDevSnapshot(store.recent);

	return { mode: 'memory', deletedSessions: targetSessionIds.size };
}
