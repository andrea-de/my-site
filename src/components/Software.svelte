<script>
	import { onMount, tick } from 'svelte';
	import projectsData from '$lib/context/projects.json';
	import Section from './Section.svelte';
	import ExternalLink from './svg/ExternalLink.svelte';
	import GameTsunamiDemo from './projects/GameTsunamiDemo.svelte';
	import CruffledDemo from './projects/CruffledDemo.svelte';
	import TackryDemo from './projects/TackryDemo.svelte';

	let view = 'grid'; // 'phone', 'carousel', or 'grid'
	let activeIndex = 0;
	let showMobileOverlay = true;
	let container;
	let carouselScroll;
	let currentTime = new Date().toLocaleTimeString([], {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	});
	/** @type {(project: string) => void} */
	export let onChatClick = () => {};

	const projects = projectsData.filter(p => !p.hidden);
	const mediaProjects = projects.filter(p => p.hasPhoneMedia !== false);

	// Pure scroll-to for buttons/indicators
	function scrollToProject(index) {
		if (view === 'carousel' && carouselScroll) {
			const card = carouselScroll.querySelector(`[data-index="${index}"]`);
			if (card) {
				const targetLeft = card.offsetLeft - carouselScroll.offsetWidth / 2 + card.offsetWidth / 2;
				carouselScroll.scrollTo({ left: targetLeft, behavior: 'smooth' });
			}
		}
		activeIndex = index;
		showMobileOverlay = true;
	}

	const next = () => {
		const list = view === 'phone' ? mediaProjects : projects;
		const newIndex = (activeIndex + 1) % list.length;
		scrollToProject(newIndex);
	};

	const prev = () => {
		const list = view === 'phone' ? mediaProjects : projects;
		const newIndex = (activeIndex - 1 + list.length) % list.length;
		scrollToProject(newIndex);
	};

	$: currentList = view === 'phone' ? mediaProjects : projects;
	$: topProject = currentList[activeIndex % currentList.length] || currentList[0];

	// Filtered phone stack strictly excluding non-media entries
	$: phoneProjects = mediaProjects.map((p, i) => {
		let diff = (i - (activeIndex % mediaProjects.length) + mediaProjects.length) % mediaProjects.length;
		return { ...p, index: diff + 1, offset: diff * 40 };
	});

	$: if (view === 'phone' && activeIndex >= mediaProjects.length) {
		activeIndex = 0;
	}

	// Only update index when scroll settles, don't fight the user
	let scrollTimeout;
	function handleCarouselScroll() {
		if (view !== 'carousel' || !carouselScroll) return;

		clearTimeout(scrollTimeout);
		scrollTimeout = setTimeout(() => {
			const containerRect = carouselScroll.getBoundingClientRect();
			const containerCenter = containerRect.left + containerRect.width / 2;

			const cards = carouselScroll.querySelectorAll('.project-card');
			let closestIndex = activeIndex;
			let minDistance = Infinity;

			cards.forEach((card, i) => {
				const rect = card.getBoundingClientRect();
				const cardCenter = rect.left + rect.width / 2;
				const distance = Math.abs(containerCenter - cardCenter);
				if (distance < minDistance) {
					minDistance = distance;
					closestIndex = i;
				}
			});

			if (closestIndex !== activeIndex) {
				activeIndex = closestIndex;
				showMobileOverlay = true;
			}
		}, 50);
	}

	// Gesture logic for Phone view only
	let lastScrollTime = 0;
	function handleWheel(event) {
		if (view === 'carousel') return;
		
		// Prevent browser "back" navigation when swiping horizontally on trackpad
		if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
			event.preventDefault();
		}

		const now = Date.now();
		if (now - lastScrollTime < 500) return;

		if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
			if (Math.abs(event.deltaX) > 30) {
				if (event.deltaX > 0) next();
				else prev();
				lastScrollTime = now;
			}
		}
	}

	let touchStartX = 0;
	function handleTouchStart(e) {
		touchStartX = e.touches[0].clientX;
	}
	function handleTouchEnd(e) {
		if (view === 'carousel') return;
		const deltaX = e.changedTouches[0].clientX - touchStartX;
		if (Math.abs(deltaX) > 50) {
			if (deltaX < 0) next();
			else prev();
		}
	}

	function handleProjectCardKeydown(event, index) {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		scrollToProject(index);
	}

	onMount(() => {
		const timer = setInterval(() => {
			currentTime = new Date().toLocaleTimeString([], {
				hour: '2-digit',
				minute: '2-digit',
				hour12: false
			});
		}, 60000);
		return () => clearInterval(timer);
	});

	let lastView;
	$: if (view === 'carousel' && lastView !== 'carousel') {
		lastView = 'carousel';
		tick().then(() => scrollToProject(activeIndex));
	} else if (view !== 'carousel') {
		lastView = view;
	}
