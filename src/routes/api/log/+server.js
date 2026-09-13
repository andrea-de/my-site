import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
	getSessionTelegramMessageId,
	setSessionTelegramMessageId
} from '$lib/server/telegram-session';

export async function POST({ request }) {
	try {
		const { messages, contactInfo, type, summary: providedSummary, sessionId } = await request.json();

		// Extract Geolocation and Metadata from Vercel headers
		const city = request.headers.get('x-vercel-ip-city') || 'Unknown City';
		const country = request.headers.get('x-vercel-ip-country') || 'Unknown Country';
		const region = request.headers.get('x-vercel-ip-country-region') || '';
		const ua = request.headers.get('user-agent') || 'Unknown Device';
		const device = ua.includes('Mobile') ? '📱 Mobile' : '💻 Desktop';

		const botToken = env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
		const chatId = env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
		const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

		let summary = providedSummary;

		if (!summary && messages && messages.length > 1 && type !== 'direct_contact' && apiKey) {
			try {
				const genAI = new GoogleGenerativeAI(apiKey);
				const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
				const prompt = `
					Summarize this chat interaction between a user and Andrea's AI assistant into a single concise paragraph for Andrea to review.
					Focus on the user's intent, specific questions asked, and any sentiment.

					CHAT LOG:
					${messages.map((m) => `${m.role}: ${m.content}`).join('\n')}
				`;
				const result = await model.generateContent(prompt);
				summary = result.response.text();
			} catch (e) {
				summary = `(Server failed to summarize)`;
			}
		}

		let telegramMessage = '';
		const locationInfo = `📍 *Location:* ${city}, ${region} ${country}\n🖥️ *Device:* ${device}\n\n`;

		if (type === 'direct_contact') {
			telegramMessage = `📬 *New Direct Message*\n${locationInfo}`;
			telegramMessage += `👤 *From:* ${contactInfo?.name || 'Anonymous'}\n`;
			telegramMessage += `📧 *Email:* ${contactInfo?.email || 'N/A'}\n\n`;
			telegramMessage += `💬 *Message:*\n${contactInfo?.note || ''}\n`;
		} else {
			telegramMessage = `🚀 *AI Chat Session Sync*\n${locationInfo}`;
			if (summary) telegramMessage += `📝 *Summary:*\n${summary}\n\n`;

			if (contactInfo) {
				telegramMessage += `👤 *Lead:* ${contactInfo.name} (${contactInfo.email})\n`;
				telegramMessage += `💬 *Form Note:* ${contactInfo.note || 'N/A'}\n\n`;
			}

			if (messages) telegramMessage += `📊 *Stats:* ${messages.length} messages.`;
		}

		if (botToken && chatId) {
			let existingMessageId = sessionId ? await getSessionTelegramMessageId(sessionId) : null;
			let sentSuccessfully = false;

			// Attempt to update the existing Telegram message if this session was already logged
			if (existingMessageId) {
				try {
					const editRes = await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							chat_id: chatId,
							message_id: existingMessageId,
							text: telegramMessage,
							parse_mode: 'Markdown'
						})
					});

					const editData = await editRes.json();
					if (editData.ok) {
						sentSuccessfully = true;
					} else {
						// If edit failed (e.g. message deleted, or text unchanged), fall back to sendMessage
						console.warn('[LOG API] editMessageText returned not ok:', editData?.description);
						if (editData?.description?.includes('message is not modified')) {
							sentSuccessfully = true;
						}
					}
				} catch (editError) {
					console.warn('[LOG API] editMessageText request failed:', editError);
				}
			}

			// If not updated (new session or edit failed), send a new message
			if (!sentSuccessfully) {
				try {
					const sendRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							chat_id: chatId,
							text: telegramMessage,
							parse_mode: 'Markdown'
						})
					});

					const sendData = await sendRes.json();
					if (sendData.ok && sendData.result?.message_id && sessionId) {
						await setSessionTelegramMessageId(sessionId, sendData.result.message_id);
					}
				} catch (sendError) {
					console.error('[LOG API] sendMessage request failed:', sendError);
				}
			}
		}

		return json({ success: true });
	} catch (error) {
		console.error('[LOG API] Fatal Route Error:', error);
		return json({ error: 'Failed to log session' }, { status: 500 });
	}
}
