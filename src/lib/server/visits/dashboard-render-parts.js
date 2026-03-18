import {
	decodeDisplayValue,
	escapeHtml,
	formatDuration,
	formatTimestamp
} from './shared';

function parseLandingDetails(landingPath) {
	try {
		const url = new URL(landingPath, 'https://example.com');
		return {
			source:
				url.searchParams.get('utm_source') ||
				url.searchParams.get('source') ||
				url.searchParams.get('ref') ||
				'',
			campaign: url.searchParams.get('utm_campaign') || url.searchParams.get('campaign') || '',
			content: url.searchParams.get('utm_content') || url.searchParams.get('content') || ''
		};
	} catch {
		return { source: '', campaign: '', content: '' };
	}
}

function getMaybeExternalHref(value) {
	const normalized = decodeDisplayValue(value).trim();
	if (!normalized) return '';
	if (/^https?:\/\//i.test(normalized)) return normalized;
	if (/^[a-z0-9.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(normalized)) return `https://${normalized}`;
	return '';
}

function renderLandingDetail(label, value) {
	const displayValue = decodeDisplayValue(value);
	if (!displayValue) return '';

	const href = getMaybeExternalHref(displayValue);
	const renderedValue = href
		? `<a class="detail-link" href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${escapeHtml(displayValue)}</a>`
		: escapeHtml(displayValue);

	return `<span class="detail-item"><strong>${escapeHtml(label)}:</strong> ${renderedValue}</span>`;
}

function renderExpandable(value, className, tagName = 'div') {
	const displayValue = decodeDisplayValue(value, 'Unknown');
	return `
		<${tagName} class="${escapeHtml(className)}" tabindex="0" title="${escapeHtml(displayValue)}">
			<span class="${escapeHtml(className)}-value">${escapeHtml(displayValue)}</span>
			<span class="${escapeHtml(className)}-tooltip">${escapeHtml(displayValue)}</span>
		</${tagName}>
	`;
}

function formatLocation(visit) {
	const location = [visit.city, visit.region, visit.country]
		.map((value) => decodeDisplayValue(value).trim())
		.filter((value) => value && value !== 'Unknown City' && value !== 'Unknown Country')
		.join(', ');

	return location || 'Unknown';
}

function renderDeleteAction(visit, { actionHref, uniqueOnly }) {
	const deleteVisitor = uniqueOnly && visit.visitorId;
	const label = deleteVisitor ? 'Delete visitor sessions' : 'Delete session';

	return `
		<form class="row-action-form" method="POST" action="${escapeHtml(actionHref)}">
			<input type="hidden" name="adminAction" value="delete" />
			<input type="hidden" name="sessionId" value="${escapeHtml(visit.sessionId || '')}" />
			<input type="hidden" name="visitorId" value="${escapeHtml(visit.visitorId || '')}" />
			<input type="hidden" name="deleteMode" value="${deleteVisitor ? 'visitor' : 'session'}" />
			<button class="row-delete-button" type="submit" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true">
					<path d="M4 7h16" />
					<path d="M10 11v6M14 11v6" />
					<path d="M6 7l1 12h10l1-12" />
					<path d="M9 7V5h6v2" />
				</svg>
			</button>
		</form>
	`;
}

export function renderBreakdownList(title, items) {
	const rows = items.length
		? items
				.map(
					(item) => `
						<li>
							${
								title === 'Top Landing Paths'
									? renderExpandable(item.label, 'breakdown-label', 'span')
									: `<span>${escapeHtml(item.label)}</span>`
							}
							<strong>${item.count}</strong>
						</li>
					`
				)
				.join('')
		: '<li class="empty">No data yet</li>';

	return `
		<section class="panel">
			<h2>${escapeHtml(title)}</h2>
			<ul class="breakdown-list">${rows}</ul>
		</section>
	`;
}

export function renderVisitRows(visits, options) {
	if (!visits.length) {
		return `
			<tr>
				<td colspan="13" class="empty-cell">No visits stored yet for this environment.</td>
			</tr>
		`;
	}

	return visits
		.map((visit, index) => {
			const landingDetails = parseLandingDetails(visit.landingPath);
			const extraLandingDetails = [
				renderLandingDetail('Campaign', landingDetails.campaign),
				renderLandingDetail('Content', landingDetails.content)
			]
				.filter(Boolean)
				.join('');
			const signals = [
				visit.resumeClicks ? `resume:${visit.resumeClicks}` : '',
				visit.projectClicks ? `projects:${visit.projectClicks}` : '',
				visit.chatOpened ? 'chat-open' : '',
				visit.hasAgentInteraction ? 'agent' : '',
				visit.hasFormSubmission ? 'contact' : '',
				visit.outboundClicks ? `outbound:${visit.outboundClicks}` : ''
			]
				.filter(Boolean)
				.join(' · ');

			return `
				<tr>
					<td>${index + 1}</td>
					<td>${escapeHtml(formatTimestamp(visit.endedAt))}</td>
					<td>${escapeHtml(visit.device || 'Unknown')}</td>
					<td>${escapeHtml(visit.visitType)}</td>
					<td>${escapeHtml(formatDuration(visit.durationMs))}</td>
					<td>${escapeHtml(formatLocation(visit))}</td>
					<td>${renderExpandable(visit.landingPath, 'landing-cell')}</td>
					<td>${escapeHtml(landingDetails.source || 'none')}</td>
					<td>${escapeHtml(visit.referrerHost || 'direct')}</td>
					<td>${visit.maxScrollPercent}%</td>
					<td>${visit.engagementScore}</td>
					<td>${renderExpandable(signals || 'none', 'signals-cell')}</td>
					<td class="row-action-cell">${renderDeleteAction(visit, options)}</td>
				</tr>
				${
					extraLandingDetails
						? `<tr class="detail-row"><td colspan="13"><div class="detail-list">${extraLandingDetails}</div></td></tr>`
						: ''
				}
			`;
		})
		.join('');
}
