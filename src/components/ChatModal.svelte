<script>
	import { fade, scale, fly } from 'svelte/transition';
	import { onMount, tick, onDestroy } from 'svelte';
	import { marked } from 'marked';
	export let isOpen = false;
	export let onClose = () => {};
	export let initialMessage = '';

	let messages = [
		{ role: 'assistant', content: "Hi! I'm Andrea's AI assistant. I can help you with his technical background, projects, or candidacy. What would you like to know?" }
	];
	let inputMessage = '';
	let isLoading = false;
	let chatContent;
	let contactSubmitted = false;
	let contactData = null;
	let lastSyncedCount = 1;
	let idleTimer;

	const CHAR_LIMIT = 500;

	// Configure marked for safety
	marked.setOptions({
		gfm: true,
		breaks: true
	});

	async function scrollToBottom() {
		await tick();
		if (chatContent) chatContent.scrollTop = chatContent.scrollHeight;
	}

	async function sendMessage(text = null) {
		const messageToSend = text || inputMessage.trim();
		if (!messageToSend || isLoading) return;

		messages = [...messages, { role: 'user', content: messageToSend }];
		inputMessage = '';
		isLoading = true;
		scrollToBottom();
		resetIdleTimer();

		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ messages })
			});

			const data = await response.json();
			if (data.content) {
				messages = [...messages, { role: 'assistant', content: data.content }];
			}
		} catch (error) {
			messages = [...messages, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }];
		} finally {
			isLoading = false;
			scrollToBottom();
		}
	}

	async function syncSession(isClosing = false) {
		if (messages.length <= lastSyncedCount && !contactData) return;
		
		const payload = {
			messages,
			contactInfo: contactData,
			type: isClosing ? 'final_sync' : 'heartbeat'
		};

		fetch('/api/log', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
			keepalive: true 
		});

		lastSyncedCount = messages.length;
	}

	function resetIdleTimer() {
		clearTimeout(idleTimer);
		idleTimer = setTimeout(() => syncSession(), 180000);
	}

	function handleContactSubmit(e) {
		e.preventDefault();
		const formData = new FormData(e.target);
		contactData = Object.fromEntries(formData);
		contactSubmitted = true;
		
		fetch('/api/log', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ type: 'direct_contact', contactInfo: contactData }),
			keepalive: true
		});

		messages = [...messages, { role: 'assistant', content: "Got it! I've sent your info to Andrea. Feel free to continue our chat." }];
		scrollToBottom();
	}

	function handleClose() {
		syncSession(true);
		onClose();
	}

	function handleKeydown(e) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}

	onMount(() => {
		const handleVisibilityChange = () => {
			if (document.visibilityState === 'hidden') syncSession();
		};
		window.addEventListener('visibilitychange', handleVisibilityChange);
		return () => window.removeEventListener('visibilitychange', handleVisibilityChange);
	});

	$: if (isOpen && initialMessage) {
		const msg = initialMessage;
		initialMessage = '';
		tick().then(() => sendMessage(msg));
	}

	$: if (isOpen) scrollToBottom();
</script>

