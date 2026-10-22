// @ts-ignore Node builtin types are not installed in this JS-only project.
import { createHash } from 'node:crypto';
import { env as privateEnv } from '$env/dynamic/private';
import { clampNumber, toArray, toShortString } from './shared';
import { engagementScore } from '$lib/visit-score';

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

// Crawlers, link previewers, monitors and scripted browsers: never stored.
const AUTOMATED_UA =
	/bot\b|bot\/|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|embedly|whatsapp|telegram|discord|curl|wget|python-|go-http|okhttp|axios|node-fetch|httpclient|phantom|puppeteer|playwright|selenium|uptime|monitor|pingdom/i;

function computeVisitType(summary) {
	if (summary.hasFormSubmission) return 'contact';
	if (summary.hasAgentInteraction) return 'agent';
	return 'silent';
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
	if (clientVisitorId) return getVisitorHash(`client:${clientVisitorId}`);

	const ipAddress = getClientIp(request);
	if (!ipAddress) return '';

	const userAgent = request.headers.get('user-agent') || '';
	return getVisitorHash(`ipua:${ipAddress}:${userAgent}`);
}

export function isVisitsAdminLanding(landingPath) {
	return (
		typeof landingPath === 'string' &&
		(landingPath.startsWith('/api/visits') || landingPath.startsWith('/admin'))
	);
}

// /shorts videos this visit played or liked: { id: "square-swaps-2", project, title, pct, liked? }.
// Kept for the visit's report; none of it counts toward the engagement score.
function normalizeShorts(value) {
	if (!Array.isArray(value)) return [];
	return value
		.filter((entry) => entry && typeof entry === 'object' && /^[a-z0-9-]{1,80}$/.test(entry.id))
		.slice(0, 60)
		.map((entry) => ({
			id: entry.id,
			project: toShortString(entry.project).slice(0, 60),
			title: toShortString(entry.title).slice(0, 80),
			pct: clampNumber(entry.pct, 0, 0, 100),
			...(entry.liked !== undefined && { liked: Boolean(entry.liked) })
		}));
}

// How the /shorts cover was left, in order: which play button, a swipe, or a link away.
export const SHORTS_COVER_ACTIONS = ['sound', 'muted', 'swipe', 'welcome', 'resume', 'site'];
// What the visitor did with the /shorts voice short: saw it, watched its intro to the end or
// skipped it, tapped the orb, asked a question.
export const SHORTS_VOICE_ACTIONS = ['view', 'intro', 'skip', 'talk', 'ask'];

function normalizeActions(value, allowed) {
	if (!Array.isArray(value)) return [];
	return [...new Set(value.filter((a) => allowed.includes(a)))];
}

export function normalizeSummary(body, request) {
	const startedAt = toShortString(body.startedAt, new Date().toISOString());
	const endedAt = toShortString(body.endedAt, new Date().toISOString());
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
		shorts: normalizeShorts(body.shorts),
		shortsCover: normalizeActions(body.shortsCover, SHORTS_COVER_ACTIONS),
		shortsVoice: normalizeActions(body.shortsVoice, SHORTS_VOICE_ACTIONS),
		// The Pause at end switch, if the visitor changed it: true or false, else left out.
		...(typeof body.shortsPauseAtEnd === 'boolean' && { shortsPauseAtEnd: body.shortsPauseAtEnd }),
		// Pages loaded before this field existed don't send it: count them as before.
		interacted: body.interacted === undefined ? true : Boolean(body.interacted),
		automated: Boolean(body.webdriver) || AUTOMATED_UA.test(userAgent),
		city: toShortString(request.headers.get('x-vercel-ip-city'), 'Unknown City'),
		country: toShortString(request.headers.get('x-vercel-ip-country'), 'Unknown Country'),
		region: toShortString(request.headers.get('x-vercel-ip-country-region')),
		device: getDeviceType(userAgent),
		visitorId: getVisitorId(request, body)
	};

	summary.visitType = computeVisitType(summary);
	summary.engagementScore = engagementScore(summary);
	return summary;
}
