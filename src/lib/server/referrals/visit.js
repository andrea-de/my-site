// What a job-link page load records, and the Telegram alert it sends.
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { escapeMarkdown, sendTelegramMessage } from '../telegram';
import { firstWithin, recordReferralEntry } from './store';

// Link unfurlers name themselves; the first match says where the link was pasted.
/** @type {[RegExp, string][]} */
const PREVIEWERS = [
	[/slack/i, 'Slack'],
	[/linkedin/i, 'LinkedIn'],
	[/whatsapp/i, 'WhatsApp'],
	[/telegrambot/i, 'Telegram'],
	[/discord/i, 'Discord'],
	[/skypeuripreview|teams/i, 'Teams'],
	// iMessage fetches previews as "facebookexternalhit Facebot Twitterbot".
	[/facebot.*twitterbot/i, 'iMessage'],
	[/facebookexternalhit|facebot/i, 'Facebook'],
	[/twitterbot/i, 'X'],
	[/googlebot|google-inspectiontool|googleother/i, 'Google'],
	[/bingbot|bingpreview/i, 'Bing'],
	[/applebot/i, 'Apple'],
	[/outlook|microsoft office|ms-office/i, 'Outlook'],
	[/headless/i, 'a headless browser']
];

const BOT_PATTERN =
	/bot|crawl|spider|preview|slurp|facebookexternalhit|embedly|headless|curl\/|wget|python-requests|python-urllib|go-http-client|node-fetch|axios|okhttp|java\/|scrapy|httpclient/i;

/** The previewer's name for a bot user agent, or null for a person. */
export function previewerFor(userAgent = '') {
	if (!userAgent) return 'an unknown client';
	if (!BOT_PATTERN.test(userAgent)) return null;
	return PREVIEWERS.find(([pattern]) => pattern.test(userAgent))?.[1] || 'a bot';
}

function deviceFor(userAgent = '') {
	if (/ipad|tablet|android(?!.*mobile)/i.test(userAgent)) return 'tablet';
	if (/mobi|iphone|android/i.test(userAgent)) return 'mobile';
	return 'desktop';
}

function referrerHost(referrer) {
	if (!referrer) return null;
	try {
		return new URL(referrer).host || null;
	} catch {
		return null;
	}
}

function decodeHeader(value) {
	if (!value) return null;
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

/** Where and on what the request came from. */
export function requestDetails(request) {
	const userAgent = request.headers.get('user-agent') || '';
	return {
		country: request.headers.get('x-vercel-ip-country') || null,
		city: decodeHeader(request.headers.get('x-vercel-ip-city')),
		device: deviceFor(userAgent),
		referrer: referrerHost(request.headers.get('referer'))
	};
}

// Telegram from the dev server only when asked, so testing doesn't page Andrea.
const telegramEnabled = () => !dev || env.REFERRALS_TELEGRAM_IN_DEV === '1';

const label = (record) =>
	`🔗 *${escapeMarkdown(record.code)}* · ${escapeMarkdown(record.company)} · ${escapeMarkdown(record.role)}`;

function placeFor({ city, country }) {
	return [city, country].filter(Boolean).join(', ') || 'somewhere unknown';
}

/**
 * Logs a page load against a code and alerts Telegram: a visit for a person, a preview
 * for a link unfurler or other bot (which isn't counted as a visit).
 * @param {any} record
 * @param {Request} request
 */
export async function logReferralPageLoad(record, request) {
	const details = requestDetails(request);
	const previewer = previewerFor(request.headers.get('user-agent') || '');

	if (previewer) {
		await recordReferralEntry(record.code, { type: 'preview', previewer, ...details });
		// Unfurlers often fetch a link several times; one alert per previewer per hour.
		if (telegramEnabled() && (await firstWithin(`preview:${record.code}:${previewer}`, 3600))) {
			await sendTelegramMessage(`${label(record)} — link previewed by ${escapeMarkdown(previewer)}.`);
		}
		return;
	}

	const visitNumber = await recordReferralEntry(record.code, { type: 'visit', ...details });
	if (telegramEnabled()) {
		const via = details.referrer ? ` via ${escapeMarkdown(details.referrer)}` : '';
		await sendTelegramMessage(
			`${label(record)} — opened from ${escapeMarkdown(placeFor(details))} (${details.device})${via}. Visit #${visitNumber}.`
		);
	}
}
