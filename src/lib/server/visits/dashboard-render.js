import { getProvidedToken } from './auth';
import { renderJobLinksSection } from './dashboard-render-jobs';
import { renderBreakdownList, renderVisitRows } from './dashboard-render-parts';
import { dashboardStyles } from './dashboard-styles';
import { escapeHtml } from './shared';

const JOB_NOTICES = {
	closed: (code) => `Job link ${code} closed: it now redirects to the home page.`,
	active: (code) => `Job link ${code} reopened.`,
	deleted: (code) => `Job link ${code} deleted.`,
	missing: (code) => `No job link "${code}".`
};

// Opens the job link named in the URL hash (from a visit's badge), so the jump lands on it expanded.
const inlineScript = `
	function openJobFromHash() {
		var el = location.hash.indexOf('#job-') === 0 && document.getElementById(location.hash.slice(1));
		if (el && el.tagName === 'DETAILS') { el.open = true; el.scrollIntoView({ block: 'start' }); }
	}
	addEventListener('hashchange', openJobFromHash);
	openJobFromHash();
`;

export function renderDashboardHtml(dashboard, request, url, params) {
	const { limit, date, uniqueOnly, totalRecentVisits, jobLinks, jobNotice, now = Date.now() } = params;
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
		? `${dashboard.recentVisits.length} unique visitors from ${totalRecentVisits} recent sessions`
		: `${dashboard.recentVisits.length} recent sessions`;
	const highIntent =
		summary.highIntent ??
		dashboard.recentVisits.filter((visit) => visit.engagementScore >= 4).length;
	const jobsByCode = new Map(jobLinks.links.map((link) => [link.code, link]));
	// Daily counters in Redis; in memory mode the cards sum the recent rows instead.
	const visitScope = dashboard.mode === 'redis' ? `for ${date} (UTC)` : 'across the recent rows';
	const notices = [
		dashboard.wasWiped ? 'Visit tracking data was wiped.' : '',
		jobNotice && JOB_NOTICES[jobNotice.result] ? JOB_NOTICES[jobNotice.result](jobNotice.code) : ''
	].filter(Boolean);

	return `<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<meta name="robots" content="noindex, nofollow" />
		<meta name="theme-color" content="#000000" />
		<title>Visits Admin</title>
		<style>${dashboardStyles}</style>
	</head>
	<body>
		<main>
			<header class="page-head">
				<div>
					<h1>Visits Admin</h1>
					<p class="muted">${escapeHtml(date)} · ${escapeHtml(dashboard.mode)} mode · times in UTC</p>
				</div>
				<nav class="actions">
					<a class="btn btn-primary" href="${escapeHtml(refreshHref)}">Refresh</a>
					<a class="btn" href="${escapeHtml(jsonHref)}">Raw JSON</a>
				</nav>
			</header>
			${notices.map((text) => `<div class="notice">${escapeHtml(text)}</div>`).join('')}

			${renderJobLinksSection(jobLinks, { actionHref, now, openCode: jobNotice?.code })}

			<section class="section" id="visits">
				<div class="section-head">
					<h2>Site visits</h2>
					<p>Totals ${escapeHtml(visitScope)} · sessions expire after 30 days</p>
				</div>
				<div class="stat-grid">
					<div class="stat"><span>Unique visitors</span><strong>${summary.uniqueVisitors ?? 0}</strong></div>
					<div class="stat"><span>Sessions</span><strong>${summary.totalVisits ?? 0}</strong></div>
					<div class="stat"><span>High-intent</span><strong>${highIntent}</strong></div>
					<div class="stat"><span>Résumé interest</span><strong>${summary.resumeInterest ?? 0}</strong></div>
					<div class="stat"><span>Silent finals</span><strong>${summary.finalSilent ?? 0}</strong></div>
					<div class="stat"><span>Agent finals</span><strong>${summary.finalAgent ?? 0}</strong></div>
					<div class="stat"><span>Contact finals</span><strong>${summary.finalContact ?? 0}</strong></div>
					<div class="stat stat-accent"><span>AI cost</span><strong>$${(summary.totalAiCostUsd ?? 0).toFixed(4)}</strong></div>
					<div class="stat"><span>AI tokens</span><strong>${(summary.totalAiTokens ?? 0).toLocaleString()}</strong></div>
				</div>

				<div class="panel">
					<div class="panel-head">
						<div>
							<h3>Recent visits</h3>
							<p class="muted small">${escapeHtml(rowSummary)}</p>
						</div>
						<div class="controls">
							<div class="view-toggle" role="group" aria-label="Rows">
								<a class="toggle-link ${uniqueOnly ? '' : 'active'}" href="${escapeHtml(allSessionsHref)}">All sessions</a>
								<a class="toggle-link ${uniqueOnly ? 'active' : ''}" href="${escapeHtml(uniqueVisitorsHref)}">Unique visitors</a>
							</div>
							<form class="filter-form" method="GET" action="/api/visits">
								${token ? `<input type="hidden" name="token" value="${escapeHtml(token)}" />` : ''}
								${uniqueOnly ? '<input type="hidden" name="unique" value="1" />' : ''}
								<label>Date <input type="date" name="date" value="${escapeHtml(date)}" /></label>
								<label>Rows <input type="number" name="limit" min="1" max="100" value="${limit}" /></label>
								<button class="btn" type="submit">Apply</button>
							</form>
						</div>
					</div>
					<div class="table-wrap">
						<table class="visits-table">
							<thead>
								<tr><th>#</th><th>Ended</th><th>Device</th><th>Type</th><th>Duration</th><th>Location</th><th>Landing</th><th>Source</th><th>Referrer</th><th>Scroll</th><th>Score</th><th>AI Cost</th><th>Signals</th><th></th></tr>
							</thead>
							<tbody>${renderVisitRows(dashboard.recentVisits, { actionHref, uniqueOnly, jobsByCode })}</tbody>
						</table>
					</div>
				</div>

				<div class="breakdown-grid">
					${renderBreakdownList('Top Landing Paths', dashboard.breakdowns.landing || [], { jobsByCode })}
					${renderBreakdownList('Top Referrers', dashboard.breakdowns.referrer || [])}
					${renderBreakdownList('Top Countries', dashboard.breakdowns.country || [])}
					${renderBreakdownList('Top Devices', dashboard.breakdowns.device || [])}
				</div>
			</section>

			<footer class="page-foot">
				<div class="panel danger-zone">
					<div>
						<h3>Wipe visit data</h3>
						<p class="muted small">Deletes every stored site visit and counter. Job links are kept.</p>
					</div>
					<form class="action-form" method="POST" action="${escapeHtml(actionHref)}" onsubmit="return confirm('Wipe all stored visit data? This cannot be undone.');">
						<input type="hidden" name="adminAction" value="wipe" />
						<button class="btn btn-danger" type="submit">Wipe visit data</button>
					</form>
				</div>
				<p class="muted small">Open this route with <code>?token=YOUR_TOKEN</code> in the URL, or use the <code>x-visits-token</code> header or Bearer token for API access. Add <code>format=json</code> for JSON (it includes <code>jobLinks</code>).</p>
			</footer>
		</main>
		<script>${inlineScript}</script>
	</body>
</html>`;
}
