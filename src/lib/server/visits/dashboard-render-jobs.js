// The Jobs tab of the admin dashboard: filters, then one compact row per /r/<code> link that
// opens its details in a sheet (a plain expanding row without JS).
// Order: recently opened first, then never opened, then closed (folded into a group).
import { stageOf } from '$lib/server/referrals/store';
import { NOTE_MAX, ROUTE_TAGS, STAGES } from '$lib/server/referrals/validate';
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

export const STAGE_LABELS = {
	'not-started': 'Not started',
	drafted: 'Drafted',
	sent: 'Sent',
	replied: 'Replied',
	interviewing: 'Interviewing',
	offer: 'Offer',
	rejected: 'Rejected',
	'no-reply': 'No reply'
};
// Quick views: the filter chips at the top of the tab, matched in the page script by data-* attributes.
const QUICK_VIEWS = [
	['yourturn', 'Your turn'],
	['claudeturn', "Claude's turn"],
	['ready', 'Ready to send'],
	['notyet', 'Not applied yet'],
	['waiting', 'Waiting on reply'],
	['opened', 'Opened']
];

/** Whose move it is on a job's notes: 'claude' once Andrea left a note, 'you' while Claude's waits. */
export const turnOf = (link) => (link.noteForClaude ? 'claude' : link.noteForAndrea ? 'you' : '');
const TURN_LABELS = { you: 'Your turn', claude: "Claude's turn" };

/** The row title: the company, or the posting's host until Claude fills the company in. */
export function jobTitle(link) {
	if (link.company) return link.company;
	try {
		return new URL(link.jobUrl).hostname.replace(/^www\./, '');
	} catch {
		return '—';
	}
}

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

function renderStagePill(link) {
	const stage = stageOf(link);
	return `<span class="pill stage stage-${stage}">${STAGE_LABELS[stage]}</span>`;
}

const renderTags = (link) =>
	(link.routes || []).map((r) => `<span class="rtag rtag-${escapeHtml(r.tag)}">${escapeHtml(r.tag)}</span>`).join('');

function renderRouteWhere(where) {
	if (!where) return '<span class="faint">—</span>';
	if (/^https?:\/\//i.test(where)) {
		return `<a class="text-link" href="${escapeHtml(where)}" target="_blank" rel="noreferrer">${escapeHtml(where.replace(/^https?:\/\/(www\.)?/, ''))}</a>`;
	}
	return escapeHtml(where);
}

function renderRoutes(link) {
	if (!link.routes?.length) return '<p class="muted small">No routes recorded.</p>';
	return `<ul class="routes">${link.routes
		.map(
			(r) =>
				`<li class="route${r.used ? ' is-used' : ''}"><span class="rtag rtag-${escapeHtml(r.tag)}">${escapeHtml(r.tag)}</span><span class="route-where">${renderRouteWhere(r.where)}</span>${r.used ? '<span class="route-used">Used</span>' : ''}</li>`
		)
		.join('')}</ul>`;
}

const placeOf = (entry) => [entry.city, entry.country].filter(Boolean).join(', ');

