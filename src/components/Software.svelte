<script>
	import { onMount, tick } from 'svelte';
	import resume from '$lib/resume.json';
	import Section from './Section.svelte';

	let view = 'phone'; // 'phone' or 'carousel'
	let activeIndex = 0;
	let container;
	let carouselScroll;
	let currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

	const projects = resume.projects;

	// Pure scroll-to for buttons/indicators
	function scrollToProject(index) {
		if (view === 'carousel' && carouselScroll) {
			const card = carouselScroll.querySelector(`[data-index="${index}"]`);
			if (card) {
				const targetLeft = card.offsetLeft - (carouselScroll.offsetWidth / 2) + (card.offsetWidth / 2);
				carouselScroll.scrollTo({ left: targetLeft, behavior: 'smooth' });
			}
		}
		activeIndex = index;
	}

	const next = () => {
		const newIndex = (activeIndex + 1) % projects.length;
		scrollToProject(newIndex);
	};

	const prev = () => {
		const newIndex = (activeIndex - 1 + projects.length) % projects.length;
		scrollToProject(newIndex);
	};

	$: topProject = projects[activeIndex];

	// Phone stack logic remains visual-only
	$: phoneProjects = projects.map((p, i) => {
		let diff = (i - activeIndex + projects.length) % projects.length;
		return { ...p, index: diff + 1, offset: diff * 40 };
	});

	// Only update index when scroll settles, don't fight the user
	let scrollTimeout;
	function handleCarouselScroll() {
		if (view !== 'carousel' || !carouselScroll) return;
		
		clearTimeout(scrollTimeout);
		scrollTimeout = setTimeout(() => {
			const center = carouselScroll.scrollLeft + (carouselScroll.offsetWidth / 2);
			const cards = carouselScroll.querySelectorAll('.project-card');
			let closestIndex = activeIndex;
			let minDistance = Infinity;

			cards.forEach((card, i) => {
				const cardCenter = card.offsetLeft + (card.offsetWidth / 2);
				const distance = Math.abs(center - cardCenter);
				if (distance < minDistance) {
					minDistance = distance;
					closestIndex = i;
				}
			});

			if (closestIndex !== activeIndex) {
				activeIndex = closestIndex;
			}
		}, 50); // Debounce to let snap finish
	}

	// Gesture logic for Phone view only
	let lastScrollTime = 0;
	function handleWheel(event) {
		if (view === 'carousel') return;
		const now = Date.now();
		if (now - lastScrollTime < 500) return;

		if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
			if (Math.abs(event.deltaX) > 30) {
				event.preventDefault();
				if (event.deltaX > 0) next();
				else prev();
				lastScrollTime = now;
			}
		}
	}

	let touchStartX = 0;
	function handleTouchStart(e) { touchStartX = e.touches[0].clientX; }
	function handleTouchEnd(e) {
		if (view === 'carousel') return; 
		const deltaX = e.changedTouches[0].clientX - touchStartX;
		if (Math.abs(deltaX) > 50) {
			if (deltaX < 0) next();
			else prev();
		}
	}

	onMount(() => {
		const timer = setInterval(() => {
			currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
		}, 60000);
		return () => clearInterval(timer);
	});

	// Sync initial view
	$: if (view === 'carousel') {
		tick().then(() => scrollToProject(activeIndex));
	}
</script>

