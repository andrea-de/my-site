<script>
	import { fly } from 'svelte/transition';
	import { onDestroy } from 'svelte';
	import { chatSuggestions } from '$lib/chat-prompts';

	export let isVisible = false;
	export let onOpen = () => {};
	export let onDismiss = () => {};

	const ROTATE_MS = 9000;

	let promptIndex = 0;
	let dragOffsetX = 0;
	let swipeStartX = 0;
	let swipeActive = false;
	let swipeMoved = false;
	const rotateTimer = setInterval(() => {
		if (!isVisible) return;
		promptIndex = (promptIndex + 1) % chatSuggestions.length;
	}, ROTATE_MS);

	$: currentPrompt = chatSuggestions[promptIndex];
	$: shellOpacity = swipeActive ? Math.max(0.55, 1 - Math.abs(dragOffsetX) / 240) : 1;

	function showNextPrompt() {
		promptIndex = (promptIndex + 1) % chatSuggestions.length;
	}

	function handleTouchStart(event) {
		if (event.touches.length !== 1) return;
		swipeStartX = event.touches[0].clientX;
		dragOffsetX = 0;
		swipeActive = true;
		swipeMoved = false;
	}

	function handleTouchMove(event) {
		if (!swipeActive || event.touches.length !== 1) return;
		dragOffsetX = event.touches[0].clientX - swipeStartX;
		if (Math.abs(dragOffsetX) > 8) {
			swipeMoved = true;
		}
	}

	function handleTouchEnd() {
		if (!swipeActive) return;

		const shouldDismiss = Math.abs(dragOffsetX) > 72;
		swipeActive = false;

		if (shouldDismiss) {
			onDismiss();
			dragOffsetX = 0;
			swipeMoved = false;
			return;
		}

		dragOffsetX = 0;
		swipeMoved = false;
	}

	function handleOpen() {
		if (swipeMoved) return;
		onOpen(currentPrompt);
	}

	onDestroy(() => {
		clearInterval(rotateTimer);
	});
</script>

{#if isVisible}
	<div class="nudge-wrapper" transition:fly={{ y: 16, duration: 350 }}>
		<div
			class="nudge-shell"
			style={`transform: translateX(${dragOffsetX}px); opacity: ${shellOpacity};`}
			on:touchstart={handleTouchStart}
			on:touchmove={handleTouchMove}
			on:touchend={handleTouchEnd}
			on:touchcancel={handleTouchEnd}
		>
			<div class="nudge-top">
				<div class="nudge-meta">
					<div class="nudge-heading">
						<span class="eyebrow">Ask AI Agent</span>
						<span class="status">Live suggestion</span>
					</div>
					<button
						class="next-suggestion"
						type="button"
						aria-label="Show next suggestion"
						on:click={showNextPrompt}
					>
						Next
					</button>
				</div>
				<button class="dismiss" type="button" aria-label="Dismiss suggestion" on:click={onDismiss}>
					×
				</button>
			</div>

			<button class="nudge-bubble" type="button" on:click={handleOpen}>
				<span class="signal"></span>
				<span class="copy">{currentPrompt.tease}</span>
			</button>
		</div>
	</div>
{/if}

<style>
	.nudge-wrapper {
		position: fixed;
		right: 2rem;
		bottom: 2.8rem;
		z-index: 1100;
		width: min(24rem, calc(100vw - 4rem));
	}

	.nudge-shell {
		width: 100%;
		background: rgba(8, 12, 18, 0.92);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 24px;
		padding: 0.95rem;
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		box-shadow: 0 20px 45px rgba(0, 0, 0, 0.35);
		text-align: left;
		transition:
			transform 180ms ease,
			border-color 180ms ease,
			background 180ms ease,
			opacity 180ms ease;
	}

	.nudge-shell:hover {
		transform: translateY(-2px);
		border-color: rgba(255, 255, 255, 0.2);
		background: rgba(12, 18, 26, 0.96);
	}

	.nudge-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.8rem;
		margin-bottom: 0.65rem;
	}

	.nudge-meta {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		min-width: 0;
	}

	.nudge-heading {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.eyebrow {
		font-size: 0.62rem;
		font-weight: 700;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.62);
	}

	.status {
		font-size: 0.68rem;
		color: rgba(255, 255, 255, 0.38);
		text-transform: uppercase;
		letter-spacing: 0.12em;
	}

	.next-suggestion {
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.05);
		color: rgba(255, 255, 255, 0.72);
		border-radius: 999px;
		padding: 0.28rem 0.6rem;
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		cursor: pointer;
		flex-shrink: 0;
		transition:
			background 160ms ease,
			border-color 160ms ease,
			color 160ms ease;
	}

	.next-suggestion:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.2);
		color: rgba(255, 255, 255, 0.94);
	}

	.dismiss {
		border: none;
		background: none;
		color: rgba(255, 255, 255, 0.45);
		font-size: 1.25rem;
		line-height: 1;
		cursor: pointer;
		padding: 0;
		flex-shrink: 0;
	}

	.dismiss:hover {
		color: rgba(255, 255, 255, 0.9);
	}

	.nudge-bubble {
		width: 100%;
		display: flex;
		align-items: flex-start;
		gap: 0.7rem;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 16px;
		padding: 0.95rem 1rem;
		color: inherit;
		text-align: left;
		cursor: pointer;
		transition:
			transform 180ms ease,
			border-color 180ms ease,
			background 180ms ease;
	}

	.nudge-bubble:hover {
		transform: translateY(-1px);
		border-color: rgba(255, 255, 255, 0.16);
		background: rgba(255, 255, 255, 0.07);
	}

	.signal {
		width: 0.6rem;
		height: 0.6rem;
		border-radius: 999px;
		background: #7ee787;
		box-shadow: 0 0 0 0 rgba(126, 231, 135, 0.5);
		margin-top: 0.35rem;
		flex-shrink: 0;
		animation: ping 1.8s infinite;
	}

	.copy {
		font-size: 0.92rem;
		line-height: 1.45;
		color: rgba(255, 255, 255, 0.92);
	}

	@keyframes ping {
		0% {
			box-shadow: 0 0 0 0 rgba(126, 231, 135, 0.5);
		}
		70% {
			box-shadow: 0 0 0 10px rgba(126, 231, 135, 0);
		}
		100% {
			box-shadow: 0 0 0 0 rgba(126, 231, 135, 0);
		}
	}

	@media (max-width: 768px) {
		.nudge-wrapper {
			left: 1rem;
			right: 1rem;
			bottom: 1rem;
			width: auto;
		}

		.copy {
			font-size: 0.88rem;
		}
	}
</style>
