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
 * AudioStreamQueue manages pipelined playback of sentence audio chunks.
 * Eagerly pre-fetches /api/tts in parallel so subsequent sentences are ready
 * before current sentence finishes playing, reducing latency to ~1s.
 */
export class AudioStreamQueue {
	constructor() {
		this.queue = [];
		this.isPlaying = false;
		this.currentAudio = null;
		this.currentAudioUrl = null;
		this.abortController = null;
		this.generationId = 0;
	}

	reset() {
		this.generationId++;
		if (this.abortController) {
			try {
				this.abortController.abort();
			} catch {}
			this.abortController = null;
		}

		if (this.currentAudio) {
			try {
				this.currentAudio.pause();
				this.currentAudio.currentTime = 0;
			} catch {}
			this.currentAudio = null;
		}

		if (this.currentAudioUrl) {
			try {
				URL.revokeObjectURL(this.currentAudioUrl);
			} catch {}
			this.currentAudioUrl = null;
		}

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
			this.queue.push({
				text: clean,
				voice,
				fetchPromise: Promise.resolve(null),
				gen: curGen
			});

			if (!this.isPlaying) {
				this._playNext();
			}
			return;
		}

		if (!this.abortController) {
			this.abortController = new AbortController();
		}
		const signal = this.abortController.signal;

		// Eagerly prefetch the TTS audio blob in parallel immediately
		const fetchPromise = fetch('/api/tts', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ text: clean, voice }),
			signal
		}).then(async (res) => {
			if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);
			return await res.blob();
		}).catch((err) => {
			if (err.name === 'AbortError') return null;
			console.warn('[AudioStreamQueue] TTS fetch failed, will use fallback:', err);
			return null;
		});

		this.queue.push({
			text: clean,
			voice,
			fetchPromise,
			gen: curGen
		});

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

		let blob = null;
		try {
			blob = await item.fetchPromise;
		} catch {
			blob = null;
		}

		if (item.gen !== this.generationId) return;

		if (blob) {
			await this._playAudioBlob(blob, item);
		} else {
			// Fallback to browser speech synthesis for this chunk
			await this._playBrowserChunk(item.text, item);
		}

		if (item.gen === this.generationId) {
			this._playNext();
		}
	}

	_playAudioBlob(blob, item) {
		return new Promise((resolve) => {
			const audioUrl = URL.createObjectURL(blob);
			this.currentAudioUrl = audioUrl;
			const audio = new Audio(audioUrl);
			this.currentAudio = audio;

			let resolved = false;
			const finish = () => {
				if (resolved) return;
				resolved = true;
				try {
					URL.revokeObjectURL(audioUrl);
				} catch {}
				if (this.currentAudio === audio) {
					this.currentAudio = null;
					this.currentAudioUrl = null;
				}
				resolve();
			};

			audio.onended = finish;
			audio.onerror = (e) => {
				console.warn('[AudioStreamQueue] Audio element playback error, trying fallback:', e);
				finish();
			};

			audio.play().catch((err) => {
				console.warn('[AudioStreamQueue] audio.play() rejected:', err);
				finish();
			});
		});
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
