import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export const isSpeaking = writable(false);
export const currentSpeakingId = writable(null);
export const isListening = writable(false);
export const voiceError = writable(null);

// Phonetic corrections dictionary for speech-to-text input
const TECH_SPEECH_REPLACEMENTS = [
	// Andrea / Work experience misheard as "AI's stance" or "AI stance"
	{ pattern: /\b(hear\s+more\s+about\s+)?(um\s+)?(ai('?s)?\s+stance)\b/gi, replacement: "Andrea's work experience" },
	{ pattern: /\b(ai('?s)?\s+stance)\b/gi, replacement: "Andrea's work experience" },
	{ pattern: /\b(and\s+he\s+has|and\s+he\s+is|andreas|andres|andre\s+is|on\s+dray|on\s+tray|undress)\s*(work\s+)?(experience|background|career|history|roles?|projects?)\b/gi, replacement: "Andrea's $2$3" },
	{ pattern: /\b(ai'?s?\s+(work\s+)?(experience|background|career|history))\b/gi, replacement: "Andrea's $2$3" },
	{ pattern: /\b(and\s+he\s+has|and\s+he\s+is|andreas|andres|on\s+dray|on\s+tray)\b/gi, replacement: 'Andrea' },
	{ pattern: /\b(Ahn-DREH-ah|Ahn-dreh-ah|ahn-dreh-ah|Ahn-dre-ah|ahn-dre-ah|an-DRÈ-a|an-dre-a|Ahn-DREH)\b/gi, replacement: 'Andrea' },

	// Node.js misheard as "note", "noted", "knows"
	{ pattern: /\b(note|noted)\s+(experience|backend|js|\.js|developer|engineer(ing)?|server|environment|runtime|stack)\b/gi, replacement: 'Node $2' },
	{ pattern: /\b(note\s*js|nodejs)\b/gi, replacement: 'Node.js' },
	{ pattern: /\bask(ed)?\s+for\s+(note|noted)\b/gi, replacement: 'asked for Node' },
	{ pattern: /\b(note|noted)\s+experience\b/gi, replacement: 'Node experience' },
	{ pattern: /\b(note|noted)\s+and\b(?=.*?\b(python|react|svelte|backend|express)\b)/gi, replacement: 'Node and' },

	// Projects
	{ pattern: /\b(game\s*tsunami|game\s*sumani|gametsunami)\b/gi, replacement: 'GameTsunami' },
	{ pattern: /\b(gamespark|game\s*spark)\b/gi, replacement: 'GameTsunami' }, // Enforce no GameSpark
	{ pattern: /\b(cruffle|cruffles|cruffled|cruelful)\b/gi, replacement: 'Cruffled' },
	{ pattern: /\b(tack\s*ry|tackery|tackley|tac\s*ry)\b/gi, replacement: 'Tackry' },
	{ pattern: /\b(weather\s*ie|weatherie|weather\s*e|weatherly)\b/gi, replacement: 'Weatherie' },
	{ pattern: /\b(autonomic\s*alpha\s*foundry|alpha\s*foundry|foundry)\b/gi, replacement: 'Foundry' },
	{ pattern: /\b(advection|advection\s*software)\b/gi, replacement: 'Advection Software' },
	{ pattern: /\b(mesa\s*cloud)\b/gi, replacement: 'Mesa Cloud' },
	{ pattern: /\b(intelli\s*sense|intellisense\.io)\b/gi, replacement: 'Intellisense.io' },
	{ pattern: /\b(g\s+and\s+d|g&d|giesecke(\s+and|\s*&\s*)devrient)\b/gi, replacement: 'G+D' },

	// Common tech acronyms & terms
	{ pattern: /\btype\s*script\b/gi, replacement: 'TypeScript' },
	{ pattern: /\bjava\s*script\b/gi, replacement: 'JavaScript' },
	{ pattern: /\bsvelte\s*kit\b/gi, replacement: 'SvelteKit' },
	{ pattern: /\bweb\s*sockets?\b/gi, replacement: 'WebSockets' },
	{ pattern: /\bweb\s*assembly\b/gi, replacement: 'WebAssembly' },
	{ pattern: /\bwasm\b/gi, replacement: 'WASM' },
	{ pattern: /\bsse\b/gi, replacement: 'SSE' },
	{ pattern: /\bmcp\b/gi, replacement: 'MCP' },
	{ pattern: /\bpost\s*gres(ql)?\b/gi, replacement: 'PostgreSQL' },
	{ pattern: /\bsql\s*ite\b/gi, replacement: 'SQLite' },
	{ pattern: /\bjet\s*pack\s*compose\b/gi, replacement: 'Jetpack Compose' }
];

export function cleanPhoneticSpelling(text) {
	if (!text) return '';
	return text
		.replace(/\bAhn-DREH-ah\b/gi, 'Andrea')
		.replace(/\bahn-dreh-ah\b/gi, 'Andrea')
		.replace(/\bAhn-dre-ah\b/gi, 'Andrea')
		.replace(/\bahn-dre-ah\b/gi, 'Andrea')
		.replace(/\ban-DRÈ-a\b/gi, 'Andrea')
		.replace(/\ban-dre-a\b/gi, 'Andrea')
		.replace(/\bAhn-DREH\b/gi, 'Andrea');
}

export function normalizeTechSpeech(raw) {
	if (!raw) return '';
	let result = cleanPhoneticSpelling(raw);
	for (const { pattern, replacement } of TECH_SPEECH_REPLACEMENTS) {
		result = result.replace(pattern, replacement);
	}
	return result;
}

export function cleanTextForSpeech(raw) {
	if (!raw) return '';
	return cleanPhoneticSpelling(raw)
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
 * Pipelined sentence chunker for streaming TTS
 * Buffers text tokens and emits complete sentences/list items as soon as ready.
 */
export class SentenceChunker {
	constructor(onChunk, minLength = 8) {
		this.onChunk = onChunk;
		this.minLength = minLength;
		this.buffer = '';
	}

	push(delta) {
		if (!delta) return;
		this.buffer += delta;

		// Match boundaries:
		// 1. Colon followed by newline or space, e.g. "Some notable ones:\n"
		// 2. Sentence terminal punctuation (.!?) followed by whitespace or newline
		// 3. Newlines preceding bullet points: e.g. "\n- " or "\n* "
		// 4. Double newlines
		const regex = /(:\s*\n+)|([.!?]+(?:\s+|\n+))|(\n\s*[-*•]\s+)|(\n{2,})/g;
		let match;

		while ((match = regex.exec(this.buffer)) !== null) {
			const splitIdx = match.index + match[0].length;
			const potentialChunk = this.buffer.slice(0, splitIdx).trim();

			if (potentialChunk.length >= this.minLength) {
				const cleaned = cleanTextForSpeech(potentialChunk);
				if (cleaned && cleaned.length >= 2) {
					this.onChunk(cleaned);
				}
				this.buffer = this.buffer.slice(splitIdx);
				regex.lastIndex = 0;
			}
		}

		// Prevent buffer from growing excessively long if no punctuation occurs
		if (this.buffer.length > 100) {
			const splitMatch = this.buffer.match(/[,;]\s+/);
			if (splitMatch && splitMatch.index >= 20) {
				const splitIdx = splitMatch.index + splitMatch[0].length;
				const chunk = cleanTextForSpeech(this.buffer.slice(0, splitIdx).trim());
				this.buffer = this.buffer.slice(splitIdx);
				if (chunk && chunk.length >= 2) {
					this.onChunk(chunk);
				}
			}
		}
	}

	flush() {
		const remaining = cleanTextForSpeech(this.buffer.trim());
		this.buffer = '';
		if (remaining && remaining.length >= 2) {
			this.onChunk(remaining);
		}
	}
}

/**
 * AudioStreamQueue plays the reply sentence by sentence. Each sentence's speech is
 * fetched from /api/tts as soon as it's queued (so the next is ready before the
 * current one ends) and arrives as streamed 16-bit PCM, which is scheduled through
 * Web Audio chunk by chunk as it lands: the first words play about half a second
 * after the request.
 */
const TTS_SAMPLE_RATE = 24000;

// Collects one sentence's streamed audio, telling a waiting player about each chunk.
function streamSpeech(text, voice, signal) {
	const speech = { chunks: [], done: false, failed: false, wake: null };
	const notify = () => {
		const wake = speech.wake;
		speech.wake = null;
		wake?.();
	};
	(async () => {
		try {
			const res = await fetch('/api/tts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text, voice }),
				signal
			});
			if (!res.ok || !res.body) throw new Error(`TTS HTTP ${res.status}`);
			const reader = res.body.getReader();
			let carry = null; // a byte left over when a network chunk splits a sample
			for (;;) {
				const { done, value } = await reader.read();
				if (done) break;
				let bytes = value;
				if (carry) {
					bytes = new Uint8Array(value.length + 1);
					bytes[0] = carry[0];
					bytes.set(value, 1);
					carry = null;
				}
				if (bytes.length % 2) {
					carry = bytes.slice(-1);
					bytes = bytes.subarray(0, bytes.length - 1);
				}
				if (!bytes.length) continue;
				const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.length);
				const samples = new Float32Array(bytes.length / 2);
				for (let i = 0; i < samples.length; i++) samples[i] = view.getInt16(i * 2, true) / 32768;
				speech.chunks.push(samples);
				notify();
			}
		} catch (err) {
			if (err?.name !== 'AbortError') console.warn('[AudioStreamQueue] TTS stream failed:', err);
			if (!speech.chunks.length) speech.failed = true;
		}
		speech.done = true;
		notify();
	})();
	return speech;
}

export class AudioStreamQueue {
	constructor() {
		this.queue = [];
		this.isPlaying = false;
		this.abortController = null;
		this.generationId = 0;
		this.context = null;
		this.sources = new Set();
	}

	/** Creates or resumes the audio output; call it from a tap so phones allow sound. */
	unlock() {
		if (typeof window === 'undefined') return null;
		const Context = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
		if (!Context) return null;
		if (!this.context || this.context.state === 'closed') this.context = new Context();
		if (this.context.state === 'suspended') this.context.resume().catch(() => {});
		return this.context;
	}

	reset() {
		this.generationId++;
		if (this.abortController) {
			try {
				this.abortController.abort();
			} catch {}
			this.abortController = null;
		}
		for (const source of this.sources) {
			try {
				source.stop();
			} catch {}
		}
		this.sources.clear();
		try {
			if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
				window.speechSynthesis.cancel();
			}
		} catch {}
		this.queue = [];
		this.isPlaying = false;
		isSpeaking.set(false);
		currentSpeakingId.set(null);
	}

	enqueue(text, voice = 'Aoede') {
		const clean = cleanTextForSpeech(text);
		if (!clean || clean.length < 2) return;

		const curGen = this.generationId;

		// If Instant Voice is selected, bypass Cloud TTS and play with 0ms delay
		if (voice === 'Instant' || voice === 'Browser') {
			this.queue.push({ text: clean, voice, speech: null, gen: curGen });
		} else {
			if (!this.abortController) this.abortController = new AbortController();
			this.queue.push({
				text: clean,
				voice,
				speech: streamSpeech(clean, voice, this.abortController.signal),
				gen: curGen
			});
		}

		if (!this.isPlaying) {
			this._playNext();
		}
	}

	async _playNext() {
		if (this.queue.length === 0) {
			this.isPlaying = false;
			isSpeaking.set(false);
			currentSpeakingId.set(null);
			return;
		}

		this.isPlaying = true;
		isSpeaking.set(true);
		const item = this.queue.shift();

		if (item.gen !== this.generationId) {
			return this._playNext();
		}

		const context = item.speech ? this.unlock() : null;
		if (item.speech && context) {
			await this._playStream(item, context);
		}
		if (item.gen !== this.generationId) return;
		if (!item.speech || !context || item.speech.failed) {
			// Fallback to browser speech synthesis for this chunk
			await this._playBrowserChunk(item.text, item);
		}

		if (item.gen === this.generationId) {
			this._playNext();
		}
	}

	// Schedules each chunk right after the one before as it arrives, then waits for the
	// last of them to finish.
	async _playStream(item, context) {
		const { speech } = item;
		let next = 0;
		let at = 0;
		let last = null;
		while (item.gen === this.generationId) {
			while (next < speech.chunks.length) {
				const samples = speech.chunks[next++];
				const buffer = context.createBuffer(1, samples.length, TTS_SAMPLE_RATE);
				buffer.copyToChannel(samples, 0);
				const source = context.createBufferSource();
				source.buffer = buffer;
				source.connect(context.destination);
				// A short lead on the first chunk (or after a stall) so it never clips.
				at = Math.max(at, context.currentTime + 0.04);
				source.start(at);
				at += buffer.duration;
				this.sources.add(source);
				source.onended = () => this.sources.delete(source);
				last = source;
			}
			if (speech.done) break;
			await new Promise((resolve) => (speech.wake = resolve));
		}
		if (!last || item.gen !== this.generationId) return;
		const remaining = at - context.currentTime;
		if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining * 1000));
	}

	_playBrowserChunk(text, item) {
		return new Promise((resolve) => {
			if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
				return resolve();
			}
			try {
				const utterance = new SpeechSynthesisUtterance(text);
				utterance.rate = 1.05;
				const voices = window.speechSynthesis.getVoices?.() || [];
				const preferredVoice = voices.find(
					(v) =>
						v.lang?.startsWith('en') &&
						(v.name?.includes('Natural') ||
							v.name?.includes('Google') ||
							v.name?.includes('Samantha') ||
							v.name?.includes('Daniel'))
				);
				if (preferredVoice) utterance.voice = preferredVoice;

				utterance.onend = () => resolve();
				utterance.onerror = () => resolve();
				window.speechSynthesis.speak(utterance);
			} catch {
				resolve();
			}
		});
	}
}

export const audioStreamQueue = new AudioStreamQueue();

export function stopVoice() {
	if (!browser) return;
	audioStreamQueue.reset();
}

/**
 * Plays voice using sentence-pipelined audio stream
 * @param {string} text 
 * @param {string|number|null} messageId 
 * @param {string} [voice] 
 */
export function playVoice(text, messageId = null, voice = 'Aoede') {
	if (!browser || !text) return;

	stopVoice();
	audioStreamQueue.unlock();

	currentSpeakingId.set(messageId);
	isSpeaking.set(true);

	const chunker = new SentenceChunker((chunk) => {
		audioStreamQueue.enqueue(chunk, voice);
	});

	chunker.push(text);
	chunker.flush();
}

/**
 * Speech-To-Text helper using Web Speech API with tech terms normalization
 */
export function createSpeechRecognizer({ onInterim, onFinal, onError, onEnd }) {
	if (!browser || typeof window === 'undefined') return null;

	const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
	if (!SpeechRecognition) return null;

	try {
		const recognizer = new SpeechRecognition();
		recognizer.continuous = false;
		recognizer.interimResults = true;
		recognizer.lang = 'en-US';

		recognizer.onstart = () => {
			isListening.set(true);
			voiceError.set(null);
		};

		recognizer.onresult = (event) => {
			let interim = '';
			let final = '';

			for (let i = event.resultIndex; i < event.results.length; ++i) {
				const transcript = event.results[i][0].transcript;
				if (event.results[i].isFinal) {
					final += transcript;
				} else {
					interim += transcript;
				}
			}

			if (final && onFinal) {
				onFinal(normalizeTechSpeech(final));
			} else if (interim && onInterim) {
				onInterim(normalizeTechSpeech(interim));
			}
		};

		recognizer.onerror = (event) => {
			console.warn('Speech recognition error:', event.error);
			isListening.set(false);
			if (event.error === 'not-allowed') {
				voiceError.set('Microphone access denied. Please allow microphone access in your browser settings.');
			} else if (event.error === 'network') {
				voiceError.set('Voice recognition network error.');
			}
			if (onError) onError(event);
		};

		recognizer.onend = () => {
			isListening.set(false);
			if (onEnd) onEnd();
		};

		return recognizer;
	} catch (e) {
		console.warn('Could not initialize SpeechRecognition:', e);
		return null;
	}
}
