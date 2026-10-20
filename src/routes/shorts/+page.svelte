<script>
	// /shorts: Andrea's product videos as a vertical feed, in the order the site shows the
	// projects (see src/lib/shorts.js); /shorts?project=square-swaps plays one project's.
	// /shorts#square-swaps-2 (in either) opens on that video. Browsers allow sound only after a tap: arriving from a link inside the site
	// that tap has happened; loaded directly (from an email, say), a start screen asks for it.
	import { onMount } from 'svelte';
	import { afterNavigate, goto } from '$app/navigation';
	import ShortsFeed from '../../components/shorts/ShortsFeed.svelte';
	import { indexForHash, loadShorts } from '$lib/shorts';

	let shorts = null;
	let startFeed = null;
	let startIndex = 0;
	let loaded = false;
	let failed = false;
	let feed;
	// Whether the visitor came here from another page of the site (so Exit can go back).
	let fromSite = false;
	let needsStart = false;
	let started = false;
	let arrived = false;

	// Runs once the page is in place, on a direct load (from: null) as after a link.
	afterNavigate(({ from }) => {
		if (arrived) return;
		arrived = true;
		fromSite = !!from?.url && from.url.pathname !== '/shorts';
		const activated = /** @type {any} */ (navigator).userActivation?.hasBeenActive;
		needsStart = !(fromSite || activated);
		started = !needsStart;
	});

	onMount(async () => {
		try {
			shorts = await loadShorts();
		} catch {
			shorts = null;
		}
		const slug = new URLSearchParams(location.search).get('project')?.toLowerCase();
		startFeed = (slug && shorts?.feedFor(slug)) || shorts?.all || null;
		let hash = location.hash;
		// A project with a single video has no feed of its own: it opens on that video in the main one.
		if (startFeed && startFeed.items.length < 2 && startFeed !== shorts.all) {
			startFeed = shorts.all;
			hash ||= `#${slug}`;
		}
		startIndex = Math.max(0, indexForHash(startFeed?.items || [], hash));
		failed = !startFeed?.items.length;
		loaded = true;
	});

	function begin() {
		started = true;
		feed?.start();
	}

	function exit() {
		if (fromSite) history.back();
		else goto('/');
	}
</script>

<svelte:head>
	<title>Shorts — Andrea de Candia</title>
	<meta
		name="description"
		content="Short videos of the apps and games Andrea de Candia built: AudioTales, Weatherie, Square Swaps, Cruffled, Rogue Calculator and more, one after another."
	/>
	<meta property="og:title" content="Shorts — Andrea de Candia" />
	<meta
		property="og:description"
		content="Short videos of the products Andrea de Candia built, in the order of the portfolio."
	/>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap"
	/>
	<meta name="theme-color" content="#000000" />
</svelte:head>

<div class="shorts-page">
	<div class="app">
		{#if loaded && arrived && !failed}
			<ShortsFeed bind:this={feed} {shorts} {startFeed} {startIndex} {started} on:exit={exit} />
		{:else}
			<div class="waiting">
				{#if failed}
					<p>The videos couldn't be loaded just now.</p>
					<button type="button" class="plain" on:click={exit}>Back to the site</button>
				{:else}
					<span class="placeholder" aria-label="Loading videos"></span>
				{/if}
			</div>
		{/if}
	</div>

	{#if needsStart && !started && !failed}
		<div class="start">
			<h1>Andrea de Candia</h1>
			<p>
				Short videos of the products, in the same order as the portfolio. Swipe up for the next one.
			</p>
			<button type="button" on:click={begin} disabled={!loaded}
				>{loaded ? 'Play with sound' : 'Loading…'}</button
			>
		</div>
	{/if}
</div>

<style>
	/* A single dark look on purpose: the videos sit on black. */
	.shorts-page {
		--ink: #000;
		--panel: #14161a;
		--raise: #1d2026;
		--line: rgba(255, 255, 255, 0.14);
		--fg: #f3f1ec;
		--muted: #9aa0a9;
		--accent: #7cd4c4;
		--live: #8fe3a2;
		--test: #f2c66d;
		--display: 'Bricolage Grotesque', 'Avenir Next', 'Segoe UI', sans-serif;
		--body: 'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif;
		--mono: 'IBM Plex Mono', ui-monospace, Menlo, monospace;
		color-scheme: dark;
		position: fixed;
		inset: 0;
		background: var(--ink);
		color: var(--fg);
		font: 15px/1.4 var(--body);
		overflow: hidden;
		overscroll-behavior: none;
		-webkit-tap-highlight-color: transparent;
	}

	/* The site sets Verdana on every element; here everything takes the page's fonts. */
	:global(.shorts-page *) {
		font-family: inherit;
	}

	:global(html:has(.shorts-page)),
	:global(body:has(.shorts-page)) {
		background: #000;
		overflow: hidden;
	}

	.app {
		height: 100%;
		max-width: 480px;
		margin: 0 auto;
		padding: 12px 16px 0;
		box-sizing: border-box;
	}

	.waiting {
		height: 100%;
		display: grid;
		place-content: center;
		justify-items: center;
		gap: 14px;
		color: var(--muted);
		text-align: center;
	}

	.placeholder {
		width: min(60vw, 260px);
		aspect-ratio: 9 / 16;
		border-radius: 20px;
		background: #0c0d0f;
		animation: breathe 1.6s ease-in-out infinite;
	}

	@keyframes breathe {
		50% {
			opacity: 0.55;
		}
	}

	.plain {
		font: 600 14px/1 var(--body);
		color: var(--fg);
		background: var(--raise);
		border: 1px solid var(--line);
		border-radius: 999px;
		padding: 12px 18px;
		cursor: pointer;
	}

	.start {
		position: fixed;
		inset: 0;
		z-index: 20;
		display: grid;
		place-content: center;
		justify-items: center;
		gap: 14px;
		background: rgba(0, 0, 0, 0.82);
		text-align: center;
		padding: 24px;
	}

	.start h1 {
		font: 700 30px/1.05 var(--display);
		margin: 0;
	}

	.start p {
		margin: 0;
		color: var(--muted);
		max-width: 30ch;
	}

	.start button {
		font: 600 15px/1 var(--body);
		color: #000;
		background: var(--fg);
		border: 0;
		border-radius: 999px;
		padding: 14px 22px;
		cursor: pointer;
	}

	.start button:disabled {
		opacity: 0.6;
		cursor: default;
	}

	.start button:focus-visible,
	.plain:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	@media (prefers-reduced-motion: reduce) {
		.placeholder {
			animation: none;
		}
	}
</style>
