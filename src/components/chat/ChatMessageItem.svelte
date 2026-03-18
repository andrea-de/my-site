<script>
	import { createEventDispatcher } from 'svelte';
	import ChatContactForm from './ChatContactForm.svelte';
	import { renderMarkdown } from '$lib/chat-modal/markdown';

	export let msg;
	export let contactSubmitted = false;

	const dispatch = createEventDispatcher();
	const contactToken = '[ACTION:SHOW_CONTACT_FORM]';

	function handleContactSubmit(event) {
		dispatch('contactsubmit', event.detail);
	}
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

		{#if msg.content.includes(contactToken)}
			<div class="markdown-body">
				{@html renderMarkdown(msg.content.replace(contactToken, ''))}
			</div>
			{#if !contactSubmitted}
				<ChatContactForm on:submit={handleContactSubmit} />
			{/if}
		{:else}
			<div class="markdown-body">
				{@html renderMarkdown(msg.content)}
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
		max-width: 85%;
		padding: 0.8rem 1.2rem;
		border-radius: 16px;
		font-size: 0.9rem;
		line-height: 1.5;
	}

	.message-tag {
		margin-bottom: 0.45rem;
		font-size: 0.58rem;
		font-weight: 800;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		opacity: 0.9;
	}

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

	.markdown-body :global(a) {
		color: currentColor;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

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
</style>
