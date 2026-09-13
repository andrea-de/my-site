export function dedupeRecentVisits(visits) {
	const map = new Map();

	for (const visit of visits) {
		const key = visit.visitorId || `session:${visit.sessionId || 'unknown'}`;
		if (!map.has(key)) {
			// Clone the most recent visit entry as the representative row
			map.set(key, {
				...visit,
				aiTokens: Number(visit.aiTokens) || 0,
				aiCostUsd: Number(visit.aiCostUsd) || 0,
				sessionCount: 1
			});
		} else {
			// Aggregate metrics from earlier sessions belonging to the same visitor
			const agg = map.get(key);
			agg.aiTokens = (agg.aiTokens || 0) + (Number(visit.aiTokens) || 0);
			agg.aiCostUsd = Math.round(((agg.aiCostUsd || 0) + (Number(visit.aiCostUsd) || 0)) * 10000) / 10000;
			agg.durationMs = (agg.durationMs || 0) + (Number(visit.durationMs) || 0);
			agg.maxScrollPercent = Math.max(agg.maxScrollPercent || 0, Number(visit.maxScrollPercent) || 0);
			agg.engagementScore = Math.max(agg.engagementScore || 0, Number(visit.engagementScore) || 0);
			agg.resumeClicks = (agg.resumeClicks || 0) + (Number(visit.resumeClicks) || 0);
			agg.projectClicks = (agg.projectClicks || 0) + (Number(visit.projectClicks) || 0);
			agg.outboundClicks = (agg.outboundClicks || 0) + (Number(visit.outboundClicks) || 0);
			agg.chatOpened = Boolean(agg.chatOpened || visit.chatOpened);
			agg.hasAgentInteraction = Boolean(agg.hasAgentInteraction || visit.hasAgentInteraction);
			agg.hasFormSubmission = Boolean(agg.hasFormSubmission || visit.hasFormSubmission);
			agg.sessionCount = (agg.sessionCount || 1) + 1;
		}
	}

	return Array.from(map.values());
}
