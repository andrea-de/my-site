import { createHash } from 'node:crypto';
import { dev } from '$app/environment';
import { env as privateEnv } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { getVisitDashboardData, storeVisitSummary, wipeVisitData } from '$lib/server/visit-store';

function clampNumber(value, fallback = 0, min = 0, max = Number.MAX_SAFE_INTEGER) {
	if (value === null || value === undefined) return fallback;
	if (typeof value === 'string' && value.trim() === '') return fallback;

	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return fallback;
	return Math.max(min, Math.min(max, parsed));
}

function toShortString(value, fallback = '') {
	if (!value) return fallback;
	return String(value).slice(0, 240);
}

function toArray(value, limit = 10) {
	if (!Array.isArray(value)) return [];

	return value
		.map((entry) => toShortString(entry))
		.filter(Boolean)
		.slice(0, limit);
}

function extractHost(urlValue) {
	if (!urlValue) return 'direct';

	try {
		return new URL(urlValue).host || 'direct';
	} catch {
		return toShortString(urlValue, 'direct');
	}
}

function getDeviceType(userAgent) {
	if (!userAgent) return 'Unknown';
	if (/mobile|android|iphone/i.test(userAgent)) return 'Mobile';
	if (/ipad|tablet/i.test(userAgent)) return 'Tablet';
	return 'Desktop';
}

function computeVisitType(summary) {
	if (summary.hasFormSubmission) return 'contact';
	if (summary.hasAgentInteraction) return 'agent';
	return 'silent';
}

function computeEngagementScore(summary) {
	let score = 0;

	if (summary.durationMs >= 60000) score += 2;
	else if (summary.durationMs >= 15000) score += 1;

	if (summary.maxScrollPercent >= 75) score += 2;
	else if (summary.maxScrollPercent >= 40) score += 1;

	if (summary.sectionsViewed.length >= 4) score += 2;
	else if (summary.sectionsViewed.length >= 2) score += 1;

	if (summary.resumeClicks > 0) score += 2;
	if (summary.projectClicks > 0) score += 1;
	if (summary.outboundClicks > 0) score += 1;
	if (summary.chatOpened) score += 1;

	return score;
}

function shouldNotify(summary) {
	return (
		summary.visitType === 'silent' &&
		summary.isFinal &&
		(summary.engagementScore >= 4 ||
			summary.resumeClicks > 0 ||
			summary.projectClicks > 1 ||
			summary.sectionsViewed.includes('contact'))
	);
}

function isVisitsAdminLanding(landingPath) {
	return typeof landingPath === 'string' && landingPath.startsWith('/api/visits');
}

function getClientIp(request) {
	const forwardedFor = request.headers.get('x-forwarded-for') || '';
	const firstForwardedIp = forwardedFor
		.split(',')
		.map((entry) => entry.trim())
		.find(Boolean);

	return (
		firstForwardedIp ||
		request.headers.get('x-real-ip') ||
		request.headers.get('x-vercel-forwarded-for') ||
		''
	);
}

function getVisitorHash(value) {
	if (!value) return '';

	const hashSalt =
		privateEnv.VISITS_ADMIN_TOKEN || privateEnv.UPSTASH_REDIS_REST_TOKEN || 'my-site-visits';

	return createHash('sha256').update(`${hashSalt}:${value}`).digest('hex');
}

function getVisitorId(request, body) {
	const clientVisitorId = toShortString(body?.visitorId);
	if (clientVisitorId) {
		return getVisitorHash(`client:${clientVisitorId}`);
	}

	const ipAddress = getClientIp(request);
	if (!ipAddress) return '';

	const userAgent = request.headers.get('user-agent') || '';
	return getVisitorHash(`ipua:${ipAddress}:${userAgent}`);
}

