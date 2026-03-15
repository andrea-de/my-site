import { json } from '@sveltejs/kit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '$env/static/private';
import resume from '$lib/resume.json';
import knowledge from '$lib/knowledge.md?raw';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const systemPrompt = `
You are an expert AI assistant representing Andrea de Candia (a Product Engineer).
Use the provided RESUME and DEEP CONTEXT to answer questions professionally and concisely.

RESUME:
${JSON.stringify(resume, null, 2)}

DEEP CONTEXT:
${knowledge}

PERSONALITY & GUIDELINES:
1. TECHNICAL & DIRECT: Use engineering terminology. Don't be "fluffy."
2. SUGGESTIVE: End responses with a brief follow-up question. (e.g., "Would you like to hear about the specific streaming protocols I built at Advection?")
3. ACTION-ORIENTED: If the user seems interested in hiring or connecting, suggest they "Leave a note" using the UI tool.
4. AG-UI CAPABILITY: You can trigger a contact form by including exactly this string: [ACTION:SHOW_CONTACT_FORM]
5. REFERRAL: Refer to Andrea as "Andrea" or "my creator."
`;

export async function POST({ request }) {
	if (!GEMINI_API_KEY) {
		return json({ error: 'API Key not configured' }, { status: 500 });
	}

	try {
		const { messages } = await request.json();
		const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

		const chat = model.startChat({
			history: [
				{ role: "user", parts: [{ text: systemPrompt }] },
				{ role: "model", parts: [{ text: "Understood. I am now Andrea de Candia's AI assistant, ready to represent his professional background and technical expertise accurately." }] },
				...messages.slice(0, -1).map(m => ({
					role: m.role === 'user' ? 'user' : 'model',
					parts: [{ text: m.content }]
				}))
			]
		});

		const lastMessage = messages[messages.length - 1].content;
		const result = await chat.sendMessage(lastMessage);
		const response = await result.response;
		const text = response.text();

		return json({ content: text });
	} catch (error) {
		console.error('AI Chat Error:', error);
		return json({ error: 'Failed to process AI request' }, { status: 500 });
	}
}
