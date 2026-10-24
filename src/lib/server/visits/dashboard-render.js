// The admin dashboard page, phone first: a compact header, four headline numbers, the latest
// activity, then three tabs (Jobs, Visits, Stats). Tabs are radio inputs, so they work
// without JS; a little script keeps the chosen tab in the URL hash.
import { icon } from './dashboard-icons';
import { jobsScript } from './dashboard-jobs-script';
import { renderJobsTab } from './dashboard-render-jobs';
import { renderBreakdown, renderLatest, renderVisitList } from './dashboard-render-parts';
import { dashboardStyles } from './dashboard-styles';
import { escapeHtml, formatRelative, referrerName } from './shared';

const MAX_LIMIT = 100;

const JOB_NOTICES = {
	closed: (code) => `Job link ${code} closed: it now redirects to the home page.`,
	active: (code) => `Job link ${code} reopened.`,
	deleted: (code) => `Job link ${code} deleted.`,
	reset: (code) => `Job link ${code} reset: visits, previews and events are back to zero.`,
	emailSent: (code) => `Job link ${code}: email marked sent.`,
	emailUnsent: (code) => `Job link ${code}: email no longer marked sent.`,
	stage: (code) => `Job link ${code}: stage updated.`,
	created: (code) => `Job ${code} added. Claude will pick it up.`,
	noteSaved: (code) => `Job ${code}: note for Claude saved. It's Claude's turn.`,
	noteCleared: (code) => `Job ${code}: note for Claude cleared.`,
	noteDismissed: (code) => `Job ${code}: Claude's note moved to the history.`,
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

	// Visits: choosing rows to delete together. A long press on a row starts it (Cancel and
	// Delete show only then); a tap then picks or unpicks a row (instead of opening it);
	// Delete N asks, then removes them; Cancel or Escape stops.
	(function () {
		var panel = document.querySelector('.panel-visits');
		var form = panel && panel.querySelector('[data-bulk]');
		if (!form) return;
		var del = form.querySelector('[data-bulk-delete]');
		var label = form.querySelector('[data-bulk-label]');
		var cancel = form.querySelector('[data-bulk-cancel]');
		var ids = form.querySelector('[data-bulk-ids]');
		var visitors = form.querySelector('input[name="deleteMode"]').value === 'visitor';
		var selecting = false;
		function picked() { return panel.querySelectorAll('.visit.picked'); }
		function refresh() {
			var n = picked().length;
			panel.classList.toggle('selecting', selecting);
			cancel.hidden = !selecting;
			label.textContent = selecting ? (n ? 'Delete ' + n : 'Choose rows') : 'Delete';
			del.disabled = selecting && !n;
		}
		function start() {
			selecting = true;
			panel.querySelectorAll('.visit[open]').forEach(function (d) { d.open = false; });
			refresh();
		}
		function stop() {
			selecting = false;
			picked().forEach(function (v) { v.classList.remove('picked'); });
			refresh();
		}
		function toggle(visit) {
			visit.classList.toggle('picked');
			refresh();
		}
		var timer = null, startX = 0, startY = 0, longPressed = false;
		panel.querySelectorAll('.visit-row').forEach(function (row) {
			var visit = row.parentElement;
			row.addEventListener('pointerdown', function (e) {
				if (e.button > 0) return;
				longPressed = false;
				startX = e.clientX; startY = e.clientY;
				clearTimeout(timer);
				timer = setTimeout(function () {
					longPressed = true;
					if (!selecting) start();
					toggle(visit);
					if (navigator.vibrate) navigator.vibrate(15);
				}, 500);
			});
			row.addEventListener('pointermove', function (e) {
				if (Math.abs(e.clientX - startX) > 8 || Math.abs(e.clientY - startY) > 8) clearTimeout(timer);
			});
			['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) {
				row.addEventListener(t, function () { clearTimeout(timer); });
			});
			row.addEventListener('contextmenu', function (e) { if (longPressed || selecting) e.preventDefault(); });
			row.addEventListener('click', function (e) {
				if (longPressed) { e.preventDefault(); longPressed = false; return; }
				if (!selecting) return;
				e.preventDefault();
				toggle(visit);
			});
		});
		cancel.addEventListener('click', stop);
		addEventListener('keydown', function (e) { if (e.key === 'Escape' && selecting) stop(); });
		form.addEventListener('submit', function (e) {
			if (!selecting) { e.preventDefault(); return start(); }
			var rows = picked();
			if (!rows.length) return e.preventDefault();
			var what = rows.length === 1 ? (visitors ? "this visitor's sessions" : 'this session') : (visitors ? rows.length + " visitors' sessions" : rows.length + ' sessions');
			if (!confirm('Delete ' + what + '? This cannot be undone.')) return e.preventDefault();
			ids.innerHTML = '';
			rows.forEach(function (v) {
				['session', 'visitor'].forEach(function (k) {
					var input = document.createElement('input');
					input.type = 'hidden';
					input.name = k + 'Id';
					input.value = v.dataset[k] || '';
					ids.appendChild(input);
				});
			});
			e.preventDefault();
			del.disabled = true;
			label.textContent = 'Deleting…';
			send(form, function () {
				removeRows(Array.prototype.slice.call(rows));
				stop();
			}, function () { del.disabled = false; refresh(); });
		});

		// A row's own Delete session button: the same, for one row.
		panel.querySelectorAll('.visit-body form').forEach(function (one) {
			one.addEventListener('submit', function (e) {
				e.preventDefault();
				var button = one.querySelector('button');
				if (button) button.disabled = true;
				send(one, function () { removeRows([one.closest('.visit')]); }, function () {
					if (button) button.disabled = false;
				});
			});
		});

		// Posts in the background and takes the rows off at once (the page used to reload, and
		// could show them until the store caught up). Failing that, the plain form post.
		function send(f, done, failed) {
			fetch(f.action, {
				method: 'POST',
				body: new URLSearchParams(new FormData(f)),
				credentials: 'same-origin',
				redirect: 'manual'
			}).then(function (res) {
				if (res.ok || res.type === 'opaqueredirect') done();
				else { failed(); f.submit(); }
			}, function () { failed(); f.submit(); });
		}

		function removeRows(rows) {
			rows.forEach(function (v) { if (v) v.remove(); });
			panel.querySelectorAll('.visit-list').forEach(function (list) {
				var head = list.previousElementSibling;
				var n = list.querySelectorAll('.visit').length;
				if (!n) { list.remove(); if (head && head.classList.contains('group-head')) head.remove(); }
				else if (head && head.classList.contains('group-head')) {
					var count = head.querySelector('span');
					if (count) count.textContent = n;
				}
			});
			var badge = document.querySelector('.tab-visits .badge');
			if (badge) badge.textContent = panel.querySelectorAll('.visit').length;
		}
		refresh();
	})();
