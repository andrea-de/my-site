<script>
	// A job link (/r/<code>): a short welcome for one company and role, up to five reasons
	// Andrea fits it, a row led by Watch as shorts, Methodologies and Experience and then
	// every project, the agent (already briefed on the job, see $lib/stores/referral), the
	// resume and the full site.
	import { onDestroy, onMount, tick } from 'svelte';
	import { browser } from '$app/environment';
	import ProjectCards from '../../../components/showcase/ProjectCards.svelte';
	import ProjectView from '../../../components/showcase/ProjectView.svelte';
	import { showcaseProjects, withMedia, projectForHash, entryShowcase } from '../../../components/showcase/projects';
	import { promoVideos, ensurePromoVideos } from '$lib/promo-videos';
	import { openChat, isChatCovering, chatMessages } from '$lib/stores/chat';
	import { activeRef, sendRefEvent } from '$lib/stores/referral';
	import { emitVisitEvent } from '$lib/visit-events';

	export let data;

	// Set before anything can reach the agent, so even a first question is briefed (only in
	// the browser: on the server the store would be shared between requests).
	$: if (browser) activeRef.set(data.code);

	// Every project, in the site's order.
	const allProjects = showcaseProjects();
	$: projects = withMedia(allProjects, $promoVideos);
	// The project view also opens Methodologies and Experience, in the row's order.
	const entrySets = entryShowcase();
	$: viewProjects = [...entrySets, ...projects];

	let scroller;
	let projectView;
	let open = null;
	let heroCardId = null;
	let playMode = 'view';

	onMount(() => {
		ensurePromoVideos().then(openLinked);
		if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) playMode = 'hover';
	});

	// A reload with a project open (#rogue-calculator) opens it again.
	async function openLinked() {
		const p = projectForHash(viewProjects, location.hash);
		if (!p || open?.id === p.id) return;
		await tick();
		projectView.open(p, null);
	}

	const cardMedia = (id) =>
		scroller?.querySelector(`[data-project="${id}"] .shot, [data-project="${id}"] .placeholder`);

	// The opening question only starts a conversation: with one under way, the chat just
	// opens where it was left.
	function askAgent() {
		emitVisitEvent('visit:chat_open');
		if ($chatMessages.some((m) => m.role === 'user')) openChat();
		else openChat({ text: `How does Andrea's experience fit the ${data.role} role?`, source: 'ask-agent' });
	}

	// The chat covers the whole screen on phones; keep the page behind it still.
	$: if (browser) {
		document.documentElement.classList.toggle('no-scroll', $isChatCovering && window.innerWidth <= 768);
	}
	onDestroy(() => browser && document.documentElement.classList.remove('no-scroll'));
</script>

