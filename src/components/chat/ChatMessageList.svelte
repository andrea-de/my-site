<script>
	import { createEventDispatcher } from 'svelte';
	import ChatMessageItem from './ChatMessageItem.svelte';

	export let messages = [];
	export let isLoading = false;
	export let contactSubmitted = false;
	export let scrollContainer;

	const dispatch = createEventDispatcher();

	function handleContactSubmit(event) {
		dispatch('contactsubmit', event.detail);
	}
</script>

<div class="chat-content" bind:this={scrollContainer}>
	{#each messages as msg}
		<ChatMessageItem {msg} {contactSubmitted} on:contactsubmit={handleContactSubmit} />
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

<style>
	.chat-content {
		flex: 1;
		padding: 1.5rem;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		scrollbar-width: thin;
		scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
	}

	.message {
		display: flex;
		width: 100%;
	}

	.message.assistant {
		justify-content: flex-start;
	}

	.message-bubble.loading {
		display: flex;
		gap: 4px;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.05);
		border-bottom-left-radius: 4px;
		border-radius: 16px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.typing-dot {
		width: 4px;
		height: 4px;
		background: rgba(255, 255, 255, 0.4);
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
		0%,
		100% {
			opacity: 0.3;
			transform: translateY(0);
		}
		50% {
			opacity: 1;
			transform: translateY(-4px);
		}
	}
</style>
