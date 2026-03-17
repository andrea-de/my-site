import { dev } from '$app/environment';
import { env as privateEnv } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { getVisitDashboardData, storeVisitSummary } from '$lib/server/visit-store';

function clampNumber(value, fallback = 0, min = 0, max = Number.MAX_SAFE_INTEGER) {
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
		device: getDeviceType(userAgent)
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
				<td colspan="8" class="empty-cell">No visits stored yet for this environment.</td>
			</tr>
		`;
	}

	return visits
		.map((visit) => {
			const landingDetails = parseLandingDetails(visit.landingPath);
			const location = [visit.city, visit.region, visit.country].filter(Boolean).join(', ');
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
					<td data-label="Ended">${escapeHtml(formatTimestamp(visit.endedAt))}</td>
					<td data-label="Type"><span class="pill type-${escapeHtml(visit.visitType)}">${escapeHtml(
						visit.visitType
					)}</span></td>
					<td data-label="Duration">${escapeHtml(formatDuration(visit.durationMs))}</td>
					<td data-label="Location">${escapeHtml(location || 'Unknown')}</td>
					<td data-label="Landing">
						<div class="landing">${escapeHtml(visit.landingPath)}</div>
						<div class="meta">${escapeHtml(landingDetails.source || 'no source')}</div>
					</td>
					<td data-label="Referrer">${escapeHtml(visit.referrerHost || 'direct')}</td>
					<td data-label="Depth / Score">${visit.maxScrollPercent}% / ${visit.engagementScore}</td>
					<td data-label="Signals">${escapeHtml(signals || 'none')}</td>
				</tr>
			`;
		})
		.join('');
}

