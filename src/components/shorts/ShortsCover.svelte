<script>
	// The first screen of /shorts: who made the videos, the Sound and Full screen switches, and
	// the cue to start: a swipe up or a scroll (or a tap on the cue). The feed's control row
	// under it offers the ways out.
	// It sits in the feed's stage above the first video, like one more item: ShortsFeed moves
	// it (`shift`: 0 showing, 1 slid up out of sight) and its gestures reach the stage's
	// handlers. Its frame is sized in CSS from the stage (a size container), so the copy the
	// page shows while the videos load, in the same layout, is exactly the same size.
	import { createEventDispatcher } from 'svelte';

	/** The company a job link (/shorts/<code>) was made for, or null. */
	export let company = null;
	/** True until the feed can play: the switches and the cue wait. */
	export let loading = false;
	/** Whether the feed will play with sound, and whether the page is full screen. */
	export let sound = true;
	export let fullscreen = false;
	/** False where the page can't go full screen (iPhone Safari): that switch is hidden. */
	export let canFullscreen = false;
	/** A deep link's video, named under the line ("Starts on …"), or null. */
	export let startsOn = null;
	/** The stage's height, for `shift`. */
	export let height = 0;
	export let shift = 0;

	const dispatch = createEventDispatcher();

	$: hidden = shift >= 1;
</script>

