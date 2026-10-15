import { env } from '$env/dynamic/private';

/**
 * Sends one Markdown message to Andrea's Telegram chat (the same bot and chat as the chat
 * session sync in /api/log). Quietly does nothing when the bot isn't configured.
 * @param {string} text
 * @returns {Promise<number | null>} the message id, or null if nothing was sent
 */
export async function sendTelegramMessage(text) {
	const botToken = env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
	const chatId = env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
	if (!botToken || !chatId) return null;

	try {
		const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				chat_id: chatId,
				text,
				parse_mode: 'Markdown',
				disable_web_page_preview: true
			})
		});
		const data = await res.json();
		if (!data.ok) console.warn('[TELEGRAM] sendMessage returned not ok:', data?.description);
		return data.ok ? data.result?.message_id || null : null;
	} catch (e) {
		console.warn('[TELEGRAM] sendMessage request failed:', e);
		return null;
	}
}

/** Escapes text for Telegram's legacy Markdown, so a company name can't break the message. */
export const escapeMarkdown = (text = '') => String(text).replace(/([_*`[])/g, '\\$1');