function renderDashboardHtml(dashboard, { token, limit, date }) {
	const tokenQuery = token ? `token=${encodeURIComponent(token)}&` : '';
	const jsonHref = `/api/visits?${tokenQuery}format=json&limit=${limit}&date=${encodeURIComponent(
		date
	)}`;
	const summary = dashboard.summary || {};
	const totalVisits = summary.totalVisits ?? 0;
	const finalSilent = summary.finalSilent ?? 0;
	const finalAgent = summary.finalAgent ?? 0;
	const finalContact = summary.finalContact ?? 0;
	const highIntent =
		summary.highIntent ??
		dashboard.recentVisits.filter((visit) => visit.engagementScore >= 4).length;
	const resumeInterest = summary.resumeInterest ?? 0;

	return `
		<!doctype html>
		<html lang="en">
			<head>
				<meta charset="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<title>Visits Admin</title>
				<style>
					:root {
						--bg: #0c1117;
						--panel: #131a22;
						--panel-alt: #10161d;
						--border: rgba(255, 255, 255, 0.12);
						--text: #e8edf2;
						--muted: #95a2af;
						--accent: #8ee3c2;
						--accent-2: #ffd166;
						--danger: #ff8a80;
					}
					* { box-sizing: border-box; }
					body {
						margin: 0;
						font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
						background:
							radial-gradient(circle at top right, rgba(142, 227, 194, 0.14), transparent 30%),
							radial-gradient(circle at top left, rgba(255, 209, 102, 0.12), transparent 30%),
							var(--bg);
						color: var(--text);
					}
					main {
						max-width: 1280px;
						margin: 0 auto;
						padding: 32px 20px 48px;
					}
					header {
						display: flex;
						justify-content: space-between;
						align-items: flex-start;
						gap: 16px;
						margin-bottom: 24px;
					}
					h1, h2 {
						margin: 0;
						letter-spacing: -0.02em;
					}
					h1 { font-size: 2rem; }
					h2 { font-size: 1rem; margin-bottom: 14px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; }
					p { margin: 6px 0 0; color: var(--muted); }
					a { color: var(--accent); text-decoration: none; }
					.actions {
						display: flex;
						gap: 10px;
						flex-wrap: wrap;
					}
					.action-link {
						padding: 10px 14px;
						border: 1px solid var(--border);
						border-radius: 999px;
						background: rgba(255, 255, 255, 0.03);
					}
					.grid {
						display: grid;
						grid-template-columns: repeat(6, minmax(0, 1fr));
						gap: 12px;
						margin-bottom: 24px;
					}
					.card, .panel {
						background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02));
						border: 1px solid var(--border);
						border-radius: 18px;
						padding: 18px;
						backdrop-filter: blur(10px);
					}
					.card strong {
						display: block;
						font-size: 1.9rem;
						margin-top: 8px;
						color: var(--text);
					}
					.layout {
						display: grid;
						grid-template-columns: 320px minmax(0, 1fr);
						gap: 16px;
					}
					.side-stack {
						display: grid;
						gap: 16px;
						align-content: start;
					}
					.breakdown-list {
						list-style: none;
						padding: 0;
						margin: 0;
						display: grid;
						gap: 10px;
					}
					.breakdown-list li {
						display: flex;
						justify-content: space-between;
						align-items: center;
						gap: 12px;
						padding: 10px 12px;
						background: var(--panel-alt);
						border-radius: 12px;
						color: var(--text);
					}
					.breakdown-list li.empty,
					.empty-cell {
						color: var(--muted);
					}
					table {
						width: 100%;
						border-collapse: collapse;
						font-size: 0.95rem;
					}
					th, td {
						padding: 12px 10px;
						border-bottom: 1px solid rgba(255, 255, 255, 0.08);
						text-align: left;
						vertical-align: top;
					}
					th {
						font-size: 0.78rem;
						text-transform: uppercase;
						letter-spacing: 0.08em;
						color: var(--muted);
					}
					.landing {
						font-family: "IBM Plex Mono", "SFMono-Regular", monospace;
						font-size: 0.85rem;
						word-break: break-all;
					}
					.meta {
						font-size: 0.78rem;
						color: var(--muted);
						margin-top: 6px;
					}
					.pill {
						display: inline-flex;
						padding: 4px 10px;
						border-radius: 999px;
						font-size: 0.78rem;
						text-transform: uppercase;
						letter-spacing: 0.08em;
						border: 1px solid var(--border);
					}
					.type-silent { color: var(--accent); }
					.type-agent { color: var(--accent-2); }
					.type-contact { color: var(--danger); }
					.footer-note {
						margin-top: 16px;
						font-size: 0.82rem;
						color: var(--muted);
					}
					@media (max-width: 980px) {
						.grid {
							grid-template-columns: repeat(2, minmax(0, 1fr));
						}
						.layout {
							grid-template-columns: 1fr;
						}
					}
					@media (max-width: 680px) {
						header {
							flex-direction: column;
						}
						.grid {
							grid-template-columns: 1fr;
						}
						table, thead, tbody, th, td, tr {
							display: block;
						}
						thead {
							display: none;
						}
						tr {
							padding: 12px 0;
							border-bottom: 1px solid rgba(255, 255, 255, 0.08);
						}
						td {
							border: 0;
							padding: 6px 0;
						}
						td::before {
							content: attr(data-label);
							display: block;
							color: var(--muted);
							font-size: 0.78rem;
							text-transform: uppercase;
							letter-spacing: 0.08em;
							margin-bottom: 4px;
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
							<a class="action-link" href="${escapeHtml(jsonHref)}">Raw JSON</a>
						</div>
					</header>

					<section class="grid">
						<div class="card"><span>Today Total</span><strong>${totalVisits}</strong></div>
						<div class="card"><span>Silent Finals</span><strong>${finalSilent}</strong></div>
						<div class="card"><span>Agent Finals</span><strong>${finalAgent}</strong></div>
						<div class="card"><span>Contact Finals</span><strong>${finalContact}</strong></div>
						<div class="card"><span>High-Intent</span><strong>${highIntent}</strong></div>
						<div class="card"><span>Resume Interest</span><strong>${resumeInterest}</strong></div>
					</section>

					<section class="layout">
						<div class="side-stack">
							${renderBreakdownList('Top Landing Paths', dashboard.breakdowns.landing || [])}
							${renderBreakdownList('Top Referrers', dashboard.breakdowns.referrer || [])}
							${renderBreakdownList('Top Countries', dashboard.breakdowns.country || [])}
							${renderBreakdownList('Top Devices', dashboard.breakdowns.device || [])}
						</div>

						<section class="panel">
							<h2>Recent Visits</h2>
							<table>
								<thead>
									<tr>
										<th>Ended</th>
										<th>Type</th>
										<th>Duration</th>
										<th>Location</th>
										<th>Landing</th>
										<th>Referrer</th>
										<th>Depth / Score</th>
										<th>Signals</th>
									</tr>
								</thead>
								<tbody>${renderVisitRows(dashboard.recentVisits)}</tbody>
							</table>
							<p class="footer-note">
								Open this route with <code>?token=YOUR_TOKEN</code> in the URL, or use the
								<code>x-visits-token</code> header / Bearer token for API access.
							</p>
						</section>
					</section>
				</main>
			</body>
		</html>
	`;
}

export async function POST({ request }) {
	try {
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
	const date = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get('date') || '')
		? url.searchParams.get('date')
		: new Date().toISOString().slice(0, 10);
	const dashboard = await getVisitDashboardData({ limit, date });

	if (wantsJson(request, url)) {
		return json({
			mode: dashboard.mode,
			date: dashboard.date,
			limit,
			summary: dashboard.summary,
			breakdowns: dashboard.breakdowns,
			recentVisits: dashboard.recentVisits
		});
	}

	return new Response(
		renderDashboardHtml(dashboard, { token: getProvidedToken(request, url), limit, date }),
		{
			headers: {
				'content-type': 'text/html; charset=utf-8',
				'cache-control': 'private, no-store'
			}
		}
	);
}
