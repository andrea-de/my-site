<script>
	import { scale } from 'svelte/transition';
	export let isDocked = false;
	export let isMenuActive = false;
	export let onChatClick = () => {};
</script>

{#if !isDocked && !isMenuActive}
<div class="ai-button-wrapper" transition:scale={{ duration: 300, start: 0.8 }}>
	<button class="ai-btn" aria-label="Chat with my AI" on:click={onChatClick}>
		<div class="prism-container">
			<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="prism-svg">
				<path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="bevel"/>
				<path d="M12 6L13.5 10.5L18 12L13.5 13.5L12 18L10.5 13.5L6 12L10.5 10.5L12 6Z" fill="currentColor" class="inner-prism"/>
			</svg>
		</div>
		<span class="btn-text">Chat with my AI</span>
	</button>
</div>
{/if}

<style>
	.ai-button-wrapper {
		position: fixed;
		bottom: 3rem;
		right: 2rem;
		z-index: 1000;
	}

	.ai-btn {
		background: #fff;
		color: #000;
		border: none;
		padding: 0.8rem 1.5rem;
		border-radius: 3rem;
		font-weight: 800;
		font-size: 0.9rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		box-shadow: 0 10px 40px rgba(255, 255, 255, 0.2);
		transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
	}

	.ai-btn:hover {
		transform: scale(1.05) translateY(-5px);
		box-shadow: 0 20px 50px rgba(255, 255, 255, 0.3);
	}

	.prism-container {
		width: 1.4rem;
		height: 1.4rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.prism-svg {
		width: 100%;
		height: 100%;
		animation: rotatePrism 8s infinite linear;
	}

	.inner-prism {
		animation: pulseInner 2s infinite ease-in-out;
	}

	@keyframes rotatePrism {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	@keyframes pulseInner {
		0%, 100% { opacity: 0.4; transform: scale(0.8); }
		50% { opacity: 1; transform: scale(1); }
	}

	@media (max-width: 768px) {
		.ai-button-wrapper {
			bottom: 2rem;
			right: 1.5rem;
		}
	}
</style>
