// The admin dashboard page, phone first: a compact header, four headline numbers, the latest
// activity, then three tabs (Jobs, Visits, Stats). Tabs are radio inputs, so they work
// without JS; a little script keeps the chosen tab in the URL hash.
import { icon } from './dashboard-icons';
import { renderJobsTab } from './dashboard-render-jobs';
import { renderBreakdown, renderLatest, renderVisitList } from './dashboard-render-parts';
import { dashboardStyles } from './dashboard-styles';
import { escapeHtml, formatRelative } from './shared';

const MAX_LIMIT = 100;

const JOB_NOTICES = {
	closed: (code) => `Job link ${code} closed: it now redirects to the home page.`,
	active: (code) => `Job link ${code} reopened.`,
	deleted: (code) => `Job link ${code} deleted.`,
	reset: (code) => `Job link ${code} reset: visits, previews and events are back to zero.`,
	missing: (code) => `No job link "${code}".`
};

// Hash → tab: #jobs, #visits, #stats, or #job-<code> / #v-<n> (open that row in its tab).
const inlineScript = `
	(function () {
		var tabs = { jobs: 1, visits: 1, stats: 1 };
		function select(name) {
			var radio = document.getElementById('tab-' + name);
			if (radio) radio.checked = true;
		}
		function fromHash() {
			var hash = location.hash.slice(1);
			if (tabs[hash]) return select(hash);
			if (hash.indexOf('job-') === 0) select('jobs');
			else if (hash.indexOf('v-') === 0) select('visits');
			else return;
			var el = document.getElementById(hash);
			if (!el) return;
			for (var node = el; node; node = node.parentElement) if (node.tagName === 'DETAILS') node.open = true;
			el.scrollIntoView({ block: 'start' });
		}
		document.querySelectorAll('input[name="tab"]').forEach(function (radio) {
			radio.addEventListener('change', function () {
				history.replaceState(null, '', '#' + radio.value);
				window.scrollTo(0, 0);
			});
		});
		addEventListener('hashchange', fromHash);
		fromHash();
	})();
`;

const chip = (label, value, sub = '', accent = false) =>
	`<div class="stat${accent ? ' stat-accent' : ''}"><span class="stat-label">${escapeHtml(label)}</span><strong>${value}</strong>${sub ? `<span class="stat-sub">${sub}</span>` : ''}</div>`;

function renderTabBar(counts) {
	return `
		<div class="tabbar" role="tablist">
			${['jobs', 'visits', 'stats']
				.map(
					(name) =>
						`<label for="tab-${name}" class="tab tab-${name}" role="tab">${name[0].toUpperCase()}${name.slice(1)}<span class="badge">${counts[name]}</span></label>`
				)
				.join('')}
		</div>`;
}

