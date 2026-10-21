// The Visits and Stats tabs of the admin dashboard, and the "Latest" feed at the top.
import { deviceIcon, icon } from './dashboard-icons';
import { describeJobEntry } from './dashboard-render-jobs';
import { jobCodeForLanding } from './job-links';
import {
	decodeDisplayValue,
	escapeHtml,
	formatDuration,
	formatRelative,
	formatTimestamp
} from './shared';

const DAY_MS = 24 * 60 * 60 * 1000;

function parseLandingDetails(landingPath) {
	try {
		const url = new URL(landingPath, 'https://example.com');
		return {
			path: url.pathname,
			source:
				url.searchParams.get('utm_source') ||
				url.searchParams.get('source') ||
				url.searchParams.get('ref') ||
				'',
			campaign: url.searchParams.get('utm_campaign') || url.searchParams.get('campaign') || '',
			content: url.searchParams.get('utm_content') || url.searchParams.get('content') || ''
		};
	} catch {
		return { path: String(landingPath || '/'), source: '', campaign: '', content: '' };
	}
}

function getMaybeExternalHref(value) {
	const normalized = decodeDisplayValue(value).trim();
	if (!normalized) return '';
	if (/^https?:\/\//i.test(normalized)) return normalized;
	if (/^[a-z0-9.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(normalized)) return `https://${normalized}`;
	return '';
}

function renderMaybeLink(value) {
	const displayValue = decodeDisplayValue(value);
	const href = getMaybeExternalHref(displayValue);
	return href
		? `<a class="text-link" href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${escapeHtml(displayValue)}</a>`
		: escapeHtml(displayValue);
}

/** "Madrid, ES" style place, or 'Unknown'. */
export function formatLocation(visit, { short = false } = {}) {
	const parts = (short ? [visit.city, visit.country] : [visit.city, visit.region, visit.country])
		.map((value) => decodeDisplayValue(value).trim())
		.filter((value) => value && value !== 'Unknown City' && value !== 'Unknown Country');
	return parts.join(', ') || 'Unknown place';
}

const dayKey = (time) => new Date(time).toISOString().slice(0, 10);

function dayLabel(key, now) {
	if (key === dayKey(now)) return 'Today';
	if (key === dayKey(now - DAY_MS)) return 'Yesterday';
	const date = new Date(`${key}T00:00:00Z`);
	return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
}

const clock = (timestamp) => {
	const date = new Date(timestamp);
	return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(11, 16);
};

// A session that landed on a job link names the link, and jumps to it in the Jobs tab.
function renderJobBadge(code, jobsByCode, { link = true } = {}) {
	const job = jobsByCode?.get(code);
	if (!job) return `<span class="job-badge job-badge-gone" title="No job link with this code any more">${escapeHtml(code)} · deleted</span>`;
	const text = `${escapeHtml(code)} · ${escapeHtml(job.company)}`;
	return link
		? `<a class="job-badge" href="#job-${escapeHtml(code)}" title="${escapeHtml(`${job.company} · ${job.role}`)}">${text} →</a>`
		: `<span class="job-badge">${text}</span>`;
}

function renderDeleteAction(visit, { actionHref, uniqueOnly }) {
	const deleteVisitor = uniqueOnly && visit.visitorId;
	const label = deleteVisitor ? 'Delete visitor’s sessions' : 'Delete session';
	return `
		<form method="POST" action="${escapeHtml(actionHref)}">
			<input type="hidden" name="adminAction" value="delete" />
			<input type="hidden" name="sessionId" value="${escapeHtml(visit.sessionId || '')}" />
			<input type="hidden" name="visitorId" value="${escapeHtml(visit.visitorId || '')}" />
			<input type="hidden" name="deleteMode" value="${deleteVisitor ? 'visitor' : 'session'}" />
			<button class="btn btn-sm btn-danger-ghost" type="submit">${icon('trash')} ${escapeHtml(label)}</button>
		</form>`;
}

const shortNumber = (entry) => entry.id.match(/-(\d+)$/)?.[1] || '?';
const shortName = (entry) =>
	`${escapeHtml(entry.project || entry.id)} · ${escapeHtml(entry.title || `video ${shortNumber(entry)}`)}`;

const COVER_ACTIONS = {
	sound: 'Play with sound',
	muted: 'Play muted',
	swipe: 'swiped in',
	welcome: 'Your welcome page',
	site: 'Main site'
};

// /shorts in a visit: how the cover was left, the videos liked (and unliked), then how much
// of each was played, per project: "AudioTales 1 100% · 2 40%".
function renderShorts(list, cover) {
	if (!Array.isArray(list)) list = [];
	const lines = [];
	const actions = (Array.isArray(cover) ? cover : []).map((a) => COVER_ACTIONS[a]).filter(Boolean);
	if (actions.length) lines.push(`<span class="muted">Cover:</span> ${escapeHtml(actions.join(' · '))}`);
	const liked = list.filter((e) => e.liked === true);
	const unliked = list.filter((e) => e.liked === false);
	if (liked.length) lines.push(`♥ ${liked.map(shortName).join(', ')}`);
	if (unliked.length) lines.push(`<span class="muted">Unliked: ${unliked.map(shortName).join(', ')}</span>`);
	const byProject = new Map();
	for (const entry of list) {
		if (!(entry.pct > 0)) continue;
		const key = entry.project || entry.id.replace(/-\d+$/, '');
		byProject.set(key, [...(byProject.get(key) || []), entry]);
	}
	const watched = [...byProject]
		.map(
			([project, entries]) =>
				`${escapeHtml(project)} ${entries
					.map((e) => `<span title="${escapeHtml(e.title || '')}">${escapeHtml(shortNumber(e))} <span class="muted">${Number(e.pct) || 0}%</span></span>`)
					.join(' · ')}`
		)
		.join('; ');
	if (watched) lines.push(`Watched: ${watched}`);
	return lines.map((line) => `<div>${line}</div>`).join('');
}

function signalsOf(visit) {
	const likes = (visit.shorts || []).filter((e) => e.liked === true).length;
	return [
		visit.resumeClicks ? `résumé ×${visit.resumeClicks}` : '',
		visit.projectClicks ? `projects ×${visit.projectClicks}` : '',
		visit.chatOpened ? 'chat opened' : '',
		visit.hasAgentInteraction ? 'talked to agent' : '',
		visit.hasFormSubmission ? 'contact form' : '',
		visit.outboundClicks ? `outbound ×${visit.outboundClicks}` : '',
		likes ? `shorts liked ×${likes}` : ''
	].filter(Boolean);
}

const def = (label, value, wide = false) =>
	value ? `<div${wide ? ' class="wide"' : ''}><dt>${escapeHtml(label)}</dt><dd>${value}</dd></div>` : '';

function renderVisit(visit, index, options) {
	const landing = parseLandingDetails(visit.landingPath);
	const code = jobCodeForLanding(visit.landingPath);
	const typeClass = ['silent', 'agent', 'contact'].includes(visit.visitType) ? visit.visitType : 'other';
	const signals = signalsOf(visit);
	const aiCost = visit.aiTokens > 0 ? `$${(Number(visit.aiCostUsd) || 0).toFixed(4)} <span class="muted">· ${Number(visit.aiTokens).toLocaleString()} tok</span>` : '';
	const landingShort = code
		? `${renderJobBadge(code, options.jobsByCode, { link: false })}${String(visit.landingPath || '').startsWith('/shorts/') ? ' <span class="muted">shorts</span> ' : ''}`
		: `<span class="v-path">${landing.path === '/' ? 'home' : escapeHtml(decodeDisplayValue(landing.path, '/'))}</span>`;
	const sessions = visit.sessionCount > 1 ? ` <span class="v-count">×${visit.sessionCount}</span>` : '';

	return `
		<details class="visit" id="v-${index + 1}">
			<summary class="visit-row">
				<span class="v-time">${escapeHtml(clock(visit.endedAt))}</span>
				<span class="v-device" title="${escapeHtml(visit.device || 'Unknown')}">${deviceIcon(visit.device)}</span>
				<span class="v-main">
					<span class="v-place">${escapeHtml(formatLocation(visit, { short: true }))}${sessions}</span>
					<span class="v-sub">${landingShort}<span class="v-dur">${escapeHtml(formatDuration(visit.durationMs))}</span></span>
				</span>
				<span class="v-cell v-ref">${escapeHtml(visit.referrerHost || 'direct')}</span>
				<span class="v-cell v-score" title="${visit.counted === false ? 'Not counted: no sign of a person' : 'Engagement score'}">${visit.engagementScore}${visit.counted === false ? '<span class="faint">*</span>' : ''}</span>
				<span class="type type-${typeClass}">${escapeHtml(visit.visitType || 'other')}</span>
				<span class="chev" aria-hidden="true"></span>
			</summary>
			<div class="visit-body">
				<dl class="facts">
					${def('Ended', `${escapeHtml(formatTimestamp(visit.endedAt))} <span class="muted">UTC</span>`)}
					${def('Duration', escapeHtml(formatDuration(visit.durationMs)))}
					${def('Device', escapeHtml(visit.device || 'Unknown'))}
					${def('Place', escapeHtml(formatLocation(visit)))}
					${def('Referrer', escapeHtml(visit.referrerHost || 'direct'))}
					${def('Source', escapeHtml(landing.source || 'none'))}
					${def('Scroll', `${visit.maxScrollPercent ?? 0}%`)}
					${def('Score', String(visit.engagementScore ?? 0))}
					${def('Campaign', landing.campaign && renderMaybeLink(landing.campaign))}
					${def('Content', landing.content && renderMaybeLink(landing.content))}
					${def('AI cost', aiCost)}
					${def('Sessions', visit.sessionCount > 1 ? String(visit.sessionCount) : '')}
					${def('Signals', signals.length ? escapeHtml(signals.join(' · ')) : '<span class="muted">none</span>', true)}
					${def('Shorts', renderShorts(visit.shorts, visit.shortsCover), true)}
					${def('Job link', code ? renderJobBadge(code, options.jobsByCode) : '', true)}
					${def('Landing', `<span class="break">${escapeHtml(decodeDisplayValue(visit.landingPath, '/'))}</span>`, true)}
				</dl>
				${renderDeleteAction(visit, options)}
			</div>
		</details>`;
}

/** Recent visits as one-line rows, under "Today" / "Yesterday" / date headers (UTC). */
export function renderVisitList(visits, options) {
	if (!visits.length) return '<p class="empty">No visits stored yet for this environment.</p>';
	const { now } = options;
	let currentDay = '';
	let html = '';
	visits.forEach((visit, index) => {
		const time = new Date(visit.endedAt).getTime();
		const key = Number.isNaN(time) ? 'unknown' : dayKey(time);
		if (key !== currentDay) {
			if (currentDay) html += '</div>';
			currentDay = key;
			const count = visits.filter((v) => {
				const t = new Date(v.endedAt).getTime();
				return (Number.isNaN(t) ? 'unknown' : dayKey(t)) === key;
			}).length;
			html += `<h3 class="group-head">${escapeHtml(key === 'unknown' ? 'Unknown day' : dayLabel(key, now))} <span>${count}</span></h3><div class="visit-list">`;
		}
		html += renderVisit(visit, index, options);
	});
	return `${html}</div>`;
}

/** A breakdown as label, count and a thin bar sized against the top entry. */
export function renderBreakdown(title, items, { jobsByCode = undefined } = {}) {
	const max = Math.max(1, ...items.map((item) => Number(item.count) || 0));
	const rows = items.length
		? items
				.map((item) => {
					const code = jobsByCode ? jobCodeForLanding(item.label) : '';
					const label = code
						? renderJobBadge(code, jobsByCode)
						: `<span class="bar-label" title="${escapeHtml(decodeDisplayValue(item.label))}">${escapeHtml(decodeDisplayValue(item.label, 'Unknown'))}</span>`;
					const pct = Math.max(3, Math.round(((Number(item.count) || 0) / max) * 100));
					return `<li><div class="bar-line">${label}<strong>${item.count}</strong></div><span class="bar" style="width:${pct}%"></span></li>`;
				})
				.join('')
		: '<li class="empty">No data yet</li>';
	return `<section class="card"><h4>${escapeHtml(title)}</h4><ul class="bars">${rows}</ul></section>`;
}

/**
 * The newest few things that happened, across job-link logs and site sessions. Sessions that
 * landed on a job link are left out: the link's own log already has them.
 */
export function renderLatest(jobLinks, visits, { now, count = 3 }) {
	const items = [];
	for (const link of jobLinks.links) {
		for (const entry of link.log.slice(0, count)) {
			items.push({
				at: new Date(entry.at).getTime(),
				href: `#job-${link.code}`,
				icon: icon(entry.type),
				tag: `${link.code} · ${link.company}`,
				text: describeJobEntry(entry)
			});
		}
	}
	visits.forEach((visit, index) => {
		if (jobCodeForLanding(visit.landingPath)) return;
		const landing = parseLandingDetails(visit.landingPath);
		items.push({
			at: new Date(visit.endedAt).getTime(),
			href: `#v-${index + 1}`,
			icon: deviceIcon(visit.device),
			tag: formatLocation(visit, { short: true }),
			text: `${landing.path === '/' ? 'home' : decodeDisplayValue(landing.path, '/')} · ${formatDuration(visit.durationMs)}${visit.visitType !== 'silent' ? ` · ${visit.visitType}` : ''}`
		});
	});
	const latest = items
		.filter((item) => !Number.isNaN(item.at))
		.sort((a, b) => b.at - a.at)
		.slice(0, count);
	if (!latest.length) return '';

	return `
		<section class="latest" aria-label="Latest activity">
			<h2 class="eyebrow">Latest</h2>
			<ol>${latest
				.map(
					(item) => `<li><a href="${escapeHtml(item.href)}">${item.icon}<span class="l-text"><b>${escapeHtml(item.tag)}</b><span>${escapeHtml(item.text)}</span></span><span class="l-time">${escapeHtml(formatRelative(new Date(item.at).toISOString(), now))}</span></a></li>`
				)
				.join('')}</ol>
		</section>`;
}
