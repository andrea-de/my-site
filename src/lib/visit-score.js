// How engaged a visit was, 0–13. Shared by the server (stored with each visit) and the
// owner's live score badge, so the badge shows exactly what the dashboard will record.

/**
 * Each rule that adds points, for the badge's breakdown.
 * @param {{ durationMs: number, maxScrollPercent: number, sectionsViewed: string[], resumeClicks: number, projectClicks: number, outboundClicks: number, chatOpened: boolean, shorts?: { pct: number }[] }} v
 * @returns {{ label: string, points: number, max: number }[]}
 */
export function engagementParts(v) {
	const seconds = v.durationMs / 1000;
	const sections = v.sectionsViewed?.length || 0;
	// Shorts watched at least halfway.
	const shorts = (v.shorts || []).filter((e) => e.pct >= 50).length;
	return [
		{ label: 'Time: 15 s / 60 s', points: seconds >= 60 ? 2 : seconds >= 15 ? 1 : 0, max: 2 },
		{
			label: 'Scroll: 40% / 75%',
			points: v.maxScrollPercent >= 75 ? 2 : v.maxScrollPercent >= 40 ? 1 : 0,
			max: 2
		},
		{ label: 'Sections: 2 / 4', points: sections >= 4 ? 2 : sections >= 2 ? 1 : 0, max: 2 },
		{ label: 'Resume opened', points: v.resumeClicks > 0 ? 2 : 0, max: 2 },
		{ label: 'Project opened', points: v.projectClicks > 0 ? 1 : 0, max: 1 },
		{ label: 'Outbound link', points: v.outboundClicks > 0 ? 1 : 0, max: 1 },
		{ label: 'Chat opened', points: v.chatOpened ? 1 : 0, max: 1 },
		{ label: 'Shorts half-watched: 1 / 3', points: shorts >= 3 ? 2 : shorts >= 1 ? 1 : 0, max: 2 }
	];
}

/** @param {Parameters<typeof engagementParts>[0]} v */
export const engagementScore = (v) => engagementParts(v).reduce((sum, p) => sum + p.points, 0);

export const ENGAGEMENT_MAX = 13;
