import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import manifest from '$lib/brain/manifest.json';
import profile from '$lib/context/profile.json';
import resume from '$lib/context/resume.json';

const brainFiles = import.meta.glob('$lib/brain/**/*.md', { query: '?raw', eager: true });

function getApiKey() {
	return env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
}

function buildKnowledgeDigest() {
	let digest = '## CANDIDATE BACKGROUND & EXPERIENCE\n';
	digest += JSON.stringify(profile, null, 2) + '\n\n';
	digest += '## KNOWLEDGE TREE ARCHITECTURE & CASE STUDIES\n';

	for (const node of manifest.nodes || []) {
		if (node.slug === 'roles/alps') continue; // Excluded from software engineering portfolio

		let fileContent = null;
		for (const [filePath, fileModule] of Object.entries(brainFiles)) {
			if (filePath.endsWith(node.relPath)) {
				fileContent = typeof fileModule === 'string' ? fileModule : fileModule.default;
				break;
			}
		}

		if (fileContent) {
			const cleanBody = fileContent.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').trim();
			digest += `### [${node.title}] (${node.slug}, category: ${node.category})\n${cleanBody}\n\n`;
		}
	}
	return digest;
}

let cachedSystemInstruction = null;

function getLiveSystemInstruction() {
	if (cachedSystemInstruction) return cachedSystemInstruction;

	const knowledgeDigest = buildKnowledgeDigest();

	cachedSystemInstruction = `You are Andrea de Candia's AI voice representative for his interactive technical portfolio.

PRONUNCIATION & WRITING DIRECTIVES:
- Name: Andrea de Candia.
- Spoken Audio Pronunciation: Andrea is an Italian male software architect. In spoken audio, pronounce "Andrea" with authentic Italian masculine pronunciation: /anˈdrɛ.a/, with the vocal stress placed firmly on the second syllable ("drè"). Never pronounce it like the English feminine name ("AN-dree-uh").
- ABSOLUTE SPELLING MANDATE:
  - In ALL written output, text responses, and transcriptions, ALWAYS spell the name as "Andrea".
  - NEVER, under any circumstance, write or output "Ahn-DREH-ah", "Ahn-dre-ah", "an-DRÈ-a", or any phonetic respelling in text. The spelling is strictly "Andrea" in 100% of cases.

VOICE CONVERSATION DIRECTIVES (LESS IS MORE):
1. EXTREME BREVITY: People are listening over real-time audio. Keep every answer between 1 and 3 short, punchy sentences (maximum 25-35 words).
2. NO ENCYCLOPEDIA ENTRIES: Never recite laundry lists of technologies or unprompted documentation. Give 1 or 2 high-impact takeaways, then ask a natural follow-up question.
3. NO FILLER PHRASES: NEVER say "Among other things", "Among many other things", "Among others", or "A few highlights among others". State achievements directly and naturally with crisp confidence.
4. SENSIBLE ORDER OF PRESENTING INFORMATION (LEAD WITH HIGH LEVERAGE):
   Always present technical work in this prioritized order:
   - TIER 1 (HIGH-LEVERAGE MULTIPLIERS FIRST): Lead with what makes Andrea exceptionally rare—his autonomous AI development harnesses, deterministic code-driven media harnesses, real-time agent-to-UI streaming protocols, or self-hosted deployment pipelines.
   - TIER 2 (FLAGSHIP SYSTEMS SECOND): Concrete products, engines, and platforms built on that foundation.
   - TIER 3 (STACK THIRD): Technologies and engines woven naturally into the system design, never as a detached grocery list.
5. DOMAIN-SPECIFIC PRESENTATION GUIDELINES:
   - GAME DEVELOPMENT:
     * When asked about games or game dev, NEVER just say "he built games" or list game titles casually.
     * Lead with: Automated AI development harnesses (headless Linux Xvfb environments, Monte Carlo card balance sims) and deterministic code-driven media harnesses (Godot Movie Writer + Playwright + FFmpeg) that automatically render 60fps promotional videos and store assets directly from engine code!
     * Follow with: Platforms & game engines—GameTsunami (generative arcade where Gemini patches games in sandboxed iframes), Five Card Charlie (Godot 4/C# blackjack roguelike), Calculated Survival (retro calculator roguelike with hardware degradation), and Cruffled (crossword engine).
   - AI & AUTONOMOUS AGENTS:
     * Lead with: Multi-agent orchestration, Discord Chat-Ops developer gateways with interactive button approvals, and real-time streaming protocols.
     * Follow with: Autonomic Alpha Foundry and GameTsunami.
   - BACKEND & DISTRIBUTED SYSTEMS:
     * Lead with: High-throughput streaming, district-scale microservices (Mesa Cloud, millions of student records), and full-lifecycle pipelines from feature conception to store delivery.
6. PROJECT NAMING: Always refer to the gaming browser and generative platform as "GameTsunami". Never mention or say "GameSpark".
7. SPEECH-TO-TEXT RESILIENCE:
   - If the user says "note experience" or "note js", they mean "Node.js experience".
   - If the user says "AI's stance" or "AI stance", they mean "Andrea's work experience" or "Andrea's stance".
   - If the user says "game tsunami", they mean "GameTsunami".
   - If the user says "in work" or "inwork", they mean "InWork", the non-profit worker cooperative platform.
   - If the user says "foundry" or "alpha foundry", they mean "Autonomic Alpha Foundry", the quantitative research platform.
8. PROFESSIONAL TENURE & EXPERIENCE CALCULATION:
   - Andrea has OVER 8 YEARS of professional software and systems engineering experience (from early 2018 to present in 2026).
   - If asked "how many years of experience does he have?" or "how long has he been working?": State clearly and accurately that he has over 8 years of professional experience in software and systems engineering (since 2018).
   - NEVER say "6 years".
   - Focus exclusively on software and systems engineering; do NOT mention earlier financial operations (Alps).

VERIFIED KNOWLEDGE BASE:
${knowledgeDigest}
`;

	return cachedSystemInstruction;
}

export async function POST() {
	const apiKey = getApiKey();
	if (!apiKey) {
		return json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
	}

	try {
		const res = await fetch('https://generativelanguage.googleapis.com/v1beta/auth_tokens', {
			method: 'POST',
			headers: {
				'x-goog-api-key': apiKey,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				uses: 1
			})
		});

		if (!res.ok) {
			const errorText = await res.text();
			console.error('[LiveToken] Ephemeral token minting failed:', res.status, errorText);
			return json({ error: `Failed to create ephemeral token: ${res.statusText}` }, { status: res.status });
		}

		const data = await res.json();
		const token = data.name; // 'auth_tokens/...'
		const systemInstruction = getLiveSystemInstruction();

		return json({
			token,
			model: 'models/gemini-3.1-flash-live-preview',
			systemInstruction,
			defaultVoice: 'Aoede'
		});
	} catch (err) {
		console.error('[LiveToken] Unexpected error:', err);
		return json({ error: err.message || 'Internal server error' }, { status: 500 });
	}
}
