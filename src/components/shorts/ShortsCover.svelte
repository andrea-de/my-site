<script>
	// The first screen of /shorts: who made the videos, two ways to start, two ways out.
	// It sits above the first video like one more item in the feed; ShortsFeed moves it
	// (`shift`: 0 showing, 1 slid up out of sight) and handles its gestures, which arrive
	// here as forwarded pointer events. The page shows a copy while the videos load.
	import { createEventDispatcher } from 'svelte';

	/** The company a job link (/shorts/<code>) was made for, or null. */
	export let company = null;
	/** That job link's code, or null. */
	export let code = null;
	/** True until the feed can play: the buttons wait. */
	export let loading = false;
	/** A deep link's video, named under the line ("Starts on …"), or null. */
	export let startsOn = null;
	/** The rounded frame the videos play in ({w, h, top, left}), so the cover matches it; null
	 * while the feed is still measuring (the frame then sizes itself in CSS). */
	export let box = null;
	/** Viewport height, for `shift`. */
	export let height = 0;
	export let shift = 0;

	const dispatch = createEventDispatcher();

	$: hidden = shift >= 1;
	// Without a code, the welcome page is the home page's own Welcome screen: a full load
	// shows it (on phones), so that link reloads. ?nointro skips it (see src/app.html).
	$: welcomeHref = code ? `/r/${code}` : '/';
</script>

<div
	class="cover"
	class:hidden
	style={shift ? `transform: translate3d(0, ${-shift * height}px, 0)` : ''}
	aria-hidden={hidden}
	on:pointerdown
	on:pointermove
	on:pointerup
	on:pointercancel
	on:wheel
>
	<div
		class="box"
		class:measured={!!box}
		style={box ? `width: ${box.w}px; height: ${box.h}px; top: ${box.top}px; left: ${box.left}px` : ''}
	>
		<div class="who">
			<p class="hello">{company ? `Hi ${company} team.` : 'Hi there.'}</p>
			<h1 class="name"><span>I'm Andrea</span><span>de Candia</span></h1>
			<p class="role">Product engineer</p>
			<p class="line">Short videos of products I've taken from idea to release.</p>
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

			<nav class="links" aria-label="Leave the videos">
				<a
					href={welcomeHref}
					data-sveltekit-reload={code ? undefined : ''}
					tabindex={hidden ? -1 : 0}
					on:click={() => dispatch('leave', { to: 'welcome' })}
				>
					<svg viewBox="0 0 24 24" aria-hidden="true"
						><path class="stroke" d="M4 6.5h16v11H4z" /><path class="stroke" d="M4.5 7l7.5 6 7.5-6" /></svg
					>
					<span>{code ? 'Your welcome page' : 'Welcome page'}</span>
				</a>
				<a
					href="/?nointro"
					tabindex={hidden ? -1 : 0}
					on:click={() => dispatch('leave', { to: 'site' })}
				>
					<svg viewBox="0 0 24 24" aria-hidden="true"
						><circle class="stroke" cx="12" cy="12" r="8.5" /><path
							class="stroke"
							d="M3.5 12h17M12 3.5c2.6 2.6 3.6 5.5 3.6 8.5s-1 5.9-3.6 8.5c-2.6-2.6-3.6-5.5-3.6-8.5s1-5.9 3.6-8.5z"
						/></svg
					>
					<span>Main site</span>
				</a>
			</nav>
		</div>

		<p class="cue" aria-hidden="true">
			<svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6" /></svg>
			<span class="touch">Swipe up</span>
			<span class="mouse">Scroll</span>
		</p>
	</div>
</div>

<style>
	.cover {
		position: fixed;
		inset: 0;
		z-index: 15;
		background: var(--ink, #000);
		color: var(--fg, #f3f1ec);
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
		will-change: transform;
	}

	.cover.hidden {
		visibility: hidden;
	}

	/* The same rounded frame the videos play in, so the cover reads as the feed's first card. */
	.box {
		position: absolute;
		top: max(12px, env(safe-area-inset-top, 0px));
		left: 50%;
		height: calc(100% - 132px);
		aspect-ratio: 9 / 16;
		max-width: calc(100% - 0px);
		transform: translateX(-50%);
		box-sizing: border-box;
		padding: 0 22px 14px;
		display: flex;
		flex-direction: column;
		border-radius: 20px;
		overflow: hidden;
		container-type: inline-size;
		background:
			radial-gradient(120% 70% at 85% 0%, rgba(67, 56, 202, 0.38), transparent 60%),
			radial-gradient(90% 60% at 0% 100%, rgba(20, 184, 166, 0.16), transparent 70%),
			#0c0d0f;
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	.box.measured {
		transform: none;
		aspect-ratio: auto;
		max-width: none;
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
		grid-template-columns: 1fr 1fr;
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

	.buttons svg,
	.links svg {
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

	.links {
		margin-top: 8px;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}

	.links a {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 13px 6px;
		border-radius: 14px;
		font: 500 13px/1.15 var(--body);
		white-space: nowrap;
		color: #d6d4cf;
		text-decoration: none;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.1);
		text-align: center;
	}

	.links a:hover {
		color: var(--fg);
		background: rgba(255, 255, 255, 0.09);
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

	button:focus-visible,
	a:focus-visible {
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