`;

// Older counts were kept by host ("www.google.es"); shown under their names, merged.
function mergeReferrers(items) {
	const totals = new Map();
	for (const item of items) {
		const name = referrerName(item.label);
		totals.set(name, (totals.get(name) || 0) + (Number(item.count) || 0));
	}
	return [...totals].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}

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
	const { limit, date, uniqueOnly, includeUncounted, totalRecentVisits, jobLinks, jobNotice, now = Date.now() } = params;
	const uniqueQuery = uniqueOnly ? 'unique=1&' : '';
	const dateQuery = `date=${encodeURIComponent(date)}`;
	const summary = dashboard.summary || {};
	// Newest first, so the day groups come out whole (the memory store keeps insertion order).
	const endedAt = (visit) => new Date(visit.endedAt).getTime() || 0;
	const visits = [...dashboard.recentVisits].sort((a, b) => endedAt(b) - endedAt(a));
	const jsonHref = `/api/visits?${uniqueQuery}format=json&limit=${limit}&${dateQuery}`;
	const actionHref = `/dashboard?${uniqueQuery}limit=${limit}&${dateQuery}`;
	const allSessionsHref = `/dashboard?limit=${limit}&${dateQuery}#visits`;
	const uniqueVisitorsHref = `/dashboard?unique=1&limit=${limit}&${dateQuery}#visits`;
	const refreshHref = `/dashboard?${uniqueQuery}limit=${limit}&${dateQuery}`;
	const moreHref = `/dashboard?${uniqueQuery}limit=${Math.min(MAX_LIMIT, limit + 20)}&${dateQuery}#visits`;
	// More rows may exist when the page came back full.
	const canShowMore = totalRecentVisits >= limit && limit < MAX_LIMIT;
	const rowSummary = uniqueOnly
		? `${visits.length} visitors from ${totalRecentVisits} sessions`
		: `${visits.length} most recent sessions`;
	// Short visits with no sign of a person (no scroll, tap, click, key or mouse movement).
	const hiddenUncounted = dashboard.hiddenUncounted || 0;
	const uncountedNote = includeUncounted
		? ` · <a class="text-link" href="/dashboard?${uniqueQuery}limit=${limit}&${dateQuery}#visits">hide uncounted visits</a>`
		: hiddenUncounted
			? ` · ${hiddenUncounted} short visit${hiddenUncounted === 1 ? '' : 's'} with no sign of a person hidden (<a class="text-link" href="/dashboard?${uniqueQuery}uncounted=1&limit=${limit}&${dateQuery}#visits">show</a>)`
			: '';
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
						<form class="filter-form" method="GET" action="/dashboard">
							${uniqueOnly ? '<input type="hidden" name="unique" value="1" />' : ''}
							<label>Date <input type="date" name="date" value="${escapeHtml(date)}" /></label>
							<label>Rows <input type="number" name="limit" min="1" max="${MAX_LIMIT}" value="${limit}" /></label>
							<button class="btn btn-sm btn-primary" type="submit">Apply</button>
						</form>
					</details>
					<!-- Several rows at once: a long press on a row starts choosing (and shows
					     Cancel and Delete here), a tap picks a row, and Delete N removes them. -->
					<form class="bulk-form" method="POST" action="${escapeHtml(actionHref)}" data-bulk>
						<input type="hidden" name="adminAction" value="deleteMany" />
						<input type="hidden" name="deleteMode" value="${uniqueOnly ? 'visitor' : 'session'}" />
						<span data-bulk-ids hidden></span>
						<button class="btn btn-sm" type="button" data-bulk-cancel hidden>Cancel</button>
						<button class="btn btn-sm btn-danger-ghost" type="submit" data-bulk-delete>${icon('trash')} <span data-bulk-label>Delete</span></button>
					</form>
				</div>
				<p class="faint small list-note">${escapeHtml(rowSummary)} · times UTC · kept 30 days${uncountedNote}</p>
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
					${chip('Applied', String(js.applied ?? 0))}
					${chip('Opened', String(js.opened))}
					${chip('Opens · 7d', String(js.opensLast7d), '', true)}
				</div>
				<h2 class="eyebrow">Breakdowns · ${escapeHtml(scope)}</h2>
				<div class="breakdown-grid">
					${renderBreakdown('Landing paths', dashboard.breakdowns.landing || [], { jobsByCode })}
					${renderBreakdown('Referrers', mergeReferrers(dashboard.breakdowns.referrer || []))}
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
		<script>${inlineScript}${jobsScript}</script>
	</body>
</html>`;
}
