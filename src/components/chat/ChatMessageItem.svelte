<script>
	import { createEventDispatcher } from 'svelte';
	import ChatContactForm from './ChatContactForm.svelte';
	import { renderMarkdown } from '$lib/chat-modal/markdown';
	import { isSpeaking, currentSpeakingId, playVoice, stopVoice } from '$lib/chat-modal/voice';
	import { selectedVoice, closeChat } from '$lib/stores/chat';

	export let msg;
	export let contactSubmitted = false;

	const dispatch = createEventDispatcher();
	const contactToken = '[ACTION:SHOW_CONTACT_FORM]';

	let isThoughtExpanded = false;
	let sourcesExpanded = false;

	function handleMarkdownClick(e) {
		const a = e.target.closest('a');
		if (a) {
			const href = a.getAttribute('href') || '';
			if (href.startsWith('/') || href.startsWith('#') || href.includes('localhost') || href.includes('nur:4173')) {
				closeChat();
			}
		}
	}

	function handleContactSubmit(event) {
		dispatch('contactsubmit', event.detail);
	}

	function toggleThought() {
		if (msg.thoughts) {
			isThoughtExpanded = !isThoughtExpanded;
		}
	}

	// Thought box is shown if assistant has tool steps, thoughts, or is streaming
	$: shouldShowThoughtBox =
		msg.role === 'assistant' &&
		((msg.toolSteps && msg.toolSteps.length > 0) || msg.thoughts || (msg.isStreaming && !msg.content));
	$: toolCount = (msg.toolSteps || []).filter((s) => s.tool === 'read_knowledge_node').length || (msg.toolSteps || []).length || 1;
	$: durationSec = msg.durationMs ? (msg.durationMs / 1000).toFixed(1) : '1.4';
</script>

<div
	class="message {msg.role}"
	class:suggested-message={msg.role === 'user' && msg.source === 'suggested'}
	class:ask-agent-message={msg.role === 'user' && msg.source === 'ask-agent'}
