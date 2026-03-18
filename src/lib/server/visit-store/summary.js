export function toNumberHashEntries(hash) {
	if (!hash || typeof hash !== 'object') return {};
	return Object.fromEntries(Object.entries(hash).map(([key, value]) => [key, Number(value) || 0]));
}

export function sortHashEntries(hash, limit = 8) {
	return Object.entries(toNumberHashEntries(hash))
		.sort((a, b) => b[1] - a[1])
		.slice(0, limit)
		.map(([label, count]) => ({ label, count }));
}

export function countBreakdown(items, limit = 8) {
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

export function summarizeVisits(recentVisits) {
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