</script>

<Section title="Software" id="software">
	<div class="software-header">
		<div class="view-toggle">
			<button class:active={view === 'grid'} on:click={() => (view = 'grid')}>Grid</button>
			<button class:active={view === 'phone'} on:click={() => (view = 'phone')}>Stack</button>
			<button class:active={view === 'carousel'} on:click={() => (view = 'carousel')}>Carousel</button>
		</div>

		{#if view !== 'grid'}
			<div class="header-controls">
				<button on:click={prev} aria-label="Previous">
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="square"><path d="M19 12H5M12 19l-7-7 7-7" /></svg
					>
				</button>
				<button on:click={next} aria-label="Next">
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="square"><path d="M5 12h14m-7 7l7-7-7-7" /></svg
					>
				</button>
			</div>
		{/if}
	</div>

	<div class="software-container" bind:this={container}>
		{#if view === 'phone'}
			<div class="phone-view">
				<div class="info-panel desktop-only">
					<div class="project-details">
						<div class="project-title-header">
							<h1>{topProject.name}</h1>
							{#if topProject.status}
								<span class="status-pill">{topProject.status}</span>
							{/if}
						</div>
						<p class="desc">{topProject.description}</p>
						<p class="tech">{topProject.technologies.join(' · ')}</p>
						<div class="desktop-action-row">
							<a href={topProject.url} target="_blank" class="action-btn primary">
								<span>Open</span>
								<ExternalLink size={14} />
							</a>
							{#if topProject.treeSlug}
								<a href="/tree/{topProject.treeSlug}" class="action-btn tree-btn">
									<span>Architecture Note</span>
									<span class="arrow">→</span>
								</a>
							{/if}
							<button class="action-btn secondary" on:click={() => onChatClick(topProject.name)}>
								<div class="prism-icon mini">
									<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path
											d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
											stroke="currentColor"
											stroke-width="2"
											stroke-linejoin="bevel"
										/>
										<path
											d="M12 6L13.5 10.5L18 12L13.5 13.5L12 18L10.5 13.5L6 12L10.5 10.5L12 6Z"
											fill="currentColor"
											class="inner-prism"
										/>
									</svg>
								</div>
								Chat
							</button>
						</div>
					</div>
				</div>

				<div
					class="phone-stack"
					on:wheel|nonpassive={handleWheel}
					on:touchstart={handleTouchStart}
					on:touchend={handleTouchEnd}
				>
					{#each phoneProjects as project (project.id)}
						<div
							class="phone-mockup"
							on:click={() => { if (project.index === 1) showMobileOverlay = !showMobileOverlay }}
							class:is-active={project.index === 1}
							class:is-ghost={project.index === 2}
							class:is-hidden={project.index > 2}
							style="
								z-index: {mediaProjects.length - project.index + 1}; 
								transform: translate({project.offset / 2}px, {project.offset}px);
								pointer-events: {project.index === 1 ? 'auto' : 'none'};
							"
						>
							<div class="status-bar-container">
								<div class="time">{currentTime}</div>
								<div class="dynamic-island"></div>
								<div class="icons">
									<svg viewBox="0 0 24 24" fill="currentColor" class="s-icon"
										><path
											d="M12.01 21.49L23.64 7c-.45-.34-4.93-4-11.64-4C5.28 3 .81 6.66.36 7l11.63 14.49.01.01.01-.01z"
										/></svg
									>
									<svg viewBox="0 0 24 24" fill="currentColor" class="s-icon"
										><path
											d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.67 7 5.33v15.33C7 21.33 7.6 22 8.33 22h7.33c.74 0 1.34-.67 1.34-1.33V5.33C17 4.67 16.4 4 15.67 4z"
										/></svg
									>
								</div>
							</div>

							<div class="screen">
								{#if project.id === 'gametsunami'}
									<GameTsunamiDemo />
								{:else if project.id === 'cruffled'}
									<CruffledDemo />
								{:else if project.id === 'tackry'}
									<TackryDemo />
								{:else if project.video && project.index === 1}
									<video autoplay muted loop playsinline src={project.video} />
								{:else}
									<img src={project.image} alt="" />
								{/if}

								{#if project.index === 1 && showMobileOverlay}
									<div class="mobile-info-overlay mobile-only">
										<div class="overlay-content">
											<div class="mobile-title-header">
												<h2>{project.name}</h2>
												{#if project.status}
													<span class="status-pill mini">{project.status}</span>
												{/if}
											</div>
											<p>{project.description}</p>
											<div class="mobile-action-row">
												<a href={topProject.url} target="_blank" class="mobile-action-btn primary">
													<span>Open</span>
													<ExternalLink size={13} />
												</a>
												{#if project.treeSlug}
													<a href="/tree/{project.treeSlug}" class="mobile-action-btn tree">
														<span>Note →</span>
													</a>
												{/if}
												<button
													class="mobile-action-btn secondary"
													on:click|stopPropagation={() => onChatClick(project.name)}
												>
													Chat ✦
												</button>
											</div>
										</div>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{:else if view === 'carousel'}
			<div class="carousel-view">
				<div class="carousel-scroll" bind:this={carouselScroll} on:scroll={handleCarouselScroll}>
					{#each projects as project, i}
						<div
							class="project-card"
							class:active={i === activeIndex}
							data-index={i}
							on:click={() => scrollToProject(i)}
							on:keydown={(event) => handleProjectCardKeydown(event, i)}
							role="button"
							tabindex="0"
							aria-pressed={i === activeIndex}
							aria-label={`Focus ${project.name} project`}
						>
							<div class="card-media">
								{#if project.id === 'gametsunami'}
									<GameTsunamiDemo />
								{:else if project.id === 'cruffled'}
									<CruffledDemo />
								{:else if project.id === 'tackry'}
									<TackryDemo />
								{:else if project.video && i === activeIndex}
									<video autoplay muted loop playsinline src={project.video} />
								{:else if project.hasPhoneMedia === false}
									<div class="blueprint-card-media">
										<div class="blueprint-grid-overlay"></div>
										<div class="blueprint-badge">
											<span class="blueprint-icon">📐</span>
											<span class="blueprint-status">{project.status}</span>
										</div>
										<div class="blueprint-title">{project.name}</div>
										<span class="blueprint-sub">Architecture & Systems Spec</span>
									</div>
								{:else}
									<img src={project.image} alt={project.name} />
								{/if}
							</div>
							<div class="card-info">
								<div class="card-header">
									<h3>{project.name}</h3>
									{#if project.status}
										<span class="status-pill mini">{project.status}</span>
									{/if}
								</div>
								<p>{project.description}</p>
								<div class="card-tech">
									{#each project.technologies as t}
										<span>{t}</span>
									{/each}
								</div>
								<div class="carousel-action-row">
									<a href={project.url} target="_blank" class="action-btn primary">
										<span>Open</span>
										<ExternalLink size={14} />
									</a>
									{#if project.treeSlug}
										<a href="/tree/{project.treeSlug}" class="action-btn tree-btn">
											<span>Architecture Note</span>
											<span class="arrow">→</span>
										</a>
									{/if}
									<button
										class="action-btn secondary"
										on:click|stopPropagation={() => onChatClick(project.name)}
									>
										<div class="prism-icon mini">
											<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path
													d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
													stroke="currentColor"
													stroke-width="2"
													stroke-linejoin="bevel"
												/>
												<path
													d="M12 6L13.5 10.5L18 12L13.5 13.5L12 18L10.5 13.5L6 12L10.5 10.5L12 6Z"
													fill="currentColor"
													class="inner-prism"
												/>
											</svg>
										</div>
										Chat
									</button>
								</div>
							</div>
						</div>
					{/each}
				</div>
				<div class="carousel-controls">
					<div class="indicators">
						{#each projects as _, i}
							<button
								type="button"
								class="dot"
								class:active={i === activeIndex}
								on:click={() => scrollToProject(i)}
								aria-label={`Go to ${projects[i].name}`}
								aria-pressed={i === activeIndex}
							></button>
						{/each}
					</div>
				</div>
			</div>
		{:else if view === 'grid'}
			<div class="portfolio-grid">
				{#each projects as project}
					<a
						href={project.url}
						target="_blank"
						rel="noopener noreferrer"
						class="grid-card"
					>
						<div class="grid-card-bg">
							{#if project.id === 'gametsunami'}
								<img src="game-modern.png" alt="" class="bg-img" loading="lazy" />
							{:else if project.id === 'squares'}
								<img src="squares.png" alt="" class="bg-img" loading="lazy" />
							{:else if project.id === 'tackry'}
								<img src="tackry-1.png" alt="" class="bg-img" loading="lazy" />
							{:else if project.id === 'cruffled'}
								<img src="cruffled.png" alt="" class="bg-img" loading="lazy" />
							{:else if project.id === 'weatherie'}
								<img src="weatherie.png" alt="" class="bg-img" loading="lazy" />
							{:else}
								<div class="grid-abstract-art {project.id}"></div>
							{/if}
							<div class="grid-card-scrim"></div>
						</div>

						<div class="grid-card-top-bar">
							{#if project.status}
								<span class="grid-status-pill">{project.status}</span>
							{:else}
								<span></span>
							{/if}
							<span class="grid-corner-link" title="Open project">
								<ExternalLink size={14} />
							</span>
						</div>

						<div class="grid-card-content">
							<h3 class="grid-card-title">{project.name}</h3>
							<p class="grid-card-desc">{project.description}</p>

							<div class="grid-card-footer">
								{#if project.treeSlug}
									<a
										href="/tree/{project.treeSlug}"
										class="grid-note-pill"
										on:click|stopPropagation
										title="View Architecture Note"
									>
										<span>Architecture Note</span>
										<span class="arrow">→</span>
									</a>
								{/if}
								<div class="grid-card-tech">
									{#each project.technologies.slice(0, 2) as tech}
										<span class="grid-tech-tag">{tech}</span>
									{/each}
								</div>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</Section>

<style>
	.software-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		position: relative;
		z-index: 50;
	}

	.view-toggle {
		display: flex;
		background: rgba(255, 255, 255, 0.03);
		padding: 0.25rem;
		border-radius: 2rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.view-toggle button {
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.4);
		padding: 0.5rem 1.2rem;
		border-radius: 1.5rem;
		cursor: pointer;
		font-size: 0.75rem;
		text-transform: uppercase;
		font-weight: 700;
		letter-spacing: 0.1em;
		transition: all 0.2s ease;
	}

	.view-toggle button.active {
		background: rgba(255, 255, 255, 0.1);
		color: #fff;
	}

	.header-controls {
		display: flex;
		gap: 1.5rem;
	}

	.header-controls button {
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.4);
		padding: 0;
		width: 2.5rem;
		height: 2.5rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.header-controls button svg {
		width: 1.2rem;
		height: 1.2rem;
	}

	.header-controls button:hover {
		color: #fff;
	}

	.mobile-only {
		display: none;
	}
	.desktop-only {
		display: flex;
	}

	/* Action Buttons */
	.desktop-action-row,
	.carousel-action-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		margin-top: 1.5rem;
	}

	.action-btn {
		flex: 1 1 auto;
		min-width: 110px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1.2rem;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		text-decoration: none;
		transition: all 0.3s ease;
		cursor: pointer;
	}

	.action-btn.primary {
		background: #fff;
		color: #000;
		border: 1px solid #fff;
	}

	.action-btn.secondary {
		background: rgba(255, 255, 255, 0.05);
		color: #fff;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.action-btn.tree-btn {
		background: rgba(99, 102, 241, 0.12);
		color: #a5b4fc;
		border: 1px solid rgba(129, 140, 248, 0.3);
	}

	.action-btn:hover {
		transform: translateY(-3px);
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
	}

	.action-btn.primary:hover {
		background: #eee;
	}
	.action-btn.secondary:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: #fff;
	}
	.action-btn.tree-btn:hover {
		background: rgba(99, 102, 241, 0.25);
		border-color: #818cf8;
		color: #ffffff;
	}

	.mobile-action-row {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.mobile-action-btn {
		flex: 1 1 auto;
		min-width: 70px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
		padding: 0.65rem 0.5rem;
		border-radius: 6px;
		font-weight: 700;
		font-size: 0.72rem;
		text-transform: uppercase;
		text-align: center;
		text-decoration: none;
		border: none;
	}

	.mobile-action-btn.primary {
		background: #fff;
		color: #000;
	}
	.mobile-action-btn.secondary {
		background: rgba(255, 255, 255, 0.15);
		color: #fff;
	}
	.mobile-action-btn.tree {
		background: rgba(99, 102, 241, 0.25);
		color: #c7d2fe;
		border: 1px solid rgba(129, 140, 248, 0.4);
	}

	.project-title-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.mobile-title-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-bottom: 0.4rem;
	}

	.status-pill {
		display: inline-flex;
		align-items: center;
		padding: 0.2rem 0.65rem;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 9999px;
		font-size: 0.72rem;
		font-weight: 600;
		color: #e2e8f0;
		letter-spacing: 0.02em;
		width: fit-content;
	}

	.status-pill.mini {
		font-size: 0.65rem;
		padding: 0.15rem 0.5rem;
	}

	.blueprint-card-media {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 220px;
		background: radial-gradient(circle at top right, rgba(99, 102, 241, 0.18), transparent 70%), #0a0e17;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 1.5rem;
		box-sizing: border-box;
	}

	.blueprint-grid-overlay {
		position: absolute;
		inset: 0;
		background-image: linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
		background-size: 20px 20px;
		pointer-events: none;
	}

	.blueprint-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.25rem 0.75rem;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 9999px;
		font-size: 0.75rem;
		color: #cbd5e1;
		margin-bottom: 0.8rem;
		z-index: 1;
	}

	.blueprint-title {
		font-size: 1.4rem;
		font-weight: 800;
		color: #f8fafc;
		margin-bottom: 0.3rem;
		z-index: 1;
	}

	.blueprint-sub {
		font-size: 0.75rem;
		color: #818cf8;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-weight: 600;
		z-index: 1;
	}

	/* Phone View */
	.phone-view {
		display: flex;
		align-items: center;
		gap: 4rem;
		min-height: 500px;
	}

	.info-panel {
		flex: 1;
		max-width: 400px;
		display: flex;
		flex-direction: column;
	}

	.project-details h1 {
		font-size: clamp(2.5rem, 5vw, 4rem);
		margin-bottom: 1rem;
		letter-spacing: -0.03em;
		color: #fff;
		margin-top: 0;
		font-weight: 800;
	}

	.desc {
		font-size: 1.1rem;
		color: rgba(255, 255, 255, 0.6);
		margin-bottom: 1.5rem;
		line-height: 1.6;
		min-height: 4.8em;
	}

	.tech {
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.3);
		text-transform: uppercase;
		letter-spacing: 0.12em;
	}

	.phone-stack {
		flex: 1;
		position: relative;
		height: 400px;
		display: flex;
		justify-content: center;
		cursor: grab;
		z-index: 10;
	}

	.phone-stack:active {
		cursor: grabbing;
	}

	.phone-mockup {
		position: absolute;
		width: 360px;
		height: 720px;
		background: #050505;
		border: 8px solid #1a1a1a;
		border-radius: 32px;
		box-shadow:
			0 30px 80px rgba(0, 0, 0, 0.6),
			inset 0 0 0 1px rgba(255, 255, 255, 0.1),
			inset 0 0 8px rgba(0, 0, 0, 0.8);
		transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		opacity: 1;
	}

	.status-bar-container {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 6px 18px 0;
		box-sizing: border-box;
		z-index: 40;
		color: #fff;
		font-size: 0.8rem;
		font-weight: 600;
	}

	.dynamic-island {
		width: 80px;
		height: 18px;
		background: #000;
		border-radius: 20px;
		margin-top: 0;
	}

	.icons {
		display: flex;
		gap: 6px;
		align-items: center;
	}
	.s-icon {
		width: 14px;
		height: 14px;
	}

	.screen {
		width: 100%;
		height: 100%;
		background: #000;
		border-radius: 26px;
		overflow: hidden;
		position: relative;
	}

	.screen img,
	.screen video,
	.screen :global(.demo-container) {
		width: 100%;
		height: calc(100% - 32px);
		object-fit: contain;
		object-position: top;
		position: absolute;
		top: 32px;
		left: 0;
		background: #000;
	}

	.mobile-info-overlay {
		position: absolute;
		bottom: 1rem;
		left: 1rem;
		width: calc(100% - 2rem);
		padding: 1.5rem;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(15px);
		-webkit-backdrop-filter: blur(15px);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 24px;
		z-index: 25;
		box-sizing: border-box;
		text-align: left;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
	}

	.overlay-content h2 {
		margin: 0 0 0.4rem 0;
		font-size: 1.4rem;
		font-weight: 800;
		color: #fff;
	}
	.overlay-content p {
		margin: 0 0 1rem 0;
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.7);
		line-height: 1.4;
	}

	.prism-icon.mini {
		width: 0.9rem;
		height: 0.9rem;
		animation: rotatePrism 8s infinite linear;
	}

	@keyframes rotatePrism {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.inner-prism {
		animation: pulseInner 2s infinite ease-in-out;
	}
	@keyframes pulseInner {
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

	/* Carousel View */
	.carousel-view {
		width: 100%;
	}
	.carousel-scroll {
		display: flex;
		gap: 2rem;
		overflow-x: auto;
		padding: 2rem 0;
		scroll-snap-type: x mandatory;
		scrollbar-width: none;
		-ms-overflow-style: none;
		padding-left: calc(50% - 250px);
		padding-right: calc(50% - 250px);
	}
	.carousel-scroll::-webkit-scrollbar {
		display: none;
	}

	.project-card {
		min-width: 500px;
		scroll-snap-align: center;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 16px;
		overflow: hidden;
		transition: all 0.4s ease;
		cursor: pointer;
		opacity: 0.3;
		transform: scale(0.95);
	}

	.project-card:focus-visible {
		outline: 2px solid rgba(255, 255, 255, 0.8);
		outline-offset: 4px;
	}

	.project-card.active {
		opacity: 1;
		transform: scale(1);
		background: rgba(255, 255, 255, 0.04);
		border-color: rgba(255, 255, 255, 0.1);
	}

	.card-media {
		width: 100%;
		aspect-ratio: 16/10;
		background: #111;
		overflow: hidden;
	}
	.card-media img,
	.card-media video,
	.card-media :global(.demo-container) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.card-info {
		padding: 1.5rem;
	}
	.card-header h3 {
		font-size: 1.4rem;
		margin: 0;
	}
	.card-info p {
		color: rgba(255, 255, 255, 0.5);
		font-size: 0.9rem;
		margin-bottom: 1.5rem;
		line-height: 1.5;
	}
	.card-tech {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}
	.card-tech span {
		font-size: 0.65rem;
		text-transform: uppercase;
		background: rgba(255, 255, 255, 0.05);
		padding: 0.2rem 0.6rem;
		border-radius: 4px;
		color: rgba(255, 255, 255, 0.4);
	}

	.carousel-controls {
		display: flex;
		justify-content: center;
		margin-top: 2rem;
	}
	.indicators {
		display: flex;
		gap: 0.6rem;
	}
	.dot {
		width: 5px;
		height: 5px;
		background: rgba(255, 255, 255, 0.15);
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.3s ease;
		border: none;
		padding: 0;
		display: block;
	}
	.dot.active {
		background: #fff;
		transform: scale(1.4);
	}
	.dot:focus-visible {
		outline: 2px solid rgba(255, 255, 255, 0.8);
		outline-offset: 4px;
	}

	@media (max-width: 900px) {
		.mobile-only {
			display: flex;
		}
		.desktop-only {
			display: none;
		}
		.software-header {
			margin-bottom: 2rem;
		}
		.phone-view {
			display: block;
			text-align: left;
			min-height: auto;
		}
		.phone-stack {
			width: 100%;
			height: min(75vh, 140vw);
			margin: 2rem auto 0;
			display: flex;
			justify-content: center;
			align-items: flex-start;
			box-sizing: border-box;
			z-index: 10;
			position: relative;
		}
		.phone-mockup {
			width: min(70vw, 35vh);
			height: min(120vw, 60vh);
			position: absolute;
			left: 50%;
			transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
			background: #050505;
			border-radius: 24px;
			border: 4px solid #1a1a1a;
		}
		.status-bar-container {
			padding: 4px 14px 0;
			height: 24px;
			font-size: 0.65rem;
		}
		.screen img,
		.screen video,
		.screen :global(.demo-container) {
			top: 24px;
			height: auto;
			min-height: calc(100% - 24px);
		}
		.dynamic-island {
			width: 45px;
			height: 12px;
			margin-top: 4px;
		}
		.s-icon {
			width: 10px !important;
			height: 10px !important;
		}
		.header-controls button svg {
			width: 1rem !important;
			height: 1rem !important;
		}
		.phone-mockup.is-active {
			z-index: 30 !important;
			opacity: 1 !important;
			transform: translateX(-50%) !important;
		}
		.phone-mockup.is-ghost {
			opacity: 1 !important;
			z-index: 20 !important;
			transform: translate(calc(-50% + 15px), 30px) !important;
		}
		.phone-mockup.is-hidden {
			opacity: 0 !important;
			pointer-events: none;
		}
		.carousel-scroll {
			padding-left: calc(50% - 150px);
			padding-right: calc(50% - 250px);
		}
		.project-card {
			min-width: 300px;
		}
	}

	/* ==========================================================================
	   Grid View Styling (Option A - Spacious & App-Like)
	   ========================================================================== */
	.portfolio-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
		gap: 1.75rem;
		width: 100%;
		box-sizing: border-box;
	}

	.grid-card {
		position: relative;
		border-radius: 20px;
		overflow: hidden;
		min-height: 340px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: #090d16;
		text-decoration: none;
		color: inherit;
		cursor: pointer;
		transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1),
			box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1),
			border-color 0.28s ease;
		box-shadow: 0 12px 36px rgba(0, 0, 0, 0.45);
	}

	.grid-card:hover {
		transform: translateY(-6px);
		border-color: rgba(255, 255, 255, 0.35);
		box-shadow: 0 22px 50px rgba(0, 0, 0, 0.7);
	}

	.grid-card-bg {
		position: absolute;
		inset: 0;
		z-index: 1;
		overflow: hidden;
	}

	.grid-card-bg .bg-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: top center;
		transform: scale(1.02);
		transition: transform 0.5s ease, filter 0.5s ease;
		filter: brightness(0.65) contrast(1.05);
	}

	.grid-card:hover .grid-card-bg .bg-img {
		transform: scale(1.08);
		filter: brightness(0.82) contrast(1.1);
	}

	.grid-card-scrim {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			180deg,
			rgba(10, 15, 26, 0.3) 0%,
			rgba(10, 15, 26, 0.45) 30%,
			rgba(8, 11, 20, 0.88) 65%,
			rgba(5, 7, 13, 0.98) 100%
		);
		pointer-events: none;
	}

	/* Abstract backgrounds for spec & system projects without phone screenshots */
	.grid-abstract-art {
		width: 100%;
		height: 100%;
		position: relative;
		background: radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.25), transparent 60%),
			radial-gradient(circle at 20% 80%, rgba(56, 189, 248, 0.18), transparent 60%),
			#0b101b;
	}

	.grid-abstract-art.section-launcher {
		background: radial-gradient(circle at 75% 25%, rgba(52, 211, 153, 0.28), transparent 60%),
			radial-gradient(circle at 20% 70%, rgba(16, 185, 129, 0.15), transparent 50%),
			#081410;
	}

	.grid-abstract-art.five-card-charlie {
		background: radial-gradient(circle at 75% 25%, rgba(244, 63, 94, 0.28), transparent 60%),
			radial-gradient(circle at 20% 70%, rgba(168, 85, 247, 0.22), transparent 50%),
			#140a16;
	}

	.grid-abstract-art.calculated-survival {
		background: radial-gradient(circle at 75% 25%, rgba(245, 158, 11, 0.28), transparent 60%),
			radial-gradient(circle at 20% 70%, rgba(234, 88, 12, 0.18), transparent 50%),
			#161108;
	}

	.grid-abstract-art.inwork {
		background: radial-gradient(circle at 75% 25%, rgba(14, 165, 233, 0.28), transparent 60%),
			radial-gradient(circle at 20% 70%, rgba(99, 102, 241, 0.22), transparent 50%),
			#0a101d;
	}

	.grid-abstract-art::after {
		content: '';
		position: absolute;
		inset: 0;
		background-image: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
		background-size: 24px 24px;
		opacity: 0.6;
	}

	/* Top Bar: Status pill & Corner launch indicator */
	.grid-card-top-bar {
		position: relative;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.1rem 1.25rem 0;
	}

	.grid-status-pill {
		display: inline-flex;
		align-items: center;
		padding: 0.22rem 0.65rem;
		background: rgba(0, 0, 0, 0.55);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 9999px;
		font-size: 0.68rem;
		font-weight: 600;
		color: #f1f5f9;
		letter-spacing: 0.02em;
		text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
	}

	.grid-corner-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.15);
		color: rgba(255, 255, 255, 0.7);
		transition: all 0.25s ease;
	}

	.grid-card:hover .grid-corner-link {
		background: #ffffff;
		color: #000000;
		border-color: #ffffff;
		transform: scale(1.1) translate(1px, -1px);
	}

	/* Bottom Content Area */
	.grid-card-content {
		position: relative;
		z-index: 2;
		padding: 1.25rem 1.35rem 1.35rem;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		box-sizing: border-box;
	}

	.grid-card-title {
		margin: 0 0 0.4rem 0;
		font-size: 1.35rem;
		font-weight: 800;
		color: #ffffff;
		letter-spacing: -0.015em;
		line-height: 1.2;
		text-shadow: 0 2px 10px rgba(0, 0, 0, 0.9), 0 1px 2px rgba(0, 0, 0, 1);
	}

	.grid-card-desc {
		margin: 0 0 1rem 0;
		font-size: 0.88rem;
		line-height: 1.5;
		color: rgba(255, 255, 255, 0.82);
		text-shadow: 0 2px 8px rgba(0, 0, 0, 0.95), 0 1px 3px rgba(0, 0, 0, 1);
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.grid-card-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.6rem;
		flex-wrap: wrap;
	}

	.grid-note-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.32rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.72rem;
		font-weight: 600;
		color: #c7d2fe;
		background: rgba(99, 102, 241, 0.22);
		border: 1px solid rgba(129, 140, 248, 0.35);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.grid-note-pill:hover {
		background: rgba(99, 102, 241, 0.45);
		border-color: #818cf8;
		color: #ffffff;
		transform: translateY(-1px);
	}

	.grid-note-pill .arrow {
		transition: transform 0.2s ease;
	}

	.grid-note-pill:hover .arrow {
		transform: translateX(2px);
	}

	.grid-card-tech {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.grid-tech-tag {
		font-size: 0.64rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		background: rgba(255, 255, 255, 0.08);
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(6px);
		border: 1px solid rgba(255, 255, 255, 0.12);
		padding: 0.2rem 0.55rem;
		border-radius: 6px;
		color: rgba(255, 255, 255, 0.85);
		text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
	}

	/* ==========================================================================
	   Mobile 2-Column Responsive Layout
	   ========================================================================== */
	@media (max-width: 680px) {
		.portfolio-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 0.75rem;
		}

		.grid-card {
			min-height: 270px;
			border-radius: 16px;
		}

		.grid-card-top-bar {
			padding: 0.75rem 0.75rem 0;
		}

		.grid-corner-link {
			width: 24px;
			height: 24px;
		}

		.grid-status-pill {
			font-size: 0.58rem;
			padding: 0.15rem 0.45rem;
		}

		.grid-card-content {
			padding: 0.75rem;
		}

		.grid-card-title {
			font-size: 1rem;
			margin-bottom: 0.25rem;
		}

		.grid-card-desc {
			font-size: 0.74rem;
			line-height: 1.35;
			margin-bottom: 0.6rem;
			-webkit-line-clamp: 2;
		}

		.grid-card-footer {
			gap: 0.35rem;
		}

		.grid-note-pill {
			font-size: 0.62rem;
			padding: 0.22rem 0.55rem;
		}

		.grid-note-pill span:first-child {
			white-space: nowrap;
		}

		.grid-card-tech {
			display: none; /* Keep clean on 2-column mobile cards */
		}
	}
</style>
