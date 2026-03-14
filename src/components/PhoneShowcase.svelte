<script>
	import { onMount } from 'svelte';
	import resume from '$lib/resume.json';
	import Section from './Section.svelte';

	let projects = resume.projects.map((p, i) => ({
		...p,
		index: i + 1,
		offset: (i + 1) * 40
	}));

	let topProject = projects[0];
	let container;

	const updateTop = () => {
		// Stop all videos
		const videos = container.querySelectorAll('video');
		videos.forEach(v => v.pause());

		topProject = projects.find((p) => p.index === 1);

		// Play current top video if it exists
		const currentVideo = container.querySelector(`#phone-${topProject.id} video`);
		if (currentVideo) currentVideo.play();
	};

	const next = () => {
		projects = projects.map((p) => {
			if (p.index === 1) {
				p.offset = 40 * projects.length;
				p.index = projects.length;
			} else {
				p.offset -= 40;
				p.index -= 1;
			}
			return p;
		});
		updateTop();
	};

	const prev = () => {
		projects = projects.map((p) => {
			if (p.index === projects.length) {
				p.offset = 40;
				p.index = 1;
			} else {
				p.offset += 40;
				p.index += 1;
			}
			return p;
		});
		updateTop();
	};

	let touchStartX = 0;

	onMount(() => {
		// Initialize video play for the first one
		updateTop();

		// Wheel scroll support
		let isScrolling = false;
		const handleWheel = (event) => {
			if (!isScrolling) {
				isScrolling = true;
				if (Math.abs(event.deltaY) > 30 || Math.abs(event.deltaX) > 30) {
					if (event.deltaY > 0 || event.deltaX > 0) next();
					else prev();
				}
				setTimeout(() => { isScrolling = false; }, 300);
			}
		};

		// Touch support
		const handleTouchStart = (e) => {
			touchStartX = e.touches[0].clientX;
		};

		const handleTouchEnd = (e) => {
			const touchEndX = e.changedTouches[0].clientX;
			const deltaX = touchEndX - touchStartX;
			if (Math.abs(deltaX) > 50) {
				if (deltaX < 0) next();
				else prev();
			}
		};

		container.addEventListener('wheel', handleWheel, { passive: true });
		container.addEventListener('touchstart', handleTouchStart, { passive: true });
		container.addEventListener('touchend', handleTouchEnd, { passive: true });

		return () => {
			container.removeEventListener('wheel', handleWheel);
			container.removeEventListener('touchstart', handleTouchStart);
			container.removeEventListener('touchend', handleTouchEnd);
		};
	});
</script>

