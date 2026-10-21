<script>
	// The /shorts page (and /shorts/<code>, a job link's: the cover greets the company). See
	// ShortsFeed for the player and src/lib/shorts.js for the feeds; /shorts?project=square-swaps
	// plays one project's, /shorts#square-swaps-2 (in either) opens on that video.
	//
	// Browsers allow sound only after a tap. Arriving from a link inside the site that tap
	// has happened, and the first video plays at once; loaded directly (from an email, say),
	// the feed opens on its cover, whose buttons start it.
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { afterNavigate, goto } from '$app/navigation';
	import { navigating } from '$app/stores';
	import { get } from 'svelte/store';
	import ShortsFeed from './ShortsFeed.svelte';
	import ShortsCover from './ShortsCover.svelte';
	import ShortsLeave from './ShortsLeave.svelte';
	import { indexForHash, loadShorts } from '$lib/shorts';

	/** A job link's code and company, on /shorts/<code>. */
	export let code = null;
	export let company = null;
	/** That link's résumé region ('us' or 'eu'), for the cover's Resume link. */
	export let region = null;

	$: base = code ? `/shorts/${code}` : '/shorts';

	let shorts = null;
	let startFeed = null;
	let startIndex = 0;
	let loaded = false;
	let failed = false;
	// Whether the visitor came here from another page of the site (so Exit can go back).
	let fromSite = false;
	// A direct load opens on the cover (the server renders it too); a link from inside the
	// site has had its tap, and plays at once. (A client-side navigation is still under way
	// while this page is set up; afterNavigate settles it either way.)
	let withCover = !(browser && get(navigating));
	let arrived = false;

	// Runs once the page is in place, on a direct load (from: null) as after a link.
	afterNavigate(({ from }) => {
		if (arrived) return;
		arrived = true;
		fromSite = !!from?.url && !/^\/shorts(\/|$)/.test(from.url.pathname);
		withCover = !from;
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

	function exit() {
		if (fromSite) history.back();
		else goto(code ? `/r/${code}` : '/');
	}
</script>

<svelte:head>
	<title>Shorts — Andrea de Candia</title>
	<meta
		name="description"
		content="Short videos of Andrea de Candia's work: the apps and games Andrea built (AudioTales, Weatherie, Square Swaps, Cruffled, Rogue Calculator and more) and earlier roles, one after another."
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
			<ShortsFeed
				{shorts}
				{startFeed}
				{startIndex}
				{withCover}
				{company}
				{code}
				{region}
				{base}
				on:exit={exit}
			/>
		{:else if withCover && !failed}
			<!-- The cover, waiting for the videos, in the feed's own layout (a stage, the
			     progress line's 3px, a 50px control row) so it doesn't change size when the
			     feed takes over. -->
			<div class="early">
				<div class="early-stage"><ShortsCover {company} loading /></div>
				<div class="early-row">
					<ShortsLeave {code} {region} />
				</div>
			</div>
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

	/* ShortsFeed's .feed, .stage, .progress and .row, as far as their sizes go. */
	.early {
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.early-stage {
		position: relative;
		container-type: size;
		flex: 1;
		min-height: 0;
		width: 100%;
		overflow: hidden;
	}

	.early-row {
		flex: none;
		width: 100%;
		box-sizing: content-box;
		height: 50px;
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 3px;
		padding-block: 12px 14px;
		padding-bottom: max(14px, env(safe-area-inset-bottom, 0px));
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
