// The Jobs tab of the admin dashboard: one compact, expandable row per /r/<code> link.
// Order: recently opened first, then never opened, then closed (folded into a group).
import { icon } from './dashboard-icons';
import { projectName } from './job-links';
import { escapeHtml, formatRelative, formatTimestamp } from './shared';

const EVENT_LABELS = {
	project_open: ['project', 'projects'],
	resume_open: ['résumé', 'résumés'],
	chat_open: ['chat', 'chats'],
	chat_question: ['question', 'questions']
};
// Timeline entries shown before the rest fold into "Older".
const TIMELINE_VISIBLE = 8;

const plural = (n, [one, many]) => `${n} ${n === 1 ? one : many}`;
const timeOf = (value) => {
	const time = new Date(value || '').getTime();
	return Number.isNaN(time) ? 0 : time;
};

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
	return chips.length ? `<span class="chips">${chips.join('')}</span>` : '';
}

function renderStatus(link) {
	if (link.status === 'closed') return '<span class="pill pill-closed">Closed</span>';
	if (link.recentlyActive) return '<span class="pill pill-live" title="Opened in the last 48 hours">Recent</span>';
	if (link.visits > 0) return '<span class="pill pill-active">Active</span>';
	return '<span class="pill pill-unopened">New</span>';
}

const placeOf = (entry) => [entry.city, entry.country].filter(Boolean).join(', ');

/** One short line for a log entry: what happened, in a few words. */
export function describeJobEntry(entry) {
	switch (entry.type) {
		case 'visit':
			return [`Opened${placeOf(entry) ? ` from ${placeOf(entry)}` : ''}`, entry.device, entry.referrer ? `via ${entry.referrer}` : '']
				.filter(Boolean)
				.join(' · ');
		case 'preview':
			return `${entry.previewer || 'Bot'} preview${placeOf(entry) ? ` · ${placeOf(entry)}` : ''}`;
		case 'project_open':
			return `Project: ${projectName(entry.project)}`;
		case 'resume_open':
			return 'Opened the résumé';
		case 'chat_open':
			return 'Opened the chat';
		case 'chat_question':
			return 'Asked the agent a question';
		default:
			return entry.type || 'Event';
	}
}

function renderTimelineItem(entry, now) {
	const type = escapeHtml(entry.type || 'event');
	return `<li class="tl tl-${type}">${icon(entry.type)}<span class="tl-text">${escapeHtml(describeJobEntry(entry))}</span><span class="tl-time">${renderTime(entry.at, now)}</span></li>`;
}

function renderTimeline(link, now) {
	if (!link.log.length) return '<p class="muted small">Nothing logged yet.</p>';
	const visible = link.log.slice(0, TIMELINE_VISIBLE).map((e) => renderTimelineItem(e, now)).join('');
	const rest = link.log.slice(TIMELINE_VISIBLE);
	const older = rest.length
		? `<details class="fold"><summary>Older (${rest.length}${link.logTruncated ? '+' : ''})</summary><ol class="timeline">${rest.map((e) => renderTimelineItem(e, now)).join('')}</ol></details>`
		: '';
	return `<ol class="timeline">${visible}</ol>${older}`;
}

const renderField = (label, value) =>
	value ? `<div><dt>${escapeHtml(label)}</dt><dd>${value}</dd></div>` : '';

function renderActions(link, actionHref) {
	const closing = link.status !== 'closed';
	const code = escapeHtml(link.code);
	// JSON-quoted, then attribute-escaped, so any company name stays a plain JS string.
	const confirmText = `Delete job link ${link.code} (${link.company}) and its whole log? This cannot be undone.`;
	return `
		<div class="job-actions">
			<a class="btn btn-sm" href="/r/${code}" target="_blank" rel="noopener" title="Opens as you: not counted, no Telegram alert">Open /r/${code} ${icon('external')}</a>
			<form method="POST" action="${escapeHtml(actionHref)}">
				<input type="hidden" name="adminAction" value="jobStatus" />
				<input type="hidden" name="code" value="${code}" />
				<input type="hidden" name="status" value="${closing ? 'closed' : 'active'}" />
				<button class="btn btn-sm" type="submit">${closing ? 'Close' : 'Reopen'}</button>
			</form>
			<form method="POST" action="${escapeHtml(actionHref)}" onsubmit="return confirm(${escapeHtml(JSON.stringify(confirmText))});">
				<input type="hidden" name="adminAction" value="jobDelete" />
				<input type="hidden" name="code" value="${code}" />
				<button class="btn btn-sm btn-danger" type="submit">Delete</button>
			</form>
		</div>`;
}

function renderFold(title, meta, body) {
	return `<details class="fold"><summary>${escapeHtml(title)}${meta ? ` <span class="muted">${escapeHtml(meta)}</span>` : ''}</summary><div class="prose">${escapeHtml(body)}</div></details>`;
}