<div class="cover" class:hidden aria-hidden={hidden}>
	<div class="slide" style={shift ? `transform: translate3d(0, ${-shift * height}px, 0)` : ''}>
		<div class="box">
			<div class="who">
				<p class="hello">{company ? `Hi ${company} team.` : 'Hi there.'}</p>
				<h1 class="name"><span>I'm Andrea</span><span>de Candia</span></h1>
				<p class="role">Product engineer</p>
				<p class="line">Short videos of my work.</p>
				{#if startsOn}
					<p class="starts">Starts on {startsOn}</p>
				{/if}

				<div class="switches">
					<button
						type="button"
						class="switch"
						role="switch"
						aria-checked={sound}
						disabled={loading}
						tabindex={hidden ? -1 : 0}
						on:click={() => dispatch('sound')}
					>
						<svg viewBox="0 0 24 24" aria-hidden="true"
							><path class="solid" d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />{#if sound}<path
									d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"
								/>{:else}<path d="M16 9.5l5 5m0-5l-5 5" />{/if}</svg
						>
						<span class="label">Sound</span>
						<span class="knob" aria-hidden="true"><i></i></span>
					</button>
					{#if canFullscreen}
						<button
							type="button"
							class="switch"
							role="switch"
							aria-checked={fullscreen}
							tabindex={hidden ? -1 : 0}
							on:click={() => dispatch('fullscreen')}
						>
							<svg viewBox="0 0 24 24" aria-hidden="true"
								><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg
							>
							<span class="label">Full screen</span>
							<span class="knob" aria-hidden="true"><i></i></span>
						</button>
					{/if}
				</div>
			</div>

			<button
				type="button"
				class="start"
				disabled={loading}
				tabindex={hidden ? -1 : 0}
				on:click={() => dispatch('start')}
			>
				<span class="chevron" aria-hidden="true">
					<svg viewBox="0 0 24 24" class="touch"><path d="M6 15l6-6 6 6" /></svg>
					<svg viewBox="0 0 24 24" class="mouse"><path d="M6 9l6 6 6-6" /></svg>
				</span>
				<span class="touch">{loading ? 'Loading…' : 'Swipe up to start'}</span>
				<span class="mouse">{loading ? 'Loading…' : 'Scroll to start'}</span>
			</button>
		</div>
	</div>
</div>

<style>
	/* Fills the stage, which clips it as it does the videos. */
	.cover {
		position: absolute;
		inset: 0;
		z-index: 3;
		color: var(--fg, #f3f1ec);
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
	}

	.cover.hidden {
		visibility: hidden;
	}

	.slide {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		will-change: transform;
	}

	/* The frame every item of the feed gets (ShortsFeed's .frame: 9:16, the stage's width or
	   its height less 20px), so the cover reads as the feed's first card. */
	.box {
		width: min(100cqw, (100cqh - 20px) * 9 / 16);
		aspect-ratio: 9 / 16;
		box-sizing: border-box;
		padding: 0 22px 14px;
		display: flex;
		flex-direction: column;
		border-radius: 20px;
		overflow: hidden;
		container-type: inline-size;
		background: radial-gradient(120% 70% at 85% 0%, rgba(67, 56, 202, 0.38), transparent 60%),
			radial-gradient(90% 60% at 0% 100%, rgba(20, 184, 166, 0.16), transparent 70%), #0c0d0f;
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	.hello {
		margin: 0 0 6px;
		font: 600 clamp(17px, 6.4cqw, 26px) / 1.2 var(--display);
		letter-spacing: -0.01em;
		color: #d6d4cf;
	}

	.who {
		margin-top: auto;
		margin-bottom: auto;
		padding-top: 20px;
	}

	.name {
		margin: 0;
		display: grid;
		font: 700 clamp(36px, 15.5cqw, 92px) / 0.92 var(--display);
		letter-spacing: -0.035em;
	}

	.role {
		margin: 14px 0 0;
		font: 500 13px/1 var(--mono);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--accent);
	}

	.line {
		margin: 16px 0 0;
		max-width: 30ch;
		font: clamp(15px, 4.6cqw, 18px) / 1.4 var(--body);
		color: #d6d4cf;
	}

	.starts {
		margin: 8px 0 0;
		font: 13px/1.35 var(--body);
		color: var(--muted);
	}

	.switches {
		margin-top: 24px;
		display: grid;
		gap: 8px;
		max-width: 300px;
	}

	/* A row with its label and an on/off knob, the whole row the target. */
	.switch {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 11px 12px 11px 14px;
		border-radius: 14px;
		color: var(--fg);
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid var(--line);
		font: 600 15px/1 var(--body);
		text-align: left;
		cursor: pointer;
	}

	.switch:disabled {
		opacity: 0.6;
		cursor: default;
	}

	.switch svg {
		width: 20px;
		height: 20px;
		flex: none;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.8;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.switch svg .solid {
		fill: currentColor;
		stroke: none;
	}

	.switch .label {
		flex: 1;
	}

	.knob {
		position: relative;
		flex: none;
		width: 40px;
		height: 24px;
		border-radius: 999px;
		box-sizing: border-box;
		background: rgba(255, 255, 255, 0.18);
		border: 1px solid var(--line);
		transition: background-color 0.2s;
	}

	.knob i {
		position: absolute;
		top: 3px;
		left: 3px;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--fg);
		transition: transform 0.2s;
	}

	.switch[aria-checked='true'] .knob {
		background: var(--accent);
	}

	.switch[aria-checked='true'] .knob i {
		transform: translateX(16px);
		background: #000;
	}

	/* The way in: a swipe up or a scroll, said plainly, and a tap on it works too. */
	.start {
		align-self: center;
		display: grid;
		justify-items: center;
		gap: 8px;
		margin: 0;
		padding: 6px 14px;
		background: none;
		border: 0;
		color: var(--fg);
		font: 600 13px/1 var(--body);
		letter-spacing: 0.02em;
		cursor: pointer;
	}

	.start:disabled {
		opacity: 0.6;
		cursor: default;
	}

	.chevron {
		width: 46px;
		height: 46px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		color: #000;
		background: var(--fg);
		animation: nudge 1.8s ease-in-out infinite;
	}

	.chevron svg {
		width: 24px;
		height: 24px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2.4;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	/* Touch screens swipe up; a mouse scrolls down. */
	.start .mouse {
		display: none;
	}

	@media (hover: hover) and (pointer: fine) {
		.start .touch {
			display: none;
		}
		.start .mouse {
			display: inline;
		}
		.chevron {
			animation-name: nudge-down;
		}
	}

	@keyframes nudge-down {
		0%,
		60%,
		100% {
			transform: translateY(0);
		}
		30% {
			transform: translateY(6px);
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

	button:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	@media (max-height: 600px) {
		.name {
			font-size: clamp(30px, 11vh, 64px);
		}
		.switches {
			margin-top: 14px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.chevron {
			animation: none;
		}
	}
</style>
