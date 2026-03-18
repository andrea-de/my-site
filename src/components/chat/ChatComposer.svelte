<script>
	import { createEventDispatcher } from 'svelte';
	import ChatComposerActions from './ChatComposerActions.svelte';

	export let inputMessage = '';
	export let isLoading = false;
	export let charLimit = 500;
	export let isExpanded = false;
	export let hasUserMessages = false;
	export let currentSuggestion = null;
	export let showExpandButton = false;
	export let textareaElement;

	const dispatch = createEventDispatcher();

	function handleInput(event) {
		dispatch('input', event.currentTarget.value);
	}
</script>

<footer class="modal-footer" class:expanded={isExpanded}>
	{#if !hasUserMessages && currentSuggestion}
		<div class="modal-suggestion-wrap">
			<button class="modal-suggestion-btn" type="button" on:click={() => dispatch('suggest')}>
				Suggested Prompt
			</button>
		</div>
	{/if}

	<div class="input-container" class:expanded={isExpanded}>
		<div class="composer-field">
			<textarea
				bind:this={textareaElement}
				bind:value={inputMessage}
				class="chat-input"
				on:input={handleInput}
				on:keydown={(event) => dispatch('keydown', event)}
				placeholder="Message AI Assistant..."
				disabled={isLoading}
				maxlength={charLimit}
				rows="1"
			></textarea>
			<div class="char-count" class:near-limit={inputMessage.length > charLimit * 0.8}>
				{inputMessage.length}/{charLimit}
			</div>
		</div>

		<ChatComposerActions
			{inputMessage}
			{isLoading}
			isExpanded={isExpanded}
			{showExpandButton}
			on:toggleexpand={() => dispatch('toggleexpand')}
			on:send={() => dispatch('send')}
		/>
	</div>
</footer>

<style>
	.modal-footer {
		padding: 1rem 1.5rem 1.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.05);
	}

	.modal-footer.expanded {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.modal-suggestion-wrap {
		display: flex;
		justify-content: center;
		margin-bottom: 0.85rem;
	}

	.modal-suggestion-btn {
		padding: 0.72rem 1rem;
		border-radius: 999px;
		border: 1px solid rgba(126, 231, 135, 0.18);
		background: rgba(126, 231, 135, 0.08);
		color: #f4fff7;
		cursor: pointer;
		text-align: center;
		font-size: 0.74rem;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		transition: background 160ms ease, border-color 160ms ease, transform 160ms ease;
	}

	.modal-suggestion-btn:hover {
		background: rgba(126, 231, 135, 0.12);
		border-color: rgba(126, 231, 135, 0.28);
		transform: translateY(-1px);
	}

	.input-container {
		display: flex;
		gap: 0.75rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.1);
		padding: 0.7rem 0.7rem 0.7rem 1rem;
		border-radius: 12px;
		align-items: flex-end;
	}

	.input-container.expanded {
		flex: 1;
		align-items: stretch;
	}

	.composer-field {
		flex: 1;
		position: relative;
		min-width: 0;
		padding-bottom: 0.95rem;
	}

	.input-container.expanded .composer-field {
		display: flex;
		flex: 1;
		min-height: 0;
	}

	.chat-input {
		width: 100%;
		min-height: 2.6rem;
		max-height: calc((1.45em * 3) + 1rem);
		background: none;
		border: none;
		color: #fff;
		font-size: 0.94rem;
		line-height: 1.45;
		padding: 0;
		outline: none;
		resize: none;
		overflow-x: hidden;
		overflow-y: hidden;
		font-family: inherit;
	}

	.input-container.expanded .chat-input {
		flex: 1;
		height: 100%;
		max-height: none;
		padding-right: 0.2rem;
	}

	.char-count {
		font-size: 0.6rem;
		color: rgba(255, 255, 255, 0.2);
		position: absolute;
		right: 0;
		bottom: 0;
		pointer-events: none;
	}

	.char-count.near-limit {
		color: #ff4444;
	}

	@media (max-width: 768px) {
		.modal-footer {
			padding: 0.9rem 1rem 1.2rem;
		}
	}
</style>