export function renderDashboardHtml(dashboard, request, url, params) {
	const { limit, date, uniqueOnly, totalRecentVisits, jobLinks, jobNotice, now = Date.now() } = params;
	const uniqueQuery = uniqueOnly ? 'unique=1&' : '';
	const dateQuery = `date=${encodeURIComponent(date)}`;
	const summary = dashboard.summary || {};
	// Newest first, so the day groups come out whole (the memory store keeps insertion order).
	const endedAt = (visit) => new Date(visit.endedAt).getTime() || 0;
	const visits = [...dashboard.recentVisits].sort((a, b) => endedAt(b) - endedAt(a));
	const jsonHref = `/api/visits?${uniqueQuery}format=json&limit=${limit}&${dateQuery}`;
	const actionHref = `/api/visits?${uniqueQuery}limit=${limit}&${dateQuery}`;
	const allSessionsHref = `/api/visits?limit=${limit}&${dateQuery}#visits`;
	const uniqueVisitorsHref = `/api/visits?unique=1&limit=${limit}&${dateQuery}#visits`;
	const refreshHref = `/api/visits?${uniqueQuery}limit=${limit}&${dateQuery}`;
	const moreHref = `/api/visits?${uniqueQuery}limit=${Math.min(MAX_LIMIT, limit + 20)}&${dateQuery}#visits`;
	// More rows may exist when the page came back full.
	const canShowMore = totalRecentVisits >= limit && limit < MAX_LIMIT;
	const rowSummary = uniqueOnly
		? `${visits.length} visitors from ${totalRecentVisits} sessions`
		: `${visits.length} most recent sessions`;
	const highIntent = summary.highIntent ?? visits.filter((visit) => visit.engagementScore >= 4).length;
	const jobsByCode = new Map(jobLinks.links.map((link) => [link.code, link]));
	const isToday = date === new Date(now).toISOString().slice(0, 10);
	// Daily counters in Redis; in memory mode the numbers sum the recent rows instead.
	const scope = dashboard.mode === 'redis' ? (isToday ? 'today' : date) : 'recent rows';
	const notices = [
		dashboard.wasWiped ? 'Visit tracking data was wiped.' : '',
		jobNotice && JOB_NOTICES[jobNotice.result] ? JOB_NOTICES[jobNotice.result](jobNotice.code) : ''
	].filter(Boolean);
	const js = jobLinks.summary;
	const lastJobOpen = jobLinks.links
		.map((link) => link.lastVisitAt)
		.filter(Boolean)
		.sort()
		.pop();
	const aiCost = `$${(summary.totalAiCostUsd ?? 0).toFixed(2)}`;

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
					<p class="faint small">${escapeHtml(date)} · ${escapeHtml(dashboard.mode)} · UTC</p>
				</div>
				<a class="btn btn-primary btn-icon" href="${escapeHtml(refreshHref)}" aria-label="Refresh">${icon('refresh')}<span>Refresh</span></a>
			</header>
			${notices.map((text) => `<div class="notice">${escapeHtml(text)}</div>`).join('')}

			<div class="stat-strip">
				${chip('Job opens · 7d', String(js.opensLast7d), lastJobOpen ? `last ${escapeHtml(formatRelative(lastJobOpen, now))}` : 'none yet', true)}
				${chip('Links opened', `${js.opened}<small>/${js.total}</small>`, `${js.active} active`)}
				${chip(`Sessions · ${scope}`, String(summary.totalVisits ?? 0), `${summary.uniqueVisitors ?? 0} unique`)}
				${chip('AI cost', escapeHtml(aiCost), `${(summary.totalAiTokens ?? 0).toLocaleString()} tok`)}
			</div>

			${renderLatest(jobLinks, visits, { now })}

			<input class="tab-radio" type="radio" name="tab" id="tab-jobs" value="jobs" checked />
			<input class="tab-radio" type="radio" name="tab" id="tab-visits" value="visits" />
			<input class="tab-radio" type="radio" name="tab" id="tab-stats" value="stats" />
			${renderTabBar({ jobs: js.total, visits: visits.length, stats: summary.totalVisits ?? 0 })}

			<section class="tab-panel panel-jobs" aria-label="Job links">
				${renderJobsTab(jobLinks, { actionHref, now, openCode: jobNotice?.code })}
				<p class="foot-note">Links are kept for good. Opening a code from here shows it as visitors see it, without counting a visit.</p>
			</section>

			<section class="tab-panel panel-visits" aria-label="Site visits">
				<div class="visit-controls">
					<div class="seg" role="group" aria-label="Rows">
						<a class="${uniqueOnly ? '' : 'active'}" href="${escapeHtml(allSessionsHref)}">Sessions</a>
						<a class="${uniqueOnly ? 'active' : ''}" href="${escapeHtml(uniqueVisitorsHref)}">Visitors</a>
					</div>
					<details class="filters">
						<summary class="btn btn-sm">Filter</summary>
						<form class="filter-form" method="GET" action="/api/visits">
							${uniqueOnly ? '<input type="hidden" name="unique" value="1" />' : ''}
							<label>Date <input type="date" name="date" value="${escapeHtml(date)}" /></label>
							<label>Rows <input type="number" name="limit" min="1" max="${MAX_LIMIT}" value="${limit}" /></label>
							<button class="btn btn-sm btn-primary" type="submit">Apply</button>
						</form>
					</details>
				</div>
				<p class="faint small list-note">${escapeHtml(rowSummary)} · times UTC · kept 30 days</p>
				<div class="list-head visit-head" aria-hidden="true">
					<span>Time</span><span></span><span>Place · landing</span><span>Referrer</span><span>Score</span><span>Type</span><span></span>
				</div>
				${renderVisitList(visits, { actionHref, uniqueOnly, jobsByCode, now })}
				${canShowMore ? `<a class="btn more" href="${escapeHtml(moreHref)}">Show more</a>` : ''}
			</section>

			<section class="tab-panel panel-stats" aria-label="Stats">
				<h2 class="eyebrow">Site totals · ${escapeHtml(scope)}</h2>
				<div class="stat-grid">
					${chip('Visitors', String(summary.uniqueVisitors ?? 0))}
					${chip('Sessions', String(summary.totalVisits ?? 0))}
					${chip('High-intent', String(highIntent))}
					${chip('Résumé', String(summary.resumeInterest ?? 0))}
					${chip('Silent', String(summary.finalSilent ?? 0))}
					${chip('Agent', String(summary.finalAgent ?? 0))}
					${chip('Contact', String(summary.finalContact ?? 0))}
					${chip('AI cost', `$${(summary.totalAiCostUsd ?? 0).toFixed(4)}`, '', true)}
					${chip('AI tokens', (summary.totalAiTokens ?? 0).toLocaleString())}
				</div>
				<h2 class="eyebrow">Job links</h2>
				<div class="stat-grid stat-grid-4">
					${chip('Links', String(js.total))}
					${chip('Active', String(js.active))}
					${chip('Opened', String(js.opened))}
					${chip('Opens · 7d', String(js.opensLast7d), '', true)}
				</div>
				<h2 class="eyebrow">Breakdowns · ${escapeHtml(scope)}</h2>
				<div class="breakdown-grid">
					${renderBreakdown('Landing paths', dashboard.breakdowns.landing || [], { jobsByCode })}
					${renderBreakdown('Referrers', dashboard.breakdowns.referrer || [])}
					${renderBreakdown('Countries', dashboard.breakdowns.country || [])}
					${renderBreakdown('Devices', dashboard.breakdowns.device || [])}
				</div>
				<section class="card api-card">
					<h4>API</h4>
					<p class="muted small">Log in at <code>/admin</code>, or send the <code>x-visits-token</code> header or a Bearer token. <code>format=json</code> returns JSON, including <code>jobLinks</code>.</p>
					<a class="btn btn-sm" href="${escapeHtml(jsonHref)}">Raw JSON</a>
				</section>
				<section class="card danger-zone">
					<div>
						<h4>Danger zone</h4>
						<p class="muted small">Deletes every stored site visit and counter. Job links are kept.</p>
					</div>
					<form method="POST" action="${escapeHtml(actionHref)}" onsubmit="return confirm('Wipe all stored visit data? This cannot be undone.');">
						<input type="hidden" name="adminAction" value="wipe" />
						<button class="btn btn-sm btn-danger" type="submit">Wipe visit data</button>
					</form>
				</section>
			</section>
		</main>
		<script>${inlineScript}</script>
	</body>
</html>`;
}
