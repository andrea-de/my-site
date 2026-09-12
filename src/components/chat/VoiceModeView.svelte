<script>
	import { onMount, onDestroy, createEventDispatcher, tick } from 'svelte';
	import { isSpeaking, isListening, playVoice, stopVoice, createSpeechRecognizer, voiceError, cleanTextForSpeech, cleanPhoneticSpelling } from '$lib/chat-modal/voice';
	import { GeminiLiveSession } from '$lib/chat-modal/live-session';

	export let messages = [];
	export let isLoading = false;

	const dispatch = createEventDispatcher();

	let recognizer = null;
	let currentTranscript = '';
	let lastSpokenText = '';
	let silenceTimeout = null;
	let restartTimer = null;
	let isMuted = false;
	let recognitionActive = false;
	let hasSpeechApi = false;
	let isProcessingTurn = false;
	let micBlocked = false;
	let blockedType = 'permission'; // 'insecure_origin' | 'permission'
	let currentHost = '';
	let isSecure = true;

	// Gemini Live API state
	let liveSession = null;
	let liveStatus = 'idle'; // 'idle' | 'connecting' | 'connected' | 'error' | 'closed'
	let liveUserText = '';
	let liveAssistantText = '';
	let isLiveSpeaking = false;
	let liveVolume = 0;
	let useLiveApi = true;
	let lastLiveTurnAssistant = '';
	let userSpeechActive = false;
	let userSilenceTimer = null;
	let subtitleContainer;

	// Topic keywords mapped to public Knowledge Tree nodes for quiet suggestions
	const TOPIC_SUGGESTIONS = [
		{ keywords: ['gametsunami', 'arcade', 'remix', 'physics', 'swarm'], title: 'GameTsunami', slug: 'products/gametsunami' },
		{ keywords: ['inwork', 'coop', 'cooperative', 'worker', 'pod', 'matching', 'fiverr'], title: 'InWork Platform', slug: 'prototypes/inwork' },
		{ keywords: ['advection', 'streaming', 'sse', 'cost', 'house-ad', 'edge'], title: 'Advection Software', slug: 'roles/advection' },
		{ keywords: ['cruffled', 'crossword', 'tile', 'applet', 'letter'], title: 'Cruffled Crossword', slug: 'products/cruffled' },
		{ keywords: ['mesa', 'etl', 'student', 'postgres', 'fastapi', 'pandas'], title: 'Mesa Cloud', slug: 'roles/mesa-cloud' },
		{ keywords: ['intellisense', 'mining', 'spatial', '3d', 'voxel'], title: 'Intellisense.io', slug: 'roles/intellisense' },
		{ keywords: ['g+d', 'giesecke', 'telecom', 'biometric', 'mwc'], title: 'G+D Biometrics', slug: 'roles/gandd' },
		{ keywords: ['aia', 'aplicaciones', 'bioscience', 'd3'], title: 'AIA Analytics', slug: 'roles/aia' },
		{ keywords: ['alps', 'mutual fund', 'nav', 'bloomberg'], title: 'Alps Fund Services', slug: 'roles/alps' },
		{ keywords: ['weatherie', 'wasm', 'theme', 'flutter', 'dart'], title: 'Weatherie WASM', slug: 'products/weatherie' },
		{ keywords: ['tackry', 'bubble', 'android', 'notification', 'sqlite', 'pendingintent'], title: 'Tackry Hub', slug: 'products/tackry' },
		{ keywords: ['section', 'launcher', 'play store', 'release', 'fastlane'], title: 'Section Launcher', slug: 'products/section-launcher' },
		{ keywords: ['godot', 'square', 'movie', 'c#'], title: 'Square Swaps', slug: 'products/square-godot' },
		{ keywords: ['foundry', 'quant', 'error control', 'backtest'], title: 'Alpha Foundry', slug: 'prototypes/foundry' },
		{ keywords: ['audio-tales', 'book', 'audiobook', 'cast', 'elevenlabs', 'drama'], title: 'AudioTales Engine', slug: 'prototypes/audio-tales' },
		{ keywords: ['fluenics', 'pronunciation', 'azure speech', 'drills', 'language'], title: 'Fluenics App', slug: 'prototypes/fluenics' },
		{ keywords: ['calculator', 'survival', 'retro calculator', 'math roguelike'], title: 'Calculated Survival', slug: 'products/calculated-survival' },
		{ keywords: ['charlie', 'five card', 'blackjack', 'card combat'], title: 'Five Card Charlie', slug: 'products/five-card-charlie' },
		{ keywords: ['development harness', 'simulation harness', 'simulation', 'xvfb', 'verification', 'game dev', 'game development', 'games'], title: 'AI Development Harnesses', slug: 'tools/agentic-development-harnesses' },
		{ keywords: ['media harness', 'video capture', 'app preview', 'promotional', 'promo', 'movie writer'], title: 'Media Harnesses', slug: 'tools/media-harnesses' },
		{ keywords: ['discord', 'chat-ops', 'discord bot', 'approval button'], title: 'Discord Agent Gateway', slug: 'tools/discord-agent-gateway' },
		{ keywords: ['context packager', 'code ingestion', 'ast', 'token budget'], title: 'Context Packager', slug: 'tools/context-packager' },
		{ keywords: ['brain', 'knowledge tree', 'digital garden', 'notes'], title: 'The Brain System', slug: 'tools/the-brain' },
		{ keywords: ['gateway', 'term-web', 'tailscale', 'supervisor', 'supervise'], title: 'Agentic Gateway', slug: 'tools/agentic-gateway' },
		{ keywords: ['publisher', 'asc.mjs', 'play.mjs', 'store publish'], title: 'Store Publishers', slug: 'tools/store-publishers' },
		{ keywords: ['full lifecycle', 'lifecycle pipeline', 'pipelines for everything'], title: 'Full-Lifecycle Pipelines', slug: 'architecture/full-lifecycle-pipelines' },
		{ keywords: ['protocol', 'envelope', 'widget', 'ag-ui'], title: 'Agent-UI Protocols', slug: 'architecture/agent-ui-protocols' },
		{ keywords: ['multi-agent', 'agents', 'tool calling', 'orchestration'], title: 'Multi-Agent Systems', slug: 'architecture/multi-agent-systems' },
		{ keywords: ['local-first', 'room', 'offline', 'sqlite'], title: 'Local-First Systems', slug: 'architecture/local-first-mobile-systems' },
		{ keywords: ['pipeline', 'ci', 'deployment', 'runner', 'apple silicon'], title: 'Release Fleet', slug: 'architecture/deployment-pipelines' },
		{ keywords: ['philosophy', 'craftsmanship', 'zero-to-one', 'execution'], title: 'Product Philosophy', slug: 'philosophy/product-engineering' }
	];

	// Dynamically update quiet suggestion links based on what the assistant or user is discussing
	$: activeSuggestions = (() => {
		const combined = `${liveAssistantText} ${lastLiveTurnAssistant} ${liveUserText}`.toLowerCase();
		const matched = [];

		for (const topic of TOPIC_SUGGESTIONS) {
			if (topic.keywords.some((k) => combined.includes(k))) {
				matched.push(topic);
				if (matched.length >= 3) break;
			}
		}

		if (matched.length === 0) {
			return [
				{ title: 'GameTsunami', slug: 'products/gametsunami' },
				{ title: 'InWork Platform', slug: 'products/inwork' },
				{ title: 'Advection Software', slug: 'roles/advection' }
			];
		}
		if (matched.length < 3) {
			const defaults = [
				{ title: 'GameTsunami', slug: 'products/gametsunami' },
				{ title: 'InWork Platform', slug: 'products/inwork' },
				{ title: 'Advection Software', slug: 'roles/advection' }
			];
			for (const d of defaults) {
				if (!matched.some((m) => m.slug === d.slug)) {
					matched.push(d);
					if (matched.length >= 3) break;
				}
			}
		}
		return matched;
	})();

	// 'listening' | 'thinking' | 'speaking' | 'muted' | 'blocked' | 'idle'
	$: currentState = (() => {
		if (micBlocked) return 'blocked';
		if (isMuted) return 'muted';
		if (useLiveApi) {
			if (isLiveSpeaking) return 'speaking';
			if (liveStatus === 'connecting') return 'thinking';
			if (liveStatus === 'connected') {
				if (userSpeechActive) return 'listening';
				if (liveUserText.trim().length > 0) return 'thinking';
				return 'listening';
			}
		}
		if ($isSpeaking) return 'speaking';
		if (isLoading || isProcessingTurn) return 'thinking';
		if ($isListening || recognitionActive) return 'listening';
		return 'idle';
	})();

	// Track processing state transitions for fallback mode
	$: if (isLoading) {
		isProcessingTurn = true;
	}

	$: if (!isLoading && !$isSpeaking && isProcessingTurn) {
		isProcessingTurn = false;
	}

	// Resilient auto-resume loop for fallback mode
	$: if (!useLiveApi && !micBlocked && !isProcessingTurn && !isLoading && !$isSpeaking && !isMuted && hasSpeechApi) {
		if (!recognitionActive && !$isListening) {
			scheduleRestartListening();
		}
	}

	// The current subtitle to show on screen
	$: activeSubtitle = (() => {
		if (micBlocked) {
			return blockedType === 'insecure_origin'
				? 'Microphone blocked by browser policy on HTTP. Switch to HTTPS or use an SSH tunnel.'
				: 'Microphone permission denied. Tap "Try Microphone Again" or allow access in browser settings.';
		}
		if (useLiveApi) {
			if (liveStatus === 'connecting') {
				return 'Connecting real-time live voice stream...';
			}
			if (currentState === 'speaking') {
				return cleanTextForSpeech(liveAssistantText || lastLiveTurnAssistant) || 'Speaking...';
			}
			if (currentState === 'thinking') {
				return liveUserText ? `"${cleanTextForSpeech(liveUserText)}"` : "Thinking...";
			}
			if (userSpeechActive || liveUserText) {
				return liveUserText || "Listening... speak to Andrea's AI";
			}
			if (currentState === 'muted') {
				return 'Microphone paused. Tap unmute or the orb to speak.';
			}
			return 'Speak naturally — Andrea\'s AI is listening live';
		}
		if (!hasSpeechApi) {
			return 'Speech recognition is not available in this browser. Please use Chrome, Edge, or Safari, or tap Text Mode.';
		}
		if (currentState === 'listening') {
			return currentTranscript || "Listening... speak to Andrea's AI";
		}
		if (currentState === 'thinking') {
			return currentTranscript ? `"${currentTranscript}"` : "Consulting Andrea's Knowledge Tree...";
		}
		if (currentState === 'speaking') {
			const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
			return cleanTextForSpeech(lastAssistantMsg?.content || lastSpokenText) || 'Speaking...';
		}
		if (currentState === 'muted') {
			return 'Microphone paused. Tap unmute or the orb to speak.';
		}
		return 'Tap the orb or start speaking...';
	})();

	// Auto-scroll subtitle container to bottom as live text streams in
	$: if (activeSubtitle && subtitleContainer) {
		tick().then(() => {
			if (subtitleContainer) {
				subtitleContainer.scrollTo({
					top: subtitleContainer.scrollHeight,
					behavior: 'smooth'
				});
			}
		});
	}

	async function startLiveSession() {
		stopLiveSession();
		liveStatus = 'connecting';
		liveUserText = '';
		liveAssistantText = '';

		try {
			liveSession = new GeminiLiveSession({
				voiceName: 'Aoede',
				onStatusChange(status) {
					liveStatus = status;
					if (status === 'connected') {
						micBlocked = false;
					}
				},
				onSpeakingStateChange(speaking) {
					isLiveSpeaking = speaking;
					if (speaking) {
						userSpeechActive = false;
						clearTimeout(userSilenceTimer);
					}
				},
				onInputTranscription(text) {
					liveUserText += text;
					userSpeechActive = true;
					clearTimeout(userSilenceTimer);
					userSilenceTimer = setTimeout(() => {
						userSpeechActive = false;
					}, 850);
				},
				onOutputTranscription(text) {
					isLiveSpeaking = true;
					userSpeechActive = false;
					clearTimeout(userSilenceTimer);
					liveAssistantText += text;
				},
				onTurnComplete() {
					isLiveSpeaking = false;
					userSpeechActive = false;
					clearTimeout(userSilenceTimer);
					const cleanUser = cleanPhoneticSpelling(liveUserText).trim();
					const cleanAssistant = cleanPhoneticSpelling(liveAssistantText).trim();

					// Only commit turn if BOTH user and assistant spoke meaningful content,
					// and it wasn't an acoustic self-echo fragment.
					if (
						cleanUser.length >= 2 &&
						cleanAssistant.length >= 2 &&
						cleanUser.toLowerCase() !== cleanAssistant.toLowerCase()
					) {
						lastLiveTurnAssistant = cleanAssistant;
						const turnSources = (activeSuggestions || []).map((s) => ({
							title: s.title,
							slug: s.slug
						}));
						dispatch('speechTurn', {
							user: cleanUser,
							assistant: cleanAssistant,
							sources: turnSources
						});
					}
					liveUserText = '';
					liveAssistantText = '';
				},
				onInterrupted() {
					isLiveSpeaking = false;
					userSpeechActive = false;
					clearTimeout(userSilenceTimer);
					liveAssistantText = '';
					liveUserText = '';
				},
				onMicVolume(vol) {
					if (!isLiveSpeaking) {
						liveVolume = vol;
						if (vol > 0.08) {
							userSpeechActive = true;
							clearTimeout(userSilenceTimer);
							userSilenceTimer = setTimeout(() => {
								userSpeechActive = false;
							}, 850);
						}
					}
				},
				onSpeakerVolume(vol) {
					liveVolume = vol;
					if (vol > 0.05) isLiveSpeaking = true;
				},
				onError(err) {
					console.warn('[VoiceMode] Gemini Live error:', err);
					if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission denied')) {
						micBlocked = true;
						blockedType = isSecure ? 'permission' : 'insecure_origin';
					} else {
						// Fallback to standard recognizer if websocket failed
						useLiveApi = false;
						startListeningLoop();
					}
				}
			});

			await liveSession.connect();
		} catch (err) {
			console.warn('[VoiceMode] Live connection failed, falling back:', err);
			if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission denied')) {
				micBlocked = true;
				blockedType = isSecure ? 'permission' : 'insecure_origin';
			} else {
				useLiveApi = false;
				startListeningLoop();
			}
		}
	}

	function stopLiveSession() {
		if (liveSession) {
			try {
				liveSession.disconnect();
			} catch {}
			liveSession = null;
		}
		liveStatus = 'idle';
		isLiveSpeaking = false;
		liveVolume = 0;
	}

	onMount(() => {
		hasSpeechApi =
			typeof window !== 'undefined' &&
			('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

		if (typeof window !== 'undefined') {
			currentHost = window.location.hostname;
			isSecure = Boolean(
				window.isSecureContext ||
				window.location.hostname === 'localhost' ||
				window.location.hostname === '127.0.0.1'
			);

			if (!isSecure && window.location.protocol === 'http:') {
				micBlocked = true;
				blockedType = 'insecure_origin';
			}
		}

		if (isSecure && !micBlocked) {
			startLiveSession();
		} else if (hasSpeechApi && !micBlocked) {
			useLiveApi = false;
			startListeningLoop();
		}
	});

	onDestroy(() => {
		stopLiveSession();
		clearTimeout(restartTimer);
		clearTimeout(silenceTimeout);
		clearTimeout(userSilenceTimer);
		stopListeningLoop();
		stopVoice();
	});

	function scheduleRestartListening() {
		clearTimeout(restartTimer);
		if (micBlocked || isMuted || isLoading || $isSpeaking || isProcessingTurn || !hasSpeechApi) return;
		restartTimer = setTimeout(() => {
			if (!micBlocked && !recognitionActive && !$isListening && !isMuted && !isLoading && !$isSpeaking && !isProcessingTurn) {
				startListeningLoop();
			}
		}, 300);
	}

	function startListeningLoop() {
		if (micBlocked || !hasSpeechApi || isMuted || $isSpeaking || isLoading || isProcessingTurn) return;

		clearTimeout(silenceTimeout);
		clearTimeout(restartTimer);
		currentTranscript = '';

		try {
			if (recognizer) {
				try { recognizer.stop(); } catch {}
				recognizer = null;
			}

			recognizer = createSpeechRecognizer({
				onInterim(text) {
					currentTranscript = text;
					resetSilenceTimer();
				},
				onFinal(text) {
					currentTranscript = text;
					handleSpeechFinalized(text);
				},
				onError(err) {
					console.warn('[VoiceMode] Speech error:', err);
					recognitionActive = false;
					if (err?.error === 'not-allowed') {
						micBlocked = true;
						if (!isSecure) {
							blockedType = 'insecure_origin';
						} else {
							blockedType = 'permission';
						}
					}
				},
				onEnd() {
					recognitionActive = false;
					if (currentTranscript && currentTranscript.trim().length > 1 && !isLoading && !$isSpeaking && !isProcessingTurn) {
						commitUserSpeech(currentTranscript);
					} else if (!micBlocked && !isProcessingTurn && !isMuted && !isLoading && !$isSpeaking) {
						scheduleRestartListening();
					}
				}
			});

			if (recognizer) {
				recognizer.start();
				recognitionActive = true;
			}
		} catch (e) {
			console.warn('[VoiceMode] Could not start speech recognition:', e);
			recognitionActive = false;
		}
	}

	function stopListeningLoop() {
		clearTimeout(silenceTimeout);
		clearTimeout(restartTimer);
		if (recognizer) {
			try { recognizer.stop(); } catch {}
			recognizer = null;
		}
		recognitionActive = false;
		isListening.set(false);
	}

	function resetSilenceTimer() {
		clearTimeout(silenceTimeout);
		silenceTimeout = setTimeout(() => {
			if (currentTranscript && currentTranscript.trim().length > 1) {
				commitUserSpeech(currentTranscript);
			}
		}, 1400);
	}

	function handleSpeechFinalized(text) {
		clearTimeout(silenceTimeout);
		if (text && text.trim().length > 1) {
			commitUserSpeech(text);
		}
	}

	function commitUserSpeech(text) {
		const query = text.trim();
		if (!query || isLoading) return;

		isProcessingTurn = true;
		stopListeningLoop();
		lastSpokenText = '';
		dispatch('send', query);
	}

	function toggleMute() {
		if (micBlocked) {
			handleRetryMic();
			return;
		}
		isMuted = !isMuted;
		if (useLiveApi && liveSession) {
			liveSession.setMute(isMuted);
			if (isMuted) {
				liveSession.stopPlayback();
				isLiveSpeaking = false;
			}
			return;
		}
		if (isMuted) {
			clearTimeout(restartTimer);
			stopListeningLoop();
			stopVoice();
		} else {
			isProcessingTurn = false;
			startListeningLoop();
		}
	}

	function handleOrbClick() {
		if (micBlocked) {
			handleRetryMic();
			return;
		}
		if (useLiveApi && liveSession) {
			if (isLiveSpeaking) {
				liveSession.stopPlayback();
				isLiveSpeaking = false;
			} else if (isMuted) {
				toggleMute();
			}
			return;
		}
		if (currentState === 'speaking') {
			stopVoice();
			isProcessingTurn = false;
			startListeningLoop();
		} else if (currentState === 'muted') {
			toggleMute();
		} else if (currentState === 'listening' && currentTranscript) {
			commitUserSpeech(currentTranscript);
		} else if (currentState === 'idle' || !recognitionActive) {
			isProcessingTurn = false;
			startListeningLoop();
		}
	}

	function handleSwitchToHttps() {
		if (typeof window !== 'undefined') {
			const targetUrl = `https://${window.location.hostname}:4173${window.location.pathname}${window.location.search}`;
			window.location.href = targetUrl;
		}
	}

	function handleRetryMic() {
		micBlocked = false;
		voiceError.set(null);
		isProcessingTurn = false;
		if (useLiveApi) {
			startLiveSession();
		} else {
			startListeningLoop();
		}
	}
</script>

<div class="voice-mode-container" class:state-listening={currentState === 'listening'} class:state-speaking={currentState === 'speaking'} class:state-thinking={currentState === 'thinking'}>
	<!-- Top Navigation -->
	<div class="voice-header">
		<div class="header-status">
			<span class="live-dot" class:active={currentState !== 'muted' && !micBlocked}></span>
			<span class="mode-title">Live Chat</span>
			{#if useLiveApi && liveStatus === 'connected'}
				<span class="state-badge live">Live ⚡</span>
			{/if}
			{#if currentState === 'listening'}
				<span class="state-badge listening">Listening</span>
			{:else if currentState === 'thinking'}
				<span class="state-badge thinking">Thinking</span>
			{:else if currentState === 'speaking'}
				<span class="state-badge speaking">Speaking</span>
			{:else if currentState === 'muted'}
				<span class="state-badge muted">Muted</span>
			{:else if currentState === 'blocked'}
				<span class="state-badge blocked">Mic Blocked</span>
			{:else}
				<span class="state-badge ready">Ready</span>
			{/if}
		</div>

		<div class="header-actions">
			<button
				type="button"
				class="action-btn text-switch-btn"
				on:click={() => dispatch('switchtotext')}
				title="Switch to standard text view"
				aria-label="Switch to standard text view"
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
				</svg>
				<span class="btn-text">Text Mode</span>
			</button>

			<button
				type="button"
				class="action-btn close-btn"
				on:click={() => dispatch('close')}
				title="End call"
				aria-label="End call"
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
					<path d="M18 6L6 18M6 6l12 12" />
				</svg>
			</button>
		</div>
	</div>

	<!-- Center Voice Visualizer Orb or Mic Blocked Card -->
	<div class="orb-stage">
		{#if micBlocked}
			<div class="mic-blocked-card">
				<div class="blocked-badge">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="1" y1="1" x2="23" y2="23" />
						<path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
						<path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
						<line x1="12" y1="19" x2="12" y2="23" />
						<line x1="8" y1="23" x2="16" y2="23" />
					</svg>
					<span>Microphone Blocked</span>
				</div>

				{#if blockedType === 'insecure_origin'}
					<h3 class="blocked-title">Browser Blocked: Insecure HTTP</h3>
					<p class="blocked-desc">
						Browsers block microphone access over plain HTTP when connected to a remote VM/Tailscale IP (<code>{currentHost}</code>).
					</p>

					<div class="fix-instructions">
						<div class="fix-option">
							<div class="fix-num">1</div>
							<div class="fix-content">
								<span class="fix-label">Option 1: Switch to HTTPS (Direct)</span>
								<p class="fix-text">Open via HTTPS on port 4173 to enable secure microphone access:</p>
								<button type="button" class="btn-https-link" on:click={handleSwitchToHttps}>
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="lock-icon">
										<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
										<path d="M7 11V7a5 5 0 0 1 10 0v4" />
									</svg>
									Open https://{currentHost}:4173
								</button>
							</div>
						</div>

						<div class="fix-option">
							<div class="fix-num">2</div>
							<div class="fix-content">
								<span class="fix-label">Option 2: SSH Port Forward (Localhost)</span>
								<p class="fix-text">Forward port to your local machine (browsers treat localhost as secure):</p>
								<code class="code-pill">ssh -L 4173:localhost:4173 dev@{currentHost}</code>
								<p class="sub-hint">Then open <a href="http://localhost:4173" target="_blank" rel="noreferrer">http://localhost:4173</a></p>
							</div>
						</div>

						<div class="fix-option">
							<div class="fix-num">3</div>
							<div class="fix-content">
								<span class="fix-label">Option 3: Chrome Flag</span>
								<p class="fix-text">Set <code>chrome://flags/#unsafely-treat-insecure-origin-as-secure</code> to include <code>http://{currentHost}:4173</code>.</p>
							</div>
						</div>
					</div>
				{:else}
					<h3 class="blocked-title">Microphone Access Denied</h3>
					<p class="blocked-desc">
						The browser denied microphone permission. Please tap the site permissions icon in your browser address bar and set Microphone to "Allow".
					</p>
				{/if}

				<div class="blocked-buttons">
					<button type="button" class="btn-retry" on:click={handleRetryMic}>
						Try Microphone Again
					</button>
					<button type="button" class="btn-text-mode" on:click={() => dispatch('switchtotext')}>
						Switch to Text Mode
					</button>
				</div>
			</div>
		{:else}
			<button
				type="button"
				class="orb-interactive-btn"
				on:click={handleOrbClick}
				title={currentState === 'speaking' ? 'Tap to interrupt' : (currentState === 'muted' ? 'Tap to unmute' : 'Voice Assistant active')}
				aria-label="Voice visualizer orb"
			>
				<div class="orb-wrapper {currentState}" style="--volume-scale: {1 + liveVolume * 0.75}">
					<div class="orb-halo halo-outer"></div>
					<div class="orb-halo halo-mid"></div>
					<div class="orb-core">
						{#if currentState === 'listening'}
							<div class="orb-pulse-rings">
								<span class="pulse-ring ring1"></span>
								<span class="pulse-ring ring2"></span>
							</div>
						{:else if currentState === 'thinking'}
							<div class="orb-spinner"></div>
						{:else if currentState === 'speaking'}
							<div class="sound-bars">
								<span class="sbar bar1"></span>
								<span class="sbar bar2"></span>
								<span class="sbar bar3"></span>
								<span class="sbar bar4"></span>
							</div>
						{:else if currentState === 'muted'}
							<div class="muted-icon">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<line x1="1" y1="1" x2="23" y2="23" />
									<path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
									<path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
									<line x1="12" y1="19" x2="12" y2="23" />
									<line x1="8" y1="23" x2="16" y2="23" />
								</svg>
							</div>
						{/if}
					</div>
				</div>
			</button>

			<div class="orb-hint">
				{#if currentState === 'speaking'}
					<span class="hint-text interactive">Tap orb to interrupt</span>
				{:else if currentState === 'listening'}
					<span class="hint-text">Speak naturally, pause when finished</span>
				{:else if currentState === 'thinking'}
					<span class="hint-text">Consulting Knowledge Tree...</span>
				{:else if currentState === 'muted'}
					<span class="hint-text interactive">Microphone muted — tap to resume</span>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Subtitle / Live Transcript -->
	<div class="transcript-stage">
		<div
			class="subtitle-card"
			bind:this={subtitleContainer}
			class:is-user={currentState === 'listening' || currentState === 'thinking'}
		>
			<p class="subtitle-text">{activeSubtitle}</p>
		</div>

		<!-- Quiet Knowledge Tree Suggestions Bar -->
		{#if !micBlocked && activeSuggestions && activeSuggestions.length > 0}
			<div class="voice-suggestions-bar">
				<span class="suggestions-label">Explore:</span>
				<div class="suggestions-chips">
					{#each activeSuggestions as suggestion}
						<a
							href="/tree/{suggestion.slug}"
							class="suggestion-chip"
							title="Open {suggestion.title} in Knowledge Tree"
							on:click={() => dispatch('close')}
						>
							<span class="chip-icon">🔗</span>
							<span class="chip-text">{suggestion.title}</span>
						</a>
					{/each}
				</div>
			</div>
		{/if}

		{#if $voiceError && !micBlocked}
			<div class="voice-error-notice">
				<span>{$voiceError}</span>
			</div>
		{/if}
	</div>

	<!-- Bottom Control Bar -->
	<div class="voice-controls">
		<button
			type="button"
			class="control-btn mute-btn"
			class:active={isMuted || micBlocked}
			on:click={toggleMute}
			title={micBlocked ? 'Retry microphone' : (isMuted ? 'Unmute microphone' : 'Mute microphone')}
			aria-label={micBlocked ? 'Retry microphone' : (isMuted ? 'Unmute microphone' : 'Mute microphone')}
		>
			{#if micBlocked}
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M1 4v6h6M23 20v-6h-6" />
					<path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
				</svg>
				<span class="control-label">Retry Mic</span>
			{:else if isMuted}
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="1" y1="1" x2="23" y2="23" />
					<path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
					<path d="M17 16.95A7 7 0 0 1 5 12v-2" />
					<line x1="12" y1="19" x2="12" y2="23" />
					<line x1="8" y1="23" x2="16" y2="23" />
				</svg>
				<span class="control-label">Unmute</span>
			{:else}
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
					<path d="M19 10v2a7 7 0 0 1-14 0v-2" />
					<line x1="12" y1="19" x2="12" y2="23" />
					<line x1="8" y1="23" x2="16" y2="23" />
				</svg>
				<span class="control-label">Mute</span>
			{/if}
		</button>

		{#if currentState === 'speaking'}
			<button
				type="button"
				class="control-btn interrupt-btn"
				on:click={() => { stopVoice(); startListeningLoop(); }}
				title="Stop assistant speaking"
				aria-label="Interrupt speech"
			>
				<svg viewBox="0 0 24 24" fill="currentColor">
					<rect x="6" y="6" width="12" height="12" rx="2" />
				</svg>
				<span class="control-label">Interrupt</span>
			</button>
		{/if}

		<button
			type="button"
			class="control-btn end-btn"
			on:click={() => dispatch('switchtotext')}
			title="Return to text conversation"
			aria-label="End call and switch to text"
		>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
				<path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 11.36 11.36 0 0 0 3.56.57 2 2 0 0 1 2 2v3.08a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 11.26 11.26 0 0 0 .57 3.57 2 2 0 0 1-.45 2.11L8.09 10.67" />
				<line x1="23" y1="1" x2="1" y2="23" />
			</svg>
			<span class="control-label">End Call</span>
		</button>
	</div>
</div>

<style>
	.voice-mode-container {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: radial-gradient(circle at 50% 30%, rgba(20, 30, 25, 0.95), rgba(5, 5, 5, 0.98));
		padding: 1.25rem 1.5rem 1.5rem;
		box-sizing: border-box;
		position: relative;
		overflow: hidden;
	}

	/* Top Navigation */
	.voice-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		z-index: 10;
	}

	.header-status {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.live-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.2);
		transition: all 0.3s ease;
	}

	.live-dot.active {
		background: #7ee787;
		box-shadow: 0 0 8px #7ee787;
	}

	.mode-title {
		font-size: 0.85rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #fff;
	}

	.state-badge {
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		padding: 0.2rem 0.55rem;
		border-radius: 999px;
		min-width: 4.4rem;
		text-align: center;
		display: inline-block;
		transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
	}

	.state-badge.ready {
		background: rgba(255, 255, 255, 0.08);
		color: rgba(255, 255, 255, 0.7);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.state-badge.live {
		background: rgba(168, 85, 247, 0.2);
		color: #c084fc;
		border: 1px solid rgba(168, 85, 247, 0.4);
		font-weight: 700;
	}

	.state-badge.listening {
		background: rgba(126, 231, 135, 0.15);
		color: #7ee787;
		border: 1px solid rgba(126, 231, 135, 0.3);
	}

	.state-badge.thinking {
		background: rgba(234, 179, 8, 0.15);
		color: #eab308;
		border: 1px solid rgba(234, 179, 8, 0.3);
	}

	.state-badge.speaking {
		background: rgba(56, 189, 248, 0.15);
		color: #38bdf8;
		border: 1px solid rgba(56, 189, 248, 0.3);
	}

	.state-badge.muted {
		background: rgba(239, 68, 68, 0.15);
		color: #ef4444;
		border: 1px solid rgba(239, 68, 68, 0.3);
	}

	.state-badge.blocked {
		background: rgba(239, 68, 68, 0.18);
		color: #f87171;
		border: 1px solid rgba(239, 68, 68, 0.4);
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.action-btn {
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		color: rgba(255, 255, 255, 0.75);
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.4rem 0.65rem;
		font-size: 0.72rem;
		font-weight: 600;
		transition: all 0.2s ease;
	}

	.action-btn:hover {
		background: rgba(255, 255, 255, 0.12);
		color: #fff;
	}

	.action-btn svg {
		width: 0.95rem;
		height: 0.95rem;
	}

	.close-btn {
		padding: 0.4rem;
	}

	/* Center Orb Stage */
	.orb-stage {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		position: relative;
		margin: 1rem 0;
	}

	.orb-interactive-btn {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		outline: none;
	}

	.orb-wrapper {
		width: 140px;
		height: 140px;
		border-radius: 50%;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		transform: scale(var(--volume-scale, 1));
		transition: transform 0.12s ease-out;
	}

	.orb-wrapper:hover {
		transform: scale(calc(var(--volume-scale, 1) * 1.04));
	}

	.orb-halo {
		position: absolute;
		border-radius: 50%;
		pointer-events: none;
		transition: all 0.5s ease;
	}

	.halo-outer {
		inset: -20px;
		filter: blur(25px);
		opacity: 0.4;
	}

	.halo-mid {
		inset: -10px;
		filter: blur(12px);
		opacity: 0.6;
	}

	.orb-core {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		z-index: 2;
		box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.2);
		transition: all 0.4s ease;
	}

	/* State-based styling */
	.orb-wrapper.listening .halo-outer {
		background: #10b981;
	}
	.orb-wrapper.listening .halo-mid {
		background: #34d399;
	}
	.orb-wrapper.listening .orb-core {
		background: radial-gradient(circle at 35% 35%, #6ee7b7, #059669);
		box-shadow: 0 0 30px rgba(16, 185, 129, 0.6);
		animation: breathe 2.4s infinite ease-in-out;
	}

	.orb-wrapper.thinking .halo-outer {
		background: #f59e0b;
	}
	.orb-wrapper.thinking .halo-mid {
		background: #8b5cf6;
	}
	.orb-wrapper.thinking .orb-core {
		background: radial-gradient(circle at 35% 35%, #fbbf24, #7c3aed);
		box-shadow: 0 0 30px rgba(245, 158, 11, 0.5);
		animation: spinPulse 3s infinite linear;
	}

	.orb-wrapper.speaking .halo-outer {
		background: #0284c7;
	}
	.orb-wrapper.speaking .halo-mid {
		background: #38bdf8;
	}
	.orb-wrapper.speaking .orb-core {
		background: radial-gradient(circle at 35% 35%, #7dd3fc, #0284c7);
		box-shadow: 0 0 40px rgba(56, 189, 248, 0.7);
		animation: speakWave 1.2s infinite ease-in-out alternate;
	}

	.orb-wrapper.muted .halo-outer,
	.orb-wrapper.muted .halo-mid {
		opacity: 0.15;
		background: #ef4444;
	}
	.orb-wrapper.muted .orb-core {
		background: radial-gradient(circle at 35% 35%, #64748b, #334155);
		box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
	}

	.muted-icon svg {
		width: 2.2rem;
		height: 2.2rem;
		color: rgba(255, 255, 255, 0.7);
	}

	/* Animations inside orb */
	.orb-pulse-rings {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.pulse-ring {
		position: absolute;
		inset: -8px;
		border: 2px solid rgba(255, 255, 255, 0.6);
		border-radius: 50%;
		animation: expandRing 2s infinite ease-out;
	}

	.ring2 {
		animation-delay: 1s;
	}

	.sound-bars {
		display: flex;
		align-items: center;
		gap: 4px;
		height: 2.2rem;
	}

	.sbar {
		width: 4px;
		background: #fff;
		border-radius: 2px;
		animation: sbarPulse 0.7s infinite alternate ease-in-out;
	}

	.bar1 { height: 45%; animation-delay: 0s; }
	.bar2 { height: 95%; animation-delay: 0.15s; }
	.bar3 { height: 70%; animation-delay: 0.3s; }
	.bar4 { height: 50%; animation-delay: 0.45s; }

	.orb-spinner {
		width: 2.2rem;
		height: 2.2rem;
		border: 3px solid rgba(255, 255, 255, 0.3);
		border-top-color: #fff;
		border-radius: 50%;
		animation: spin 1s infinite linear;
	}

	@keyframes breathe {
		0%, 100% { transform: scale(1); }
		50% { transform: scale(1.08); }
	}

	@keyframes speakWave {
		0% { transform: scale(0.97); }
		100% { transform: scale(1.1); }
	}

	@keyframes expandRing {
		0% { transform: scale(0.9); opacity: 0.8; }
		100% { transform: scale(1.35); opacity: 0; }
	}

	@keyframes sbarPulse {
		0% { transform: scaleY(0.4); }
		100% { transform: scaleY(1.3); }
	}

	@keyframes spinPulse {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.orb-hint {
		margin-top: 1.4rem;
	}

	.hint-text {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.45);
		letter-spacing: 0.04em;
	}

	.hint-text.interactive {
		color: rgba(255, 255, 255, 0.75);
		text-decoration: underline;
		cursor: pointer;
	}

	/* Subtitles Stage */
	.transcript-stage {
		margin-bottom: 1.2rem;
		min-height: 4.5rem;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		text-align: center;
	}

	.subtitle-card {
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 16px;
		padding: 0.75rem 1.2rem;
		max-width: 90%;
		width: 100%;
		max-height: 5.8rem;
		overflow-y: auto;
		backdrop-filter: blur(10px);
		scroll-behavior: smooth;
	}

	.subtitle-card::-webkit-scrollbar {
		width: 4px;
	}

	.subtitle-card::-webkit-scrollbar-track {
		background: transparent;
	}

	.subtitle-card::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.18);
		border-radius: 4px;
	}

	.subtitle-card.is-user {
		border-color: rgba(126, 231, 135, 0.2);
	}

	.subtitle-text {
		margin: 0;
		font-size: 0.88rem;
		line-height: 1.45;
		color: rgba(255, 255, 255, 0.9);
	}

	.voice-error-notice {
		margin-top: 0.5rem;
		font-size: 0.7rem;
		color: #ef4444;
	}

	.voice-suggestions-bar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.65rem;
		max-width: 90%;
		overflow-x: auto;
		scrollbar-width: none;
		padding: 0.15rem 0;
	}

	.voice-suggestions-bar::-webkit-scrollbar {
		display: none;
	}

	.suggestions-label {
		font-size: 0.62rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: rgba(255, 255, 255, 0.4);
		flex-shrink: 0;
	}

	.suggestions-chips {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex-wrap: nowrap;
	}

	.suggestion-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.22rem 0.65rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 999px;
		color: rgba(255, 255, 255, 0.85);
		font-size: 0.7rem;
		font-weight: 600;
		text-decoration: none;
		white-space: nowrap;
		transition: all 0.18s ease;
	}

	.suggestion-chip:hover {
		background: rgba(126, 231, 135, 0.15);
		border-color: rgba(126, 231, 135, 0.35);
		color: #7ee787;
		transform: translateY(-1px);
	}

	.chip-icon {
		font-size: 0.65rem;
		opacity: 0.75;
	}

	.chip-text {
		letter-spacing: 0.02em;
	}

	/* Bottom Control Bar */
	.voice-controls {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1.2rem;
		padding-top: 0.8rem;
		border-top: 1px solid rgba(255, 255, 255, 0.05);
	}

	.control-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.75);
		cursor: pointer;
		padding: 0.5rem 0.8rem;
		border-radius: 12px;
		transition: all 0.2s ease;
	}

	.control-btn:hover {
		color: #fff;
		background: rgba(255, 255, 255, 0.06);
	}

	.control-btn svg {
		width: 1.4rem;
		height: 1.4rem;
	}

	.control-label {
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.mute-btn.active {
		color: #ef4444;
		background: rgba(239, 68, 68, 0.12);
	}

	.interrupt-btn {
		color: #38bdf8;
	}

	.end-btn {
		color: #f87171;
	}

	.end-btn:hover {
		background: rgba(239, 68, 68, 0.15);
		color: #ef4444;
	}

	/* Mic Blocked Troubleshooting Card */
	.mic-blocked-card {
		background: rgba(18, 20, 26, 0.95);
		border: 1px solid rgba(239, 68, 68, 0.35);
		border-radius: 16px;
		padding: 1rem 1.25rem;
		max-width: 95%;
		max-height: 290px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
		text-align: left;
		box-shadow: 0 12px 35px rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(15px);
	}

	.blocked-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		background: rgba(239, 68, 68, 0.15);
		color: #ef4444;
		border: 1px solid rgba(239, 68, 68, 0.3);
		padding: 0.2rem 0.55rem;
		border-radius: 999px;
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		align-self: flex-start;
	}

	.blocked-badge svg {
		width: 0.85rem;
		height: 0.85rem;
	}

	.blocked-title {
		margin: 0;
		font-size: 0.92rem;
		font-weight: 700;
		color: #fff;
	}

	.blocked-desc {
		margin: 0;
		font-size: 0.76rem;
		color: rgba(255, 255, 255, 0.75);
		line-height: 1.45;
	}

	.blocked-desc code {
		background: rgba(255, 255, 255, 0.1);
		padding: 0.1rem 0.35rem;
		border-radius: 4px;
		color: #7ee787;
	}

	.fix-instructions {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
		margin-top: 0.1rem;
	}

	.fix-option {
		display: flex;
		gap: 0.6rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 8px;
		padding: 0.5rem 0.7rem;
	}

	.fix-num {
		width: 1.3rem;
		height: 1.3rem;
		border-radius: 50%;
		background: rgba(126, 231, 135, 0.15);
		color: #7ee787;
		font-size: 0.72rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.fix-content {
		flex: 1;
		min-width: 0;
	}

	.fix-label {
		display: block;
		font-size: 0.76rem;
		font-weight: 700;
		color: #fff;
		margin-bottom: 0.15rem;
	}

	.fix-text {
		margin: 0 0 0.35rem;
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.65);
		line-height: 1.35;
	}

	.btn-https-link {
		background: #7ee787;
		color: #000;
		border: none;
		border-radius: 6px;
		padding: 0.35rem 0.65rem;
		font-size: 0.72rem;
		font-weight: 700;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		transition: transform 0.2s ease, opacity 0.2s ease;
	}

	.btn-https-link:hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}

	.lock-icon {
		width: 0.8rem;
		height: 0.8rem;
	}

	.code-pill {
		background: rgba(0, 0, 0, 0.5);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 6px;
		padding: 0.2rem 0.45rem;
		font-size: 0.68rem;
		font-family: monospace;
		color: #7ee787;
		display: inline-block;
		word-break: break-all;
	}

	.sub-hint {
		margin: 0.25rem 0 0;
		font-size: 0.66rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.sub-hint a {
		color: #7ee787;
		text-decoration: underline;
	}

	.blocked-buttons {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.4rem;
	}

	.btn-retry,
	.btn-text-mode {
		flex: 1;
		padding: 0.45rem 0.75rem;
		border-radius: 8px;
		font-size: 0.74rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-retry {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: #fff;
	}

	.btn-retry:hover {
		background: rgba(255, 255, 255, 0.18);
	}

	.btn-text-mode {
		background: rgba(126, 231, 135, 0.12);
		border: 1px solid rgba(126, 231, 135, 0.3);
		color: #7ee787;
	}

	.btn-text-mode:hover {
		background: rgba(126, 231, 135, 0.22);
		color: #fff;
	}
</style>
