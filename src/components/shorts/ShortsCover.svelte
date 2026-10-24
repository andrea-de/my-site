<script>
	// The first screen of /shorts: who made the videos, the Sound and Full screen switches (one
	// row), the main feed's filters (Methods, Work, Products, each over a list of what it
	// holds, five at most), and the cue to start: a swipe up or a scroll (or a tap on the cue). The feed's control row
	// under it offers the ways out.
	// It sits in the feed's stage above the first video, like one more item: ShortsFeed moves
	// it (`shift`: 0 showing, 1 slid up out of sight) and its gestures reach the stage's
	// handlers. Its frame is sized in CSS from the stage (a size container), so the copy the
	// page shows while the videos load, in the same layout, is exactly the same size.
	import { createEventDispatcher } from 'svelte';

	/** The company a job link (/shorts/<code>) was made for, or null. */
	export let company = null;
	/** True until the feed can play: the switches and the cue wait, under the loading effect
	 *  (Sheen, Prism or Develop: html[data-loader], see shorts-loader.js). */
	export let loading = false;
	/** Whether the feed will play with sound, and whether the page is full screen. */
	export let sound = true;
	export let fullscreen = false;
	/** False where the page can't go full screen (iPhone Safari): that switch is hidden. */
	export let canFullscreen = false;
	/** A deep link's video, named under the line ("Starts on …"), or null. */
	export let startsOn = null;
	/** The main feed's filters ({ key, label, items }, see coverGroups), or none (a project's feed). */
	export let groups = [];
	/** Which of them are on, by key. */
	export let shown = {};
	/** The stage's height, for `shift`. */
	export let height = 0;
	export let shift = 0;

	const dispatch = createEventDispatcher();

	$: hidden = shift >= 1;
</script>

