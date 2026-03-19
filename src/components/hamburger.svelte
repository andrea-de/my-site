<script>
	export let isActive = false;
	export let onChatClick = () => {};

	let y = 0;
	$: isScrolled = y > 100;
	$: showLeadingSlot = isScrolled || isActive;
</script>

<svelte:window bind:scrollY={y} />

<div class="header-container" class:scrolled={isScrolled} class:menu-open={isActive}>
	<div class="pill-button" class:active={isActive}>
		{#if showLeadingSlot}
			<div class="leading-slot" class:is-hidden={isActive} aria-hidden={isActive}>
				<button
					type="button"
					class="ai-trigger-header"
					on:click={onChatClick}
					aria-label="Open chat"
					disabled={isActive}
					tabindex={isActive ? -1 : 0}
				>
					<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="prism-svg">
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
					<span class="chat-label">Chat</span>
				</button>
				<span class="header-divider" aria-hidden="true"></span>
			</div>
		{/if}

		<button
			type="button"
			class="menu-toggle"
			on:click={() => (isActive = !isActive)}
			aria-label="Toggle Menu"
			aria-expanded={isActive}
		>
			<div class="branding" class:visible={isScrolled || isActive}>
				<span class="name">Andrea de Candia</span>
			</div>
			<div class="hamburger">
				<div class="line line-1"></div>
				<div class="line line-2"></div>
			</div>
		</button>
	</div>
</div>

<style>
	.header-container {
		position: fixed;
		top: 1.5rem;
		right: 1.5rem;
		z-index: 100;
		transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
	}

	.pill-button {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 0.8rem 1.1rem;
		background: rgba(255, 255, 255, 0.03);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 3.5rem;
		cursor: pointer;
		transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		overflow: hidden;
		width: auto;
		min-width: 3.6rem;
	}

	.pill-button:hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.25);
		transform: translateY(-2px);
	}

	.ai-trigger-header {
		color: rgba(255, 255, 255, 0.8);
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.45rem;
		margin-right: 0;
		flex-shrink: 0;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		font: inherit;
	}

	.leading-slot {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		overflow: hidden;
		max-width: 7rem;
		transition:
			max-width 0.32s cubic-bezier(0.22, 1, 0.36, 1),
			opacity 0.24s ease,
			transform 0.32s cubic-bezier(0.22, 1, 0.36, 1),
			visibility 0.24s ease;
	}

	.leading-slot.is-hidden {
		max-width: 0;
		opacity: 0;
		visibility: hidden;
		transform: translateX(0.35rem);
		pointer-events: none;
	}

	.menu-toggle {
		display: flex;
		align-items: center;
		background: none;
		border: none;
		color: inherit;
		padding: 0;
		cursor: pointer;
		font: inherit;
	}

	.ai-trigger-header:focus-visible,
	.menu-toggle:focus-visible {
		outline: 2px solid rgba(255, 255, 255, 0.8);
		outline-offset: 4px;
	}

	.ai-trigger-header:disabled {
		cursor: default;
	}

	.prism-svg {
		width: 1.3rem;
		height: 1.3rem;
		animation: rotatePrism 8s infinite linear;
	}

	.chat-label {
		color: rgba(255, 255, 255, 0.82);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		font-size: 0.74rem;
		line-height: 1;
	}

	.header-divider {
		width: 1px;
		height: 1.5rem;
		margin: 0 0.85rem 0 0.75rem;
		background: rgba(255, 255, 255, 0.16);
		flex-shrink: 0;
	}

	.inner-prism {
		animation: pulseInner 2s infinite ease-in-out;
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

	.hamburger {
		width: 1.4rem;
		height: 1.4rem;
		display: flex;
		justify-content: center;
		align-items: center;
		position: relative;
		flex-shrink: 0;
	}

	.line {
		width: 1.3rem;
		height: 2px;
		background-color: #fff;
		position: absolute;
		transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
	}

	.line-1 {
		transform: translateY(-4px);
	}
	.line-2 {
		transform: translateY(4px);
	}

	.pill-button.active .line-1 {
		transform: translateY(0) rotate(45deg);
	}
	.pill-button.active .line-2 {
		transform: translateY(0) rotate(-45deg);
	}

	.branding {
		display: flex;
		align-items: center;
		width: 0;
		opacity: 0;
		transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
		white-space: nowrap;
		overflow: hidden;
		text-align: right;
	}

	.branding.visible {
		width: auto;
		max-width: 250px;
		opacity: 1;
		margin-left: 0;
		margin-right: 0.85rem;
	}

	.name {
		display: block;
		color: #fff;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		font-size: 0.8rem;
		line-height: 1;
	}

	/* Scrolled or Menu Open State */
	.header-container.scrolled .pill-button,
	.header-container.menu-open .pill-button {
		max-width: 450px;
		background: rgba(0, 0, 0, 0.75);
		border-color: rgba(255, 255, 255, 0.2);
	}

	@media (max-width: 768px) {
		.header-container {
			top: 1rem;
			right: 1rem;
		}

		.branding.visible {
			width: auto;
			max-width: 200px;
		}

		.name {
			font-size: 0.75rem;
		}

		.chat-label {
			font-size: 0.68rem;
		}

		.header-divider {
			margin: 0 0.7rem 0 0.6rem;
		}
	}
</style>
