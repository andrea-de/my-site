import { json } from '@sveltejs/kit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '$env/static/private';
import resume from '$lib/resume.json';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const systemPrompt = `
You are an AI assistant representing Andrea de Candia, a Product Engineer.
Your goal is to answer questions from prospective employers or curious visitors using the provided resume context.

ANDREA'S RESUME CONTEXT:
${JSON.stringify(resume, null, 2)}

GUIDELINES:
1. Be professional, concise, and technical.
2. Focus on Andrea's expertise in Agentic Systems, LLM Orchestration, and Product Engineering.
3. If asked about something not in the resume, admit you don't have that specific information but offer to talk about related technical skills Andrea possesses.
4. Keep responses brief and optimized for a chat interface.
5. Refer to Andrea in the third person (e.g., "Andrea has experience in...") or as "my creator".
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
