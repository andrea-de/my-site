// The Job links section of the admin dashboard: one expandable row per /r/<code> link.
import { projectName } from './job-links';
import { escapeHtml, formatRelative, formatTimestamp } from './shared';

const EVENT_LABELS = {
	project_open: ['project', 'projects'],
	resume_open: ['résumé', 'résumés'],
	chat_open: ['chat', 'chats'],
	chat_question: ['question', 'questions']
};

const plural = (n, [one, many]) => `${n} ${n === 1 ? one : many}`;

function renderTime(timestamp, now) {
	if (!timestamp) return '<span class="muted">—</span>';
	return `<time datetime="${escapeHtml(timestamp)}" title="${escapeHtml(formatTimestamp(timestamp))} UTC">${escapeHtml(formatRelative(timestamp, now))}</time>`;
}

function renderEngagement(events = {}) {
	const chips = Object.entries(events)
		.filter(([, count]) => count > 0)
		.map(([type, count]) => {
			const label = EVENT_LABELS[type] ? plural(count, EVENT_LABELS[type]) : `${count} ${type}`;
			return `<span class="chip chip-${escapeHtml(type)}">${escapeHtml(label)}</span>`;
		});
	return chips.length ? chips.join('') : '<span class="muted">—</span>';
}

function renderStatus(link) {
	if (link.status === 'closed') return '<span class="pill pill-closed">Closed</span>';
	if (link.recentlyActive) return '<span class="pill pill-live" title="Active, opened in the last 48 hours">Recent</span>';
	if (link.visits > 0) return '<span class="pill pill-active">Active</span>';
	return '<span class="pill pill-unopened">Not opened</span>';
}

function placeOf(entry) {
	return [entry.city, entry.country].filter(Boolean).join(', ') || 'Unknown place';
}

function describeEntry(entry) {
	switch (entry.type) {
		case 'visit':
			return {
				kind: 'Visit',
				text: [placeOf(entry), entry.device, entry.referrer ? `via ${entry.referrer}` : 'direct']
					.filter(Boolean)
					.join(' · ')
			};
		case 'preview':
			return { kind: 'Preview', text: `Unfurled by ${entry.previewer || 'a bot'}${entry.country ? ` · ${placeOf(entry)}` : ''}` };
		case 'project_open':
			return { kind: 'Project', text: `Opened ${projectName(entry.project)}` };
		case 'resume_open':
			return { kind: 'Résumé', text: 'Opened the résumé' };
		case 'chat_open':
			return { kind: 'Chat', text: 'Opened the chat' };
		case 'chat_question':
			return { kind: 'Question', text: 'Asked the agent a question' };
		default:
			return { kind: entry.type || 'Event', text: '' };
	}
}

function renderTimeline(link, now) {
	if (!link.log.length) return '<p class="muted">Nothing logged yet.</p>';
	const items = link.log
		.map((entry) => {
			const { kind, text } = describeEntry(entry);
			return `
				<li class="tl-item tl-${escapeHtml(entry.type || 'event')}">
					<span class="tl-kind">${escapeHtml(kind)}</span>
					<span class="tl-text">${escapeHtml(text)}</span>
					<span class="tl-time">${renderTime(entry.at, now)}<span class="tl-abs">${escapeHtml(formatTimestamp(entry.at))}</span></span>
				</li>`;
		})
		.join('');
	const note = link.logTruncated ? `<p class="muted small">Showing the newest ${link.log.length} entries.</p>` : '';
	return `<ol class="timeline">${items}</ol>${note}`;
}

function renderField(label, value) {
	if (!value) return '';
	return `<div class="field"><dt>${escapeHtml(label)}</dt><dd>${value}</dd></div>`;
}

function renderActions(link, actionHref) {
	const closing = link.status !== 'closed';
	const code = escapeHtml(link.code);
	// JSON-quoted, then attribute-escaped, so any company name stays a plain JS string.
	const confirmText = `Delete job link ${link.code} (${link.company}) and its whole log? This cannot be undone.`;
	return `
		<div class="job-actions">
			<a class="btn" href="/r/${code}" target="_blank" rel="noopener">Open /r/${code} ↗</a>
			<form method="POST" action="${escapeHtml(actionHref)}">
				<input type="hidden" name="adminAction" value="jobStatus" />
				<input type="hidden" name="code" value="${code}" />
				<input type="hidden" name="status" value="${closing ? 'closed' : 'active'}" />
				<button class="btn" type="submit">${closing ? 'Close link' : 'Reopen link'}</button>
			</form>
			<form method="POST" action="${escapeHtml(actionHref)}" onsubmit="return confirm(${escapeHtml(JSON.stringify(confirmText))});">
				<input type="hidden" name="adminAction" value="jobDelete" />
				<input type="hidden" name="code" value="${code}" />
				<button class="btn btn-danger" type="submit">Delete</button>
			</form>
		</div>`;
}

