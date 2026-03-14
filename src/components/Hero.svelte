<script>
	import { onMount, onDestroy, tick } from 'svelte';
	import Animations from './Animations.svelte';
	import resume from '$lib/resume.json';

	const expertise = [
		{ label: 'Full Stack Engineering', icon: 'full' },
		{ label: 'Web Design', icon: 'web' },
		{ label: 'Game Development', icon: 'game' },
		{ label: 'AI Implementation', icon: 'ai' },
		{ label: 'Application Development', icon: 'application' },
		{ label: 'Systems Architecture', icon: 'systems' }
	];

	const slot1 = [
		'orchestrating numerous agentic coding tools simultaneously',
		'implementing custom orchestration for multi-agent systems',
		'engineering streaming protocols for real-time agent sync',
		'developing multi-step autonomous workflows with AI SDKs',
		'architecting real-time LLM usage tracking and monitoring',
		'designing complex event-driven architectural systems'
	];

	const slot2 = [
		'high-performance architectures for high-growth startups',
		'scalable ETL microservices handling millions of records',
		'complex AWS and GCP cloud infrastructure orchestration',
		'asynchronous systems bridging industrial events with AI models',
		'sophisticated end-to-end product delivery across domains',
		'robust systems with architectural insights and planning'
	];

	let index = 0;
	let interval;
	let isPaused = false;
	let showDropdown = false;
	const duration = 7000;

	function startCycle() {
		clearInterval(interval);
		interval = setInterval(() => {
			if (!isPaused) {
				index = (index + 1) % Math.max(expertise.length, slot1.length, slot2.length);
			}
		}, duration);
	}

	function togglePause() {
		isPaused = !isPaused;
		if (!isPaused) {
			index = (index + 1) % Math.max(expertise.length, slot1.length, slot2.length);
			startCycle();
		}
	}

	function selectExpertise(i) {
		index = i;
		isPaused = true;
		showDropdown = false;
	}

	function toggleDropdown(e) {
		e.stopPropagation();
		showDropdown = !showDropdown;
	}

	onMount(() => {
		startCycle();
		const closeDropdown = () => showDropdown = false;
		window.addEventListener('click', closeDropdown);
		return () => window.removeEventListener('click', closeDropdown);
	});

	onDestroy(() => {
		clearInterval(interval);
	});

	$: currentExpertise = expertise[index % expertise.length];
	$: currentSlot1 = slot1[index % slot1.length];
	$: currentSlot2 = slot2[index % slot2.length];
</script>