<svelte:head>
	<title>Andrea de Candia · {data.role}</title>
	<meta name="robots" content="noindex, nofollow" />
	<meta property="og:title" content="Andrea de Candia" />
	<meta property="og:description" content="Product engineer. A page put together for the {data.role} role." />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@200;400;500;600;700;800;900&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<main class="ref">
	<header class="top">
		<span class="name">Andrea de Candia</span>
		<span class="title">Product engineer</span>
	</header>

	<section class="welcome">
		<h1 class="headline">
			<span class="line">Hi {data.company} team.</span>
			<span class="line accent">I'm Andrea.</span>
		</h1>
		<p class="lede">
			{data.greeting ||
				(data.fitPoints.length
					? `Here are some ways I'm a good fit for the ${data.role} role.`
					: `This page was put together for the ${data.role} role.`)}
		</p>
	</section>

	{#if data.fitPoints.length}
		<ol class="fit" aria-label="Why I fit the role">
			{#each data.fitPoints as point, i}
				<li class="point">
					<span class="num" aria-hidden="true">{i + 1}</span>
					<span class="point-text">{point}</span>
				</li>
			{/each}
		</ol>
	{/if}

	<section class="work" aria-label="Projects">
		<p class="label">Explore my work</p>
		<div class="cards">
			<ProjectCards
				{projects}
				videos={$promoVideos}
				paused={$isChatCovering || !!open}
				hiddenId={heroCardId}
				{playMode}
				entry
				shortsBase="/shorts/{data.code}"
				bind:scroller
				onOpen={(p, media) => projectView.open(p, media)}
			/>
		</div>
	</section>

	<section class="actions">
		<button class="primary" on:click={askAgent}>
			<span class="chat-icon" aria-hidden="true">
				<svg viewBox="0 0 24 24" fill="none"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="bevel" /><path class="inner-prism" d="M12 6L13.5 10.5L18 12L13.5 13.5L12 18L10.5 13.5L6 12L10.5 10.5L12 6Z" fill="currentColor" /></svg>
			</span>
			Chat with my agent about this role
		</button>
		<div class="bands">
			<a class="band" href="/resume?region={data.region}" on:click={() => sendRefEvent('resume_open')}>
				<span class="band-text">
					<span class="band-title">Resume</span>
					<span class="band-sub">Web or PDF</span>
				</span>
				<svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
			</a>
			<a class="band" href="/">
				<span class="band-text">
					<span class="band-title">Full site</span>
					<span class="band-sub">Everything else</span>
				</span>
				<svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
			</a>
		</div>
	</section>
</main>

<ProjectView
	bind:this={projectView}
	bind:project={open}
	bind:heroCardId
	projects={viewProjects}
	lockScroll
	findCardMedia={cardMedia}
/>

<style>
	/* This route doesn't load the home page, so it sets the site's base itself. */
	:global(html, body) {
		background-color: #000;
		color: #fff;
		margin: 0;
		padding: 0;
		box-sizing: border-box;
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		width: 100%;
		overflow-x: hidden;
		-webkit-tap-highlight-color: transparent;
	}

	:global(*) {
		box-sizing: inherit;
	}

	:global(html.no-scroll),
	:global(html.no-scroll body) {
		overflow: hidden !important;
		height: 100svh !important;
		position: fixed;
		width: 100%;
	}

	.ref {
		max-width: 1000px;
		margin: 0 auto;
		padding: 20px 1.5rem max(4vh, 28px);
		min-height: 100vh;
		min-height: 100svh;
		display: flex;
		flex-direction: column;
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
	}

	.top {
		display: flex;
		align-items: baseline;
		gap: 10px;
		font-size: 0.9rem;
	}

	.name {
		font-weight: 700;
	}

	.title {
		color: #71717a;
	}

	.welcome {
		padding-top: max(5vh, 28px);
	}

	/* The Welcome screen's headline. */
	.headline {
		margin: 0;
		display: flex;
		flex-direction: column;
		font-size: clamp(2.2rem, 9vw, 3.6rem);
		font-weight: 800;
		line-height: 1.08;
		letter-spacing: -0.03em;
		overflow-wrap: anywhere;
	}

	.line {
		display: block;
		padding-bottom: 0.06em;
	}

	.accent {
		color: #a5b4fc;
	}

	.lede {
		margin: 1rem 0 0;
		max-width: 34rem;
		font-size: 1.05rem;
		line-height: 1.5;
		color: #d4d4d8;
	}

	/* Why I fit: on phones two points across, the rest a sideways scroll away. */
	.fit {
		list-style: none;
		margin: 1.5rem 0 0;
		padding: 2px 0 8px;
		display: grid;
		grid-auto-flow: column;
		/* Two across, with the next one peeking in so the row reads as scrollable. */
		grid-auto-columns: calc(50% - 28px);
		gap: 12px;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		scrollbar-width: none;
	}

	.fit::-webkit-scrollbar {
		display: none;
	}

	/* Phones: edge to edge, like the project cards. */
	@media (max-width: 768px) {
		.fit {
			margin-left: -1.5rem;
			margin-right: -1.5rem;
			padding-left: 1.5rem;
			padding-right: 1.5rem;
			scroll-padding: 0 1.5rem;
			grid-auto-columns: calc(50% - 40px);
		}
	}

	.point {
		scroll-snap-align: start;
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 16px;
		border: 1px solid #27272a;
		border-radius: 18px;
		background: #0f0f13;
	}

	.num {
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: #312e81;
		color: #c7d2fe;
		font-size: 0.8rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.point-text {
		font-size: 0.95rem;
		line-height: 1.45;
		color: #e4e4e7;
	}

	.work {
		margin-top: 2.25rem;
	}

	.label {
		margin: 0 0 12px;
		font-size: 0.8rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #71717a;
	}

	/* The Software section's row: inside the column on wide screens, edge to edge on phones. */
	.cards {
		height: 440px;
		--cards-touch-action: pan-x pan-y;
		--cards-padding: 6px 0 10px;
	}

	@media (max-width: 768px) {
		.cards {
			height: min(56vh, 460px);
			--cards-margin: 0 -1.5rem;
			--cards-padding: 6px 1.5rem 10px;
			--cards-scroll-padding: 0 1.5rem;
		}
	}

	.actions {
		margin-top: 1.5rem;
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 12px;
		max-width: 34rem;
	}

	/* The Welcome screen's main button, with the chat's star. */
	.primary {
		height: 64px;
		padding: 0 20px;
		border: 0;
		border-radius: 28px;
		background: #fff;
		color: #1e1b4b;
		font: 700 1.05rem 'Inter', sans-serif;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		line-height: 1.2;
		text-wrap: balance;
		cursor: pointer;
		transition: transform 0.2s ease;
	}

	.primary:hover {
		transform: translateY(-1px);
	}

	.primary:active {
		transform: scale(0.98);
	}

	.chat-icon {
		flex-shrink: 0;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: #4f46e5;
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.chat-icon svg {
		width: 18px;
		height: 18px;
		animation: prism-turn 8s linear infinite;
	}

	.inner-prism {
		transform-box: fill-box;
		transform-origin: center;
		animation: prism-pulse 2s ease-in-out -1s infinite;
	}

	@keyframes prism-turn {
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes prism-pulse {
		0%,
		100% {
			opacity: 0.4;
			transform: scale(0.8);
		}
		50% {
			opacity: 1;
			transform: scale(1);
		}
	}

	/* The Welcome screen's band. */
	/* Resume and full site: one row, half each. */
	.bands {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: 12px;
	}

	.band {
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 14px 18px;
		border-radius: 18px;
		border: 1px solid #27272a;
		background: #0f0f13;
		color: #fff;
		text-decoration: none;
		transition: border-color 0.2s ease;
	}

	.band:hover {
		border-color: #4338ca;
	}

	.band-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.band-title {
		font-weight: 700;
		font-size: 1rem;
	}

	.band-sub {
		font-size: 0.85rem;
		color: #a1a1aa;
	}

	.chevron {
		width: 20px;
		height: 20px;
		color: #71717a;
		flex-shrink: 0;
	}

	/* Wide screens: a wider column for the actions. */
	/* Wide screens: the points wrap in a grid at a readable width, no sideways scroll. */
	@media (min-width: 769px) {
		.fit {
			grid-auto-flow: row;
			grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
			overflow-x: visible;
			scroll-snap-type: none;
		}
	}

	@media (min-width: 769px) {
		.ref {
			padding: 28px 2rem 40px;
		}

		.welcome {
			padding-top: 7vh;
		}

		.actions {
			max-width: 44rem;
		}
	}

	@media (max-width: 359px) {
		.primary {
			font-size: 0.95rem;
			padding: 0 14px;
			gap: 10px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.chat-icon svg,
		.inner-prism {
			animation: none;
		}
	}
</style>
