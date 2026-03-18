import { getProvidedToken } from './auth';
import { renderBreakdownList, renderVisitRows } from './dashboard-render-parts';
import { dashboardStyles } from './dashboard-styles';
import { escapeHtml } from './shared';

export function renderDashboardHtml(dashboard, request, url, params) {
	const { limit, date, uniqueOnly, totalRecentVisits } = params;
	const token = getProvidedToken(request, url);
	const tokenQuery = token ? `token=${encodeURIComponent(token)}&` : '';
	const uniqueQuery = uniqueOnly ? 'unique=1&' : '';
	const summary = dashboard.summary || {};
	const jsonHref = `/api/visits?${tokenQuery}${uniqueQuery}format=json&limit=${limit}&date=${encodeURIComponent(date)}`;
	const actionHref = `/api/visits?${tokenQuery}${uniqueQuery}limit=${limit}&date=${encodeURIComponent(date)}`;
	const allSessionsHref = `/api/visits?${tokenQuery}limit=${limit}&date=${encodeURIComponent(date)}`;
	const uniqueVisitorsHref = `/api/visits?${tokenQuery}unique=1&limit=${limit}&date=${encodeURIComponent(date)}`;
	const refreshHref = `/api/visits?${tokenQuery}${uniqueQuery}limit=${limit}&date=${encodeURIComponent(date)}`;
	const rowSummary = uniqueOnly
		? `Showing ${dashboard.recentVisits.length} unique visitors from ${totalRecentVisits} recent sessions`
		: `Showing ${dashboard.recentVisits.length} recent sessions`;
	const highIntent =
		summary.highIntent ??
		dashboard.recentVisits.filter((visit) => visit.engagementScore >= 4).length;

	return `<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>Visits Admin</title>
		<style>${dashboardStyles}</style>
	</head>
	<body>
		<main>
			<header>
				<div>
					<h1>Visits Admin</h1>
					<p>${escapeHtml(date)} · ${escapeHtml(dashboard.mode)} mode · ${dashboard.recentVisits.length} recent rows</p>
				</div>
				<div class="actions">
					<a class="action-link refresh-button" href="${escapeHtml(refreshHref)}">Refresh</a>
					<a class="action-link" href="${escapeHtml(jsonHref)}">Raw JSON</a>
					<form class="action-form" method="POST" action="${escapeHtml(actionHref)}" onsubmit="return confirm('Wipe all stored visit data? This cannot be undone.');">
						<input type="hidden" name="adminAction" value="wipe" />
						<button class="action-button" type="submit">Wipe Visit Data</button>
					</form>
				</div>
			</header>
			${dashboard.wasWiped ? '<div class="notice">Visit tracking data was wiped.</div>' : ''}
			<section class="summary-grid">
				<div class="summary-card"><span>Unique Visitors</span><strong>${summary.uniqueVisitors ?? 0}</strong></div>
				<div class="summary-card"><span>Total Sessions</span><strong>${summary.totalVisits ?? 0}</strong></div>
				<div class="summary-card"><span>Silent Finals</span><strong>${summary.finalSilent ?? 0}</strong></div>
				<div class="summary-card"><span>Agent Finals</span><strong>${summary.finalAgent ?? 0}</strong></div>
				<div class="summary-card"><span>Contact Finals</span><strong>${summary.finalContact ?? 0}</strong></div>
				<div class="summary-card"><span>High-Intent</span><strong>${highIntent}</strong></div>
				<div class="summary-card"><span>Resume Interest</span><strong>${summary.resumeInterest ?? 0}</strong></div>
			</section>
			<div class="view-toggle">
				<a class="toggle-link ${uniqueOnly ? '' : 'active'}" href="${escapeHtml(allSessionsHref)}">All Sessions</a>
				<a class="toggle-link ${uniqueOnly ? 'active' : ''}" href="${escapeHtml(uniqueVisitorsHref)}">Unique Visitors</a>
			</div>
			<section class="breakdown-grid">
				${renderBreakdownList('Top Landing Paths', dashboard.breakdowns.landing || [])}
				${renderBreakdownList('Top Referrers', dashboard.breakdowns.referrer || [])}
				${renderBreakdownList('Top Countries', dashboard.breakdowns.country || [])}
				${renderBreakdownList('Top Devices', dashboard.breakdowns.device || [])}
			</section>
			<section class="panel">
				<h2>Recent Visits</h2>
				<p class="panel-summary">${escapeHtml(rowSummary)}</p>
				<div class="table-wrap">
					<table>
						<thead>
							<tr><th>#</th><th>Ended</th><th>Device</th><th>Type</th><th>Duration</th><th>Location</th><th>Landing</th><th>Source</th><th>Referrer</th><th>Scroll</th><th>Score</th><th>Signals</th><th></th></tr>
						</thead>
						<tbody>${renderVisitRows(dashboard.recentVisits, { actionHref, uniqueOnly })}</tbody>
					</table>
				</div>
				<p class="footer-note">Open this route with <code>?token=YOUR_TOKEN</code> in the URL, or use the <code>x-visits-token</code> header or Bearer token for API access.</p>
			</section>
		</main>
	</body>
</html>`;
}
