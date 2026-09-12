/**
 * Gemini Live API Client for Bidirectional Streaming Voice
 * Direct browser WebSocket connection using short-lived ephemeral tokens.
 */
import { cleanPhoneticSpelling } from './voice.js';

function arrayBufferToBase64(buffer) {
	let binary = '';
	const bytes = new Uint8Array(buffer);
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

function base64ToFloat32Array(base64) {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	const int16 = new Int16Array(bytes.buffer);
	const float32 = new Float32Array(int16.length);
	for (let i = 0; i < int16.length; i++) {
		float32[i] = int16[i] / 32768.0;
	}
	return float32;
}

function downsampleAndConvertToPCM16(float32Array, inputSampleRate, outputSampleRate = 16000) {
	if (inputSampleRate === outputSampleRate) {
		const pcm16 = new Int16Array(float32Array.length);
		for (let i = 0; i < float32Array.length; i++) {
			const s = Math.max(-1, Math.min(1, float32Array[i]));
			pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
		}
		return pcm16.buffer;
	}

	const ratio = inputSampleRate / outputSampleRate;
	const newLength = Math.round(float32Array.length / ratio);
	const pcm16 = new Int16Array(newLength);

	for (let i = 0; i < newLength; i++) {
		const sampleIndex = Math.floor(i * ratio);
		const s = Math.max(-1, Math.min(1, float32Array[sampleIndex]));
		pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
	}
	return pcm16.buffer;
}

export class GeminiLiveSession {
	constructor(options = {}) {
		this.voiceName = options.voiceName || 'Aoede';
		this.onStatusChange = options.onStatusChange || (() => {});
		this.onSpeakingStateChange = options.onSpeakingStateChange || (() => {});
		this.onInputTranscription = options.onInputTranscription || (() => {});
		this.onOutputTranscription = options.onOutputTranscription || (() => {});
		this.onTurnComplete = options.onTurnComplete || (() => {});
		this.onInterrupted = options.onInterrupted || (() => {});
		this.onMicVolume = options.onMicVolume || (() => {});
		this.onSpeakerVolume = options.onSpeakerVolume || (() => {});
		this.onError = options.onError || (() => {});

		this.ws = null;
		this.mediaStream = null;
		this.inputAudioContext = null;
		this.outputAudioContext = null;
		this.scriptProcessor = null;
		this.inputSource = null;

		this.isMuted = false;
		this.isConnected = false;
		this.nextPlayTime = 0;
		this.activeSources = new Set();
		this.isModelSpeaking = false;
		this.isServerTurnComplete = false;
		this.turnCompletionTimer = null;
		this.turnTimeoutTimer = null;
		this.isDestroyed = false;
	}

	async connect() {
		this.isDestroyed = false;
		this.onStatusChange('connecting');

		try {
			// 1. Fetch ephemeral token and pre-seeded system instruction
			const res = await fetch('/api/live-token', { method: 'POST' });
			if (!res.ok) {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.error || `Server responded with ${res.status}`);
			}
			const { token, model, systemInstruction, defaultVoice } = await res.json();
			if (!token) throw new Error('No ephemeral token received from server');

			const selectedVoice = this.voiceName || defaultVoice || 'Aoede';

			// 2. Open WebSocket
			const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=${token}`;
			this.ws = new WebSocket(wsUrl);

			await new Promise((resolve, reject) => {
				const timeout = setTimeout(() => {
					reject(new Error('Live API WebSocket connection timeout'));
				}, 10000);

				this.ws.onopen = () => {
					clearTimeout(timeout);
					// Send setup
					this.ws.send(JSON.stringify({
						setup: {
							model: model || 'models/gemini-3.1-flash-live-preview',
							generationConfig: {
								responseModalities: ['AUDIO'],
								speechConfig: {
									voiceConfig: {
										prebuiltVoiceConfig: {
											voiceName: selectedVoice
										}
									}
								},
								thinkingConfig: {
									thinkingLevel: 'minimal'
								}
							},
							systemInstruction: {
								parts: [{ text: systemInstruction }]
							},
							inputAudioTranscription: {},
							outputAudioTranscription: {}
						}
					}));
				};

				this.ws.onerror = (err) => {
					clearTimeout(timeout);
					reject(err);
				};

				this.ws.onmessage = async (evt) => {
					try {
						const text = typeof evt.data === 'string' ? evt.data : await evt.data.text();
						const msg = JSON.parse(text);

						if (msg.setupComplete) {
							this.isConnected = true;
							this.onStatusChange('connected');
							resolve();
						} else {
							this.handleServerMessage(msg);
						}
					} catch (err) {
						console.error('[GeminiLive] Parse error:', err);
					}
				};

				this.ws.onclose = (evt) => {
					console.log('[GeminiLive] Closed:', evt.code, evt.reason);
					this.isConnected = false;
					if (!this.isDestroyed) {
						this.onStatusChange('closed');
					}
				};
			});

			// 3. Initialize Audio
			await this.startAudioIO();
		} catch (err) {
			console.error('[GeminiLive] Connection failed:', err);
			this.onStatusChange('error');
			this.onError(err);
			this.disconnect();
			throw err;
		}
	}

	async startAudioIO() {
		// Output AudioContext (24kHz) with explicit 'playback' hint so mobile OS routes to Media stream
		const AudioCtx = window.AudioContext || window.webkitAudioContext;
		this.outputAudioContext = new AudioCtx({ sampleRate: 24000, latencyHint: 'playback' });
		if (this.outputAudioContext.state === 'suspended') {
			await this.outputAudioContext.resume();
		}
		this.nextPlayTime = this.outputAudioContext.currentTime;

		// Input Microphone:
		// Explicitly disable telecom communication constraints (echoCancellation, noiseSuppression, autoGainControl).
		// By setting these to false, mobile browsers (Android Chrome, iOS Safari) use standard Media Audio (AudioSource.MIC)
		// rather than entering "MODE_IN_COMMUNICATION" / "AVAudioSessionModeVoiceChat".
		// This keeps the phone's physical volume rocker controlling "Media Volume" (STREAM_MUSIC) instead of "Call Volume".
		this.mediaStream = await navigator.mediaDevices.getUserMedia({
			audio: {
				channelCount: 1,
				echoCancellation: false,
				noiseSuppression: false,
				autoGainControl: false
			}
		});

		// Inform mobile OS media subsystem that an active media session is running
		if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
			try {
				navigator.mediaSession.playbackState = 'playing';
				navigator.mediaSession.metadata = new MediaMetadata({
					title: 'Andrea de Candia — Voice Mode',
					artist: 'Knowledge Tree',
					album: 'Interactive Portfolio'
				});
			} catch {}
		}

		this.inputAudioContext = new AudioCtx();
		if (this.inputAudioContext.state === 'suspended') {
			await this.inputAudioContext.resume();
		}

		this.inputSource = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
		// Use ScriptProcessorNode for wide browser compatibility
		// Use ScriptProcessorNode for wide browser compatibility
		const bufferSize = 4096;
		this.scriptProcessor = this.inputAudioContext.createScriptProcessor(bufferSize, 1, 1);

		this.scriptProcessor.onaudioprocess = (e) => {
			if (this.isMuted || !this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
				return;
			}

			// ACOUSTIC ECHO SHIELD:
			// While assistant is speaking or audio is scheduled to play through the speaker,
			// gate the microphone to prevent speaker audio from looping back into Gemini Live.
			if (this.isSpeakerActive()) {
				return;
			}

			const inputFloat32 = e.inputBuffer.getChannelData(0);

			// Calculate volume for UI visualizer
			let sum = 0;
			for (let i = 0; i < inputFloat32.length; i++) {
				sum += inputFloat32[i] * inputFloat32[i];
			}
			const rms = Math.sqrt(sum / inputFloat32.length);
			this.onMicVolume(Math.min(1, rms * 4));

			// Convert to 16kHz 16-bit PCM
			const pcmBuffer = downsampleAndConvertToPCM16(
				inputFloat32,
				this.inputAudioContext.sampleRate,
				16000
			);

			const base64Audio = arrayBufferToBase64(pcmBuffer);
			this.ws.send(JSON.stringify({
				realtimeInput: {
					audio: {
						data: base64Audio,
						mimeType: 'audio/pcm;rate=16000'
					}
				}
			}));
		};

		this.inputSource.connect(this.scriptProcessor);
		// ScriptProcessor must connect to destination to fire in some browsers
		const silentGain = this.inputAudioContext.createGain();
		silentGain.gain.value = 0;
		this.scriptProcessor.connect(silentGain);
		silentGain.connect(this.inputAudioContext.destination);
	}

	isSpeakerActive() {
		if (!this.outputAudioContext) return false;
		if (this.isModelSpeaking || this.activeSources.size > 0) return true;
		// 400ms acoustic tail for room reverberation
		return this.outputAudioContext.currentTime < (this.nextPlayTime + 0.40);
	}

	handleServerMessage(msg) {
		if (msg.serverContent) {
			const sc = msg.serverContent;

			// Handle Interruption
			if (sc.interrupted) {
				console.log('[GeminiLive] Interrupted by user');
				this.stopPlayback();
				this.onInterrupted();
				return;
			}

			// Model audio turn
			if (sc.modelTurn?.parts) {
				this.isServerTurnComplete = false;
				clearTimeout(this.turnCompletionTimer);
				clearTimeout(this.turnTimeoutTimer);

				if (!this.isModelSpeaking) {
					this.isModelSpeaking = true;
					this.onSpeakingStateChange(true);
				}

				for (const part of sc.modelTurn.parts) {
					if (part.inlineData?.data) {
						const float32 = base64ToFloat32Array(part.inlineData.data);
						this.playAudioChunk(float32);
					}
				}

				// Fallback safety timeout if stream stalls
				this.turnTimeoutTimer = setTimeout(() => {
					if (this.isModelSpeaking && this.activeSources.size === 0) {
						this.finishTurn();
					}
				}, 4500);
			}

			// Transcripts
			if (sc.inputTranscription?.text) {
				if (!this.isSpeakerActive()) {
					this.onInputTranscription(cleanPhoneticSpelling(sc.inputTranscription.text));
				}
			}

			if (sc.outputTranscription?.text) {
				this.onOutputTranscription(cleanPhoneticSpelling(sc.outputTranscription.text));
			}

			if (sc.turnComplete) {
				this.isServerTurnComplete = true;
				this.scheduleTurnCompletion();
			}
		}
	}

	playAudioChunk(float32Data) {
		if (!this.outputAudioContext || this.outputAudioContext.state === 'closed') return;

		this.isModelSpeaking = true;
		clearTimeout(this.turnCompletionTimer);
		clearTimeout(this.turnTimeoutTimer);

		// Calculate speaker volume for orb visualizer
		let sum = 0;
		for (let i = 0; i < float32Data.length; i++) {
			sum += float32Data[i] * float32Data[i];
		}
		const rms = Math.sqrt(sum / float32Data.length);
		this.onSpeakerVolume(Math.min(1, rms * 3.5));

		const buffer = this.outputAudioContext.createBuffer(1, float32Data.length, 24000);
		buffer.copyToChannel(float32Data, 0);

		const source = this.outputAudioContext.createBufferSource();
		source.buffer = buffer;
		source.connect(this.outputAudioContext.destination);

		const now = this.outputAudioContext.currentTime;
		const startTime = Math.max(now, this.nextPlayTime);
		source.start(startTime);
		this.nextPlayTime = startTime + buffer.duration;

		this.activeSources.add(source);
		source.onended = () => {
			this.activeSources.delete(source);
			if (this.activeSources.size === 0) {
				this.onSpeakerVolume(0);
				if (this.isServerTurnComplete) {
					this.scheduleTurnCompletion();
				}
			}
		};
	}

	scheduleTurnCompletion() {
		clearTimeout(this.turnCompletionTimer);
		if (!this.outputAudioContext || this.outputAudioContext.state === 'closed') {
			this.finishTurn();
			return;
		}

		const now = this.outputAudioContext.currentTime;
		const remaining = Math.max(0, this.nextPlayTime - now);

		// Wait until all scheduled audio has played out + 120ms buffer
		this.turnCompletionTimer = setTimeout(() => {
			if (this.activeSources.size === 0 || (this.outputAudioContext && this.outputAudioContext.currentTime >= this.nextPlayTime - 0.05)) {
				this.finishTurn();
			} else {
				this.scheduleTurnCompletion();
			}
		}, Math.round(remaining * 1000) + 120);
	}

	finishTurn() {
		clearTimeout(this.turnCompletionTimer);
		clearTimeout(this.turnTimeoutTimer);
		if (this.isModelSpeaking) {
			this.isModelSpeaking = false;
			this.isServerTurnComplete = false;
			this.onSpeakerVolume(0);
			this.onSpeakingStateChange(false);
			this.onTurnComplete();
		}
	}

	stopPlayback() {
		clearTimeout(this.turnCompletionTimer);
		clearTimeout(this.turnTimeoutTimer);
		for (const source of this.activeSources) {
			try {
				source.stop();
			} catch {}
		}
		this.activeSources.clear();
		const wasSpeaking = this.isModelSpeaking;
		this.isModelSpeaking = false;
		this.isServerTurnComplete = false;
		this.onSpeakerVolume(0);
		if (wasSpeaking) {
			this.onSpeakingStateChange(false);
		}
		if (this.outputAudioContext && this.outputAudioContext.state !== 'closed') {
			this.nextPlayTime = this.outputAudioContext.currentTime;
		}
	}

	sendTextMessage(text) {
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
			console.warn('[GeminiLive] Cannot send text, WS not open');
			return;
		}
		this.ws.send(JSON.stringify({
			realtimeInput: { text }
		}));
	}

	setMute(muted) {
		this.isMuted = muted;
		if (muted && this.ws && this.ws.readyState === WebSocket.OPEN) {
			// Flush audio buffer
			this.ws.send(JSON.stringify({
				realtimeInput: { audioStreamEnd: true }
			}));
		}
	}

	disconnect() {
		this.isDestroyed = true;
		this.isConnected = false;

		this.stopPlayback();

		if (this.scriptProcessor) {
			try {
				this.scriptProcessor.disconnect();
			} catch {}
			this.scriptProcessor = null;
		}

		if (this.inputSource) {
			try {
				this.inputSource.disconnect();
			} catch {}
			this.inputSource = null;
		}

		if (this.mediaStream) {
			try {
				this.mediaStream.getTracks().forEach((t) => t.stop());
			} catch {}
			this.mediaStream = null;
		}

		if (this.inputAudioContext) {
			try {
				this.inputAudioContext.close();
			} catch {}
			this.inputAudioContext = null;
		}

		if (this.outputAudioContext) {
			try {
				this.outputAudioContext.close();
			} catch {}
			this.outputAudioContext = null;
		}

		if (this.ws) {
			try {
				this.ws.close();
			} catch {}
			this.ws = null;
		}

		if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
			try {
				navigator.mediaSession.playbackState = 'none';
			} catch {}
		}

		this.onStatusChange('idle');
	}
}
