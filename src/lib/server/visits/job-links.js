// Job links (/r/<code>) for the admin dashboard: every record with its recent log, plus
// the headline counts. Unlike the visit analytics these never expire.
import projectsData from '$lib/context/projects.json';
import { referralUrl } from '$lib/server/referrals/auth';
import { getReferralLogs, isApplied, listReferrals } from '$lib/server/referrals/store';

// Enough history for the timeline and the 7-day count without pulling all 500 entries per link.
const DASHBOARD_LOG_LIMIT = 150;
const DAY_MS = 24 * 60 * 60 * 1000;
// "Recently active" on the dashboard: a person opened it in the last two days.
export const RECENT_ACTIVITY_MS = 2 * DAY_MS;

const PROJECT_NAMES = Object.fromEntries(projectsData.map((p) => [p.id, p.name]));

export const projectName = (id) => PROJECT_NAMES[id] || id;

/** The job-link code a landing path like "/r/k7q?utm=…" or "/shorts/k7q#…" points at, or ''. */
export function jobCodeForLanding(landingPath) {
	const match = /^\/(?:r|shorts)\/([a-z0-9]{3})(?:[/?#]|$)/i.exec(String(landingPath || ''));
	return match ? match[1].toLowerCase() : '';
}

const timeOf = (value) => {
	const time = new Date(value || '').getTime();
	return Number.isNaN(time) ? 0 : time;
};

/**
 * @param {{ now?: number }} [options]
 * @returns {Promise<{ summary: Record<string, number>, links: any[], error?: string }>}
 */
export async function getJobLinksData({ now = Date.now() } = {}) {
	let records;
	try {
		records = await listReferrals();
	} catch (error) {
		// No Redis in production: show the rest of the dashboard rather than failing it.
		console.warn('[VISITS ADMIN] Failed to load job links:', error);
		return { summary: emptySummary(), links: [], error: 'Job links could not be loaded.' };
	}

	const logs = await getReferralLogs(
		records.map((r) => r.code),
		DASHBOARD_LOG_LIMIT
	);
	const weekAgo = now - 7 * DAY_MS;

	const links = records.map((record) => {
		const log = logs[record.code] || [];
		const opensLast7d = log.filter((e) => e.type === 'visit' && timeOf(e.at) >= weekAgo).length;
		const lastVisit = timeOf(record.lastVisitAt);
		return {
			...record,
			url: referralUrl(record.code),
			opensLast7d,
			recentlyActive: Boolean(lastVisit && now - lastVisit < RECENT_ACTIVITY_MS),
			log,
			logTruncated: log.length >= DASHBOARD_LOG_LIMIT
		};
	});

	return {
		summary: {
			total: links.length,
			active: links.filter((l) => l.status !== 'closed').length,
			applied: links.filter(isApplied).length,
			opened: links.filter((l) => l.visits > 0).length,
			opensLast7d: links.reduce((sum, l) => sum + l.opensLast7d, 0)
		},
		links
	};
}

function emptySummary() {
	return { total: 0, active: 0, applied: 0, opened: 0, opensLast7d: 0 };
}
