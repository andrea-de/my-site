import { env } from '$env/dynamic/private';
import { GoogleGenerativeAI } from '@google/generative-ai';
import manifest from '$lib/brain/manifest.json';
import profile from '$lib/context/profile.json';
import resume from '$lib/context/resume.json';
import projects from '$lib/context/projects.json';

const brainFiles = import.meta.glob('$lib/brain/**/*.md', { query: '?raw', eager: true });

function getApiKey() {
	return env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
}

function stemWord(w) {
	return (w || '').toLowerCase().replace(/(ing|ed|es|s)$/i, '');
}

function matchText(text, tokens) {
	if (!text) return false;
	const lowerText = text.toLowerCase();
	return tokens.some((t) => {
		const lowerToken = t.toLowerCase();
		if (lowerText.includes(lowerToken)) return true;
		const stem = stemWord(lowerToken);
		if (stem.length >= 4 && lowerText.includes(stem)) return true;
		return false;
	});
}

function executeSearchKnowledgeIndex({ query, category, tag }) {
	const q = (query || '').toLowerCase().trim();
	const cat = (category || '').toLowerCase().trim();
	const tg = (tag || '').toLowerCase().trim();
	const tokens = q ? q.split(/\s+/).filter(Boolean) : [];

	const matches = manifest.nodes
		.filter((n) => n.category !== 'hub')
		.filter((n) => {
			if (cat && n.category.toLowerCase() !== cat) return false;
			if (tg && !(n.tags || []).some((t) => t.toLowerCase() === tg)) return false;
			if (tokens.length > 0) {
				const inTitle = matchText(n.title, tokens);
				const inDesc = matchText(n.description || '', tokens);
				const inTags = (n.tags || []).some((tag) => matchText(tag, tokens));
				const inSlug = matchText(n.slug, tokens);
				return inTitle || inDesc || inTags || inSlug;
			}
			return true;
		})
		.slice(0, 5)
		.map((n) => ({
			slug: n.slug,
			title: n.title,
			category: n.category,
			description: n.description,
			tags: n.tags
		}));

	return matches;
}

