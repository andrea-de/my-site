<script>
	// A sideways row of phone-shaped project cards, each playing its promo video.
	// Used by the Welcome screen's products page and by the site's Software section.
	// With `shortsTile`, the row opens with a card of the same shape linking to /shorts.

	export let projects = [];
	/** project id → { src, poster } (see $lib/promo-videos) */
	export let videos = {};
	/** Pauses every card, e.g. while the project view or the chat is open. */
	export let paused = false;
	/** The card whose media the open project view currently stands in for. */
	export let hiddenId = null;
	/** 'view': the card in view plays (touch). 'hover': the card under the pointer plays. */
	export let playMode = 'view';
	/** Called with the project and the card's media element when a card is chosen. */
	export let onOpen = (project, media) => {};
	export let onScroll = () => {};
	/** Puts a "Watch as shorts" card (a link to /shorts) first in the row. */
	export let shortsTile = false;
	/** Called when that card is followed, before the page changes. */
	export let onShorts = () => {};
	/** The scrolling row, for a parent that wants to nudge it. */
	export let scroller = null;
	// Optional transitions, so a parent can choreograph the cards (the Welcome screen's
	// thumbnails grow into them). Params carry the card's key and a staggered delay.
	/** @type {(node: Element, params: any) => any} */
	export let cardIn = () => ({ duration: 0 });
	/** @type {(node: Element, params: any) => any} */
	export let cardOut = () => ({ duration: 0 });

	// Up to three stills of the first projects, fanned out on the shorts card.
	$: fan = projects
		.map((p) => videos[p.id]?.poster || p.image)
		.filter(Boolean)
		.slice(0, 3);
	$: lead = shortsTile ? 1 : 0;

	function choose(project, e) {
		// Let new-tab clicks through to the project's note.
		if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
		e.preventDefault();
		const card = e.currentTarget;
		onOpen(project, card.querySelector('.shot, .placeholder') || card);
	}

	function playCard(node, params) {
		let { paused, mode } = params;
		let wanted = false;
		const card = node.closest('.product');
		const observer = new IntersectionObserver(
			([entry]) => {
				if (mode === 'view') wanted = entry.isIntersecting;
				sync();
			},
			{ root: node.closest('.carousel'), threshold: 0.6 }
		);
		const enter = () => {
			if (mode !== 'hover') return;
			wanted = true;
			sync();
		};
		const leave = () => {
			if (mode !== 'hover') return;
			wanted = false;
			sync();
		};
		function sync() {
			if (wanted && !paused) node.play().catch(() => {});
			else node.pause();
		}
		observer.observe(node);
		card?.addEventListener('pointerenter', enter);
		card?.addEventListener('pointerleave', leave);
		card?.addEventListener('focusin', enter);
		card?.addEventListener('focusout', leave);
		return {
			update(next) {
				({ paused, mode } = next);
				sync();
			},
			destroy() {
				observer.disconnect();
				card?.removeEventListener('pointerenter', enter);
				card?.removeEventListener('pointerleave', leave);
				card?.removeEventListener('focusin', enter);
				card?.removeEventListener('focusout', leave);
			}
		};
	}
</script>

