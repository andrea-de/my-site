import { json } from '@sveltejs/kit';
import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, GEMINI_API_KEY } from '$env/static/private';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function POST({ request }) {
	try {
		const { messages, contactInfo, type, summary: providedSummary } = await request.json();

		// Extract Geolocation and Metadata from Vercel headers
		const city = request.headers.get('x-vercel-ip-city') || 'Unknown City';
		const country = request.headers.get('x-vercel-ip-country') || 'Unknown Country';
		const region = request.headers.get('x-vercel-ip-country-region') || '';
		const ua = request.headers.get('user-agent') || 'Unknown Device';
		const device = ua.includes('Mobile') ? '📱 Mobile' : '💻 Desktop';

		let summary = providedSummary;

		if (!summary && messages && messages.length > 1 && type !== 'direct_contact') {
			try {
				const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
				const prompt = `
					Summarize this chat interaction between a user and Andrea's AI assistant into a single concise paragraph for Andrea to review.
					Focus on the user's intent, specific questions asked, and any sentiment.

					CHAT LOG:
					${messages.map(m => `${m.role}: ${m.content}`).join('\n')}
				`;
				const result = await model.generateContent(prompt);
				summary = result.response.text();
			} catch (e) {
				summary = `(Server failed to summarize)`;
			}
		}

		let telegramMessage = "";
		const locationInfo = `📍 *Location:* ${city}, ${region} ${country}\n🖥️ *Device:* ${device}\n\n`;

		if (type === 'direct_contact') {
			telegramMessage = `📬 *New Direct Message*\n${locationInfo}`;
			telegramMessage += `👤 *From:* ${contactInfo.name}\n`;
			telegramMessage += `📧 *Email:* ${contactInfo.email}\n\n`;
			telegramMessage += `💬 *Message:*\n${contactInfo.note}\n`;
		} else {
			telegramMessage = `🚀 *AI Chat Session Sync*\n${locationInfo}`;
			if (summary) telegramMessage += `📝 *Summary:*\n${summary}\n\n`;

			if (contactInfo) {
				telegramMessage += `👤 *Lead:* ${contactInfo.name} (${contactInfo.email})\n`;
				telegramMessage += `💬 *Form Note:* ${contactInfo.note || 'N/A'}\n\n`;
			}

			if (messages) telegramMessage += `📊 *Stats:* ${messages.length} messages.`;
		}

		if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
			await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					chat_id: TELEGRAM_CHAT_ID,
					text: telegramMessage,
					parse_mode: 'Markdown'
				})
			});
		}

		return json({ success: true });
	} catch (error) {
		console.error('[LOG API] Fatal Route Error:', error);
		return json({ error: 'Failed to log session' }, { status: 500 });
	}
}