<section class="hero">
	<div class="grain-overlay"></div>
	
	<div class="animation-background">
		<Animations role={currentExpertise.label} />
	</div>

	<div class="content">
		<div class="hero-main">
			<div class="name-container">
				<h1 class="name">
					<span class="bold">Andrea</span>
					<span class="light">de Candia</span>
				</h1>
				{#key index}
					<div class="progress-line-container" on:click={togglePause} class:is-paused={isPaused}>
						<div class="progress-line" style="animation-duration: {duration}ms; animation-play-state: {isPaused ? 'paused' : 'running'}"></div>
					</div>
				{/key}
			</div>
			
			<div class="meta-container">
				<div class="title-group">
					<p class="label">{resume.label}</p>
					<div class="role-selector-wrapper">
						<button class="role-text-btn" on:click={toggleDropdown}>
							<span class="role-name">{currentExpertise.label}</span>
							<svg class="chevron" class:open={showDropdown} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 9l6 6 6-6"/></svg>
						</button>
						
						{#if showDropdown}
							<div class="dropdown">
								{#each expertise as item, i}
									<button 
										class="dropdown-item" 
										class:active={i === index % expertise.length}
										on:click={() => selectExpertise(i)}
									>
										{item.label}
									</button>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<div class="summary-box">
					<div class="dynamic-statement">
						I'm a Software Engineer extensively practiced in utilizing AI through 
						<span class="slot" key={currentSlot1}>{currentSlot1}</span>
						to accomplish with architectural insights and end-to-end planning 
						<span class="slot" key={currentSlot2}>{currentSlot2}</span>.
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="scroll-indicator">
		<div class="mouse"></div>
		<span>Scroll</span>
	</div>
</section>

<style>
	.hero {
		scroll-snap-align: start;
		min-height: 100vh;
		min-height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		box-sizing: border-box;
		background: #000;
		position: relative;
		overflow: hidden;
	}

	.grain-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
		opacity: 0.05;
		pointer-events: none;
		z-index: 5;
	}

	.animation-background {
		position: absolute;
		top: 50%;
		right: -8%;
		transform: translateY(-50%);
		width: 50%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.06;
		pointer-events: none;
		z-index: 1;
		transition: all 1s ease;
	}

	:global(.hero .animation-background .animations svg) {
		width: 40vh !important;
		height: 40vh !important;
		max-width: 500px;
	}

	.content {
		max-width: 1100px;
		width: 100%;
		position: relative;
		z-index: 10;
	}

	.hero-main {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		text-align: left;
	}

	.name-container {
		margin-bottom: 2rem;
		position: relative;
	}

	.name {
		font-size: clamp(3.5rem, 12vw, 7rem);
		line-height: 0.9;
		margin: 0;
		text-transform: uppercase;
		display: flex;
		flex-direction: column;
		letter-spacing: -0.04em;
	}

	.name .bold { font-weight: 900; color: #fff; }
	.name .light { font-weight: 200; color: rgba(255, 255, 255, 0.4); margin-top: -0.5rem; }

	.progress-line-container {
		width: 100px;
		height: 4px;
		background: rgba(255, 255, 255, 0.1);
		margin-top: 1.5rem;
		overflow: hidden;
		cursor: pointer;
		transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
	}

	.progress-line-container.is-paused {
		width: 50px;
		background: rgba(255, 255, 255, 0.05);
	}

	.progress-line-container.is-paused .progress-line {
		animation: none;
		width: 100%;
		background: rgba(255, 255, 255, 0.3);
	}

	.progress-line {
		height: 100%;
		background: #fff;
		width: 0;
		animation: progress linear forwards;
	}

	@keyframes progress {
		from { width: 0; }
		to { width: 100%; }
	}

	.meta-container {
		display: flex;
		gap: 4rem;
		align-items: flex-start;
		margin-top: 3rem;
		width: 100%;
	}

	.title-group {
		flex-shrink: 0;
		width: 300px;
	}

	.label {
		font-size: 1.2rem;
		font-weight: 700;
		color: #fff;
		text-transform: uppercase;
		letter-spacing: 0.4em;
		margin: 0;
	}

	.role-selector-wrapper {
		position: relative;
		margin-top: 0.5rem;
	}

	.role-text-btn {
		background: none;
		border: none;
		padding: 0;
		display: flex;
		align-items: center;
		gap: 0.8rem;
		cursor: pointer;
		text-align: left;
		transition: all 0.3s ease;
	}

	.role-text-btn:hover .role-name {
		color: #fff;
	}

	.role-name {
		color: rgba(255, 255, 255, 0.6);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-size: 0.9rem;
		transition: color 0.3s ease;
	}

	.chevron {
		width: 1rem;
		height: 1rem;
		color: rgba(255, 255, 255, 0.3);
		transition: transform 0.3s ease;
	}

	.chevron.open { transform: rotate(180deg); }

	.dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		width: 280px;
		background: rgba(15, 15, 15, 0.9);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		margin-top: 1rem;
		padding: 0.5rem;
		z-index: 100;
		box-shadow: 0 20px 50px rgba(0,0,0,0.5);
	}

	.dropdown-item {
		width: 100%;
		padding: 0.8rem 1rem;
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.5);
		text-align: left;
		font-size: 0.85rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		cursor: pointer;
		border-radius: 6px;
		transition: all 0.2s ease;
	}

	.dropdown-item:hover {
		background: rgba(255, 255, 255, 0.05);
		color: #fff;
	}

	.dropdown-item.active {
		color: #fff;
		background: rgba(255, 255, 255, 0.1);
	}

	.summary-box {
		flex: 1;
		padding-left: 3rem;
		border-left: 1px solid rgba(255, 255, 255, 0.1);
	}

	.dynamic-statement {
		font-size: clamp(1.1rem, 2vw, 1.3rem);
		line-height: 1.8;
		color: rgba(255, 255, 255, 0.6);
		margin: 0;
		font-weight: 400;
	}

	.slot {
		color: rgba(255, 255, 255, 0.9);
		font-weight: 500;
		border-bottom: 1px solid rgba(255, 255, 255, 0.2);
		display: inline;
		transition: opacity 0.5s ease;
	}

	.scroll-indicator {
		position: absolute;
		bottom: 3rem;
		left: 2rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		color: rgba(255, 255, 255, 0.3);
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		z-index: 10;
	}

	.mouse {
		width: 1px;
		height: 40px;
		background: rgba(255, 255, 255, 0.1);
		position: relative;
	}

	.mouse::after {
		content: '';
		width: 1px;
		height: 15px;
		background: #fff;
		position: absolute;
		top: 0;
		left: 0;
		animation: scrollLine 2s infinite cubic-bezier(0.77, 0, 0.175, 1);
	}

	@keyframes scrollLine {
		0% { transform: translateY(0); opacity: 0; }
		50% { opacity: 1; }
		100% { transform: translateY(25px); opacity: 0; }
	}

	@media (max-width: 1024px) {
		.title-group { width: 220px; }
		.summary-box { padding-left: 2rem; }
	}

	@media (max-width: 900px) {
		.meta-container {
			flex-direction: column;
			gap: 2rem;
		}
		
		.summary-box {
			padding-left: 0;
			border-left: none;
			border-top: 1px solid rgba(255, 255, 255, 0.1);
			padding-top: 2rem;
		}

		.animation-background {
			width: 75%;
			left: 50%;
			top: 72%;
			transform: translate(-50%, -50%);
			opacity: 0.1;
		}

		:global(.hero .animation-background .animations svg) {
			width: 35vh !important;
			height: 35vh !important;
		}
	}

	@media (max-width: 768px) {
		.hero {
			padding: 0 1.5rem;
			justify-content: center;
		}

		.name {
			font-size: clamp(3rem, 15vw, 4.5rem);
		}

		.title-group { width: 100%; }

		.dynamic-statement {
			font-size: 1.05rem;
			line-height: 1.6;
		}

		.scroll-indicator {
			left: 1.5rem;
			bottom: 2rem;
		}
	}
</style>