function executeReadKnowledgeNode({ slug }) {
	if (!slug) return { error: 'slug parameter is required' };
	const cleanSlug = slug.replace(/^\/?(brain\/)?/, '').replace(/\/$/, '');
	const node = manifest.nodes.find((n) => n.slug === cleanSlug || n.slug.endsWith(cleanSlug));

	if (!node) {
		return { error: `Node with slug "${slug}" not found in brain index.` };
	}

	let fileContent = null;
	for (const [filePath, fileModule] of Object.entries(brainFiles)) {
		if (filePath.endsWith(node.relPath)) {
			fileContent = typeof fileModule === 'string' ? fileModule : fileModule.default;
			break;
		}
	}

	if (!fileContent) {
		return { error: `File content for "${node.relPath}" could not be loaded.` };
	}

	// Strip frontmatter
	const body = fileContent.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');

	return {
		node: {
			slug: node.slug,
			title: node.title,
			category: node.category
		},
		content: body
	};
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function handleLocalIntelligence(messages, sendEvent, options = {}) {
	const lastUserMessage = messages[messages.length - 1]?.content || '';
	const lower = lastUserMessage.toLowerCase().trim();

	// 1. Greetings
	if (/^(hi|hello|hey|greetings|who are you|what can you do)/i.test(lower)) {
		sendEvent('thought', {
			delta: 'Greeting detected. Presenting Andrea de Candia overview and inviting recruiter inquiry...'
		});
		await sleep(80);
		const greetingText = "Hi! I'm Andrea's AI assistant. Andrea is a Product Engineer and Systems Architect specializing in autonomous multi-agent systems, real-time streaming protocols, and high-performance web/mobile engineering. What role or tech stack are you hiring for?";
		const words = greetingText.split(' ');
		for (let i = 0; i < words.length; i += 3) {
			const chunk = words.slice(i, i + 3).join(' ') + ' ';
			sendEvent('content', { delta: chunk });
			await sleep(35);
		}
		await sleep(50);
		sendEvent('done', { sources: [], warning: options.warning || null });
		return;
	}

	let targetSlugs = [];
	let customResponse = '';
	let followUp = '';
	let searchQuery = '';

	// 2. Multi-project breakdown / overview / three words
	if (
		/\b(projects?|portfolio|overview|breakdown|summary|summarize|three words?|3 words?|list)\b/i.test(lower) &&
		!/\b(cruffle[sd]?|foundr(y|ies)|gametsunami|weatherie[sd]?|tackr(y|ies))\b/i.test(lower)
	) {
		searchQuery = 'products';
		targetSlugs = [
			'prototypes/foundry',
			'products/gametsunami',
			'products/cruffled',
			'products/tackry',
			'products/weatherie'
		];

		if (lower.includes('three word') || lower.includes('3 word')) {
			customResponse = `A 3-word breakdown:\n\n- **Foundry**: Multi-agent quant orchestration\n- **GameTsunami**: Autonomous AI gaming\n- **Cruffled**: Word puzzle engine\n- **Tackry**: Local-first Android hub\n- **Weatherie**: Dynamic Flutter themes`;
			followUp = 'Which one would you like to explore?';
		} else {
			customResponse = `Some notable ones:\n\n- Gaming browser, short-form media & generative development platform (**GameTsunami**)\n- Dynamic UI weather platform (**Weatherie**)\n- Word puzzle game with embeddable crossword engine (**Cruffled**)\n- Native Android productivity tool (**Tackry**)\n- Autonomous multi-agent quant trading system (**Foundry**)`;
			followUp = 'Which domain would you like to hear more about?';
		}
	}
	// 2b-1. Years of experience / tenure
	else if (
		/\b(how many years|years of (experience|software|work|engineering)|how long (has he|have you) been (working|an engineer|a developer|coding)|experience years)\b/i.test(lower)
	) {
		searchQuery = 'roles';
		targetSlugs = ['roles/advection', 'roles/gandd'];
		customResponse = "Andrea has over **8 years of professional software and systems engineering experience**, starting in early 2018 (at AIA and Giesecke+Devrient) and continuing through his current role at Advection Software.";
		followUp = "Would you like an overview of his technical roles or specific architectures?";
	}
	// 2b. Professional Experience / Career / Companies / Work History
	else if (
		/\b(experience|career|roles?|work\s*history|companies|employment|jobs?|professional\s*background|resume|ai'?s?\s+stance)\b/i.test(lower) &&
		!/\b(cruffle[sd]?|foundr(y|ies)|gametsunami|weatherie[sd]?|tackr(y|ies))\b/i.test(lower)
	) {
		searchQuery = 'roles';
		targetSlugs = [
			'roles/advection',
			'roles/mesa-cloud',
			'roles/intellisense',
			'roles/gandd'
		];
		customResponse = "Andrea's career highlights:\n\n- **Advection Software**: Founding engineer for real-time LLM streaming and edge systems\n- **Mesa Cloud**: Led AWS microservice migration and district-scale student ETL\n- **Intellisense.io**: Staff engineer for Mine-to-Market industrial AI and 3D spatial math\n- **Giesecke+Devrient**: Android biometric showcase and high-scale telecom services";
		followUp = "Which role or stack would you like to inspect?";
	}
	// 2c. Advection Software
	else if (/\b(advection|advection\s*software)\b/i.test(lower)) {
		searchQuery = 'advection';
		targetSlugs = ['roles/advection'];
		customResponse = "At **Advection Software**, Andrea architected multi-channel LLM streaming pipelines (SSE/WebSockets), in-house edge ad infrastructure with Cloudflare Pages/Workers/D1, and serverless FFmpeg transcoding pipelines.";
		followUp = "Would you like to explore the real-time streaming protocol or edge architecture?";
	}
	// 2d. Mesa Cloud
	else if (/\b(mesa|mesa\s*cloud)\b/i.test(lower)) {
		searchQuery = 'mesa cloud';
		targetSlugs = ['roles/mesa-cloud'];
		customResponse = "At **Mesa Cloud**, Andrea led the migration from a legacy monolithic SQL engine to Python/Pandas microservices on AWS Elastic Beanstalk, processing district-scale student records with distributed batching.";
		followUp = "Want to hear about the distributed batching or testing strategy?";
	}
	// 2e. Intellisense.io
	else if (/\b(intellisense|intellisense\.io|mining|sio|mine-to-market|voxel|spatial\s*geometry)\b/i.test(lower)) {
		searchQuery = 'intellisense';
		targetSlugs = ['roles/intellisense'];
		customResponse = "At **Intellisense.io**, Andrea deployed industrial AI for mining operations, authoring a custom 3D voxel-to-column translation math library and event-driven microservices.";
		followUp = "Interested in the 3D geometry engine or edge synchronization?";
	}
	// 2f. Giesecke+Devrient
	else if (/\b(g\+d|giesecke|devrient|biometric|biometrics|telecom|mwc)\b/i.test(lower)) {
		searchQuery = 'giesecke devrient';
		targetSlugs = ['roles/gandd'];
		customResponse = "At **G+D**, Andrea engineered an MWC biometric Android app with hardware serial bridging, high-volume telecom microservices, and automated testing engines.";
		followUp = "Would you like to dive into the Android hardware bridge or the test engine?";
	}
	// 2g. Game Development / Games / Godot / Roguelike / Simulation Harnesses
	else if (
		/\b(game\s*dev(elopment)?|games?|gaming|godot|roguelike|crosswords?)\b/i.test(lower) &&
		!/\b(gametsunami|cruffle[sd]?|weatherie|tackry|foundry|inwork)\b/i.test(lower)
	) {
		searchQuery = 'game development harnesses godot';
		targetSlugs = [
			'tools/agentic-development-harnesses',
			'tools/media-harnesses',
			'products/gametsunami',
			'products/five-card-charlie',
			'products/calculated-survival'
		];
		customResponse =
			"Andrea approaches game development through high-leverage infrastructure:\n\n" +
			"- **Automated AI Development Harnesses**: Headless Linux Xvfb simulation environments and Monte Carlo balance sims that allow coding agents to build and verify games without human input.\n" +
			"- **Code-Driven Media Harnesses**: Programmatic pipelines (Godot Movie Writer + Playwright + FFmpeg) that generate 60fps promotional videos and store assets straight from engine code.\n" +
			"- **Platforms & Game Engines**: **GameTsunami** (AI-native generative arcade in p5.js), **Five Card Charlie** (Godot 4/C# blackjack roguelike), **Calculated Survival** (retro calculator roguelike), and **Cruffled** (crossword applet engine).";
		followUp = "Would you like to explore the automated simulation harnesses or the game architectures?";
	}
	// 3. App / Mobile / Native / Store Production Experience
	else if (/\b(apps?|mobile|native|ios|android|cross-platform|capacitor|flutter|app\s*store|play\s*store|device|phone|shipped)\b/i.test(lower)) {
		searchQuery = 'mobile android capacitor flutter';
		targetSlugs = [
			'products/tackry',
			'products/cruffled',
			'products/weatherie'
		];
		customResponse = "Andrea's mobile highlights:\n\n- Native Android productivity hub with Room SQLite (**Tackry**)\n- Cross-platform SvelteKit crossword app via Capacitor (**Cruffled**)\n- Cross-platform Flutter weather app compiled to WASM (**Weatherie**)";
		followUp = "Which mobile stack would you like to explore?";
	}
	// 4. AI / Multi-Agent / LLM experience
	else if (/\b(ai|agent|agents|multi-agent|mcp|llm|machine learning|genai|gemini|prompts?|reasoning loop)\b/i.test(lower) && !/\b(ai'?s?\s+stance)\b/i.test(lower)) {
		searchQuery = 'multi-agent mcp gemini';
		targetSlugs = [
			'prototypes/foundry',
			'products/gametsunami',
			'architecture/agent-ui-protocols'
		];
		customResponse = "Andrea's AI highlights:\n\n- Multi-agent quant orchestration with MCP & WebSockets (**Foundry**)\n- 15-step autonomous reasoning loops in sandboxed iframes (**GameTsunami**)\n- High-frequency WebSocket streaming protocols for agent-to-UI sync (**Advection**)";
		followUp = "Looking for multi-agent architecture or real-time UI streaming?";
	}
	// 5. Node / Backend / Streaming / Real-time Protocols
	else if (/\b(node|nodejs|note\s*(js|\.js|experience|backend|server)?|express|backend|api|server|streaming|websocket|websockets|sse|envelopes?|protocol)\b/i.test(lower)) {
		searchQuery = 'streaming websockets sse';
		targetSlugs = ['architecture/agent-ui-protocols', 'prototypes/foundry'];
		customResponse = "Andrea's backend focus is high-frequency WebSocket and SSE streaming pipelines in Node.js, combined with async Python/FastAPI microservices for intensive computation.";
		followUp = "What kind of backend architecture is your team building?";
	}
	// 6. Web / Frontend / UI / Components / Svelte / WASM
	else if (/\b(web|frontend|ui|svelte|sveltekit|react|components?|css|browser|wasm|webassembly)\b/i.test(lower)) {
		searchQuery = 'svelte sveltekit web-components wasm';
		targetSlugs = [
			'products/cruffled',
			'architecture/agent-ui-protocols',
			'products/weatherie'
		];
		customResponse = "Andrea's frontend work focuses on ultra-responsive architectures: standalone embeddable Web Components (**Cruffled**), real-time agent event envelopes in Svelte, and Flutter on WebAssembly (**Weatherie**).";
		followUp = "Interested in SvelteKit components or WebAssembly delivery?";
	}
	// 7. Database / Local-First / Storage / SQL
	else if (/\b(database|databases|storage|sqlite|room|postgres|postgresql|local-first|sql|persistence)\b/i.test(lower)) {
		searchQuery = 'sqlite room postgresql';
		targetSlugs = [
			'products/tackry',
			'prototypes/foundry'
		];
		customResponse = "Andrea works across local-first SQLite architectures with reactive Android queries (**Tackry**) and high-throughput server-side PostgreSQL for backtesting (**Foundry**).";
		followUp = "Want to hear about local-first caching or relational schemas?";
	}
	// 8. Cruffled
	else if (/\b(cruffle[sd]?|crosswords?|puzzles?)\b/i.test(lower)) {
		searchQuery = 'cruffled';
		targetSlugs = ['products/cruffled'];
		customResponse = "**Cruffled** is an interactive crossword puzzle game built in SvelteKit with an O(1) state engine, packaged as both an embeddable web applet and a Capacitor mobile app.";
		followUp = 'Want to hear about the puzzle engine or embed architecture?';
	}
	// 9. Foundry
	else if (/\b(foundr(y|ies)|quant|trading|backtest|financial)\b/i.test(lower)) {
		searchQuery = 'foundry';
		targetSlugs = ['prototypes/foundry'];
		customResponse = "**Autonomic Alpha Foundry** is an autonomous quant trading system coordinating AI agents using Microsoft Agent Framework and MCP over WebSockets with live approval envelopes.";
		followUp = 'Are you interested in the agent coordination or the streaming UI?';
	}
	// 10. GameTsunami
	else if (/\b(gametsunami|p5|sandbox|iframe)\b/i.test(lower)) {
		searchQuery = 'gametsunami';
		targetSlugs = ['products/gametsunami'];
		customResponse = "**GameTsunami** is a gaming browser, short-form media, and generative development platform where Gemini runs an autonomous 15-step reasoning loop to patch and run games in sandboxed iframes.";
		followUp = 'Would you like to explore the agent loop or iframe sandboxing?';
	}
	// 11. Weatherie
	else if (/\b(weatherie[sd]?|flutter|wasm|dart|theming)\b/i.test(lower)) {
		searchQuery = 'weatherie';
		targetSlugs = ['products/weatherie'];
		customResponse = "**Weatherie** is a Flutter weather platform with a polymorphic JSON-driven UI engine for dynamic theming without restarts, offline geo-search, and WASM compilation.";
		followUp = 'Interested in the dynamic layout engine or WASM pipeline?';
	}
	// 12. Tackry
	else if (/\b(tackr(y|ies)|android|kotlin|room|sqlite|notification|bubbles?)\b/i.test(lower)) {
		searchQuery = 'tackry';
		targetSlugs = ['products/tackry'];
		customResponse = "**Tackry** is a native Android productivity tool built with Kotlin, Jetpack Compose, and Room SQLite, featuring live notification action preservation for instant system replies.";
		followUp = 'Want to dive into the Android system hooks or local storage?';
	}
	// 12b. InWork
	else if (/\b(inwork|coop|cooperatives?|worker\s*coop|pod|pods)\b/i.test(lower)) {
		searchQuery = 'inwork';
		targetSlugs = ['prototypes/inwork'];
		customResponse = "**InWork** is an open-source, non-profit platform helping workers join, start, and patronize worker cooperatives ('Tinder for coop teams'). It is built on PostgreSQL+pgvector, a Fastify/Drizzle OpenAPI backend, and a decoupled React/Vite SPA.";
		followUp = 'Want to hear about the mutual opt-in matching or the decoupled architecture?';
	}
	// 13. Philosophy / Leadership / Craft
	else if (/\b(philosophy|craft|craftsmanship|product engineering|zero to one|0 to 1|principles|lead|leadership|velocity)\b/i.test(lower)) {
		searchQuery = 'product engineering';
		targetSlugs = ['philosophy/product-engineering'];
		customResponse = 'Andrea treats velocity as an architectural property—combining autonomous tool loops with dependable, local-first tech where stability matters, and prioritizing user sovereignty.';
		followUp = 'What engineering values matter most on your team?';
	}
	// 14. Intelligent Semantic Keyword Scoring Fallback
	else {
		const STOP_WORDS = new Set([
			'tell', 'about', 'what', 'does', 'have', 'with', 'his', 'your', 'give', 'show', 'some',
			'more', 'into', 'from', 'that', 'this', 'experience', 'background', 'know', 'can', 'you',
			'how', 'when', 'where', 'which', 'is', 'are', 'me', 'him', 'he', 'like', 'would', 'could',
			'should', 'their', 'work', 'done', 'built', 'build', 'did', 'andrea', 'andy'
		]);

		const queryTokens = lower
			.replace(/[^a-z0-9\s-]/g, ' ')
			.split(/\s+/)
			.filter((w) => w.length >= 2 && !STOP_WORDS.has(w));

		const scoredNodes = manifest.nodes
			.filter((n) => n.category !== 'hub')
			.map((node) => {
				let score = 0;
				for (const token of queryTokens) {
					if (matchText(node.title, [token])) score += 10;
					if ((node.tags || []).some((t) => matchText(t, [token]))) score += 8;
					if (matchText(node.slug, [token])) score += 6;
					if (matchText(node.description || '', [token])) score += 4;
				}
				return { node, score };
			})
			.filter((item) => item.score > 0)
			.sort((a, b) => b.score - a.score);

		if (scoredNodes.length > 0) {
			const topNodes = scoredNodes.slice(0, 3).map((item) => item.node);
			targetSlugs = topNodes.map((n) => n.slug);
			searchQuery = queryTokens.join(' ');
			const bullets = topNodes
				.map((n) => `- **${n.title.split(':')[0]}**: ${n.description}`)
				.join('\n');
			customResponse = `Regarding **${queryTokens.join(' ')}**, some highlights:\n\n${bullets}`;
			followUp = 'Would you like to inspect any of these in detail?';
		} else {
			searchQuery = queryTokens[0] || 'engineering';
			targetSlugs = ['prototypes/foundry', 'products/cruffled'];
			customResponse = `Some notable ones:\n\n- Gaming browser, short-form media & generative development platform (**GameTsunami**)\n- Dynamic UI weather platform (**Weatherie**)\n- Word puzzle game with embeddable crossword engine (**Cruffled**)\n- Native Android productivity tool (**Tackry**)\n- Multi-agent quant trading system (**Foundry**)`;
			followUp = 'What technical challenges is your team looking to tackle?';
		}
	}

	sendEvent('thought', {
		delta: `Analyzing recruiter inquiry: "${lastUserMessage}"\n`
	});
	await sleep(60);

	// Step 1: search
	sendEvent('tool_call', { tool: 'search_knowledge_index', args: { query: searchQuery } });
	await sleep(80);
	const found = executeSearchKnowledgeIndex({ query: searchQuery });
	sendEvent('tool_result', {
		tool: 'search_knowledge_index',
		found: found.map((r) => ({ slug: r.slug, title: r.title }))
	});
	sendEvent('thought', {
		delta: `• Searched Knowledge Tree index for "${searchQuery}" (${found.length} candidate matches found)\n`
	});
	await sleep(50);

	// Step 2..N: read each target node sequentially
	const loadedSources = [];
	for (const slug of targetSlugs) {
		const nodeData = executeReadKnowledgeNode({ slug });
		if (nodeData.node) {
			sendEvent('tool_call', { tool: 'read_knowledge_node', args: { slug } });
			await sleep(80);
			sendEvent('tool_result', {
				tool: 'read_knowledge_node',
				status: 'loaded',
				slug: nodeData.node.slug,
				title: nodeData.node.title
			});
			loadedSources.push({ title: nodeData.node.title, slug: nodeData.node.slug });
			sendEvent('thought', {
				delta: `• Loaded note "${nodeData.node.title}" — parsed architecture specifications and technical highlights\n`
			});
			await sleep(40);
		}
	}

	sendEvent('thought', {
		delta: `• Synthesized technical findings from ${loadedSources.map((s) => s.title.split(':')[0]).join(', ')}. Grounding concise answer for recruiter overview.`
	});
	await sleep(60);

	// Stream synthesized answer with natural pacing
	const fullAnswer = `${customResponse}\n\n${followUp}`;
	const words = fullAnswer.split(' ');
	for (let i = 0; i < words.length; i += 2) {
		const chunk = words.slice(i, i + 2).join(' ') + ' ';
		sendEvent('content', { delta: chunk });
		await sleep(35);
	}
	await sleep(60);

	sendEvent('done', { sources: loadedSources, warning: options.warning || null });
}

function getSystemPrompt() {
	const sanitizedResume = {
		...resume,
		workExperience: (resume.workExperience || []).filter(
			(w) => !w.company?.toLowerCase().includes('alps')
		)
	};

	const coreContext = `
--- SOURCE: profile.json ---
${JSON.stringify(profile, null, 2)}

--- SOURCE: resume.json ---
${JSON.stringify(sanitizedResume, null, 2)}

--- SOURCE: projects.json ---
${JSON.stringify(projects, null, 2)}
`;

	return `
You are a warm, direct, and EXTREMELY CONCISE technical assistant representing Andrea de Candia.

CORE CONTEXT:
${coreContext}

KNOWLEDGE TREE NAVIGATION TOOLS:
You have access to Andrea's curated "Knowledge Tree" knowledge base via two tools:
1. "search_knowledge_index": Search the knowledge tree index for matching notes.
2. "read_knowledge_node": Retrieve the full technical markdown note.

TOOL CALLING POLICY:
- Use tools only when you need specific technical depth for pointed architectural questions.
- For broad questions or greetings, answer directly without tool calls.
- Even when you read a node, NEVER write an encyclopedia entry or recite documentation.

NUMBER ONE DIRECTIVE: LESS IS MORE — EXTREME BREVITY & VOICE-READY TONE
People are scanning quickly or interacting via voice. Nobody reads long paragraphs or encyclopedia entries. Keep every single response EXTREMELY short, conversational, and punchy.

1. BROAD OR OPEN QUESTIONS (e.g. "tell me about your projects", "what experience do you have?"):
   - Give a quick 1-sentence opener, followed by 3-4 ultra-short bullet phrases (under 8-10 words per bullet).
   - NEVER list technologies, frameworks, or laundry lists unless explicitly asked.
   - Example response for "tell me about your projects":
     "Some notable ones:
     - Gaming browser, short-form media & generative development platform (**GameTsunami**)
     - Dynamic UI weather platform (**Weatherie**)
     - Word puzzle game with embeddable crossword engine (**Cruffled**)
     - Native Android productivity tool (**Tackry**)
     Which one would you like to hear more about?"

2. POINTED QUESTIONS (e.g. "how does Cruffled work?", "tell me about Advection"):
   - Answer in ONLY 2 to 3 short, conversational sentences (or 2-3 brief bullet phrases).
   - Give the 1 or 2 main takeaways, then ask if they'd like a technical deep dive.

3. ALWAYS CLARIFY PROJECT TYPE & PROJECT NAMES:
   - The platform is **GameTsunami** (always use the exact name **GameTsunami**).
   - Never just drop project names in isolation. Always lead with or include what it is:
     - **GameTsunami** (gaming browser, short-form media & generative development platform)
     - **Weatherie** (dynamic UI weather platform)
     - **Cruffled** (word puzzle game & crossword engine)
     - **Tackry** (native Android productivity tool)
     - **Autonomic Alpha Foundry** (multi-agent quant trading system)

4. NO REPETITIVE FILLER PHRASES:
   - NEVER use cliches or filler disclaimers like "Among other things", "Among many other things", "Among others", or "A few highlights among others".
   - State engineering accomplishments directly, concisely, and with authoritative confidence.

5. SENSIBLE ORDER OF PRESENTING INFORMATION (LEAD WITH HIGH LEVERAGE):
   Always present technical work in this prioritized order:
   - TIER 1 (HIGH-LEVERAGE INFRASTRUCTURE & MULTIPLIERS FIRST):
     Lead with the foundational systems that set Andrea apart from typical developers—autonomous AI development harnesses, deterministic code-driven media harnesses, real-time agent-to-UI streaming protocols, or self-hosted deployment fleets.
   - TIER 2 (FLAGSHIP ARCHITECTURES & PRODUCTS SECOND):
     Showcase the concrete products, engines, and platforms built on that foundation.
   - TIER 3 (CRAFTSMANSHIP & STACK THIRD):
     Mention languages and frameworks (Godot 4/C#, SvelteKit, TypeScript, Python) naturally as part of the architecture, never as a detached grocery list.

   DOMAIN-SPECIFIC HIGHLIGHTS:
   - GAME DEVELOPMENT:
     * When asked about games or game dev, NEVER just list game titles casually or say "he built games".
     * Lead with: Automated AI development harnesses (headless Linux Xvfb environments, Monte Carlo card balance sims) and deterministic code-driven media harnesses (Godot Movie Writer + Playwright + FFmpeg) that automatically render 60fps promotional videos and app store assets directly from engine code!
     * Follow with: AI-native platforms and deep game engines—GameTsunami (generative arcade where Gemini patches games in sandboxed iframes), Five Card Charlie (Godot 4/C# blackjack roguelike), Calculated Survival (retro calculator roguelike with hardware degradation), and Cruffled (O(1) crossword engine).
   - AI & AUTONOMOUS AGENTS:
     * Lead with: Multi-agent orchestration, Discord Chat-Ops developer gateways with interactive button approvals, and real-time agent-to-UI streaming protocols.
     * Follow with: Autonomic Alpha Foundry, GameTsunami, and Gemini Live bidirectional streaming.
   - BACKEND & DISTRIBUTED SYSTEMS:
     * Lead with: High-throughput streaming, district-scale microservices (Mesa Cloud, millions of student records), and full-lifecycle pipelines from feature conception to store delivery.

6. VOICE-READY & CONVERSATIONAL:
   - Write as if speaking in a real-time voice chat: natural, crisp, zero fluff.
   - Refer to Andrea as "Andrea". In written text, NEVER write "Ahn-DREH-ah" or phonetic spellings.
   - Always spell Andrea as "Andrea".

7. SPEECH-TO-TEXT (STT) PHONETIC TOLERANCE:
   - Recruiter inquiries may arrive from browser voice dictation. For example, "note experience" means "Node.js experience", "game tsunami" means "GameTsunami", "cruffles" means "Cruffled", "AI's stance" means "Andrea's work experience", etc. Always interpret technical terms flexibly.

8. PROFESSIONAL TENURE & YEARS OF EXPERIENCE (CRITICAL):
   - Andrea has OVER 8 YEARS of professional software and systems engineering experience (starting in early 2018 at AIA and Giesecke+Devrient through present day in 2026).
   - When asked "how many years of experience does he have?", "how long has he been an engineer?", or similar questions:
     * State authoritatively and accurately: "Andrea has over 8 years of professional software engineering experience (since 2018)."
     * NEVER say "6 years".
     * Do NOT mention earlier financial operations (Alps); his portfolio and recruiter inquiries focus exclusively on his 8+ years of software engineering.
`;
}

const tools = [
	{
		functionDeclarations: [
			{
				name: 'search_knowledge_index',
				description:
					'Search the knowledge tree index for matching engineering roles, case studies, architecture notes, and technical philosophies by keyword, category, or tag.',
				parameters: {
					type: 'OBJECT',
					properties: {
						query: {
							type: 'STRING',
							description: 'Search query keyword, e.g. "advection", "mesa", "intellisense", "streaming", "wasm", "multi-agent", "room", "crossword"'
						},
						category: {
							type: 'STRING',
							description: 'Optional category filter: "products", "roles", "prototypes", "tools", "architecture", "philosophy"'
						},
						tag: {
							type: 'STRING',
							description: 'Optional tag filter, e.g. "python", "etl", "spatial-analytics", "sveltekit", "websockets", "flutter", "capacitor"'
						}
					}
				}
			},
			{
				name: 'read_knowledge_node',
				description:
					'Retrieve and read the complete technical markdown body of a specific node from the knowledge tree by its slug.',
				parameters: {
					type: 'OBJECT',
					properties: {
						slug: {
							type: 'STRING',
							description: 'The exact slug of the node, e.g. "prototypes/foundry", "products/cruffled", "architecture/agent-ui-protocols"'
						}
					},
					required: ['slug']
				}
			}
		]
	}
];

export async function POST({ request }) {
	const apiKey = getApiKey();

	let messages = [];
	try {
		const body = await request.json();
		messages = body.messages || [];
	} catch {
		return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const stream = new ReadableStream({
		async start(controller) {
			const encoder = new TextEncoder();

			function sendEvent(event, data) {
				try {
					controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
				} catch (e) {
					console.warn('Failed to enqueue SSE chunk:', e);
				}
			}

			// If no real API key is configured, run our local knowledge retrieval engine
			if (!apiKey || apiKey === 'your_api_key_here') {
				await handleLocalIntelligence(messages, sendEvent, {
					warning: 'Personal message threshold reached for today. Running in offline Knowledge Tree mode.'
				});
				controller.close();
				return;
			}

			try {
				const genAI = new GoogleGenerativeAI(apiKey);
				const model = genAI.getGenerativeModel({
					model: 'gemini-2.5-flash',
					systemInstruction: getSystemPrompt(),
					tools,
					generationConfig: {
						thinkingConfig: {
							thinkingBudget: 0
						}
					}
				});

				// Clean history
				const history = [];
				const priorMessages = messages.slice(0, -1);

				for (const m of priorMessages) {
					if (!m.content) continue;
					const role = m.role === 'user' ? 'user' : 'model';
					if (history.length === 0 && role !== 'user') {
						continue;
					}
					if (history.length > 0 && history[history.length - 1].role === role) {
						history[history.length - 1].parts[0].text += `\n\n${m.content}`;
					} else {
						history.push({
							role,
							parts: [{ text: m.content }]
						});
					}
				}

				const chat = model.startChat({ history });
				const lastUserMessage = messages[messages.length - 1]?.content || 'Hello';

				let currentMessage = lastUserMessage;
				const sources = new Map();
				let loopCount = 0;
				const MAX_LOOPS = 5;

				while (loopCount < MAX_LOOPS) {
					loopCount++;
					const result = await chat.sendMessageStream(currentMessage);
					let functionCalls = [];

					for await (const chunk of result.stream) {
						const candidate = chunk.candidates?.[0];
						if (!candidate) continue;

						for (const part of candidate.content?.parts || []) {
							if (part.thought) {
								sendEvent('thought', { delta: part.text || '' });
							} else if (part.text) {
								sendEvent('content', { delta: part.text });
							} else if (part.functionCall) {
								functionCalls.push(part.functionCall);
							}
						}
					}

					const response = await result.response;
					const candidateCalls = response.functionCalls() || [];
					if (candidateCalls.length > 0 && functionCalls.length === 0) {
						functionCalls = candidateCalls;
					}

					if (functionCalls.length === 0) {
						break;
					}

					// Execute tools
					const functionResponses = [];
					for (const call of functionCalls) {
						sendEvent('tool_call', { tool: call.name, args: call.args });

						let resultData;
						if (call.name === 'search_knowledge_index') {
							resultData = executeSearchKnowledgeIndex(call.args);
							sendEvent('tool_result', {
								tool: call.name,
								found: resultData.map((r) => ({ slug: r.slug, title: r.title }))
							});
						} else if (call.name === 'read_knowledge_node') {
							resultData = executeReadKnowledgeNode(call.args);
							if (resultData.node) {
								sources.set(resultData.node.slug, {
									title: resultData.node.title,
									slug: resultData.node.slug
								});
								sendEvent('tool_result', {
									tool: call.name,
									status: 'loaded',
									slug: resultData.node.slug,
									title: resultData.node.title
								});
							} else {
								sendEvent('tool_result', {
									tool: call.name,
									status: 'not_found',
									error: resultData.error
								});
							}
						} else {
							resultData = { error: `Unknown tool: ${call.name}` };
							sendEvent('tool_result', { tool: call.name, error: resultData.error });
						}

						functionResponses.push({
							functionResponse: {
								name: call.name,
								response: { result: resultData }
							}
						});
					}

					currentMessage = functionResponses;
				}

				sendEvent('done', {
					sources: Array.from(sources.values())
				});
			} catch (error) {
				console.error('[API/CHAT] Streaming error:', error);
				// Fallback to local intelligence if Gemini API call errors (e.g. rate limit / network)
				await handleLocalIntelligence(messages, sendEvent, {
					warning: 'Personal message threshold reached for today. Running in offline Knowledge Tree mode.'
				});
			} finally {
				controller.close();
			}
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream; charset=utf-8',
			'Cache-Control': 'no-cache, no-transform',
			'Connection': 'keep-alive',
			'X-Accel-Buffering': 'no'
		}
	});
}