{#if isOpen}
	<div class="chat-wrapper" class:is-open={isOpen}>
		<div class="modal-backdrop mobile-only" on:click={handleClose} transition:fade={{ duration: 200 }}></div>
		
		<div class="chat-container" 
			on:click|stopPropagation 
			transition:fly={{ y: 20, duration: 400, opacity: 0 }}
		>
			<header class="modal-header">
				<div class="header-left">
					<div class="prism-icon">
						<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="bevel"/>
							<path d="M12 6L13.5 10.5L18 12L13.5 13.5L12 18L10.5 13.5L6 12L10.5 10.5L12 6Z" fill="currentColor" class="inner-prism"/>
						</svg>
					</div>
					<div class="header-text">
						<h3>AI Assistant</h3>
						<span class="status">{isLoading ? 'AI is thinking...' : 'Neural context active'}</span>
					</div>
				</div>
				<button class="close-btn" on:click={handleClose}>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
				</button>
			</header>

			<div class="chat-content" bind:this={chatContent}>
				{#each messages as msg}
					<div class="message {msg.role}">
						<div class="message-bubble">
							{#if msg.content.includes('[ACTION:SHOW_CONTACT_FORM]')}
								<div class="markdown-body">
									{@html marked(msg.content.replace('[ACTION:SHOW_CONTACT_FORM]', ''))}
								</div>
								{#if !contactSubmitted}
									<form class="ag-ui-form" on:submit={handleContactSubmit}>
										<input name="name" placeholder="Your Name" required />
										<input name="email" type="email" placeholder="Your Email" required />
										<textarea name="note" placeholder="Quick note..."></textarea>
										<button type="submit">Submit Info</button>
									</form>
								{/if}
							{:else}
								<div class="markdown-body">
									{@html marked(msg.content)}
								</div>
							{/if}
						</div>
					</div>
				{/each}
				{#if isLoading}
					<div class="message assistant">
						<div class="message-bubble loading">
							<div class="typing-dot"></div>
							<div class="typing-dot"></div>
							<div class="typing-dot"></div>
						</div>
					</div>
				{/if}
			</div>

			<footer class="modal-footer">
				<div class="input-container">
					<input 
						bind:value={inputMessage}
						on:keydown={handleKeydown}
						placeholder="Message AI Assistant..."
						disabled={isLoading}
						maxlength={CHAR_LIMIT}
					/>
					<div class="char-count" class:near-limit={inputMessage.length > CHAR_LIMIT * 0.8}>
						{inputMessage.length}/{CHAR_LIMIT}
					</div>
					<button class="send-btn" on:click={() => sendMessage()} disabled={!inputMessage.trim() || isLoading}>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
					</button>
				</div>
			</footer>
		</div>
	</div>
{/if}

<style>
	.chat-wrapper {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		z-index: 2000;
		pointer-events: none;
	}

	.chat-wrapper.is-open { pointer-events: auto; }

	.chat-container {
		width: 400px;
		height: 550px;
		background: rgba(10, 10, 10, 0.85);
		backdrop-filter: blur(25px);
		-webkit-backdrop-filter: blur(25px);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 24px;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
		overflow: hidden;
	}

	.modal-header {
		padding: 1.2rem 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: rgba(255, 255, 255, 0.02);
	}

	.header-left { display: flex; align-items: center; gap: 0.8rem; }

	.prism-icon {
		width: 1.3rem;
		height: 1.3rem;
		animation: rotatePrism 8s infinite linear;
		color: #fff;
	}

	@keyframes rotatePrism { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
	.inner-prism { animation: pulseInner 2s infinite ease-in-out; }
	@keyframes pulseInner { 0%, 100% { opacity: 0.4; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1); } }

	.header-text h3 { margin: 0; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #fff; }
	.status { font-size: 0.6rem; color: rgba(255, 255, 255, 0.4); text-transform: uppercase; letter-spacing: 0.1em; }

	.close-btn { background: none; border: none; color: rgba(255, 255, 255, 0.3); cursor: pointer; padding: 0.5rem; transition: all 0.2s ease; }
	.close-btn:hover { color: #fff; transform: rotate(90deg); }
	.close-btn svg { width: 1.1rem; height: 1.1rem; }

	.chat-content {
		flex: 1;
		padding: 1.5rem;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		scrollbar-width: thin;
		scrollbar-color: rgba(255,255,255,0.1) transparent;
	}

	.message { display: flex; width: 100%; }
	.message.user { justify-content: flex-end; }
	.message.assistant { justify-content: flex-start; }

	.message-bubble {
		max-width: 85%;
		padding: 0.8rem 1.2rem;
		border-radius: 16px;
		font-size: 0.9rem;
		line-height: 1.5;
	}

	/* Markdown Styling */
	.markdown-body :global(p) { margin: 0 0 0.5rem 0; }
	.markdown-body :global(p:last-child) { margin-bottom: 0; }
	.markdown-body :global(ul), .markdown-body :global(ol) { margin: 0.5rem 0; padding-left: 1.2rem; }
	.markdown-body :global(li) { margin-bottom: 0.3rem; }
	.markdown-body :global(strong) { color: #fff; font-weight: 700; }
	.markdown-body :global(a) { color: #fff; text-decoration: underline; text-underline-offset: 2px; }

	.user .message-bubble {
		background: #fff;
		color: #000;
		border-bottom-right-radius: 4px;
	}

	.assistant .message-bubble {
		background: rgba(255, 255, 255, 0.05);
		color: rgba(255, 255, 255, 0.9);
		border-bottom-left-radius: 4px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.ag-ui-form {
		margin-top: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
	}

	.ag-ui-form input, .ag-ui-form textarea {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: #fff;
		padding: 0.6rem;
		border-radius: 8px;
		font-size: 0.85rem;
		font-family: inherit;
	}

	.ag-ui-form button {
		background: #fff;
		color: #000;
		border: none;
		padding: 0.6rem;
		border-radius: 8px;
		font-weight: 700;
		cursor: pointer;
		margin-top: 0.5rem;
	}

	.message-bubble.loading {
		display: flex;
		gap: 4px;
		padding: 1rem;
	}

	.typing-dot {
		width: 4px;
		height: 4px;
		background: rgba(255, 255, 255, 0.4);
		border-radius: 50%;
		animation: typing 1.4s infinite;
	}
	.typing-dot:nth-child(2) { animation-delay: 0.2s; }
	.typing-dot:nth-child(3) { animation-delay: 0.4s; }

	@keyframes typing { 0%, 100% { opacity: 0.3; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-4px); } }

	.modal-footer {
		padding: 1rem 1.5rem 1.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.05);
	}

	.input-container {
		display: flex;
		gap: 0.8rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.1);
		padding: 0.4rem 0.4rem 0.4rem 1.2rem;
		border-radius: 12px;
		align-items: center;
		position: relative;
	}

	.char-count {
		font-size: 0.6rem;
		color: rgba(255, 255, 255, 0.2);
		position: absolute;
		right: 3.5rem;
		pointer-events: none;
	}

	.char-count.near-limit { color: #ff4444; }

	input {
		flex: 1;
		background: none;
		border: none;
		color: #fff;
		font-size: 0.9rem;
		padding: 0.6rem 0;
		outline: none;
	}

	.send-btn {
		background: #fff;
		border: none;
		color: #000;
		width: 2.2rem;
		height: 2.2rem;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.send-btn:disabled { opacity: 0.3; cursor: default; }
	.send-btn svg { width: 1rem; height: 1rem; }

	@media (max-width: 768px) {
		.chat-wrapper { top: 0; left: 0; width: 100vw; height: 100vh; bottom: 0; right: 0; display: flex; align-items: center; justify-content: center; padding: 1rem; box-sizing: border-box; }
		.modal-backdrop { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.6); }
		.chat-container { width: 100%; height: 90vh; max-height: 700px; z-index: 2001; }
	}
</style>
