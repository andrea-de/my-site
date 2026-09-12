<script>
	import { isVoiceEnabled, toggleVoiceEnabled, enterVoiceMode } from '$lib/stores/chat';
	import { isSpeaking, stopVoice } from '$lib/chat-modal/voice';

	export let isLoading = false;
	export let onClose = () => {};
</script>

<header class="modal-header">
	<div class="header-left">
		<div class="prism-icon">
			<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path
					d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linejoin="bevel"
				/>
				<path
					d="M12 6L13.5 10.5L18 12L13.5 13.5L12 18L10.5 13.5L6 12L10.5 10.5L12 6Z"
					fill="currentColor"
					class="inner-prism"
				/>
			</svg>
		</div>
		<div class="header-text">
			<h3>AI Assistant</h3>
			<span class="status">{isLoading ? 'AI is thinking...' : ($isSpeaking ? 'Speaking...' : 'Neural context active')}</span>
		</div>
	</div>
	<div class="header-actions">
		<button
			class="voice-mode-btn"
			type="button"
			on:click={enterVoiceMode}
			title="Start hands-free Live Chat"
			aria-label="Start hands-free Live Chat"
		>
			<span class="live-voice-pulse"></span>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="voice-mode-icon">
				<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
				<path d="M19 10v2a7 7 0 0 1-14 0v-2" />
				<line x1="12" y1="19" x2="12" y2="23" />
				<line x1="8" y1="23" x2="16" y2="23" />
			</svg>
			<span class="voice-btn-label">Live Chat</span>
		</button>

		<button
			class="voice-toggle-btn"
			class:active={$isVoiceEnabled}
			class:speaking={$isSpeaking}
			type="button"
			on:click={() => {
				if ($isSpeaking) {
					stopVoice();
				}
				toggleVoiceEnabled();
			}}
			title={$isVoiceEnabled ? ($isSpeaking ? 'Speaking... (click to mute)' : 'AI Voice enabled (click to mute)') : 'AI Voice muted (click to enable)'}
			aria-label={$isVoiceEnabled ? 'Mute AI voice output' : 'Enable AI voice output'}
		>
			{#if $isVoiceEnabled}
				{#if $isSpeaking}
					<span class="audio-waves" aria-hidden="true">
						<span class="wave-bar bar1"></span>
						<span class="wave-bar bar2"></span>
						<span class="wave-bar bar3"></span>
					</span>
				{:else}
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
						<path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
					</svg>
				{/if}
			{:else}
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
					<line x1="23" y1="9" x2="17" y2="15" />
					<line x1="17" y1="9" x2="23" y2="15" />
				</svg>
			{/if}
		</button>
		<button class="close-btn" on:click={onClose} aria-label="Close chat modal">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
				<path d="M18 6L6 18M6 6l12 12" />
			</svg>
		</button>
	</div>
</header>

<style>
	.modal-header {
		padding: 1.2rem 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: rgba(255, 255, 255, 0.02);
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.8rem;
	}

	.prism-icon {
		width: 1.3rem;
		height: 1.3rem;
		animation: rotatePrism 8s infinite linear;
		color: #fff;
	}

	.inner-prism {
		animation: pulseInner 2s infinite ease-in-out;
	}

	.header-text h3 {
		margin: 0;
		font-size: 0.85rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #fff;
	}

	.status {
		font-size: 0.6rem;
		color: rgba(255, 255, 255, 0.4);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.voice-mode-btn {
		background: rgba(126, 231, 135, 0.12);
		border: 1px solid rgba(126, 231, 135, 0.35);
		border-radius: 999px;
		color: #7ee787;
		cursor: pointer;
		padding: 0.35rem 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		transition: all 0.2s ease;
	}

	.voice-mode-btn:hover {
		background: rgba(126, 231, 135, 0.22);
		border-color: rgba(126, 231, 135, 0.55);
		color: #fff;
		transform: translateY(-1px);
		box-shadow: 0 0 12px rgba(126, 231, 135, 0.25);
	}

	.voice-mode-icon {
		width: 0.95rem;
		height: 0.95rem;
	}

	.voice-btn-label {
		display: inline-block;
	}

	.live-voice-pulse {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #7ee787;
		box-shadow: 0 0 6px #7ee787;
		animation: pulseDot 1.8s infinite ease-in-out;
	}

	@keyframes pulseDot {
		0%, 100% {
			transform: scale(0.85);
			opacity: 0.6;
		}
		50% {
			transform: scale(1.35);
			opacity: 1;
		}
	}

	.voice-toggle-btn {
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 8px;
		color: rgba(255, 255, 255, 0.45);
		cursor: pointer;
		padding: 0.45rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.voice-toggle-btn:hover {
		color: #fff;
		border-color: rgba(255, 255, 255, 0.2);
		background: rgba(255, 255, 255, 0.08);
	}

	.voice-toggle-btn.active {
		color: #7ee787;
		border-color: rgba(126, 231, 135, 0.35);
		background: rgba(126, 231, 135, 0.1);
	}

	.voice-toggle-btn.speaking {
		box-shadow: 0 0 12px rgba(126, 231, 135, 0.3);
	}

	.voice-toggle-btn svg {
		width: 1.1rem;
		height: 1.1rem;
	}

	.audio-waves {
		display: flex;
		align-items: center;
		gap: 2px;
		height: 1.1rem;
		width: 1.1rem;
		justify-content: center;
	}

	.wave-bar {
		width: 2.5px;
		background: #7ee787;
		border-radius: 2px;
		animation: pulseWave 0.7s ease-in-out infinite alternate;
	}

	.bar1 { height: 45%; animation-delay: 0s; }
	.bar2 { height: 95%; animation-delay: 0.2s; }
	.bar3 { height: 65%; animation-delay: 0.4s; }

	@keyframes pulseWave {
		0% { transform: scaleY(0.35); }
		100% { transform: scaleY(1.15); }
	}

	.close-btn {
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.3);
		cursor: pointer;
		padding: 0.5rem;
		transition: all 0.2s ease;
	}

	.close-btn:hover {
		color: #fff;
		transform: rotate(90deg);
	}

	.close-btn svg {
		width: 1.1rem;
		height: 1.1rem;
	}

	@keyframes rotatePrism {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes pulseInner {
		0%,
		100% {
			opacity: 0.4;
			transform: scale(0.8);
		}
		50% {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
