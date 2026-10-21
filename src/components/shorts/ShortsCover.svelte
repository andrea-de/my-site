<script>
	// The first screen of /shorts: who made the videos, two ways to start (the feed's
	// control row under it offers the ways out).
	// It sits in the feed's stage above the first video, like one more item: ShortsFeed moves
	// it (`shift`: 0 showing, 1 slid up out of sight) and its gestures reach the stage's
	// handlers. Its frame is sized in CSS from the stage (a size container), so the copy the
	// page shows while the videos load, in the same layout, is exactly the same size.
	import { createEventDispatcher } from 'svelte';

	/** The company a job link (/shorts/<code>) was made for, or null. */
	export let company = null;
	/** True until the feed can play: the buttons wait. */
	export let loading = false;
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

				<div class="buttons">
					<button
						type="button"
						class="primary"
						disabled={loading}
						tabindex={hidden ? -1 : 0}
						on:click={() => dispatch('play', { sound: true })}
					>
						<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" /></svg>
						<span>{loading ? 'Loading…' : 'Play with sound'}</span>
					</button>
					<button
						type="button"
						class="secondary"
						disabled={loading}
						tabindex={hidden ? -1 : 0}
						on:click={() => dispatch('play', { sound: false })}
					>
						<svg viewBox="0 0 24 24" aria-hidden="true"
							><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" /><path
								class="stroke"
								d="M16 9.5l5 5m0-5l-5 5"
							/></svg
						>
						<span>Play muted</span>
					</button>
				</div>
			</div>

			<p class="cue" aria-hidden="true">
				<svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6" /></svg>
				<span class="touch">Swipe up</span>
				<span class="mouse">Scroll</span>
			</p>
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

	.buttons {
		margin-top: 24px;
		display: grid;
		/* Side by side where they fit, stacked in a small frame. */
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 8px;
	}

	.buttons button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 7px;
		font: 600 15px/1 var(--body);
		border-radius: 999px;
		padding: 14px 12px;
		cursor: pointer;
		white-space: nowrap;
	}

	svg {
		flex: none;
	}

	.buttons svg {
		width: 18px;
		height: 18px;
		fill: currentColor;
	}

	svg .stroke {
		fill: none;
		stroke: currentColor;
		stroke-width: 1.8;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.primary {
		color: #000;
		background: var(--fg);
		border: 0;
	}

	.secondary {
		color: var(--fg);
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid var(--line);
	}

	.buttons button:disabled {
		opacity: 0.6;
		cursor: default;
	}

	.cue {
		margin: 0;
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

	.mouse {
		display: none;
	}

	@media (hover: hover) and (pointer: fine) {
		.touch {
			display: none;
		}
		.mouse {
			display: inline;
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
		.buttons {
			margin-top: 14px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.cue {
			animation: none;
		}
	}
</style>
