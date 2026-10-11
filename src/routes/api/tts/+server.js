import { env } from '$env/dynamic/private';

function getApiKey() {
	return env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
}

function cleanTextForSpeech(raw) {
	if (!raw) return '';
	return raw
		// Remove markdown links [title](url) -> title
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
		// Remove markdown formatting: **, *, _, `, #, ~
		.replace(/[*_#`~]/g, '')
		// Remove bullet points
		.replace(/^[\s]*[-*•]\s+/gm, '')
		// Remove action tokens like [ACTION:SHOW_CONTACT_FORM]
		.replace(/\[ACTION:[^\]]+\]/g, '')
		// Convert consecutive newlines to pauses
		.replace(/\n+/g, '. ')
		// Remove emojis / special symbols
		.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
		// Clean up extra spaces
		.replace(/\s+/g, ' ')
		.trim();
}

// Streamed, so the first words play about half a second after the request instead of
// after the whole sentence is synthesised. The response is raw 16-bit mono PCM.
const TTS_MODEL = 'gemini-3.1-flash-tts-preview';
const SAMPLE_RATE = 24000;
const PCM_TYPE = `audio/L16; rate=${SAMPLE_RATE}; channels=1`;

// In-memory LRU-style cache of finished PCM (max 50 entries)
const audioCache = new Map();
const MAX_CACHE_SIZE = 50;

function remember(key, pcm) {
	if (audioCache.size >= MAX_CACHE_SIZE) audioCache.delete(audioCache.keys().next().value);
	audioCache.set(key, pcm);
}

export async function POST({ request }) {
	const apiKey = getApiKey();
	if (!apiKey) {
		return new Response(JSON.stringify({ error: 'API key not configured' }), {
			status: 503,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	let body;
	try {
		body = await request.json();
	} catch {
		return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const rawText = body.text || '';
	const voice = 'Aoede'; // Hardcoded strictly to Aoede per user mandate
	const cleanText = cleanTextForSpeech(rawText);

	if (!cleanText || cleanText.length < 2) {
		return new Response(JSON.stringify({ error: 'Text too short' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const cacheKey = `${voice}:${cleanText.slice(0, 300)}`;
	if (audioCache.has(cacheKey)) {
		return new Response(audioCache.get(cacheKey), {
			headers: { 'Content-Type': PCM_TYPE, 'Cache-Control': 'no-store' }
		});
	}

	try {
		const res = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:streamGenerateContent?alt=sse`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
				body: JSON.stringify({
					contents: [
						{
							parts: [
								{
									// The pace matches the live voice; without it the model reads slowly.
									text: `Say this in a warm, upbeat, brisk conversational pace, like a friendly expert talking. Pronounce the Italian name Andrea as Ahn-dre-ah: ${cleanText}`
								}
							]
						}
					],
					generationConfig: {
						responseModalities: ['AUDIO'],
						speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } }
					}
				})
			}
		);

		if (!res.ok || !res.body) {
			const errText = await res.text();
			console.error('[API/TTS] Gemini TTS error response:', res.status, errText);
			return new Response(JSON.stringify({ error: 'TTS generation failed', details: errText }), {
				status: res.status || 502,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const upstream = res.body.getReader();
		const decoder = new TextDecoder();
		const parts = [];
		const stream = new ReadableStream({
			async pull(controller) {
				let buffer = '';
				try {
					for (;;) {
						const { done, value } = await upstream.read();
						if (done) break;
						buffer += decoder.decode(value, { stream: true });
						let end;
						while ((end = buffer.search(/\r?\n\r?\n/)) >= 0) {
							const event = buffer.slice(0, end);
							buffer = buffer.slice(end).replace(/^\r?\n\r?\n/, '');
							const line = event.match(/^data: (.*)$/m);
							if (!line) continue;
							const data = JSON.parse(line[1]);
							for (const part of data.candidates?.[0]?.content?.parts || []) {
								if (!part.inlineData?.data) continue;
								const pcm = Buffer.from(part.inlineData.data, 'base64');
								parts.push(pcm);
								controller.enqueue(new Uint8Array(pcm));
							}
						}
					}
					if (parts.length) remember(cacheKey, Buffer.concat(parts));
					controller.close();
				} catch (err) {
					console.error('[API/TTS] Stream error:', err);
					controller.error(err);
				}
			},
			cancel() {
				upstream.cancel().catch(() => {});
			}
		});

		return new Response(stream, {
			headers: { 'Content-Type': PCM_TYPE, 'Cache-Control': 'no-store' }
		});
	} catch (err) {
		console.error('[API/TTS] Unexpected error:', err);
		return new Response(JSON.stringify({ error: 'Internal TTS error', message: err?.message }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}