<div class="carousel" bind:this={scroller} on:scroll={onScroll}>
	{#if shortsTile}
		<a
			draggable="false"
			class="product shorts"
			href="/shorts"
			on:click={() => onShorts()}
			in:cardIn|global={{ key: 'shorts', delay: 140, x: 90, y: 0 }}
			out:cardOut|global={{ key: 'shorts', delay: 0 }}
		>
			<span class="fan" aria-hidden="true">
				{#each fan as src, n}
					<img draggable="false" src={src} alt="" loading="lazy" class="f{n}" />
				{/each}
				<span class="play-badge">
					<svg viewBox="0 0 24 24"><path d="M9 6.5v11l9-5.5z" /></svg>
				</span>
			</span>
			<span class="product-meta">
				<span class="name">Watch as shorts</span>
				<span class="desc">Every product video, one after another. Swipe up for the next.</span>
			</span>
		</a>
	{/if}
	{#each projects as p, i (p.id)}
		<a
			draggable="false"
			class="product"
			class:hero-source={hiddenId === p.id}
			data-project={p.id}
			href={p.href}
			on:click={(e) => choose(p, e)}
			in:cardIn|global={{ key: p.id, delay: 140 + (i + lead) * 70, x: 90, y: 0 }}
			out:cardOut|global={{ key: p.id, delay: (i + lead) * 25 }}
		>
			{#if videos[p.id]}
				<span class="shot">
					<video
						src={videos[p.id].src}
						poster={videos[p.id].poster}
						muted
						loop
						playsinline
						preload="none"
						aria-label="{p.name} promo video"
						use:playCard={{ paused, mode: playMode }}
					></video>
				</span>
			{:else if p.image}
				<span class="shot"><img draggable="false" src={p.image} alt="" loading="lazy" style="animation-delay: {-i * 3}s" /></span>
			{:else}
				<span class="placeholder">{p.name[0]}</span>
			{/if}
			<span class="product-meta">
				<span class="name">{p.name}</span>
				<span class="desc">{p.description}</span>
			</span>
		</a>
	{/each}
</div>

<style>
	/* Margins and padding come from the parent, which knows how far the row may bleed. */
	.carousel {
		height: 100%;
		margin: var(--cards-margin, 0);
		padding: var(--cards-padding, 0);
		display: flex;
		gap: 12px;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		scroll-padding: var(--cards-scroll-padding, 0);
		scrollbar-width: none;
		/* The Welcome screen keeps vertical swipes for itself; the site lets them scroll the page. */
		touch-action: var(--cards-touch-action, pan-x);
	}

	.carousel::-webkit-scrollbar {
		display: none;
	}

	/* Phone-shaped cards: the promo videos are portrait (1:2). */
	.product {
		flex: 0 0 auto;
		height: 100%;
		aspect-ratio: 10 / 19;
		scroll-snap-align: start;
		display: flex;
		flex-direction: column;
		border-radius: 20px;
		border: 1px solid #27272a;
		background: #111114;
		overflow: hidden;
		color: #fff;
		text-decoration: none;
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		transition:
			border-color 0.2s ease,
			transform 0.25s ease;
	}

	@media (hover: hover) {
		.product:hover {
			border-color: #4338ca;
			transform: translateY(-4px);
		}
	}

	.product .shot,
	.product .placeholder {
		flex: 1;
		min-height: 0;
		width: 100%;
	}

	.shot {
		display: block;
		overflow: hidden;
	}

	/* Whole frame, never cropped: the cuts are not all the same shape. */
	.shot video {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
		background: #0b0b0e;
	}

	.shot img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: top;
		animation: drift 18s ease-in-out infinite alternate;
	}

	.placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		background: #1e1b4b;
		font-size: 4rem;
		font-weight: 800;
		color: #a5b4fc;
	}

	.product-meta {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 12px 14px 14px;
	}

	.name {
		font-weight: 700;
	}

	.desc {
		font-size: 0.85rem;
		line-height: 1.35;
		color: #a1a1aa;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	/* Watch as shorts: the first stills fanned out like phones, with a play button. */
	.fan {
		position: relative;
		flex: 1;
		min-height: 0;
		width: 100%;
		overflow: hidden;
		background:
			radial-gradient(120% 80% at 50% 30%, rgba(67, 56, 202, 0.45), transparent 70%),
			#0b0b0e;
	}

	.fan img {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 46%;
		aspect-ratio: 9 / 16;
		object-fit: cover;
		border-radius: 12px;
		border: 1px solid #3f3f46;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.55);
		transition: transform 0.35s ease;
	}

	.fan .f0 {
		z-index: 3;
		transform: translate(-50%, -54%);
	}

	.fan .f1 {
		z-index: 2;
		transform: translate(-92%, -48%) rotate(-9deg) scale(0.86);
		opacity: 0.8;
	}

	.fan .f2 {
		z-index: 1;
		transform: translate(-8%, -48%) rotate(9deg) scale(0.86);
		opacity: 0.8;
	}

	@media (hover: hover) {
		.product.shorts:hover .f1 {
			transform: translate(-100%, -48%) rotate(-12deg) scale(0.86);
		}
		.product.shorts:hover .f2 {
			transform: translate(0%, -48%) rotate(12deg) scale(0.86);
		}
	}

	.play-badge {
		position: absolute;
		z-index: 4;
		left: 50%;
		top: 50%;
		width: 52px;
		height: 52px;
		transform: translate(-50%, -54%);
		border-radius: 50%;
		display: grid;
		place-items: center;
		background: rgba(0, 0, 0, 0.55);
		border: 1px solid rgba(255, 255, 255, 0.35);
		backdrop-filter: blur(4px);
	}

	.play-badge svg {
		width: 24px;
		height: 24px;
		margin-left: 3px;
		fill: #fff;
	}

	/* The open project view's hero stands in for this card's media. */
	.product.hero-source .shot,
	.product.hero-source .placeholder {
		visibility: hidden;
	}

	@keyframes drift {
		from {
			transform: scale(1) translateY(0);
		}
		to {
			transform: scale(1.08) translateY(-3%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.shot img {
			animation: none;
		}
		.product,
		.fan img {
			transition: none;
		}
	}
</style>
