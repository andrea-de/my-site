<script>
	import { fade, scale, fly } from 'svelte/transition';
	export let isOpen = false;
	export let onClose = () => {};
</script>

{#if isOpen}
	<div class="chat-wrapper" class:is-open={isOpen}>
		<!-- Backdrop only on mobile -->
		<div class="modal-backdrop mobile-only" on:click={onClose} transition:fade={{ duration: 200 }}></div>
		
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
						<span class="status">Neural context active</span>
					</div>
				</div>
				<button class="close-btn" on:click={onClose}>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
				</button>
			</header>

			<div class="chat-content">
				<div class="placeholder-msg">
					<p>How can I help you with Andrea's technical background or projects?</p>
				</div>
			</div>

			<footer class="modal-footer">
				<div class="input-placeholder">Message AI Assistant...</div>
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

	@keyframes rotatePrism {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.inner-prism {
		animation: pulseInner 2s infinite ease-in-out;
	}

	@keyframes pulseInner {
		0%, 100% { opacity: 0.4; transform: scale(0.8); }
		50% { opacity: 1; transform: scale(1); }
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

	.chat-content {
		flex: 1;
		padding: 1.5rem;
		display: flex;
		align-items: flex-end;
	}

	.placeholder-msg {
		background: rgba(255, 255, 255, 0.05);
		padding: 1rem 1.2rem;
		border-radius: 16px 16px 16px 4px;
		max-width: 85%;
	}

	.placeholder-msg p {
		margin: 0;
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.8);
		line-height: 1.5;
	}

	.modal-footer {
		padding: 1.2rem 1.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.05);
	}

	.input-placeholder {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.1);
		padding: 0.8rem 1.2rem;
		border-radius: 12px;
		color: rgba(255, 255, 255, 0.2);
		font-size: 0.85rem;
	}

	.mobile-only { display: none; }

	@media (max-width: 768px) {
		.mobile-only { display: block; }

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
			padding: 1.5rem;
			box-sizing: border-box;
		}

		.modal-backdrop {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: rgba(0, 0, 0, 0.6);
			backdrop-filter: blur(8px);
			-webkit-backdrop-filter: blur(8px);
		}

		.chat-container {
			width: 100%;
			height: 80vh;
			max-height: 600px;
			z-index: 2001;
		}
	}
</style>
