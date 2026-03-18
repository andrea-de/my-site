export function dedupeRecentVisits(visits) {
	const seen = new Set();

	return visits.filter((visit) => {
		const key = visit.visitorId || `session:${visit.sessionId || 'unknown'}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}
