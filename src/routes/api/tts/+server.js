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

/**
 * Packs 16-bit linear PCM into a standard RIFF/WAV buffer
 * @param {Buffer} pcmBuffer
 * @param {number} sampleRate
 * @param {number} numChannels
 * @param {number} bitsPerSample
 */
function pcmToWav(pcmBuffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
	const dataSize = pcmBuffer.length;
	const header = Buffer.alloc(44);
	const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
	const blockAlign = (numChannels * bitsPerSample) / 8;

	// RIFF chunk descriptor
	header.write('RIFF', 0);
	header.writeUInt32LE(36 + dataSize, 4);
	header.write('WAVE', 8);

	// "fmt " sub-chunk
	header.write('fmt ', 12);
	header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
	header.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
	header.writeUInt16LE(numChannels, 22);
	header.writeUInt32LE(sampleRate, 24);
	header.writeUInt32LE(byteRate, 28);
	header.writeUInt16LE(blockAlign, 32);
	header.writeUInt16LE(bitsPerSample, 34);

	// "data" sub-chunk
	header.write('data', 36);
	header.writeUInt32LE(dataSize, 40);

	return Buffer.concat([header, pcmBuffer]);
}

// In-memory LRU-style cache for audio responses (max 50 entries)
const audioCache = new Map();
const MAX_CACHE_SIZE = 50;

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
		const cached = audioCache.get(cacheKey);
		return new Response(cached, {
			headers: {
				'Content-Type': 'audio/wav',
				'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800'
			}
		});
	}

	try {
		const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
		const payload = {
			contents: [
				{
					parts: [
						{
							text: `Read aloud the following text clearly and naturally. Pronounce the Italian name Andrea as Ahn-dre-ah: ${cleanText}`
						}
					]
				}
			],
			generationConfig: {
				responseModalities: ['AUDIO'],
				speechConfig: {
					voiceConfig: {
						prebuiltVoiceConfig: {
							voiceName: voice
						}
					}
				}
			}
		};

		const res = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		if (!res.ok) {
			const errText = await res.text();
			console.error('[API/TTS] Gemini TTS error response:', res.status, errText);
			return new Response(JSON.stringify({ error: 'TTS generation failed', details: errText }), {
				status: res.status,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const data = await res.json();
		const candidate = data.candidates?.[0];
		const part = candidate?.content?.parts?.find((p) => p.inlineData?.data);

		if (!part || !part.inlineData?.data) {
			console.error('[API/TTS] No inline audio data in candidate:', JSON.stringify(data));
			return new Response(JSON.stringify({ error: 'No audio data returned by model' }), {
				status: 502,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const rawPcmBuffer = Buffer.from(part.inlineData.data, 'base64');
		const wavBuffer = pcmToWav(rawPcmBuffer, 24000, 1, 16);

		// Cache
		if (audioCache.size >= MAX_CACHE_SIZE) {
			const firstKey = audioCache.keys().next().value;
			audioCache.delete(firstKey);
		}
		audioCache.set(cacheKey, wavBuffer);

		return new Response(wavBuffer, {
			headers: {
				'Content-Type': 'audio/wav',
				'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800'
			}
		});
	} catch (err) {
		console.error('[API/TTS] Unexpected error:', err);
		return new Response(JSON.stringify({ error: 'Internal TTS error', message: err?.message }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}