<Section title="Software" id="software">
	<div class="software-header">
		<div class="view-toggle">
			<button class:active={view === 'phone'} on:click={() => view = 'phone'}>Stack</button>
			<button class:active={view === 'carousel'} on:click={() => view = 'carousel'}>Carousel</button>
		</div>
		
		<div class="header-controls">
			<button on:click={prev} aria-label="Previous">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
			</button>
			<button on:click={next} aria-label="Next">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square"><path d="M5 12h14m-7 7l7-7-7-7"/></svg>
			</button>
		</div>
	</div>

	<div class="software-container" bind:this={container}>
		{#if view === 'phone'}
			<div class="phone-view">
				<div class="info-panel desktop-only">
					<div class="project-details">
						<h1>{topProject.name}</h1>
						<p class="desc">{topProject.description}</p>
						<p class="tech">{topProject.technologies.join(' · ')}</p>
						<a href={topProject.url} target="_blank" class="desktop-project-btn">
							Open Project ↗
						</a>
					</div>
				</div>

				<div class="phone-stack" 
					on:wheel={handleWheel}
					on:touchstart={handleTouchStart}
					on:touchend={handleTouchEnd}
				>
					{#each phoneProjects as project (project.id)}
						<div
							class="phone-mockup"
							class:is-active={project.index === 1}
							class:is-ghost={project.index === 2}
							class:is-hidden={project.index > 2}
							style="
								z-index: {projects.length - project.index + 1}; 
								transform: translate({project.offset / 2}px, {project.offset}px);
								pointer-events: {project.index === 1 ? 'auto' : 'none'};
							"
						>
							<div class="status-bar-container">
								<div class="time">{currentTime}</div>
								<div class="dynamic-island"></div>
								<div class="icons">
									<svg viewBox="0 0 24 24" fill="currentColor" class="s-icon"><path d="M12.01 21.49L23.64 7c-.45-.34-4.93-4-11.64-4C5.28 3 .81 6.66.36 7l11.63 14.49.01.01.01-.01z"/></svg>
									<svg viewBox="0 0 24 24" fill="currentColor" class="s-icon"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.67 7 5.33v15.33C7 21.33 7.6 22 8.33 22h7.33c.74 0 1.34-.67 1.34-1.33V5.33C17 4.67 16.4 4 15.67 4z"/></svg>
								</div>
							</div>
							
							<div class="screen">
								{#if project.video && project.index === 1}
									<video autoplay muted loop playsinline src={project.video} />
								{:else}
									<img src={project.image} alt="" />
								{/if}
								
								{#if project.index === 1}
									<div class="mobile-info-overlay mobile-only">
										<div class="overlay-content">
											<h2>{project.name}</h2>
											<p>{project.description}</p>
											<div class="overlay-tech">
												{#each project.technologies.slice(0,3) as t}
													<span>{t}</span>
												{/each}
											</div>
											<a href={topProject.url} target="_blank" class="overlay-btn">Open Project ↗</a>
										</div>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<div class="carousel-view">
				<div class="carousel-scroll" 
					bind:this={carouselScroll}
					on:scroll={handleCarouselScroll}
				>
					{#each projects as project, i}
						<div 
							class="project-card" 
							class:active={i === activeIndex}
							data-index={i}
							on:click={() => scrollToProject(i)}
						>
							<div class="card-media">
								{#if project.video && i === activeIndex}
									<video autoplay muted loop playsinline src={project.video} />
								{:else}
									<img src={project.image} alt={project.name} />
								{/if}
							</div>
							<div class="card-info">
								<div class="card-header">
									<h3>{project.name}</h3>
								</div>
								<p>{project.description}</p>
								<div class="card-tech">
									{#each project.technologies as t}
										<span>{t}</span>
									{/each}
								</div>
								<a href={project.url} target="_blank" class="carousel-project-btn">
									Open Project ↗
								</a>
							</div>
						</div>
					{/each}
				</div>
				<div class="carousel-controls">
					<div class="indicators">
						{#each projects as _, i}
							<div class="dot" class:active={i === activeIndex} on:click={() => scrollToProject(i)}></div>
						{/each}
					</div>
				</div>
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

	.header-controls button, .controls button {
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

	.header-controls button svg, .controls button svg {
		width: 1.2rem;
		height: 1.2rem;
	}

	.header-controls button:hover, .controls button:hover {
		color: #fff;
	}

	.mobile-only { display: none; }
	.desktop-only { display: flex; }

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

	.controls {
		display: flex !important;
		flex-direction: row !important;
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.project-details h1 {
		font-size: clamp(2.5rem, 5vw, 4rem);
		margin-bottom: 1rem;
		letter-spacing: -0.03em;
		color: #fff;
		margin-top: 0;
		font-weight: 800;
	}

	.desktop-project-btn {
		display: inline-block;
		margin-top: 2rem;
		padding: 0.8rem 2rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		color: #fff;
		text-decoration: none;
		font-weight: 600;
		font-size: 0.9rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		transition: all 0.3s ease;
	}

	.desktop-project-btn:hover {
		background: #fff;
		color: #000;
		border-color: #fff;
		transform: translateY(-3px);
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
		border: 6px solid #1a1a1a;
		border-radius: 32px;
		box-shadow: 
			0 30px 80px rgba(0,0,0,0.6),
			inset 0 0 0 1px rgba(255,255,255,0.1),
			inset 0 0 8px rgba(0,0,0,0.8);
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

	.screen img, .screen video {
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
		box-shadow: 0 10px 30px rgba(0,0,0,0.5);
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

	.overlay-tech {
		display: flex;
		gap: 0.4rem;
		margin-bottom: 1.2rem;
	}

	.overlay-tech span {
		font-size: 0.6rem;
		text-transform: uppercase;
		background: rgba(255, 255, 255, 0.1);
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		color: #fff;
	}

	.overlay-btn {
		display: block;
		width: 100%;
		padding: 0.7rem;
		background: #fff;
		color: #000;
		text-align: center;
		text-decoration: none;
		font-weight: 700;
		font-size: 0.75rem;
		border-radius: 6px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
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

	.card-media img, .card-media video {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.card-info {
		padding: 1.5rem;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.card-header h3 {
		font-size: 1.4rem;
		margin: 0;
	}

	.carousel-project-btn {
		display: inline-block;
		margin-top: 1.5rem;
		padding: 0.6rem 1.5rem;
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 8px;
		color: #fff;
		text-decoration: none;
		font-weight: 600;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		transition: all 0.3s ease;
		text-align: center;
	}

	.carousel-project-btn:hover {
		background: #fff;
		color: #000;
		border-color: #fff;
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
	}

	.dot.active {
		background: #fff;
		transform: scale(1.4);
	}

	@media (max-width: 900px) {
		.mobile-only { display: flex; }
		.desktop-only { display: none; }

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
			height: min(130vw, 65vh);
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

		.screen img, .screen video {
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
			padding-right: calc(50% - 150px);
		}

		.project-card {
			min-width: 300px;
		}
	}
</style>