<Section title="Showcase" id="showcase">
	<div class="showcase-container" bind:this={container}>
		<div class="info-panel">
			<div class="controls">
				<button on:click={prev}>&larr; Prev</button>
				<button on:click={next}>Next &rarr;</button>
			</div>
			<div class="project-details">
				<a href={topProject.url} target="_blank" class="title-link">
					<h1>{topProject.name}</h1>
				</a>
				<p class="desc">{topProject.description}</p>
				<p class="tech">{topProject.technologies.join(' · ')}</p>
			</div>
		</div>

		<div class="phone-stack">
			{#each projects as project (project.id)}
				<div
					id="phone-{project.id}"
					class="phone-mockup"
					style="
						z-index: {projects.length - project.index + 1};
						transform: translate({project.offset / 2}px, {project.offset}px);
						opacity: {project.index < 4 ? 1 : 0};
						pointer-events: {project.index === 1 ? 'auto' : 'none'};
					"
				>
					<div class="notch"></div>
					<div class="screen">
						<img src={project.image} alt="" />
						{#if project.video}
							<video muted loop playsinline src={project.video} />
						{/if}
						<div class="reflection"></div>
					</div>
					<div class="hardware-buttons">
						<div class="button silent"></div>
						<div class="button vol-up"></div>
						<div class="button vol-down"></div>
						<div class="button power"></div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</Section>

<style>
	.showcase-container {
		display: flex;
		min-height: 650px;
		align-items: center;
		gap: 4rem;
		user-select: none;
	}

	.info-panel {
		flex: 1;
		max-width: 400px;
	}

	.controls {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.controls button {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: #fff;
		padding: 0.6rem 1.2rem;
		border-radius: 2rem;
		cursor: pointer;
		font-weight: 600;
		font-size: 0.9rem;
		transition: all 0.3s ease;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.controls button:hover {
		background: #fff;
		color: #000;
	}

	.title-link {
		text-decoration: none;
		color: #fff;
	}

	.title-link h1 {
		font-size: 3.5rem;
		margin-bottom: 1rem;
		letter-spacing: -0.02em;
	}

	.desc {
		font-size: 1.2rem;
		color: rgba(255, 255, 255, 0.7);
		margin-bottom: 1rem;
		line-height: 1.5;
	}

	.tech {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.4);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.phone-stack {
		flex: 1;
		position: relative;
		height: 600px;
		display: flex;
		justify-content: center;
		align-items: flex-start;
	}

	.phone-mockup {
		position: absolute;
		width: 270px;
		height: 560px;
		background: #050505;
		border: 6px solid #1a1a1a;
		border-radius: 48px;
		box-shadow:
			0 20px 50px rgba(0,0,0,0.6),
			inset 0 0 0 1px rgba(255,255,255,0.1);
		transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
		display: flex;
		align-items: center;
		justify-content: center;
		outline: 1px solid #000;
	}

	.notch {
		position: absolute;
		top: 10px;
		left: 50%;
		transform: translateX(-50%);
		width: 75px;
		height: 22px;
		background: #000;
		border-radius: 20px;
		z-index: 30;
	}

	.notch::after {
		content: '';
		position: absolute;
		right: 12px;
		top: 50%;
		transform: translateY(-50%);
		width: 6px;
		height: 6px;
		background: #0a0a0a;
		border-radius: 50%;
		box-shadow: inset 0 0 1px rgba(255,255,255,0.2);
	}

	.screen {
		width: calc(100% - 4px);
		height: calc(100% - 4px);
		background: #000;
		border-radius: 42px;
		overflow: hidden;
		position: relative;
		z-index: 10;
	}

	.screen img,
	.screen video {
		width: 100%;
		height: 100%;
		object-fit: cover;
		position: absolute;
		top: 0;
		left: 0;
	}

	.reflection {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(
			105deg,
			transparent 40%,
			rgba(255, 255, 255, 0.02) 41%,
			rgba(255, 255, 255, 0.05) 50%,
			transparent 60%
		);
		pointer-events: none;
		z-index: 20;
	}

	.hardware-buttons .button {
		position: absolute;
		background: #1a1a1a;
		border-radius: 2px;
		z-index: -1;
	}

	.silent { top: 75px; left: -9px; width: 3px; height: 22px; }
	.vol-up { top: 115px; left: -9px; width: 3px; height: 45px; }
	.vol-down { top: 170px; left: -9px; width: 3px; height: 45px; }
	.power { top: 140px; right: -9px; width: 3px; height: 75px; }

	@media (max-width: 900px) {
		.showcase-container {
			display: block;
			text-align: center;
			min-height: auto;
		}

		.info-panel {
			max-width: 100%;
			margin-bottom: 2rem;
		}

		.controls {
			justify-content: center;
			margin-bottom: 2rem;
		}

		.phone-stack {
			width: 100%;
			margin: 0 auto;
			display: flex;
			justify-content: center;
			align-items: flex-start;
			/* Offset for the stack translation to keep it centered */
			padding-right: 40px;
			box-sizing: border-box;
		}

		.phone-mockup {
			width: 240px; /* Slightly smaller for mobile */
			height: 500px;
		}

		.title-link h1 {
			font-size: 2.5rem;
		}
	}
</style>
