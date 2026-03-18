<script>
	import { fade, fly } from 'svelte/transition';

	export let isOpen = false;
	export let isComposerExpanded = false;
	export let onClose = () => {};
</script>

{#if isOpen}
	<div class="chat-wrapper" class:is-open={isOpen}>
		<div
			class="modal-backdrop mobile-only"
			on:click={onClose}
			transition:fade={{ duration: 200 }}
		></div>

		<div
			class="chat-container"
			class:composer-expanded={isComposerExpanded}
			on:click|stopPropagation
			transition:fly={{ y: 20, duration: 400, opacity: 0 }}
		>
			<slot />
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

	.chat-wrapper.is-open {
		pointer-events: auto;
	}

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

	.chat-container.composer-expanded :global(.chat-content) {
		display: none;
	}

	.mobile-only {
		display: none;
	}

	@media (max-width: 768px) {
		.chat-wrapper {
			top: 0;
			left: 0;
			width: 100vw;
			height: 100vh;
			bottom: 0;
			right: 0;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 1rem;
			box-sizing: border-box;
		}

		.mobile-only {
			display: block;
		}

		.modal-backdrop {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: rgba(0, 0, 0, 0.6);
		}

		.chat-container {
			width: 100%;
			height: 90vh;
			max-height: 700px;
			z-index: 2001;
		}
	}
</style>
