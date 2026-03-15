<script>
	import { fade, scale } from 'svelte/transition';
	export let x = 0;
	export let y = 0;
	export let isVisible = false;
	export let onClick = () => {};
</script>

{#if isVisible}
	<button 
		class="context-tooltip" 
		style="top: {y}px; left: {x}px;"
		transition:scale={{ duration: 200, start: 0.9 }}
		on:click|stopPropagation={onClick}
	>
		<div class="prism-icon">
			<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="bevel"/>
				<path d="M12 6L13.5 10.5L18 12L13.5 13.5L12 18L10.5 13.5L6 12L10.5 10.5L12 6Z" fill="currentColor" class="inner-prism"/>
			</svg>
		</div>
		<span class="text">Ask Agent</span>
	</button>
{/if}

<style>
	.context-tooltip {
		position: fixed;
		z-index: 3000;
		background: #fff;
		color: #000;
		padding: 0.6rem 1.2rem;
		border-radius: 2rem;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		border: none;
		cursor: pointer;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
		transform: translate(-50%, -120%);
		white-space: nowrap;
		pointer-events: auto;
	}

	.prism-icon {
		width: 1rem;
		height: 1rem;
		color: #000;
	}

	.text {
		font-size: 0.85rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.inner-prism {
		animation: pulseInner 2s infinite ease-in-out;
	}

	@keyframes pulseInner {
		0%, 100% { opacity: 0.4; transform: scale(0.8); }
		50% { opacity: 1; transform: scale(1); }
	}
</style>
