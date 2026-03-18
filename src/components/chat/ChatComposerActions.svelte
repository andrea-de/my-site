<script>
	import { createEventDispatcher } from 'svelte';

	export let inputMessage = '';
	export let isLoading = false;
	export let isExpanded = false;
	export let showExpandButton = false;

	const dispatch = createEventDispatcher();
</script>

<div class="composer-actions" class:expanded={isExpanded}>
	{#if showExpandButton}
		<button
			class="expand-btn"
			type="button"
			aria-label={isExpanded ? 'Collapse message editor' : 'Expand message editor'}
			on:click={() => dispatch('toggleexpand')}
		>
			{#if isExpanded}
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1">
					<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" />
					<path d="M3 8l6-5M21 8l-6-5M3 16l6 5M21 16l-6 5" />
				</svg>
			{:else}
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1">
					<path d="M9 3H3v6M15 3h6v6M9 21H3v-6M15 21h6v-6" />
					<path d="M3 9l7-7M21 9l-7-7M3 15l7 7M21 15l-7 7" />
				</svg>
			{/if}
		</button>
	{/if}

	<button
		class="send-btn"
		type="button"
		on:click={() => dispatch('send')}
		disabled={!inputMessage.trim() || isLoading}
	>
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
			<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
		</svg>
	</button>
</div>

<style>
	.composer-actions {
		display: flex;
		align-items: flex-end;
		gap: 0.45rem;
	}

	.composer-actions.expanded {
		height: 100%;
		align-self: stretch;
		justify-content: flex-end;
	}

	.expand-btn,
	.send-btn {
		width: 2.2rem;
		height: 2.2rem;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.expand-btn {
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.12);
		color: rgba(255, 255, 255, 0.82);
	}

	.send-btn {
		background: #fff;
		border: none;
		color: #000;
	}

	.expand-btn:hover {
		background: rgba(255, 255, 255, 0.12);
		color: #fff;
	}

	.send-btn:disabled {
		opacity: 0.3;
		cursor: default;
	}

	.expand-btn svg,
	.send-btn svg {
		width: 1rem;
		height: 1rem;
	}
</style>