function renderJobBody(link, { actionHref, now }) {
	const projects = (link.projects || []).length
		? `<ol class="project-list">${link.projects.map((id) => `<li>${escapeHtml(projectName(id))}</li>`).join('')}</ol>`
		: '<span class="muted">All projects (none chosen)</span>';
	const jobUrl = link.jobUrl
		? `<a class="text-link" href="${escapeHtml(link.jobUrl)}" target="_blank" rel="noreferrer">${escapeHtml(link.jobUrl)}</a>`
		: '';
	const description = link.jobDescription
		? `<details class="description"><summary>Job description <span class="muted">(${link.jobDescription.length.toLocaleString()} chars)</span></summary><div class="prose">${escapeHtml(link.jobDescription)}</div></details>`
		: '';
	const dates = [
		`created ${escapeHtml(formatTimestamp(link.createdAt))}`,
		link.updatedAt && link.updatedAt !== link.createdAt ? `updated ${escapeHtml(formatTimestamp(link.updatedAt))}` : '',
		link.firstVisitAt ? `first opened ${escapeHtml(formatTimestamp(link.firstVisitAt))}` : ''
	]
		.filter(Boolean)
		.join(' · ');

	return `
		<div class="job-body">
			${renderActions(link, actionHref)}
			<div class="job-columns">
				<dl class="fields">
					${renderField('Job posting', jobUrl)}
					${renderField('Projects', projects)}
					${renderField('Greeting', link.greeting ? `<span class="prose">${escapeHtml(link.greeting)}</span>` : '')}
					${renderField('Notes', link.notes ? `<span class="prose">${escapeHtml(link.notes)}</span>` : '')}
					${renderField('Dates', `${dates} <span class="muted">UTC</span>`)}
					${description ? `<div class="field">${description}</div>` : ''}
				</dl>
				<div class="timeline-wrap">
					<h4>Timeline</h4>
					${renderTimeline(link, now)}
				</div>
			</div>
		</div>`;
}

function renderJobRow(link, options) {
	const { now, openCode } = options;
	const classes = [
		'job',
		link.visits > 0 ? 'is-opened' : 'is-unopened',
		link.recentlyActive ? 'is-recent' : '',
		link.status === 'closed' ? 'is-closed' : ''
	]
		.filter(Boolean)
		.join(' ');
	const code = escapeHtml(link.code);

	return `
		<details class="${classes}" id="job-${code}"${openCode === link.code ? ' open' : ''}>
			<summary class="job-row">
				<span class="c-code"><a href="/r/${code}" target="_blank" rel="noopener" title="Open the live page (counts as a visit)">${code}</a></span>
				<span class="c-job"><strong>${escapeHtml(link.company || '—')}</strong><span>${escapeHtml(link.role || '')}</span></span>
				<span class="c-status">${renderStatus(link)}</span>
				<span class="c-cell c-region"><span class="m-label">Region</span>${escapeHtml((link.region || 'us').toUpperCase())}</span>
				<span class="c-cell c-created"><span class="m-label">Created</span>${renderTime(link.createdAt, now)}</span>
				<span class="c-cell c-visits"><span class="m-label">Visits</span><b>${link.visits}</b>${link.opensLast7d ? `<small>${link.opensLast7d} this wk</small>` : ''}</span>
				<span class="c-cell c-previews"><span class="m-label">Previews</span><b>${link.previews}</b></span>
				<span class="c-cell c-last"><span class="m-label">Last visit</span>${renderTime(link.lastVisitAt, now)}</span>
				<span class="c-cell c-eng${Object.values(link.events || {}).some((n) => n > 0) ? '' : ' is-empty'}"><span class="m-label">Engagement</span><span class="chips">${renderEngagement(link.events)}</span></span>
				<span class="c-chev" aria-hidden="true"></span>
			</summary>
			${renderJobBody(link, options)}
		</details>`;
}

export function renderJobLinksSection(jobLinks, { actionHref, now, openCode }) {
	const { summary, links, error } = jobLinks;
	const list = links.length
		? `
			<div class="job-list">
				<div class="job-head" aria-hidden="true">
					<span>Code</span><span>Company · Role</span><span>Status</span><span>Region</span><span>Created</span><span>Visits</span><span>Previews</span><span>Last visit</span><span>Engagement</span><span></span>
				</div>
				${links.map((link) => renderJobRow(link, { actionHref, now, openCode })).join('')}
			</div>`
		: `<p class="empty">${escapeHtml(error || 'No job links yet. Agents create them with POST /api/r.')}</p>`;

	return `
		<section class="section" id="job-links">
			<div class="section-head">
				<h2>Job links</h2>
				<p>Kept for good · newest first · opening a code from here counts as a visit</p>
			</div>
			<div class="stat-grid stat-grid-4">
				<div class="stat"><span>Links</span><strong>${summary.total}</strong></div>
				<div class="stat"><span>Active</span><strong>${summary.active}</strong></div>
				<div class="stat"><span>Opened at least once</span><strong>${summary.opened}</strong></div>
				<div class="stat stat-accent"><span>Opens · last 7 days</span><strong>${summary.opensLast7d}</strong></div>
			</div>
			${list}
		</section>`;
}