>
	<div class="message-bubble">
		{#if msg.role === 'user' && msg.source === 'suggested'}
			<div class="message-tag">Suggested prompt</div>
		{:else if msg.role === 'user' && msg.source === 'ask-agent'}
			<div class="message-tag">Ask agent</div>
		{/if}

		<!-- Assistant Stream of Thought / Tool-Use Section -->
		{#if shouldShowThoughtBox}
			<div class="thought-container" class:is-streaming={msg.isStreaming}>
				<button
					class="thought-header-btn"
					on:click={toggleThought}
					type="button"
					class:clickable={!!msg.thoughts}
					aria-expanded={isThoughtExpanded}
				>
					<div class="thought-header-left">
						{#if msg.isStreaming && !msg.toolSteps?.length}
							<span class="thought-spinner"></span>
							<span class="thought-title-live">Reasoning across Knowledge Tree...</span>
						{:else}
							<span class="thought-icon">⚡</span>
							<span class="thought-title-collapsed">
								Reasoned across {toolCount} brain {toolCount === 1 ? 'node' : 'nodes'} in {durationSec}s
							</span>
						{/if}
					</div>
					{#if msg.thoughts}
						<div class="thought-toggle-indicator">
							<span class="thought-toggle-label">{isThoughtExpanded ? 'Hide' : 'Expand'}</span>
							<span class="toggle-arrow" class:open={isThoughtExpanded}>
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
									<path d="M6 9l6 6 6-6" />
								</svg>
							</span>
						</div>
					{/if}
				</button>

				<!-- The Action List is ALWAYS visible when steps exist (the collapsed base state) -->
				{#if msg.toolSteps && msg.toolSteps.length > 0}
					<div class="tool-steps-list">
						{#each msg.toolSteps as step}
							<div class="tool-step-row">
								<span class="step-bullet">├</span>
								{#if step.tool === 'search_knowledge_index'}
									<span class="tool-badge search">🔍 Search</span>
									<span class="step-text">
										Indexed: <code>{step.args?.query || step.args?.tag || step.args?.category || 'public nodes'}</code>
									</span>
									{#if step.result?.found && step.result.found.length > 0}
										<span class="found-count">({step.result.found.length} matched)</span>
									{/if}
								{:else if step.tool === 'read_knowledge_node'}
									<span class="tool-badge read">📖 Read</span>
									<span class="step-text">
										Loaded: <strong>{step.result?.title ? step.result.title.split(':')[0] : step.args?.slug}</strong>
									</span>
								{:else}
									<span class="tool-badge general">⚙️ {step.tool}</span>
								{/if}
							</div>
						{/each}
					</div>
				{/if}

				<!-- Expanded View: The nice box with the reasoning text -->
				{#if isThoughtExpanded && msg.thoughts}
					<div class="thought-expanded-box">
						<div class="thought-text-content">{msg.thoughts.trim()}</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Main Message Body -->
		{#if msg.content}
			{#if msg.content.includes(contactToken)}
				<div class="markdown-body" role="presentation" on:click={handleMarkdownClick} on:keydown={() => {}}>
					{@html renderMarkdown(msg.content.replace(contactToken, ''))}
				</div>
				{#if !contactSubmitted}
					<ChatContactForm on:submit={handleContactSubmit} />
				{/if}
			{:else}
				<div class="markdown-body" role="presentation" on:click={handleMarkdownClick} on:keydown={() => {}}>
					{@html renderMarkdown(msg.content)}
				</div>
			{/if}

			{#if msg.role === 'assistant' && msg.content && !msg.isStreaming}
				<div class="message-audio-action">
					<button
						type="button"
						class="message-audio-btn"
						class:playing={$isSpeaking && $currentSpeakingId === (msg.id || msg.startTime || msg.content)}
						on:click={() => {
							const id = msg.id || msg.startTime || msg.content;
							if ($isSpeaking && $currentSpeakingId === id) {
								stopVoice();
							} else {
								playVoice(msg.content, id, $selectedVoice);
							}
						}}
						title={$isSpeaking && $currentSpeakingId === (msg.id || msg.startTime || msg.content) ? 'Stop playing voice' : 'Listen to response'}
						aria-label="Listen to response"
					>
						{#if $isSpeaking && $currentSpeakingId === (msg.id || msg.startTime || msg.content)}
							<span class="btn-audio-waves" aria-hidden="true">
								<span class="btn-wave-bar b1"></span>
								<span class="btn-wave-bar b2"></span>
								<span class="btn-wave-bar b3"></span>
							</span>
							<span class="audio-btn-label">Playing</span>
						{:else}
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="speaker-icon">
								<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
								<path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
							</svg>
							<span class="audio-btn-label">Listen</span>
						{/if}
					</button>
				</div>
			{/if}
		{:else if msg.isStreaming && !msg.thoughts}
			<div class="typing-placeholder">
				<div class="typing-dot"></div>
				<div class="typing-dot"></div>
				<div class="typing-dot"></div>
			</div>
		{/if}

		<!-- Threshold Warning Banner -->
		{#if msg.warning}
			<div class="message-warning-banner">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="warning-icon">
					<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
					<line x1="12" y1="9" x2="12" y2="13" />
					<line x1="12" y1="17" x2="12.01" y2="17" />
				</svg>
				<span>{msg.warning}</span>
			</div>
		{/if}

		<!-- Sources Citations Section -->
		{#if msg.sources && msg.sources.length > 0}
			<div class="sources-wrapper">
				<div class="sources-label">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="source-doc-icon">
						<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
						<polyline points="14 2 14 8 20 8" />
					</svg>
					<span>Consulted Knowledge Tree:</span>
				</div>
				<div class="sources-pills">
					<!-- Top Entry (always shown) -->
					<a
						href="/tree/{msg.sources[0].slug}"
						class="source-pill"
						on:click={() => closeChat()}
					>
						<span class="source-link-icon">🔗</span>
						<span class="source-name">{msg.sources[0].title}</span>
					</a>

					<!-- Remaining Entries (revealed on expand) -->
					{#if sourcesExpanded}
						{#each msg.sources.slice(1) as source}
							<a
								href="/tree/{source.slug}"
								class="source-pill"
								on:click={() => closeChat()}
							>
								<span class="source-link-icon">🔗</span>
								<span class="source-name">{source.title}</span>
							</a>
						{/each}
					{/if}

					<!-- Expand / Collapse Toggle Button -->
					{#if msg.sources.length > 1}
						<button
							type="button"
							class="source-pill source-expand-btn"
							on:click={() => (sourcesExpanded = !sourcesExpanded)}
						>
							{#if sourcesExpanded}
								<span>Show less</span>
								<span class="expand-arrow">▴</span>
							{:else}
								<span>+{msg.sources.length - 1} more</span>
								<span class="expand-arrow">▾</span>
							{/if}
						</button>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.message {
		display: flex;
		width: 100%;
	}

	.message.user {
		justify-content: flex-end;
	}

	.message.assistant {
		justify-content: flex-start;
	}

	.message-bubble {
		max-width: 88%;
		padding: 0.9rem 1.25rem;
		border-radius: 16px;
		font-size: 0.92rem;
		line-height: 1.55;
		position: relative;
	}

	.message-tag {
		margin-bottom: 0.45rem;
		font-size: 0.58rem;
		font-weight: 800;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		opacity: 0.9;
	}

	/* User vs Assistant bubbles */
	.user .message-bubble {
		background: #fff;
		color: #000;
		border-bottom-right-radius: 4px;
	}

	.assistant .message-bubble {
		background: rgba(255, 255, 255, 0.05);
		color: rgba(255, 255, 255, 0.92);
		border-bottom-left-radius: 4px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.user.suggested-message .message-bubble {
		background: linear-gradient(135deg, rgba(95, 179, 114, 0.28), rgba(22, 44, 31, 0.92));
		color: #f4fff7;
		border-bottom-right-radius: 4px;
		border: 1px solid rgba(126, 231, 135, 0.3);
	}

	.user.suggested-message .message-tag {
		color: rgba(174, 255, 189, 0.9);
	}

	.user.ask-agent-message .message-bubble {
		background: linear-gradient(135deg, rgba(91, 132, 255, 0.3), rgba(16, 26, 54, 0.92));
		color: #f5f8ff;
		border-bottom-right-radius: 4px;
		border: 1px solid rgba(150, 184, 255, 0.28);
	}

	.user.ask-agent-message .message-tag {
		color: rgba(188, 210, 255, 0.9);
	}

	/* Thought Process Accordion */
	.thought-container {
		background: rgba(0, 0, 0, 0.35);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 10px;
		margin-bottom: 0.85rem;
		overflow: hidden;
		transition: all 0.2s ease;
	}

	.thought-container.is-streaming {
		border-color: rgba(24, 144, 255, 0.3);
		background: rgba(24, 144, 255, 0.03);
	}

	.thought-header-btn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.45rem 0.75rem;
		background: none;
		border: none;
		color: inherit;
		font-family: inherit;
		cursor: pointer;
		text-align: left;
	}

	.thought-header-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.76rem;
	}

	.thought-spinner {
		width: 8px;
		height: 8px;
		border: 1.5px solid rgba(24, 144, 255, 0.3);
		border-top-color: #1890ff;
		border-radius: 50%;
		animation: spin 1s infinite linear;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.thought-title-live {
		color: #69c0ff;
		font-weight: 600;
		letter-spacing: 0.02em;
	}

	.thought-title-collapsed {
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.72rem;
		letter-spacing: 0.02em;
		line-height: 1.4;
	}

	.thought-title-collapsed strong {
		color: #e6f7ff;
		font-weight: 600;
	}

	.thought-header-btn:hover .thought-title-collapsed {
		color: rgba(255, 255, 255, 0.9);
	}

	.thought-icon {
		color: #e6f7ff;
	}

	.thought-header-btn.clickable {
		cursor: pointer;
	}

	.thought-toggle-indicator {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		color: rgba(255, 255, 255, 0.45);
		font-size: 0.68rem;
		letter-spacing: 0.02em;
		transition: color 0.2s ease;
	}

	.thought-header-btn:hover .thought-toggle-indicator {
		color: rgba(255, 255, 255, 0.85);
	}

	.thought-toggle-label {
		font-weight: 500;
	}

	.toggle-arrow {
		width: 14px;
		height: 14px;
		color: rgba(255, 255, 255, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.2s ease;
	}

	.toggle-arrow.open {
		transform: rotate(180deg);
	}

	.toggle-arrow svg {
		width: 100%;
		height: 100%;
	}

	/* Tool Steps Timeline */
	.tool-steps-list {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		font-family: ui-monospace, SFMono-Regular, monospace;
		padding: 0.15rem 0.75rem 0.55rem 0.75rem;
	}

	.thought-expanded-box {
		padding: 0 0.75rem 0.65rem 0.75rem;
		animation: thoughtFadeIn 0.2s ease;
	}

	@keyframes thoughtFadeIn {
		from { opacity: 0; transform: translateY(-3px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.thought-text-content {
		font-size: 0.72rem;
		line-height: 1.6;
		color: rgba(255, 255, 255, 0.75);
		white-space: pre-wrap;
		padding: 0.55rem 0.7rem;
		background: rgba(255, 255, 255, 0.025);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 6px;
		font-family: inherit;
	}

	.tool-step-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.72rem;
	}

	.step-bullet {
		color: rgba(255, 255, 255, 0.25);
	}

	.tool-badge {
		font-size: 0.65rem;
		padding: 0.1rem 0.35rem;
		border-radius: 4px;
		font-weight: 700;
		text-transform: uppercase;
	}

	.tool-badge.search {
		background: rgba(24, 144, 255, 0.15);
		color: #69c0ff;
	}

	.tool-badge.read {
		background: rgba(114, 46, 209, 0.18);
		color: #d3adf7;
	}

	.tool-badge.general {
		background: rgba(255, 255, 255, 0.08);
		color: #fff;
	}

	.step-text {
		color: rgba(255, 255, 255, 0.7);
	}

	.step-text code {
		background: rgba(255, 255, 255, 0.08);
		padding: 0.1rem 0.3rem;
		border-radius: 3px;
		color: #e6f7ff;
	}

	.found-count {
		color: rgba(255, 255, 255, 0.4);
		font-size: 0.68rem;
	}


	/* Sources Citations */
	.sources-wrapper {
		margin-top: 0.9rem;
		padding-top: 0.75rem;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}

	.sources-label {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: rgba(255, 255, 255, 0.4);
	}

	.source-doc-icon {
		width: 12px;
		height: 12px;
	}

	.sources-pills {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.source-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.12);
		padding: 0.25rem 0.65rem;
		border-radius: 6px;
		font-size: 0.75rem;
		color: #91caff;
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.source-pill:hover {
		background: rgba(24, 144, 255, 0.15);
		border-color: rgba(24, 144, 255, 0.35);
		color: #fff;
		transform: translateY(-1px);
	}

	.source-expand-btn {
		cursor: pointer;
		font-family: inherit;
		color: rgba(255, 255, 255, 0.65);
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.source-expand-btn:hover {
		color: #fff;
		background: rgba(255, 255, 255, 0.12);
		border-color: rgba(255, 255, 255, 0.3);
	}

	.expand-arrow {
		font-size: 0.7rem;
		line-height: 1;
		color: rgba(255, 255, 255, 0.5);
	}

	.source-link-icon {
		font-size: 0.7rem;
	}

	.message-warning-banner {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.75rem;
		padding: 0.45rem 0.75rem;
		background: rgba(250, 173, 20, 0.08);
		border: 1px solid rgba(250, 173, 20, 0.25);
		border-radius: 6px;
		font-size: 0.75rem;
		line-height: 1.35;
		color: #ffd591;
	}

	.warning-icon {
		width: 14px;
		height: 14px;
		flex-shrink: 0;
		color: #faad14;
	}

	/* Markdown styles inside message */
	.markdown-body :global(p) {
		margin: 0 0 0.5rem 0;
	}

	.markdown-body :global(p:last-child) {
		margin-bottom: 0;
	}

	.markdown-body :global(ul),
	.markdown-body :global(ol) {
		margin: 0.5rem 0;
		padding-left: 1.2rem;
	}

	.markdown-body :global(li) {
		margin-bottom: 0.3rem;
	}

	.markdown-body :global(strong) {
		color: currentColor;
		font-weight: 700;
	}

	.markdown-body :global(em) {
		opacity: 0.85;
		font-style: italic;
	}

	.markdown-body :global(code) {
		background: rgba(255, 255, 255, 0.12);
		padding: 0.12rem 0.35rem;
		border-radius: 4px;
		font-size: 0.86em;
		font-family: monospace;
	}

	.user .markdown-body :global(code) {
		background: rgba(0, 0, 0, 0.08);
	}

	.markdown-body :global(a) {
		color: #69c0ff;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	/* Typing placeholder */
	.typing-placeholder {
		display: flex;
		gap: 4px;
		padding: 0.4rem 0;
	}

	.typing-dot {
		width: 4px;
		height: 4px;
		background: rgba(255, 255, 255, 0.5);
		border-radius: 50%;
		animation: typing 1.4s infinite;
	}

	.typing-dot:nth-child(2) {
		animation-delay: 0.2s;
	}

	.typing-dot:nth-child(3) {
		animation-delay: 0.4s;
	}

	@keyframes typing {
		0%, 100% {
			opacity: 0.3;
			transform: translateY(0);
		}
		50% {
			opacity: 1;
			transform: translateY(-3px);
		}
	}

	.message-audio-action {
		display: flex;
		align-items: center;
		margin-top: 0.5rem;
		padding-top: 0.35rem;
		border-top: 1px solid rgba(255, 255, 255, 0.04);
	}

	.message-audio-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.38rem;
		padding: 0.28rem 0.6rem;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 999px;
		color: rgba(255, 255, 255, 0.55);
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.message-audio-btn:hover {
		background: rgba(255, 255, 255, 0.08);
		color: #fff;
		border-color: rgba(255, 255, 255, 0.18);
	}

	.message-audio-btn.playing {
		background: rgba(126, 231, 135, 0.12);
		border-color: rgba(126, 231, 135, 0.35);
		color: #7ee787;
	}

	.speaker-icon {
		width: 0.85rem;
		height: 0.85rem;
	}

	.btn-audio-waves {
		display: flex;
		align-items: center;
		gap: 1.5px;
		height: 0.85rem;
	}

	.btn-wave-bar {
		width: 2px;
		background: #7ee787;
		border-radius: 1px;
		animation: pulseWave 0.7s ease-in-out infinite alternate;
	}

	.b1 { height: 40%; animation-delay: 0s; }
	.b2 { height: 95%; animation-delay: 0.2s; }
	.b3 { height: 60%; animation-delay: 0.4s; }

	@keyframes pulseWave {
		0% { transform: scaleY(0.35); }
		100% { transform: scaleY(1.15); }
	}
</style>
