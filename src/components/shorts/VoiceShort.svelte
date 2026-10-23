<script>
	// The AI voice short: the Welcome screen's voice agent (its orb and the capabilities
	// under it, see intro/capabilities.js) as an item of the /shorts feed, in the same frame
	// as the videos. Nothing starts until a tap: the orb opens the site's own voice mode,
	// a capability opens the chat with its question asked. ShortsFeed closes either when the
	// feed moves on, which ends the call and releases the microphone.
	// A narrated intro, if any (VOICE_INTRO in $lib/shorts), is not played here: ShortsFeed
	// plays it on its shared <video> over this layout, then hands over.
	import { createEventDispatcher, onDestroy } from 'svelte';
	import { CAPABILITIES } from '../intro/capabilities';

	/** True while this is the feed's current item: the capabilities rotate, buttons take focus. */
	export let active = false;
	/**
	 * True while the feed's intro video plays over this layout (its last frame is this layout
	 * at rest): everything holds still, and the capabilities don't change, so the swap at its
	 * end is invisible; then the idle motion starts from its first frame.
	 */
	export let waiting = false;

	// Laid out at a 390px phone's frame (358px) and scaled to the real one, as the intro video
	// is (it was rendered from this markup at that size), so the two match at any width.
	const DESIGN_W = 358;
	let frameW = DESIGN_W;
	let frameH = (DESIGN_W * 16) / 9;
	// Fitted whole and centred, as the intro video is: on most phones the frame is taller than
	// 9:16 and the layout sits in its middle; on a wide, short screen it fits the height instead.
	$: scale = Math.min(frameW / DESIGN_W, frameH / ((DESIGN_W * 16) / 9)) || 1;
	$: top = Math.max(0, (frameH - (DESIGN_W * 16 * scale) / 9) / 2);
	$: left = Math.max(0, (frameW - DESIGN_W * scale) / 2);

	const dispatch = createEventDispatcher();

	// Two capabilities show; every few seconds one gives way to the next, as on the Welcome screen.
	let shown = [0, 1];
	let turn = 0;
	let timer;

	function rotate() {
		const next = (Math.max(...shown) + 1) % CAPABILITIES.length;
		shown[turn] = next === shown[1 - turn] ? (next + 1) % CAPABILITIES.length : next;
		turn = 1 - turn;
	}

	$: {
		clearInterval(timer);
		if (active && !waiting) timer = setInterval(rotate, 3800);
	}

	onDestroy(() => clearInterval(timer));

	// A card shown under the intro skips its fade-in for good (set on the element, since
	// turning an animation back on would replay it at the swap).
	function settled(node, quiet) {
		if (quiet) node.style.animation = 'none';
	}
</script>

