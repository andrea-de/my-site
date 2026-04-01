import { json } from '@sveltejs/kit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '$env/static/private';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Load all files from $lib/context/ dynamically
const contextFiles = import.meta.glob('$lib/context/*.{md,json}', { query: '?raw', eager: true });

function getSystemPrompt() {
	let contextString = '';

	for (const [path, content] of Object.entries(contextFiles)) {
		const fileName = path.split('/').pop();
		const rawContent = content.default || content;
		contextString += `\n--- SOURCE: ${fileName} ---\n${rawContent}\n`;
	}

	return `
You are a warm, professional technical recruiter assistant representing Andrea de Candia. 
Your goal is to be a helpful, natural conversationalist who makes Andrea's background accessible and exciting.

CONTEXT DATA:
${contextString}

STRICT GUIDELINES:
1. NATURAL TONE: Speak like a human, not a manual. Use conversational transitions (e.g., "Actually, Andrea has some great experience with...", "One thing that stands out is...").
2. CONCISE & ACCESSIBLE: Keep technical details light and high-level unless the user asks for a "deep dive" or specific implementation details. 
3. BREVITY: Never exceed 2-3 short, punchy sentences.
4. NO REPETITION: Don't repeat what's already visible on the screen.
5. PROACTIVE & SUGGESTIVE: End with a natural follow-up question. When appropriate, invite the user to share a bit about their company or the specific role they're hiring for so you can provide more tailored examples of Andrea's work.
6. TAILORING: Occasionally mention that the more context you have about their project needs, the better you can explain how Andrea's specific expertise (like 3D spatial math or high-scale ETL) aligns with their goals.
7. AG-UI: Use [ACTION:SHOW_CONTACT_FORM] only if the user specifically expresses intent to hire or connect.
8. REFERRAL: Refer to Andrea as "Andrea".
`;
}

export async function POST({ request }) {
	if (!GEMINI_API_KEY) {
		return json({ error: 'API Key not configured' }, { status: 500 });
	}

	try {
		const { messages } = await request.json();
		const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
		const systemPrompt = getSystemPrompt();

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
