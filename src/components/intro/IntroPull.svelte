<script>
	import { onMount, onDestroy } from 'svelte';
	import { isChatCovering } from '$lib/stores/chat';
	import { openIntro, INTRO_CLASS, isPhoneWidth } from './intro-gate';

	// Pulling down past the top of the page (touch) or scrolling up again once
	// already at the top (wheel) brings the Welcome screen back.

	/** True while something else owns the screen, e.g. the menu. */
	export let disabled = false;

	const WHEEL_PULL = 280;
	const TOUCH_PULL = 120;
	// A wheel pull must start fresh at the top, so the momentum of scrolling up
	// to the top never opens it by itself.
	const WHEEL_GAP = 220;

	let progress = 0;
	let wheelTotal = 0;
	let lastWheel = 0;
	let armed = false;
	let decayTimer;
	let touchStartY = null;

	const blocked = () =>
		disabled ||
		$isChatCovering ||
		!isPhoneWidth() ||
		document.documentElement.classList.contains(INTRO_CLASS);

	function reset() {
		progress = 0;
		wheelTotal = 0;
		armed = false;
	}

	function trigger() {
		reset();
		touchStartY = null;
		openIntro();
	}

	function onWheel(e) {
		const now = performance.now();
		if (now - lastWheel > WHEEL_GAP) armed = window.scrollY <= 0 && e.deltaY < 0;
		lastWheel = now;
		if (!armed || blocked() || window.scrollY > 0) return;
		if (e.deltaY > 0) return reset();
		wheelTotal += -e.deltaY;
		progress = Math.min(1, wheelTotal / WHEEL_PULL);
		clearTimeout(decayTimer);
		decayTimer = setTimeout(reset, 350);
		if (progress >= 1) trigger();
	}

	function onTouchStart(e) {
		touchStartY = window.scrollY <= 0 && !blocked() ? e.touches[0].clientY : null;
	}

	function onTouchMove(e) {
		if (touchStartY === null) return;
		const dy = e.touches[0].clientY - touchStartY;
		progress = window.scrollY <= 0 && dy > 0 ? Math.min(1, dy / TOUCH_PULL) : 0;
	}

	function onTouchEnd() {
		if (touchStartY !== null && progress >= 1) trigger();
		touchStartY = null;
		reset();
	}

	onMount(() => {
		window.addEventListener('wheel', onWheel, { passive: true });
		window.addEventListener('touchstart', onTouchStart, { passive: true });
		window.addEventListener('touchmove', onTouchMove, { passive: true });
		window.addEventListener('touchend', onTouchEnd);
		window.addEventListener('touchcancel', onTouchEnd);
	});

	onDestroy(() => {
		clearTimeout(decayTimer);
		if (typeof window === 'undefined') return;
		window.removeEventListener('wheel', onWheel);
		window.removeEventListener('touchstart', onTouchStart);
		window.removeEventListener('touchmove', onTouchMove);
		window.removeEventListener('touchend', onTouchEnd);
		window.removeEventListener('touchcancel', onTouchEnd);
	});
</script>

<div
	class="pull"
	class:ready={progress >= 1}
	style="--p: {progress}"
	aria-hidden="true"
>
	<span class="mini-orb"><span></span><span></span><span></span></span>
	<span>{progress >= 1 ? 'Let go for Welcome' : 'Pull for Welcome'}</span>
</div>

<style>
	.pull {
		position: fixed;
		top: 0;
		left: 50%;
		z-index: 1500;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 7px 14px 7px 7px;
		border-radius: 22px;
		border: 1px solid #3730a3;
		background: #1e1b4b;
		color: #fff;
		font: 600 0.9rem 'Inter', sans-serif;
		white-space: nowrap;
		pointer-events: none;
		opacity: min(1, calc(var(--p) * 3));
		transform: translate(-50%, calc(-100% + var(--p) * 84px)) scale(calc(0.85 + var(--p) * 0.15));
		transition:
			transform 0.25s cubic-bezier(0.2, 0.9, 0.25, 1.2),
			opacity 0.2s ease;
	}

	.pull.ready {
		border-color: #818cf8;
	}

	.mini-orb {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: #4f46e5;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2px;
		transform: rotate(calc(var(--p) * 360deg));
	}

	.mini-orb span {
		width: 2px;
		height: 8px;
		border-radius: 1px;
		background: #fff;
	}

	.mini-orb span:nth-child(2) {
		height: 14px;
	}

	@media (prefers-reduced-motion: reduce) {
		.pull,
		.mini-orb {
			transition: none;
			transform: translate(-50%, calc(-100% + var(--p) * 84px));
		}
	}
</style>