<div class="fit" bind:clientWidth={frameW} bind:clientHeight={frameH}>
	<div class="voice" class:waiting style="transform: translate({left}px, {top}px) scale({scale})">
		<div class="top">
			<p class="eyebrow">AI voice agent</p>
			<h2>My agent knows my work inside out.</h2>
			<p class="lede">Tap the orb and ask it anything.</p>
		</div>

		<div class="orb-stage">
			<span class="ring outer" aria-hidden="true"></span>
			<span class="ring inner" aria-hidden="true"></span>
			<button
				type="button"
				class="orb"
				aria-label="Talk to the voice agent"
				tabindex={active ? 0 : -1}
				on:click={() => dispatch('talk')}
			>
				{#each [10, 22, 34, 44, 34, 22, 10] as h, n}
					<span class="bar" style="height: {h}px; animation-delay: {n * 120}ms"></span>
				{/each}
			</button>
		</div>

		<div class="skills">
			{#each shown as k, slot (slot)}
				{#key k}
					<button
						type="button"
						class="skill"
						use:settled={waiting}
						tabindex={active ? 0 : -1}
						on:click={() => dispatch('ask', CAPABILITIES[k])}
					>
						<svg viewBox="0 0 24 24" aria-hidden="true"
							><path
								d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
								class="outline"
							/><path
								d="M12 6L13.5 10.5L18 12L13.5 13.5L12 18L10.5 13.5L6 12L10.5 10.5L12 6Z"
							/></svg
						>
						<span>{CAPABILITIES[k].label}</span>
					</button>
				{/key}
			{/each}
		</div>

		<p class="cue" aria-hidden="true">
			<svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6" /></svg>
			<span>The videos</span>
		</p>
	</div>
</div>

<style>
	/* Fills the feed's frame, which gives it the cover's look. */
	.fit {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}

	/* The design frame (9:16 at 358px), scaled to fit the real one from its top left and moved
	   to its middle. */
	.voice {
		position: absolute;
		top: 0;
		left: 0;
		width: 358px;
		aspect-ratio: 9 / 16;
		transform-origin: 0 0;
		box-sizing: border-box;
		padding: 26px 20px 12px;
		display: flex;
		flex-direction: column;
		container-type: inline-size;
		color: var(--fg, #f3f1ec);
		background: radial-gradient(90% 55% at 50% 52%, rgba(79, 70, 229, 0.32), transparent 70%),
			radial-gradient(120% 70% at 85% 0%, rgba(67, 56, 202, 0.3), transparent 60%), #0c0d0f;
		user-select: none;
		-webkit-user-select: none;
	}

	.eyebrow {
		margin: 0;
		font: 500 12px/1 var(--mono);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--accent);
	}

	h2 {
		margin: 12px 0 0;
		font: 700 clamp(22px, 9cqw, 40px) / 1.05 var(--display);
		letter-spacing: -0.025em;
	}

	.lede {
		margin: 10px 0 0;
		font: clamp(14px, 4.4cqw, 17px) / 1.4 var(--body);
		color: #d6d4cf;
	}

	.orb-stage {
		flex: 1;
		min-height: 120px;
		position: relative;
		display: grid;
		place-items: center;
	}

	.ring {
		position: absolute;
		border-radius: 50%;
		border: 1px solid rgba(165, 180, 252, 0.35);
		animation: pulse 3.2s ease-in-out infinite;
	}

	.ring.outer {
		width: min(62cqw, 230px);
		aspect-ratio: 1;
		border-color: rgba(165, 180, 252, 0.2);
		animation-delay: 0.2s;
	}

	.ring.inner {
		width: min(46cqw, 170px);
		aspect-ratio: 1;
		border-color: rgba(165, 180, 252, 0.5);
	}

	.orb {
		position: relative;
		width: min(32cqw, 120px);
		aspect-ratio: 1;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: #4f46e5;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		cursor: pointer;
		box-shadow: 0 0 40px rgba(79, 70, 229, 0.45);
		transition: background-color 0.2s ease;
	}

	.orb:hover {
		background: #5b52f0;
	}

	.bar {
		width: 4px;
		border-radius: 2px;
		background: #fff;
		animation: breathe 2.4s ease-in-out infinite;
	}

	.skills {
		display: grid;
		gap: 8px;
	}

	.skill {
		min-height: 3.2rem;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px 12px;
		border: 1px solid #27272a;
		border-radius: 16px;
		background: rgba(17, 17, 20, 0.85);
		color: #d4d4d8;
		font: 500 13px/1.35 var(--body);
		text-align: left;
		cursor: pointer;
		animation: skill-in 0.5s ease-out;
	}

	.skill:hover {
		border-color: #4338ca;
	}

	.skill svg {
		flex: none;
		width: 18px;
		height: 18px;
		fill: currentColor;
		color: #a5b4fc;
	}

	.skill .outline {
		fill: none;
		stroke: currentColor;
		stroke-width: 1.5;
		stroke-linejoin: bevel;
	}

	.cue {
		margin: 10px 0 0;
		align-self: center;
		display: grid;
		justify-items: center;
		gap: 2px;
		font: 500 11px/1 var(--mono);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
		opacity: 0.75;
		animation: nudge 2.4s ease-in-out infinite;
	}

	.cue svg {
		width: 22px;
		height: 22px;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.8;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	button:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	@keyframes breathe {
		0%,
		100% {
			transform: scaleY(1);
		}
		50% {
			transform: scaleY(0.55);
		}
	}

	@keyframes pulse {
		0%,
		100% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(1.06);
			opacity: 0.55;
		}
	}

	@keyframes skill-in {
		from {
			opacity: 0;
			filter: blur(5px);
		}
	}

	@keyframes nudge {
		0%,
		60%,
		100% {
			transform: translateY(0);
		}
		30% {
			transform: translateY(-6px);
		}
	}

	/* Short screens keep one, so the orb still has room. */
	@media (max-height: 700px) {
		.skills > :nth-child(2) {
			display: none;
		}
	}

	/* Held at their first frame (the intro's last) until the swap. */
	.waiting .ring,
	.waiting .bar,
	.waiting .cue {
		animation-play-state: paused;
	}

	@media (prefers-reduced-motion: reduce) {
		.ring,
		.bar,
		.skill,
		.cue {
			animation: none;
		}
	}
</style>