/** One short line for a log entry: what happened, in a few words. */
export function describeJobEntry(entry) {
	switch (entry.type) {
		case 'visit':
			return [`Opened${entry.page === 'shorts' ? ' shorts' : ''}${placeOf(entry) ? ` from ${placeOf(entry)}` : ''}`, entry.device, entry.referrer ? `via ${entry.referrer}` : '']
				.filter(Boolean)
				.join(' · ');
		case 'preview':
			return `${entry.previewer || 'Bot'} preview${entry.page === 'shorts' ? ' of shorts' : ''}${placeOf(entry) ? ` · ${placeOf(entry)}` : ''}`;
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
	const resetText = `Reset ${link.code} (${link.company})? Its visits, previews and events go back to zero and its log is cleared. The link itself keeps working.`;
	return `
		<div class="job-actions">
			${link.company ? `<a class="btn btn-sm" href="/r/${code}" target="_blank" rel="noopener" title="Opens as you: not counted, no Telegram alert">Open /r/${code} ${icon('external')}</a>` : ''}
			${link.resume ? `<a class="btn btn-sm" href="/api/r/${code}/resume" download title="${escapeHtml(`${link.resume.filename} · ${Math.round(link.resume.size / 1024)} KB`)}">Download resume</a>` : ''}
			<form method="POST" action="${escapeHtml(actionHref)}">
				<input type="hidden" name="adminAction" value="jobEmail" />
				<input type="hidden" name="code" value="${code}" />
				<input type="hidden" name="sent" value="${link.emailSentAt ? '0' : '1'}" />
				<button class="btn btn-sm toggle${link.emailSentAt ? ' is-on' : ''}" type="submit" role="switch" aria-checked="${link.emailSentAt ? 'true' : 'false'}" title="Switch on once you've sent the pitch email for this job">
					<span class="knob" aria-hidden="true"></span>Email sent
				</button>
			</form>
			<form method="POST" action="${escapeHtml(actionHref)}">
				<input type="hidden" name="adminAction" value="jobStatus" />
				<input type="hidden" name="code" value="${code}" />
				<input type="hidden" name="status" value="${closing ? 'closed' : 'active'}" />
				<button class="btn btn-sm" type="submit">${closing ? 'Close' : 'Reopen'}</button>
			</form>
			<form method="POST" action="${escapeHtml(actionHref)}" onsubmit="return confirm(${escapeHtml(JSON.stringify(resetText))});">
				<input type="hidden" name="adminAction" value="jobReset" />
				<input type="hidden" name="code" value="${code}" />
				<button class="btn btn-sm" type="submit" title="Clears visits, previews, events and the log; keeps the link">Reset activity</button>
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

const WHO = { andrea: 'You', claude: 'Claude' };

// The two note boxes: Claude's note for Andrea (read-only, Dismiss moves it to the history)
// and Andrea's note for Claude (a textarea; saving a note makes it Claude's turn).
function renderNotes(link, { actionHref, now }) {
	const code = escapeHtml(link.code);
	const forYou = link.noteForAndrea
		? `<section class="note note-you">
				<div class="note-head"><h4>For you</h4><span class="note-meta">from Claude${link.noteForAndreaAt ? ` · ${renderTime(link.noteForAndreaAt, now)}` : ''}</span></div>
				<div class="note-box"><p class="note-text">${escapeHtml(link.noteForAndrea)}</p>
					<form method="POST" action="${escapeHtml(actionHref)}">
						<input type="hidden" name="adminAction" value="jobDismissNote" />
						<input type="hidden" name="code" value="${code}" />
						<button class="btn btn-sm" type="submit" title="Moves Claude's note to the history">Dismiss</button>
					</form>
				</div>
			</section>`
		: '';
	const saved = link.noteForClaude
		? `Saved${link.noteForClaudeAt ? ` ${renderTime(link.noteForClaudeAt, now)}` : ''} · Claude's turn`
		: 'Nothing for Claude yet';
	const forClaude = `
		<form class="note note-claude" method="POST" action="${escapeHtml(actionHref)}" data-note-form>
			<input type="hidden" name="adminAction" value="jobNoteForClaude" />
			<input type="hidden" name="code" value="${code}" />
			<div class="note-head"><h4><label for="nfc-${code}">For Claude</label></h4></div>
			<textarea id="nfc-${code}" name="noteForClaude" rows="${link.noteForClaude ? 4 : 2}" maxlength="${NOTE_MAX}" placeholder="Answers, decisions or what to do next">${escapeHtml(link.noteForClaude || '')}</textarea>
			<div class="note-foot"><span class="note-state" data-saved="${escapeHtml(saved.replace(/<[^>]+>/g, ''))}">${saved}</span><button class="btn btn-sm btn-primary" type="submit">Save</button></div>
		</form>`;
	return `<div class="notes">${forYou}${forClaude}</div>`;
}

function renderHistory(link, now) {
	const history = link.history || [];
	if (!history.length) return '';
	const items = history
		.map(
			(e) =>
				`<li class="h-entry h-${e.by === 'andrea' ? 'andrea' : 'claude'}"><div class="h-meta"><strong>${WHO[e.by] || 'Claude'}</strong> · ${renderTime(e.at, now)}</div><p class="note-text">${escapeHtml(e.text)}</p></li>`
		)
		.join('');
	return `<details class="fold history"><summary>History <span class="muted">${history.length}</span></summary><ol class="history-list">${items}</ol></details>`;
}

function renderJobBody(link, { actionHref, now }) {
	const jobUrl = link.jobUrl
		? `<a class="text-link" href="${escapeHtml(link.jobUrl)}" target="_blank" rel="noreferrer">${escapeHtml(link.jobUrl.replace(/^https?:\/\/(www\.)?/, ''))}</a>`
		: '';
	const visits = `${link.visits}${link.opensLast7d ? ` <span class="muted">(${link.opensLast7d} this week)</span>` : ''}`;
	const updated = link.updatedAt && link.updatedAt !== link.createdAt ? renderTime(link.updatedAt, now) : '';

	const code = escapeHtml(link.code);
	const stage = stageOf(link);
	const notes = renderNotes(link, { actionHref, now });

	return `
		<div class="job-body">
			${notes}
			${renderActions(link, actionHref)}
			<div class="job-plan">
				<form class="stage-form" method="POST" action="${escapeHtml(actionHref)}">
					<input type="hidden" name="adminAction" value="jobStage" />
					<input type="hidden" name="code" value="${code}" />
					<label><span class="h4">Stage</span>
						<select name="stage" onchange="this.form.requestSubmit ? this.form.requestSubmit() : this.form.submit()">
							${STAGES.map((s) => `<option value="${s}"${s === stage ? ' selected' : ''}>${STAGE_LABELS[s]}</option>`).join('')}
						</select>
					</label>
					<noscript><button class="btn btn-sm" type="submit">Save</button></noscript>
				</form>
				<div class="routes-wrap"><h4>Routes</h4>${renderRoutes(link)}</div>
			</div>
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
						${renderField('Applied', link.appliedAt ? `${renderTime(link.appliedAt, now)} <span class="muted">via form</span>` : '')}
						${renderField('Email sent', link.emailSentAt ? renderTime(link.emailSentAt, now) : '')}
						${renderField('Created', renderTime(link.createdAt, now))}
						${renderField('Updated', updated)}
						${renderField('Region', escapeHtml((link.region || 'us').toUpperCase()))}
						${renderField('Engagement', renderEngagement(link.events))}
						${jobUrl ? `<div class="wide"><dt>Posting</dt><dd>${jobUrl}</dd></div>` : ''}
						${link.greeting ? `<div class="wide"><dt>Greeting</dt><dd class="prose">${escapeHtml(link.greeting)}</dd></div>` : ''}
					</dl>
					${link.fitPoints?.length ? `<details class="fold"><summary>Fit points <span class="muted">${link.fitPoints.length}</span></summary><ul class="fit-points">${link.fitPoints.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}</ul></details>` : ''}
					${link.appliedNote ? renderFold('Application note', '', link.appliedNote) : ''}
					${link.notes ? renderFold('Notes', '', link.notes) : ''}
					${link.jobDescription ? renderFold('Job description', `${link.jobDescription.length.toLocaleString()} chars`, link.jobDescription) : ''}
					${link.foundBy ? `<p class="j-source">Source: ${link.foundBy === 'agent' ? 'daily search' : 'you'}</p>` : ''}
				</div>
			</div>
			${renderHistory(link, now)}
		</div>`;
}

function renderSideLine(link, now) {
	if (link.status === 'closed') return link.visits ? `${plural(link.visits, ['open', 'opens'])}` : 'never opened';
	if (!link.visits) return `created ${escapeHtml(formatRelative(link.createdAt, now))}`;
	return `${escapeHtml(formatRelative(link.lastVisitAt, now))} · ${plural(link.visits, ['open', 'opens'])}`;
}

function renderTurn(link) {
	const turn = turnOf(link);
	return turn ? `<span class="pill turn turn-${turn}">${TURN_LABELS[turn]}</span>` : '';
}

// Under the role: whose turn it is, then the first line of whichever note is waiting.
function renderNoteLine(link) {
	const turn = turnOf(link);
	if (!turn) return '';
	const text = (turn === 'you' ? link.noteForAndrea : link.noteForClaude).split('\n').find((l) => l.trim()) || '';
	return `<span class="j-note j-note-${turn}">${renderTurn(link)}<span class="j-note-text">${turn === 'claude' ? '<b>You:</b> ' : ''}${escapeHtml(text)}</span></span>`;
}

function renderJobRow(link, { now, openCode, actionHref }) {
	const classes = ['job', link.recentlyActive ? 'is-recent' : '', link.status === 'closed' ? 'is-closed' : '']
		.filter(Boolean)
		.join(' ');
	const code = escapeHtml(link.code);
	const engagement = renderEngagement(link.events);

	const stage = stageOf(link);
	const data = {
		stage,
		tags: (link.routes || []).map((r) => r.tag).join(' '),
		turn: turnOf(link),
		opened: link.visits > 0 ? '1' : '',
		search: `${link.code} ${jobTitle(link)} ${link.role || ''}`.toLowerCase()
	};
	const dataAttrs = Object.entries(data)
		.map(([k, v]) => `data-${k}="${escapeHtml(v)}"`)
		.join(' ');
	const tags = renderTags(link);

	return `
		<details class="${classes}" id="job-${code}" ${dataAttrs}${openCode === link.code ? ' open' : ''}>
			<summary class="job-row">
				<span class="j-main">
					<span class="j-title"><span class="j-code">${code}</span><span class="j-sep">·</span><strong>${escapeHtml(jobTitle(link))}</strong></span>
					<span class="j-role">${escapeHtml(link.role || '')}</span>
					${tags ? `<span class="j-tags">${tags}</span>` : ''}
					${renderNoteLine(link)}
				</span>
				<span class="j-cell j-region">${escapeHtml((link.region || 'us').toUpperCase())}</span>
				<span class="j-cell j-previews">${link.previews ? plural(link.previews, ['preview', 'previews']) : '<span class="faint">—</span>'}</span>
				<span class="j-cell j-eng">${engagement || '<span class="faint">—</span>'}</span>
				<span class="j-side">
					<span class="j-last">${renderSideLine(link, now)}</span>
					<span class="j-pills">${renderStagePill(link)}${renderStatus(link)}</span>
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
		return `${renderNewJob(actionHref)}<p class="empty">${escapeHtml(error || 'No job links yet. Add one above, or agents create them with POST /api/r.')}</p>`;
	}

	const { opened, unopened, closed } = sortJobLinks(links);
	const rows = (list) => list.map((link) => renderJobRow(link, { actionHref, now, openCode })).join('');
	const closedOpen = closed.some((l) => l.code === openCode);

	return `
		${renderNewJob(actionHref)}
		${renderFilters()}
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
		<p class="empty job-none" hidden>No jobs match these filters.</p>
		<dialog class="job-sheet" id="job-sheet" aria-label="Job details"></dialog>
		${error ? `<p class="empty">${escapeHtml(error)}</p>` : ''}`;
}

// "+ New job": a posting Andrea found and what Claude should do about it. A plain form post.
function renderNewJob(actionHref) {
	return `
		<details class="new-job">
			<summary class="btn btn-sm">+ New job</summary>
			<form class="new-job-form" method="POST" action="${escapeHtml(actionHref)}">
				<input type="hidden" name="adminAction" value="jobCreate" />
				<label class="nj-wide"><span>Job URL</span><input type="url" name="jobUrl" required maxlength="2000" placeholder="https://…" /></label>
				<label><span>Company <i>optional</i></span><input type="text" name="company" maxlength="120" /></label>
				<label><span>Role <i>optional</i></span><input type="text" name="role" maxlength="160" /></label>
				<label class="nj-wide"><span>Note for Claude</span><textarea name="noteForClaude" rows="3" maxlength="${NOTE_MAX}" placeholder="See if you can apply · find an email contact · I'll apply on LinkedIn, attach a resume"></textarea></label>
				<div class="nj-wide nj-foot"><button class="btn btn-sm btn-primary" type="submit">Add job</button></div>
			</form>
		</details>`;
}

// Filters work in the page script; without JS the bar stays hidden and every row shows.
function renderFilters() {
	return `
		<div class="job-filters" hidden>
			<input id="jf-q" type="search" placeholder="Search company, role or code" aria-label="Search company, role or code" />
			<div class="jf-chips" data-group="quick">${QUICK_VIEWS.map(([id, label]) => `<button type="button" class="jf-chip" data-quick="${id}" aria-pressed="false">${label}<span class="n"></span></button>`).join('')}</div>
			<div class="jf-chips" data-group="tags">${ROUTE_TAGS.map((t) => `<button type="button" class="jf-chip jf-tag" data-tag="${t}" aria-pressed="false">${t}<span class="n"></span></button>`).join('')}</div>
			<div class="jf-row">
				<select id="jf-stage" aria-label="Stage"><option value="">Any stage</option>${STAGES.map((s) => `<option value="${s}">${STAGE_LABELS[s]}</option>`).join('')}</select>
			</div>
			<div class="jf-count"><span id="jf-shown"></span><button type="button" class="jf-clear" id="jf-clear" hidden>Clear filters</button></div>
		</div>`;
}