function normalizeSummary(body, request) {
	const startedAt = toShortString(body.startedAt, new Date().toISOString());
	const endedAt = toShortString(body.endedAt, new Date().toISOString());
	const city = toShortString(request.headers.get('x-vercel-ip-city'), 'Unknown City');
	const country = toShortString(request.headers.get('x-vercel-ip-country'), 'Unknown Country');
	const region = toShortString(request.headers.get('x-vercel-ip-country-region'));
	const userAgent = request.headers.get('user-agent') || '';

	const summary = {
		sessionId: toShortString(body.sessionId),
		startedAt,
		endedAt,
		durationMs: clampNumber(body.durationMs, 0, 0, 1000 * 60 * 60 * 4),
		reason: toShortString(body.reason, 'unknown'),
		isFinal: Boolean(body.isFinal),
		landingPath: toShortString(body.landingPath, '/'),
		referrer: toShortString(body.referrer),
		referrerHost: extractHost(body.referrer),
		pageTitle: toShortString(body.pageTitle),
		maxScrollPercent: clampNumber(body.maxScrollPercent, 0, 0, 100),
		resumeClicks: clampNumber(body.resumeClicks, 0, 0, 25),
		projectClicks: clampNumber(body.projectClicks, 0, 0, 50),
		outboundClicks: clampNumber(body.outboundClicks, 0, 0, 50),
		outboundHosts: toArray(body.outboundHosts),
		sectionsViewed: toArray(body.sectionsViewed),
		chatOpened: Boolean(body.chatOpened),
		hasAgentInteraction: Boolean(body.hasAgentInteraction),
		hasFormSubmission: Boolean(body.hasFormSubmission),
		city,
		country,
		region,
		device: getDeviceType(userAgent),
		visitorId: getVisitorId(request, body)
	};

	summary.visitType = computeVisitType(summary);
	summary.engagementScore = computeEngagementScore(summary);

	return summary;
}

async function sendSilentVisitAlert(summary) {
	const telegramBotToken = privateEnv.TELEGRAM_BOT_TOKEN;
	const telegramChatId = privateEnv.TELEGRAM_CHAT_ID;

	if (!telegramBotToken || !telegramChatId) return;

	const durationSeconds = Math.max(1, Math.round(summary.durationMs / 1000));
	const durationLabel =
		durationSeconds >= 60
			? `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`
			: `${durationSeconds}s`;

	const lines = [
		'👀 *Engaged Silent Visit*',
		`📍 *Location:* ${summary.city}, ${summary.region} ${summary.country}`.trim(),
		`🖥️ *Device:* ${summary.device}`,
		`🔗 *Referrer:* ${summary.referrerHost || 'direct'}`,
		`⏱️ *Duration:* ${durationLabel}`,
		`📈 *Max Scroll:* ${summary.maxScrollPercent}%`,
		`📄 *Landing:* ${summary.landingPath}`,
		`🧭 *Sections:* ${summary.sectionsViewed.join(', ') || 'hero'}`,
		`📊 *Score:* ${summary.engagementScore}`
	];

	if (summary.resumeClicks > 0) {
		lines.push(`📎 *Resume Clicks:* ${summary.resumeClicks}`);
	}

	if (summary.projectClicks > 0) {
		lines.push(`🗂️ *Project Clicks:* ${summary.projectClicks}`);
	}

	if (summary.outboundHosts.length > 0) {
		lines.push(`🌐 *Outbound:* ${summary.outboundHosts.join(', ')}`);
	}

	await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			chat_id: telegramChatId,
			text: lines.join('\n'),
			parse_mode: 'Markdown'
		})
	});
}

function getAdminToken() {
	return privateEnv.VISITS_ADMIN_TOKEN || '';
}

function getProvidedToken(request, url) {
	const queryToken = url.searchParams.get('token');
	if (queryToken) return queryToken;

	const headerToken = request.headers.get('x-visits-token');
	if (headerToken) return headerToken;

	const authorization = request.headers.get('authorization') || '';
	if (authorization.toLowerCase().startsWith('bearer ')) {
		return authorization.slice(7).trim();
	}

	return '';
}

function isAuthorized(request, url) {
	const adminToken = getAdminToken();
	if (!adminToken) return dev;
	return getProvidedToken(request, url) === adminToken;
}

function wantsUniqueOnly(url) {
	const value = (url.searchParams.get('unique') || '').trim().toLowerCase();
	return value === '1' || value === 'true' || value === 'yes';
}

function wantsJson(request, url) {
	if (url.searchParams.get('format') === 'json') return true;
	return request.headers.get('accept')?.includes('application/json') || false;
}