<div class="cover" class:hidden aria-hidden={hidden}>
	<div class="slide" style={shift ? `transform: translate3d(0, ${-shift * height}px, 0)` : ''}>
		<div class="box" class:loading>
			{#if loading}
				<!-- All three are here; html[data-loader] (set before the first paint) shows one. -->
				<span class="ld-sheen" aria-hidden="true"></span>
				<span class="ld-edge" aria-hidden="true"></span>
			{/if}
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

				{#if groups.length}
					<div class="groups">
						{#each groups as g (g.key)}
							<div class="group" class:off={!shown[g.key]}>
								<button
									type="button"
									class="filter"
									role="switch"
									aria-checked={!!shown[g.key]}
									disabled={loading}
									tabindex={hidden ? -1 : 0}
									on:click={() => dispatch('filter', g.key)}
								>
									<span class="tick" aria-hidden="true"></span>
									{g.label}
								</button>
								<!-- At most five; a longer list fades out on its fifth. -->
								<ul aria-label="{g.label} videos">
									{#each g.items.slice(0, 5) as name, n}<li
											class:fade={n === 4 && g.items.length > 5}>{name}</li
										>{/each}
								</ul>
							</div>
						{/each}
					</div>
				{/if}
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
					{#if loading}
						<span class="ld-prism"
							><span class="glow"></span><span class="ring"></span><span class="ring b"
							></span><svg viewBox="0 0 24 24"
								><path
									d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
									fill="none"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linejoin="bevel"
								/><path
									class="in"
									d="M12 6L13.5 10.5L18 12L13.5 13.5L12 18L10.5 13.5L6 12L10.5 10.5L12 6Z"
									fill="currentColor"
								/></svg
							></span
						>
					{/if}
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

	/* The frame every item of the feed gets (ShortsFeed's .frame: the stage's width, its height
	   less 20px), so the cover reads as the feed's first card. */
	.box {
		width: 100cqw;
		height: calc(100cqh - 20px);
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

	/* Sound and Full screen side by side, the frame's full width. */
	.switches {
		margin-top: 22px;
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: minmax(0, 1fr);
		gap: 8px;
	}

	/* The filters: three toggles in a row, each over a small list of what it holds. A filter
	   that's off sets its list in the mono face, struck through. */
	.groups {
		margin-top: 10px;
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 8px;
		align-items: start;
	}

	.filter {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 7px;
		padding: 9px 10px;
		border-radius: 12px;
		color: var(--fg);
		background: rgba(124, 212, 196, 0.12);
		border: 1px solid rgba(124, 212, 196, 0.45);
		font: 600 13px/1 var(--body);
		text-align: left;
		cursor: pointer;
		transition:
			background-color 0.2s,
			border-color 0.2s,
			color 0.2s;
	}

	.filter:disabled {
		opacity: 0.6;
		cursor: default;
	}

	.tick {
		flex: none;
		width: 14px;
		height: 14px;
		border-radius: 4px;
		box-sizing: border-box;
		background: var(--accent);
		border: 1px solid var(--accent);
		box-shadow: inset 0 0 0 2.5px #0c0d0f;
		transition: background-color 0.2s;
	}

	.off .filter {
		color: var(--muted);
		background: rgba(255, 255, 255, 0.04);
		border-color: var(--line);
	}

	.off .tick {
		background: none;
		border-color: var(--muted);
		box-shadow: none;
	}

	.group ul {
		margin: 7px 0 0;
		padding: 0 0 0 12px;
		list-style: disc;
		font: 11px/1.3 var(--body);
		color: #c9c7c2;
	}

	.group li {
		margin-bottom: 2px;
		overflow-wrap: break-word;
	}

	.group li.fade {
		-webkit-mask-image: linear-gradient(to bottom, #000 10%, transparent 95%);
		mask-image: linear-gradient(to bottom, #000 10%, transparent 95%);
	}

	.group li::marker {
		color: var(--accent);
	}

	.off li::marker {
		color: var(--muted);
	}

	/* The mono face is wider: long names end in an ellipsis rather than break mid-word. */
	.off li {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.off ul {
		font: 10.5px/1.35 var(--mono);
		color: var(--muted);
		text-decoration: line-through;
		opacity: 0.7;
	}

	/* A row with its label and an on/off knob, the whole row the target. */
	.switch {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 11px 12px 11px 14px;
		border-radius: 14px;
		color: var(--muted);
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid var(--line);
		font: 600 15px/1 var(--body);
		text-align: left;
		cursor: pointer;
		transition:
			background-color 0.2s,
			border-color 0.2s,
			color 0.2s;
	}

	/* On, like a filter that's on: teal tint and border. */
	.switch[aria-checked='true'] {
		color: var(--fg);
		background: rgba(124, 212, 196, 0.12);
		border-color: rgba(124, 212, 196, 0.45);
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

	/* ---- While loading: one of three effects, by html[data-loader] ---- */
	.box {
		position: relative;
	}

	.ld-sheen,
	.ld-edge,
	.ld-prism {
		display: none;
		pointer-events: none;
	}

	/* The "Loading…" label breathes under every effect. */
	.start:disabled .touch,
	.start:disabled .mouse {
		animation: ld-label 1.6s ease-in-out infinite;
	}

	@keyframes ld-label {
		50% {
			opacity: 0.35;
		}
	}

	/* Sheen: a teal shine sweeps the whole card. */
	:global(html[data-loader='sheen']) .ld-sheen {
		display: block;
		position: absolute;
		inset: -40%;
		background: linear-gradient(
			105deg,
			transparent 40%,
			rgba(124, 212, 196, 0.16) 48%,
			rgba(255, 255, 255, 0.22) 50%,
			rgba(124, 212, 196, 0.16) 52%,
			transparent 60%
		);
		animation: ld-sweep 1.6s cubic-bezier(0.5, 0, 0.3, 1) infinite;
	}

	@keyframes ld-sweep {
		from {
			transform: translateX(-60%);
		}
		to {
			transform: translateX(60%);
		}
	}

	/* Prism: the cue's arrow gives way to the chat prism, spinning in a glow. */
	:global(html[data-loader='prism']) .box.loading .chevron {
		background: none;
		animation: none;
		position: relative;
	}

	:global(html[data-loader='prism']) .box.loading .chevron > svg {
		display: none;
	}

	:global(html[data-loader='prism']) .ld-prism {
		display: grid;
		place-items: center;
		position: absolute;
		inset: 0;
		color: #fff;
	}

	.ld-prism .glow {
		position: absolute;
		inset: -26px;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(124, 212, 196, 0.55), rgba(124, 212, 196, 0) 65%);
		animation: ld-breathe 1.8s ease-in-out infinite;
	}

	.ld-prism .ring {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		border: 1.5px solid rgba(124, 212, 196, 0.8);
		animation: ld-ripple 1.8s ease-out infinite;
	}

	.ld-prism .ring.b {
		animation-delay: 0.9s;
	}

	.ld-prism svg {
		position: relative;
		width: 34px;
		height: 34px;
		fill: none;
		stroke: none;
		animation: ld-spin 3s linear infinite;
		filter: drop-shadow(0 0 8px rgba(124, 212, 196, 0.9));
	}

	.ld-prism svg .in {
		transform-origin: 12px 12px;
		animation: ld-pulse 1.8s ease-in-out infinite;
	}

	/* The disabled cue's dimming would dull the prism. */
	:global(html[data-loader='prism']) .start:disabled {
		opacity: 1;
	}

	@keyframes ld-breathe {
		0%,
		100% {
			opacity: 0.45;
			transform: scale(0.85);
		}
		50% {
			opacity: 1;
			transform: scale(1.05);
		}
	}

	@keyframes ld-ripple {
		from {
			transform: scale(0.6);
			opacity: 0.9;
		}
		to {
			transform: scale(2.2);
			opacity: 0;
		}
	}

	@keyframes ld-spin {
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes ld-pulse {
		0%,
		100% {
			opacity: 0.4;
			transform: scale(0.75);
		}
		50% {
			opacity: 1;
			transform: scale(1);
		}
	}

	/* Develop: a light runs round the card's edge, over drifting film grain. */
	:global(html[data-loader='develop']) .ld-edge {
		display: block;
		position: absolute;
		inset: 0;
		border-radius: inherit;
		padding: 2px;
		background: conic-gradient(
			from var(--ld-angle),
			transparent 0 70%,
			var(--accent, #7cd4c4) 85%,
			#fff 90%,
			transparent 95%
		);
		-webkit-mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		-webkit-mask-composite: xor;
		mask-composite: exclude;
		animation: ld-orbit 1.6s linear infinite;
	}

	:global(html[data-loader='develop']) .box.loading::after {
		content: '';
		position: absolute;
		inset: -50%;
		opacity: 0.14;
		background-image: radial-gradient(rgba(255, 255, 255, 0.9) 0.6px, transparent 0.8px);
		background-size: 3px 3px;
		mix-blend-mode: overlay;
		pointer-events: none;
		animation: ld-drift 0.25s steps(2) infinite;
	}

	@property --ld-angle {
		syntax: '<angle>';
		inherits: false;
		initial-value: 0deg;
	}

	@keyframes ld-orbit {
		to {
			--ld-angle: 360deg;
		}
	}

	@keyframes ld-drift {
		0% {
			transform: translate(0, 0);
		}
		50% {
			transform: translate(-1px, 1px);
		}
		100% {
			transform: translate(1px, -1px);
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

	.switch .label {
		min-width: 0;
	}

	/* A narrow frame (short phones): the switches lose their icons and shrink, the filters
	   their tick (their fill still says on or off). */
	@container (max-width: 320px) {
		.switch {
			gap: 6px;
			padding: 9px 9px 9px 11px;
			font-size: 13px;
		}
		.switch svg {
			display: none;
		}
		.knob {
			width: 32px;
			height: 20px;
		}
		.knob i {
			width: 12px;
			height: 12px;
		}
		.switch[aria-checked='true'] .knob i {
			transform: translateX(12px);
		}
		.filter {
			justify-content: center;
			padding: 8px 4px;
			font-size: 12px;
		}
		.tick {
			display: none;
		}
		.group ul {
			font-size: 10px;
		}
		/* and the words above give back height for the lists. */
		.who {
			padding-top: 12px;
		}
		.hello {
			margin-bottom: 2px;
		}
		.name {
			font-size: 13cqw;
		}
		.role {
			margin-top: 10px;
		}
		.line {
			margin-top: 8px;
		}
		.switches {
			margin-top: 14px;
		}
		.off ul {
			font-size: 9.5px;
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
		/* No movement while loading: only the label breathes. */
		.ld-sheen,
		.ld-edge,
		.ld-prism *,
		.box.loading::after {
			animation: none !important;
		}
	}
</style>
