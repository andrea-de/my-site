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
	<div class="col">
		{#if company}
			<p class="hello">Hi {company} team.</p>
		{/if}

		<div class="who">
			<h1 class="name"><span>Andrea</span><span>de Candia</span></h1>
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
					on:click={() => dispatch('play', { sound: false })}>Play muted</button
				>
			</div>

			<nav class="links" aria-label="Leave the videos">
				<a
					href={welcomeHref}
					data-sveltekit-reload={code ? undefined : ''}
					tabindex={hidden ? -1 : 0}
					on:click={() => dispatch('leave', { to: 'welcome' })}>Your welcome page</a
				>
				<a
					href="/?nointro"
					tabindex={hidden ? -1 : 0}
					on:click={() => dispatch('leave', { to: 'site' })}>Main site</a
				>
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

	.col {
		height: 100%;
		max-width: 480px;
		margin: 0 auto;
		box-sizing: border-box;
		padding: max(20px, env(safe-area-inset-top, 0px)) 16px
			max(16px, env(safe-area-inset-bottom, 0px));
		display: flex;
		flex-direction: column;
	}

	.hello {
		margin: 8px 0 0;
		font: 600 21px/1.2 var(--display);
		letter-spacing: -0.01em;
	}

	.who {
		margin-top: auto;
		margin-bottom: auto;
		padding-top: 24px;
	}

	.name {
		margin: 0;
		display: grid;
		font: 700 clamp(58px, 19vw, 104px) / 0.9 var(--display);
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
		margin: 18px 0 0;
		max-width: 30ch;
		font: 17px/1.4 var(--body);
		color: #d6d4cf;
	}

	.starts {
		margin: 8px 0 0;
		font: 13px/1.35 var(--body);
		color: var(--muted);
	}

	.buttons {
		margin-top: 28px;
		display: flex;
		gap: 10px;
	}

	.buttons button {
		font: 600 15px/1 var(--body);
		border-radius: 999px;
		padding: 15px 20px;
		cursor: pointer;
		white-space: nowrap;
	}

	.primary {
		flex: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		color: #000;
		background: var(--fg);
		border: 0;
	}

	.primary svg {
		width: 18px;
		height: 18px;
		fill: currentColor;
	}

	.secondary {
		flex: none;
		color: var(--fg);
		background: none;
		border: 1px solid var(--line);
	}

	.buttons button:disabled {
		opacity: 0.6;
		cursor: default;
	}

	.links {
		margin-top: 22px;
		display: flex;
		gap: 20px;
		font: 14px/1 var(--body);
		color: var(--muted);
	}

	.links a {
		color: var(--muted);
		text-decoration: none;
		padding: 4px 0;
	}

	.links a:hover {
		color: var(--fg);
		text-decoration: underline;
		text-underline-offset: 3px;
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

	@media (min-width: 900px) {
		.hello {
			font-size: 24px;
		}
		.line {
			font-size: 18px;
		}
	}

	@media (max-height: 600px) {
		.name {
			font-size: clamp(44px, 12vh, 72px);
		}
		.buttons {
			margin-top: 18px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.cue {
			animation: none;
		}
	}
</style>