function escapeHtml(value) {
	return String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

function formatDuration(durationMs) {
	const seconds = Math.max(0, Math.round(durationMs / 1000));
	if (seconds < 60) return `${seconds}s`;
	const minutes = Math.floor(seconds / 60);
	return `${minutes}m ${seconds % 60}s`;
}

function formatTimestamp(timestamp) {
	const date = new Date(timestamp);
	if (Number.isNaN(date.getTime())) return timestamp;
	return date.toISOString().replace('T', ' ').slice(0, 16);
}

function decodeDisplayValue(value, fallback = '') {
	const text = toShortString(value, fallback);
	if (!text) return fallback;

	try {
		return decodeURIComponent(text);
	} catch {
		return text;
	}
}

function parseLandingDetails(landingPath) {
	try {
		const url = new URL(landingPath, 'https://example.com');
		return {
			source:
				url.searchParams.get('utm_source') ||
				url.searchParams.get('source') ||
				url.searchParams.get('ref') ||
				'',
			campaign: url.searchParams.get('utm_campaign') || url.searchParams.get('campaign') || ''
		};
	} catch {
		return { source: '', campaign: '' };
	}
}

function dedupeRecentVisits(visits) {
	const seen = new Set();

	return visits.filter((visit) => {
		const key = visit.visitorId || `session:${visit.sessionId || 'unknown'}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

function renderBreakdownList(title, items) {
	const rows = items.length
		? items
				.map(
					(item) => `
						<li>
							<span>${escapeHtml(item.label)}</span>
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

function renderVisitRows(visits) {
	if (!visits.length) {
		return `
			<tr>
				<td colspan="12" class="empty-cell">No visits stored yet for this environment.</td>
			</tr>
		`;
	}

	return visits
		.map((visit, index) => {
			const landingDetails = parseLandingDetails(visit.landingPath);
			const location = [
				decodeDisplayValue(visit.city),
				decodeDisplayValue(visit.region),
				decodeDisplayValue(visit.country)
			]
				.filter(Boolean)
				.join(', ');
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
					<td>${escapeHtml(location || 'Unknown')}</td>
					<td>${escapeHtml(visit.landingPath)}</td>
					<td>${escapeHtml(landingDetails.source || 'none')}</td>
					<td>${escapeHtml(visit.referrerHost || 'direct')}</td>
					<td>${visit.maxScrollPercent}%</td>
					<td>${visit.engagementScore}</td>
					<td>${escapeHtml(signals || 'none')}</td>
				</tr>
			`;
		})
		.join('');
}

function renderDashboardHtml(dashboard, { token, limit, date, uniqueOnly, totalRecentVisits }) {
	const tokenQuery = token ? `token=${encodeURIComponent(token)}&` : '';
	const uniqueQuery = uniqueOnly ? 'unique=1&' : '';
	const jsonHref = `/api/visits?${tokenQuery}${uniqueQuery}format=json&limit=${limit}&date=${encodeURIComponent(date)}`;
	const summary = dashboard.summary || {};
	const uniqueVisitors = summary.uniqueVisitors ?? 0;
	const totalVisits = summary.totalVisits ?? 0;
	const finalSilent = summary.finalSilent ?? 0;
	const finalAgent = summary.finalAgent ?? 0;
	const finalContact = summary.finalContact ?? 0;
	const highIntent =
		summary.highIntent ??
		dashboard.recentVisits.filter((visit) => visit.engagementScore >= 4).length;
	const resumeInterest = summary.resumeInterest ?? 0;
	const wiped = dashboard.wasWiped;
	const actionHref = `/api/visits?${tokenQuery}${uniqueQuery}limit=${limit}&date=${encodeURIComponent(date)}`;
	const allSessionsHref = `/api/visits?${tokenQuery}limit=${limit}&date=${encodeURIComponent(date)}`;
	const uniqueVisitorsHref = `/api/visits?${tokenQuery}unique=1&limit=${limit}&date=${encodeURIComponent(date)}`;
	const refreshHref = `/api/visits?${tokenQuery}${uniqueQuery}limit=${limit}&date=${encodeURIComponent(date)}`;
	const displayedRowCount = dashboard.recentVisits.length;
	const rowSummary = uniqueOnly
		? `Showing ${displayedRowCount} unique visitors from ${totalRecentVisits} recent sessions`
		: `Showing ${displayedRowCount} recent sessions`;

	return `
		<!doctype html>
		<html lang="en">
			<head>
				<meta charset="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<title>Visits Admin</title>
				<style>
					:root {
						--bg: #0d1117;
						--panel: #161b22;
						--panel-alt: #0f141a;
						--border: #30363d;
						--text: #e6edf3;
						--muted: #9da7b3;
						--accent: #7ee787;
						--danger: #ff7b72;
					}
					* {
						box-sizing: border-box;
					}
					body {
						margin: 0;
						font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
						background: var(--bg);
						color: var(--text);
					}
					main {
						max-width: 1400px;
						margin: 0 auto;
						padding: 24px 16px 40px;
					}
					header {
						display: flex;
						justify-content: space-between;
						gap: 16px;
						align-items: flex-start;
						margin-bottom: 20px;
						flex-wrap: wrap;
					}
					h1,
					h2,
					h3 {
						margin: 0;
					}
					h1 {
						font-size: 1.8rem;
						margin-bottom: 4px;
					}
					h2 {
						font-size: 1rem;
						margin-bottom: 12px;
					}
					p {
						margin: 0;
						color: var(--muted);
					}
					a {
						color: var(--text);
						text-decoration: none;
					}
					.actions {
						display: flex;
						flex-wrap: wrap;
						gap: 10px;
					}
					.view-toggle {
						display: flex;
						flex-wrap: wrap;
						gap: 8px;
						margin-bottom: 16px;
					}
					.action-link,
					.action-button {
						padding: 10px 14px;
						border: 1px solid var(--border);
						border-radius: 8px;
						background: var(--panel);
						color: var(--text);
						font: inherit;
						cursor: pointer;
					}
					.action-button {
						color: var(--danger);
					}
					.refresh-button {
						color: var(--accent);
					}
					.toggle-link {
						padding: 8px 12px;
						border: 1px solid var(--border);
						border-radius: 999px;
						background: var(--panel);
						color: var(--muted);
						font-size: 0.9rem;
					}
					.toggle-link.active {
						color: var(--text);
						border-color: var(--accent);
					}
					.action-form {
						margin: 0;
					}
					.notice,
					.panel {
						background: var(--panel);
						border: 1px solid var(--border);
						border-radius: 10px;
					}
					.notice {
						margin-bottom: 16px;
						padding: 12px 14px;
						color: var(--accent);
					}
					.summary-grid {
						display: grid;
						grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
						gap: 12px;
						margin-bottom: 16px;
					}
					.summary-card {
						padding: 14px;
						background: var(--panel);
						border: 1px solid var(--border);
						border-radius: 10px;
					}
					.summary-card strong {
						display: block;
						font-size: 1.6rem;
						margin-top: 8px;
					}
					.breakdown-grid {
						display: grid;
						grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
						gap: 12px;
						margin-bottom: 16px;
					}
					.panel {
						padding: 14px;
					}
					.breakdown-list {
						list-style: none;
						padding: 0;
						margin: 0;
					}
					.breakdown-list li {
						display: flex;
						justify-content: space-between;
						gap: 12px;
						padding: 8px 0;
						border-top: 1px solid rgba(255, 255, 255, 0.06);
					}
					.breakdown-list li:first-child {
						border-top: 0;
					}
					.empty-cell {
						color: var(--muted);
					}
					.panel-summary,
					.footer-note {
						margin-bottom: 12px;
						color: var(--muted);
						font-size: 0.9rem;
					}
					.table-wrap {
						overflow: auto;
						border: 1px solid var(--border);
						border-radius: 10px;
					}
					table {
						width: 100%;
						border-collapse: collapse;
						background: var(--panel-alt);
					}
					thead {
						background: #11161d;
					}
					th,
					td {
						padding: 10px 12px;
						border-bottom: 1px solid rgba(255, 255, 255, 0.08);
						text-align: left;
						vertical-align: top;
						font-size: 0.9rem;
					}
					th {
						font-size: 0.78rem;
						text-transform: uppercase;
						letter-spacing: 0.06em;
						color: var(--muted);
						white-space: nowrap;
					}
					tbody tr:nth-child(even) {
						background: rgba(255, 255, 255, 0.02);
					}
					td:nth-child(7),
					td:nth-child(12) {
						min-width: 220px;
						word-break: break-word;
					}
					@media (max-width: 720px) {
						main {
							padding: 16px 12px 32px;
						}
					}
				</style>
			</head>
			<body>
				<main>
					<header>
						<div>
							<h1>Visits Admin</h1>
							<p>${escapeHtml(date)} · ${escapeHtml(dashboard.mode)} mode · ${
								dashboard.recentVisits.length
							} recent rows</p>
						</div>
						<div class="actions">
							<a class="action-link refresh-button" href="${escapeHtml(refreshHref)}">Refresh</a>
							<a class="action-link" href="${escapeHtml(jsonHref)}">Raw JSON</a>
							<form
								class="action-form"
								method="POST"
								action="${escapeHtml(actionHref)}"
								onsubmit="return confirm('Wipe all stored visit data? This cannot be undone.');"
							>
								<input type="hidden" name="adminAction" value="wipe" />
								<button class="action-button" type="submit">Wipe Visit Data</button>
							</form>
						</div>
					</header>

					${wiped ? '<div class="notice">Visit tracking data was wiped.</div>' : ''}

					<section class="summary-grid">
						<div class="summary-card"><span>Unique Visitors</span><strong>${uniqueVisitors}</strong></div>
						<div class="summary-card"><span>Total Sessions</span><strong>${totalVisits}</strong></div>
						<div class="summary-card"><span>Silent Finals</span><strong>${finalSilent}</strong></div>
						<div class="summary-card"><span>Agent Finals</span><strong>${finalAgent}</strong></div>
						<div class="summary-card"><span>Contact Finals</span><strong>${finalContact}</strong></div>
						<div class="summary-card"><span>High-Intent</span><strong>${highIntent}</strong></div>
						<div class="summary-card"><span>Resume Interest</span><strong>${resumeInterest}</strong></div>
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
									<tr>
										<th>#</th>
										<th>Ended</th>
										<th>Device</th>
										<th>Type</th>
										<th>Duration</th>
										<th>Location</th>
										<th>Landing</th>
										<th>Source</th>
										<th>Referrer</th>
										<th>Scroll</th>
										<th>Score</th>
										<th>Signals</th>
									</tr>
								</thead>
								<tbody>${renderVisitRows(dashboard.recentVisits)}</tbody>
							</table>
						</div>
						<p class="footer-note">
							Open this route with <code>?token=YOUR_TOKEN</code> in the URL, or use the
							<code>x-visits-token</code> header or Bearer token for API access.
						</p>
					</section>
				</main>
			</body>
		</html>
	`;
}

export async function POST({ request, url }) {
	try {
		const contentType = request.headers.get('content-type') || '';

		if (contentType.includes('application/x-www-form-urlencoded')) {
			if (!isAuthorized(request, url)) {
				return new Response('Not found', { status: 404 });
			}

			const formData = await request.formData();
			const adminAction = toShortString(formData.get('adminAction'));

			if (adminAction !== 'wipe') {
				return json({ error: 'Unknown admin action' }, { status: 400 });
			}

			await wipeVisitData();

			const redirectUrl = new URL(url);
			redirectUrl.searchParams.set('wiped', '1');
			return new Response(null, {
				status: 303,
				headers: {
					location: `${redirectUrl.pathname}?${redirectUrl.searchParams.toString()}`
				}
			});
		}

		const body = await request.json();
		const summary = normalizeSummary(body, request);

		if (!summary.sessionId) {
			return json({ error: 'Missing session id' }, { status: 400 });
		}

		if (isVisitsAdminLanding(summary.landingPath)) {
			return json({
				success: true,
				skipped: true,
				reason: 'visits-admin-route'
			});
		}

		const storageResult = await storeVisitSummary(summary);

		if (storageResult.finalizedNow && shouldNotify(summary)) {
			await sendSilentVisitAlert(summary);
		}

		if (dev) {
			console.log('[VISIT TRACKER]', summary);
		}

		return json({
			success: true,
			mode: storageResult.mode,
			visitType: summary.visitType,
			engagementScore: summary.engagementScore
		});
	} catch (error) {
		console.error('[VISIT API] Failed to persist visit summary:', error);
		return json({ error: 'Failed to store visit summary' }, { status: 500 });
	}
}

export async function GET({ request, url }) {
	if (!isAuthorized(request, url)) {
		return new Response('Not found', { status: 404 });
	}

	const limit = clampNumber(url.searchParams.get('limit'), 20, 1, 100);
	const uniqueOnly = wantsUniqueOnly(url);
	const date = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get('date') || '')
		? url.searchParams.get('date')
		: new Date().toISOString().slice(0, 10);
	const dashboard = await getVisitDashboardData({ limit, date });
	const totalRecentVisits = dashboard.recentVisits.length;
	if (uniqueOnly) {
		dashboard.recentVisits = dedupeRecentVisits(dashboard.recentVisits);
	}
	dashboard.wasWiped = url.searchParams.get('wiped') === '1';

	if (wantsJson(request, url)) {
		return json({
			mode: dashboard.mode,
			date: dashboard.date,
			limit,
			filters: {
				uniqueOnly
			},
			summary: dashboard.summary,
			breakdowns: dashboard.breakdowns,
			recentVisits: dashboard.recentVisits
		});
	}

	return new Response(
		renderDashboardHtml(dashboard, {
			token: getProvidedToken(request, url),
			limit,
			date,
			uniqueOnly,
			totalRecentVisits
		}),
		{
			headers: {
				'content-type': 'text/html; charset=utf-8',
				'cache-control': 'private, no-store'
			}
		}
	);
}
