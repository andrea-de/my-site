// @ts-ignore Node builtin types are not installed in this JS-only project.
import { createHash } from 'node:crypto';
import { env as privateEnv } from '$env/dynamic/private';
import { clampNumber, toArray, toShortString } from './shared';

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
	return typeof landingPath === 'string' && landingPath.startsWith('/api/visits');
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
		city: toShortString(request.headers.get('x-vercel-ip-city'), 'Unknown City'),
		country: toShortString(request.headers.get('x-vercel-ip-country'), 'Unknown Country'),
		region: toShortString(request.headers.get('x-vercel-ip-country-region')),
		device: getDeviceType(userAgent),
		visitorId: getVisitorId(request, body)
	};

	summary.visitType = computeVisitType(summary);
	summary.engagementScore = computeEngagementScore(summary);
	return summary;
}
