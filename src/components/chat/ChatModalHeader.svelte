<script>
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
			<span class="status">{isLoading ? 'AI is thinking...' : 'Neural context active'}</span>
		</div>
	</div>
	<button class="close-btn" on:click={onClose}>
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
			<path d="M18 6L6 18M6 6l12 12" />
		</svg>
	</button>
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
