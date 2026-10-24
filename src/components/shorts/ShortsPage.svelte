<script>
	// The /shorts page (and /shorts/<code>, a job link's: the cover greets the company). See
	// ShortsFeed for the player and src/lib/shorts.js for the feeds; /shorts?project=square-swaps
	// plays one project's, /shorts#square-swaps-2 (in either) opens on that video.
	//
	// The feed opens on its cover, whose buttons start it (browsers allow sound only after a
	// tap), whether loaded directly (from an email, say) or from the site's Watch as shorts
	// card. A link inside the site to a particular video or a project's feed (the project
	// view's Watch as shorts, the Experience card) has had its tap, and plays at once.
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { afterNavigate, goto, preloadCode } from '$app/navigation';
	import { navigating, page } from '$app/stores';
	import { get } from 'svelte/store';
	import ShortsFeed from './ShortsFeed.svelte';
	import ShortsCover from './ShortsCover.svelte';
	import ShortsLeave from './ShortsLeave.svelte';
	import { coverGroups, indexForHash, loadShorts } from '$lib/shorts';
	import { canFullscreen, watchFullscreen } from '$lib/fullscreen';
	import { finishLap } from '$lib/finish-lap';
	import { PRESS_PAGES } from '$lib/press-pages';
	import { showcaseProjects } from '../showcase/projects';
	import { PROMO_CATALOGUE } from '$lib/promo-videos';

	/** A job link's code and company, on /shorts/<code>. */
	export let code = null;
	export let company = null;
	/** That link's résumé region ('us' or 'eu'), for the cover's Resume link. */
	export let region = null;

	$: base = code ? `/shorts/${code}` : '/shorts';

	// The press pages loadShorts will ask for.
	const pressIds = showcaseProjects()
		.map((p) => p.id)
		.filter((id) => PRESS_PAGES[id]);

	let shorts = null;
	let startFeed = null;
	let startIndex = 0;
	let loaded = false;
	let failed = false;
	// Whether the visitor came here from another page of the site (so Exit can go back).
	let fromSite = false;
	// A direct load opens on the cover (the server renders it too), and so does a link from
	// inside the site, unless it names a video or a project's feed. A project's feed never has
	// one: it is just its videos. (A client-side navigation is still under way while this page
	// is set up; afterNavigate settles it either way.)
	/** @param {URL | undefined} url */
	const pointed = (url) => !!(url?.hash || url?.searchParams.has('project'));
	const projectFeed = $page.url.searchParams.has('project');
	let withCover =
		!projectFeed && !(browser && get(navigating) && pointed(get(navigating)?.to?.url));
	let arrived = false;

	// Runs once the page is in place, on a direct load (from: null) as after a link.
	afterNavigate(({ from, to }) => {
		if (arrived) return;
		arrived = true;
		fromSite = !!from?.url && !/^\/shorts(\/|$)/.test(from.url.pathname);
		withCover = !projectFeed && (!from || !pointed(to?.url));
	});

	// The page itself goes full screen (not a video), so the rows and swipes keep working.
	let root;
	onMount(watchFullscreen);

	onMount(async () => {
		try {
			shorts = await loadShorts();
		} catch {
			shorts = null;
		}
		const slug = new URLSearchParams(location.search).get('project')?.toLowerCase();
		startFeed = (slug && shorts?.feedFor(slug)) || shorts?.all || null;
		let hash = location.hash;
		// A project with a single video has no feed of its own: it opens on that video in the main
		// one (unless the main feed doesn't hold it, as with Methodologies).
		if (
			startFeed &&
			startFeed.items.length < 2 &&
			startFeed !== shorts.all &&
			shorts.all.items.some((it) => it.id === startFeed.items[0]?.id)
		) {
			startFeed = shorts.all;
			hash ||= `#${slug}`;
		}
		startIndex = Math.max(0, indexForHash(startFeed?.items || [], hash));
		failed = !startFeed?.items.length;
		await settleCover();
		loaded = true;
	});

	// The early cover's loading light, if mid-lap, races round to finish it and fades before the
	// feed takes over (a few hundred ms at most), rather than vanish wherever it was.
	let earlyEl;
	async function settleCover() {
		const edge = earlyEl?.querySelector('.ld-edge');
		if (!edge) return;
		const lap = finishLap(edge);
		edge.animate([{ opacity: 1 }, { opacity: 0 }], {
			duration: COVER_FADE_MS,
			delay: lap,
			fill: 'forwards'
		});
		await new Promise((r) => setTimeout(r, lap + COVER_FADE_MS));
	}
	const COVER_FADE_MS = 150;

		// Where Exit goes when it can't go back: the job link's page, or the site.
	$: away = code ? `/r/${code}` : '/';

	// Opened directly (from an email, say), the first Exit used to wait on the next page's
	// code with nothing on screen changing, so it read as a missed tap, and a second tap's
	// history.back() then went back twice. The code is fetched ahead, a tap shows at once
	// (leaving), later taps do nothing, and if the page still hasn't changed a few seconds on,
	// a full load takes over.
	$: if (loaded && arrived && !fromSite) preloadCode(away);
	let leaving = false;
	let leaveTimer;

	function exit() {
		if (leaving) return;
		leaving = true;
		const from = location.href;
		leaveTimer = setTimeout(() => {
			if (location.href === from) location.assign(code ? away : '/?nointro');
		}, 4000);
		if (fromSite) history.back();
		else goto(away);
	}
	onDestroy(() => clearTimeout(leaveTimer));
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
	<!-- The feed's lists, asked for while the page's code is still arriving (loadShorts's
	     fetches pick these up). -->
	<link rel="preload" href={PROMO_CATALOGUE} as="fetch" crossorigin="anonymous" />
	{#each pressIds as id}
		<link rel="preload" href="/api/press?project={id}" as="fetch" crossorigin="anonymous" />
	{/each}
</svelte:head>

<div class="shorts-page" class:leaving bind:this={root}>
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
				fullscreenTarget={root}
				on:exit={exit}
			/>
		{:else if withCover && !failed}
			<!-- The cover, waiting for the videos, in the feed's own layout (a stage, the
			     progress line's 3px, a 50px control row) so it doesn't change size when the
			     feed takes over. -->
			<div class="early" bind:this={earlyEl}>
				<div class="early-stage">
					<ShortsCover
						{company}
						loading
						canFullscreen={canFullscreen()}
						groups={$page.url.searchParams.has('project') ? [] : coverGroups()}
						shown={{ methods: true, work: true, products: true }}
					/>
				</div>
				<div class="early-row">
					<ShortsLeave {code} {region} canPlaylist={false} />
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
	/* Exit was tapped: the page dims at once while the next one arrives. */
	.shorts-page.leaving .app {
		opacity: 0.55;
		pointer-events: none;
		transition: opacity 0.15s ease;
	}

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
