<script>
	import { onMount, tick } from 'svelte';
	import Section from './Section.svelte';
	import ProjectCards from './showcase/ProjectCards.svelte';
	import ProjectView from './showcase/ProjectView.svelte';
	import { showcaseProjects, withMedia, projectForHash } from './showcase/projects';
	import { promoVideos, ensurePromoVideos } from '$lib/promo-videos';
	import { isChatCovering } from '$lib/stores/chat';

	/** @type {(project: string) => void} */
	export let onChatClick = () => {};

	// The same cards and project view as the Welcome screen's products page, so desktop
	// visitors (who skip that screen) get the whole showcase here.
	const allProjects = showcaseProjects();
	$: projects = withMedia(allProjects, $promoVideos);

	let scroller;
	// Which edges of the row still have cards beyond them, for the fades.
	let moreLeft = false;
	let moreRight = false;

	function measureEdges() {
		if (!scroller) return;
		moreLeft = scroller.scrollLeft > 4;
		moreRight = scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 4;
	}

	$: if (scroller) requestAnimationFrame(measureEdges);
	let projectView;
	let open = null;
	let heroCardId = null;
	// Mouse and trackpad: the card under the pointer plays. Touch: the card in view plays.
	let playMode = 'view';

	onMount(() => {
		ensurePromoVideos().then(openLinked);
		if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) playMode = 'hover';
		window.addEventListener('hashchange', openLinked);
		return () => window.removeEventListener('hashchange', openLinked);
	});

	// A link like /#rogue-calculator opens that project over its section (the catalogue
	// has to load first, since it decides which projects show).
	async function openLinked() {
		const p = projectForHash(projects, location.hash);
		if (!p || open?.id === p.id) return;
		await tick();
		document.getElementById('software')?.scrollIntoView({ block: 'start', behavior: 'instant' });
		projectView.open(p, null);
	}

	const cardMedia = (id) =>
		scroller?.querySelector(`[data-project="${id}"] .shot, [data-project="${id}"] .placeholder`);

	// Arrow buttons move the row by about two cards.
	function nudge(direction) {
		const card = scroller?.querySelector('.product');
		if (!card) return;
		scroller.scrollBy({ left: direction * (card.offsetWidth + 12) * 2, behavior: 'smooth' });
	}
</script>

<svelte:window on:resize={measureEdges} />

<Section title="Software" id="software">
	<div class="software-header">
		<p class="lede">Tap a project for its videos, store links and how it's built.</p>
		<div class="arrows">
			<button on:click={() => nudge(-1)} aria-label="Scroll projects left">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
			</button>
			<button on:click={() => nudge(1)} aria-label="Scroll projects right">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
			</button>
		</div>
	</div>

	<div class="cards" class:more-left={moreLeft} class:more-right={moreRight}>
		<ProjectCards
			{projects}
			videos={$promoVideos}
			paused={$isChatCovering || !!open}
			hiddenId={heroCardId}
			{playMode}
			shortsTile
			experienceTile
			bind:scroller
			onScroll={measureEdges}
			onOpen={(p, media) => projectView.open(p, media)}
		/>
	</div>
</Section>

<ProjectView
	bind:this={projectView}
	bind:project={open}
	bind:heroCardId
	{projects}
	lockScroll
	findCardMedia={cardMedia}
	onChat={(p) => onChatClick(p.name)}
/>

<style>
	.software-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 20px;
	}

	.lede {
		margin: 0;
		color: #a1a1aa;
		font-size: 1rem;
		line-height: 1.5;
	}

	.arrows {
		display: flex;
		gap: 8px;
		flex-shrink: 0;
	}

	.arrows button {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		border: 1px solid #3f3f46;
		background: none;
		color: #e4e4e7;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition:
			background-color 0.2s ease,
			border-color 0.2s ease;
	}

	.arrows button:hover {
		background: #18181b;
		border-color: #52525b;
	}

	.arrows svg {
		width: 20px;
		height: 20px;
	}

	/* Wide screens: the row stays inside the site's column, fading out on whichever
	   side still has cards to scroll to. */
	.cards {
		height: 460px;
		--cards-touch-action: pan-x pan-y;
		--cards-padding: 6px 0 10px;
		--fade-l: 0px;
		--fade-r: 0px;
		-webkit-mask-image: linear-gradient(to right, transparent, #000 var(--fade-l), #000 calc(100% - var(--fade-r)), transparent);
		mask-image: linear-gradient(to right, transparent, #000 var(--fade-l), #000 calc(100% - var(--fade-r)), transparent);
	}

	.cards.more-left {
		--fade-l: 72px;
	}

	.cards.more-right {
		--fade-r: 72px;
	}

	/* Phones: the row runs to the screen edges instead, with its first card in line
	   with the section (Section pads 1.5rem there). */
	@media (max-width: 768px) {
		.cards {
			height: min(62vh, 480px);
			-webkit-mask-image: none;
			mask-image: none;
			--cards-margin: 0 -1.5rem;
			--cards-padding: 6px 1.5rem 10px;
			--cards-scroll-padding: 0 1.5rem;
		}
	}

	/* Touch screens scroll the row with a finger. */
	@media (hover: none) {
		.arrows {
			display: none;
		}
	}
</style>