function renderJobBody(link, { actionHref, now }) {
	const jobUrl = link.jobUrl
		? `<a class="text-link" href="${escapeHtml(link.jobUrl)}" target="_blank" rel="noreferrer">${escapeHtml(link.jobUrl.replace(/^https?:\/\/(www\.)?/, ''))}</a>`
		: '';
	const visits = `${link.visits}${link.opensLast7d ? ` <span class="muted">(${link.opensLast7d} this week)</span>` : ''}`;
	const updated = link.updatedAt && link.updatedAt !== link.createdAt ? renderTime(link.updatedAt, now) : '';

	return `
		<div class="job-body">
			${renderActions(link, actionHref)}
			<div class="job-columns">
				<div class="timeline-wrap">
					<h4>Timeline</h4>
					${renderTimeline(link, now)}
				</div>
				<div class="job-info">
					<dl class="facts">
						${renderField('Opens', visits)}
						${renderField('Previews', String(link.previews))}
						${renderField('Last open', renderTime(link.lastVisitAt, now))}
						${renderField('First open', link.firstVisitAt ? renderTime(link.firstVisitAt, now) : '')}
						${renderField('Created', renderTime(link.createdAt, now))}
						${renderField('Updated', updated)}
						${renderField('Region', escapeHtml((link.region || 'us').toUpperCase()))}
						${renderField('Engagement', renderEngagement(link.events))}
						${jobUrl ? `<div class="wide"><dt>Posting</dt><dd>${jobUrl}</dd></div>` : ''}
						${link.fitPoints?.length ? `<div class="wide"><dt>Fit points</dt><dd class="prose">${link.fitPoints.map(escapeHtml).join('<br />')}</dd></div>` : ''}
						${link.greeting ? `<div class="wide"><dt>Greeting</dt><dd class="prose">${escapeHtml(link.greeting)}</dd></div>` : ''}
					</dl>
					${link.notes ? renderFold('Notes', '', link.notes) : ''}
					${link.jobDescription ? renderFold('Job description', `${link.jobDescription.length.toLocaleString()} chars`, link.jobDescription) : ''}
				</div>
			</div>
		</div>`;
}

function renderSideLine(link, now) {
	if (link.status === 'closed') return link.visits ? `${plural(link.visits, ['open', 'opens'])}` : 'never opened';
	if (!link.visits) return `created ${escapeHtml(formatRelative(link.createdAt, now))}`;
	return `${escapeHtml(formatRelative(link.lastVisitAt, now))} · ${plural(link.visits, ['open', 'opens'])}`;
}

function renderJobRow(link, { now, openCode, actionHref }) {
	const classes = ['job', link.recentlyActive ? 'is-recent' : '', link.status === 'closed' ? 'is-closed' : '']
		.filter(Boolean)
		.join(' ');
	const code = escapeHtml(link.code);
	const engagement = renderEngagement(link.events);

	return `
		<details class="${classes}" id="job-${code}"${openCode === link.code ? ' open' : ''}>
			<summary class="job-row">
				<span class="j-main">
					<span class="j-title"><span class="j-code">${code}</span><span class="j-sep">·</span><strong>${escapeHtml(link.company || '—')}</strong></span>
					<span class="j-role">${escapeHtml(link.role || '')}</span>
				</span>
				<span class="j-cell j-region">${escapeHtml((link.region || 'us').toUpperCase())}</span>
				<span class="j-cell j-previews">${link.previews ? plural(link.previews, ['preview', 'previews']) : '<span class="faint">—</span>'}</span>
				<span class="j-cell j-eng">${engagement || '<span class="faint">—</span>'}</span>
				<span class="j-side">
					<span class="j-last">${renderSideLine(link, now)}</span>
					${renderStatus(link)}
				</span>
				<span class="chev" aria-hidden="true"></span>
			</summary>
			${renderJobBody(link, { actionHref, now })}
		</details>`;
}

/** Recently opened first, then never opened (newest first); closed ones separately. */
export function sortJobLinks(links) {
	const open = links.filter((l) => l.status !== 'closed');
	const byLast = (a, b) => timeOf(b.lastVisitAt) - timeOf(a.lastVisitAt);
	const byCreated = (a, b) => timeOf(b.createdAt) - timeOf(a.createdAt);
	return {
		opened: open.filter((l) => l.visits > 0).sort(byLast),
		unopened: open.filter((l) => !l.visits).sort(byCreated),
		closed: links.filter((l) => l.status === 'closed').sort((a, b) => byLast(a, b) || byCreated(a, b))
	};
}

export function renderJobsTab(jobLinks, { actionHref, now, openCode }) {
	const { links, error } = jobLinks;
	if (!links.length) {
		return `<p class="empty">${escapeHtml(error || 'No job links yet. Agents create them with POST /api/r.')}</p>`;
	}

	const { opened, unopened, closed } = sortJobLinks(links);
	const rows = (list) => list.map((link) => renderJobRow(link, { actionHref, now, openCode })).join('');
	const closedOpen = closed.some((l) => l.code === openCode);

	return `
		<div class="list-head job-head" aria-hidden="true">
			<span>Code · company · role</span><span>Region</span><span>Previews</span><span>Engagement</span><span>Last open</span><span></span>
		</div>
		<div class="job-list">
			${rows(opened)}
			${unopened.length ? `<h3 class="group-head">Not opened yet <span>${unopened.length}</span></h3>${rows(unopened)}` : ''}
		</div>
		${
			closed.length
				? `<details class="group-fold"${closedOpen ? ' open' : ''}><summary class="group-head">Closed <span>${closed.length}</span><span class="chev" aria-hidden="true"></span></summary><div class="job-list">${rows(closed)}</div></details>`
				: ''
		}
		${error ? `<p class="empty">${escapeHtml(error)}</p>` : ''}`;
}
