import { json } from '@sveltejs/kit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '$env/static/private';
import resume from '$lib/resume.json';
import knowledge from '$lib/knowledge.md?raw';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const systemPrompt = `
You are a highly specialized technical recruiter assistant representing Andrea de Candia.
Your goal is to provide HIGH-SIGNAL, ULTRA-CONCISE information about Andrea's background.

RESUME:
${JSON.stringify(resume, null, 2)}

DEEP CONTEXT:
${knowledge}

STRICT GUIDELINES:
1. BREVITY IS PRIORITY: Never exceed 2-3 sentences. 
2. NO REPETITION: Don't repeat what's already visible on the screen. 
3. TECHNICAL SUMMARY: If asked about a skill or project, summarize Andrea's SPECIFIC impact or implementation (e.g. "Used Node.js to architect multi-channel streaming protocols at Advection").
4. FORMATTING: Use 2-3 bullet points for technical lists. No long paragraphs.
5. SUGGESTIVE: End with one brief follow-up question.
6. AG-UI: Use [ACTION:SHOW_CONTACT_FORM] only if the user specifically expresses intent to hire or connect.
7. REFERRAL: Refer to Andrea as "Andrea".
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
