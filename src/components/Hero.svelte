<script>
	import { onMount, onDestroy, tick } from 'svelte';
	import { fade } from 'svelte/transition';
	import Animations from './Animations.svelte';
	import resume from '$lib/resume.json';

	const expertise = [
		{ label: 'Full Stack Engineering', icon: 'full', summaryRole: 'a Full Stack Engineer' },
		{ label: 'Web Design', icon: 'web', summaryRole: 'a Web Designer' },
		{ label: 'Game Development', icon: 'game', summaryRole: 'a Game Designer' },
		{ label: 'AI Implementation', icon: 'ai', summaryRole: 'an AI Engineer' },
		{
			label: 'Application Development',
			icon: 'application',
			summaryRole: 'an Application Developer'
		},
		{ label: 'Systems Architecture', icon: 'systems', summaryRole: 'a Systems Architect' }
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
	let currentPhase = -1;
	let isPaused = false;
	let showDropdown = false;
	let y = 0;
	let progress = 0;
	let sequenceId = 0;
	let chunkRenderKey = 0;
	const duration = 10000;
	const frameRate = 10; // ms per update
	const chunkFadeDuration = 600;
	const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

	function getChunks(text) {
		const words = text.split(' ');
		const chunks = [];
		for (let i = 0; i < words.length; i += 2) {
			chunks.push(words.slice(i, i + 2).join(' '));
		}
		return chunks;
	}

	function getIntroChunks(targetIndex) {
		const { summaryRole } = expertise[targetIndex % expertise.length];
		return ["I'm ", `${summaryRole} `, 'extensively practiced ', 'in utilizing AI through '];
	}

	let introChunks = getIntroChunks(0);
	let chunks1 = [];
	let chunks2 = [];

	$: introChunkCount = introChunks.length;
	$: middleChunkPhase = introChunkCount + chunks1.length;
	$: slot2StartPhase = middleChunkPhase + 1;
	$: finalPhase = slot2StartPhase + chunks2.length;

	async function waitForActiveSequence(ms, runId) {
		let remaining = ms;

		while (remaining > 0) {
			if (runId !== sequenceId) return false;

			const step = Math.min(50, remaining);
			await wait(step);
			remaining -= step;
		}

		return runId === sequenceId;
	}

	async function runSequence(targetIndex = index) {
		const runId = ++sequenceId;
		const nextIntroChunks = getIntroChunks(targetIndex);
		const nextChunks1 = getChunks(slot1[targetIndex % slot1.length]);
		const nextChunks2 = getChunks(slot2[targetIndex % slot2.length]);
		const nextMiddleChunkPhase = nextIntroChunks.length + nextChunks1.length;
		const nextSlot2StartPhase = nextMiddleChunkPhase + 1;
		const nextFinalPhase = nextSlot2StartPhase + nextChunks2.length;

		currentPhase = -1;
		await tick();
		if (runId !== sequenceId) return;
		if (!(await waitForActiveSequence(chunkFadeDuration, runId))) return;

		introChunks = nextIntroChunks;
		chunks1 = nextChunks1;
		chunks2 = nextChunks2;
		chunkRenderKey += 1;
		await tick();
		if (runId !== sequenceId) return;

		currentPhase = 0;
		if (!(await waitForActiveSequence(600, runId))) return;

		for (let i = 1; i < introChunkCount; i++) {
			if (runId !== sequenceId) return;
			currentPhase = i;
			if (!(await waitForActiveSequence(250, runId))) return;
		}

		for (let i = 0; i < chunks1.length; i++) {
			if (runId !== sequenceId) return;
			currentPhase = introChunkCount + i;
			if (!(await waitForActiveSequence(250, runId))) return;
		}

		currentPhase = nextMiddleChunkPhase;
		if (!(await waitForActiveSequence(600, runId))) return;

		for (let i = 0; i < chunks2.length; i++) {
			if (runId !== sequenceId) return;
			currentPhase = nextSlot2StartPhase + i;
			if (!(await waitForActiveSequence(250, runId))) return;
		}

		if (runId !== sequenceId) return;
		currentPhase = nextFinalPhase;
	}

	let timer;
	function startTimer() {
		timer = setInterval(() => {
			if (!isPaused) {
				progress += (frameRate / duration) * 100;
				if (progress >= 100) {
					progress = 0;
					index = (index + 1) % expertise.length;
					runSequence();
				}
			}
		}, frameRate);
	}

	function togglePause() {
		isPaused = !isPaused;
	}

	function selectExpertise(i) {
		sequenceId += 1;
		index = i;
		introChunks = getIntroChunks(i);
		chunks1 = getChunks(slot1[i % slot1.length]);
		chunks2 = getChunks(slot2[i % slot2.length]);
		chunkRenderKey += 1;
		isPaused = true;
		progress = 0;
		showDropdown = false;
		currentPhase = finalPhase;
	}

	function toggleDropdown(e) {
		e.stopPropagation();
		showDropdown = !showDropdown;
	}

	onMount(() => {
		runSequence();
		startTimer();
		const closeDropdown = () => (showDropdown = false);
		window.addEventListener('click', closeDropdown);
		return () => window.removeEventListener('click', closeDropdown);
	});

	onDestroy(() => {
		clearInterval(timer);
	});

	$: currentExpertise = expertise[index % expertise.length];
	$: currentSlot1 = slot1[index % slot1.length];
	$: currentSlot2 = slot2[index % slot2.length];
</script>

<svelte:window bind:scrollY={y} />

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
				<button
					type="button"
					class="progress-line-container"
					class:is-paused={isPaused}
					on:click={togglePause}
					aria-pressed={isPaused}
					aria-label={isPaused ? 'Resume hero animation' : 'Pause hero animation'}
				>
					<div class="progress-line" style="width: {progress}%"></div>
				</button>
			</div>

			<div class="meta-container">
				<div class="title-group">
					<p class="label">{resume.label}</p>
					<div class="role-selector-wrapper">
						<button class="role-text-btn" on:click={toggleDropdown}>
							<span class="role-name">{currentExpertise.label}</span>
							<svg
								class="chevron"
								class:open={showDropdown}
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="3"><path d="M6 9l6 6 6-6" /></svg
							>
						</button>

						{#if showDropdown}
							<div class="dropdown" transition:fade={{ duration: 200 }}>
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

				<button
					type="button"
					class="summary-box"
					on:click={togglePause}
					aria-pressed={isPaused}
					aria-label={isPaused ? 'Resume hero animation' : 'Pause hero animation'}
				>
					<p class="dynamic-statement" class:is-paused={isPaused}>
						{#each introChunks as chunk, i}
							<span class="chunk" class:visible={currentPhase >= i}>{chunk}</span>
						{/each}

						<span class="var-slot">
							{#key `slot1-${chunkRenderKey}`}
								{#each chunks1 as chunk, i}
									<span class="chunk" class:visible={currentPhase >= introChunkCount + i}
										>{chunk}{' '}</span
									>
								{/each}
							{/key}
						</span>

						<span class="chunk" class:visible={currentPhase >= middleChunkPhase}>
							to accomplish with architectural insights and end-to-end planning
						</span>

						<span class="var-slot">
							{#key `slot2-${chunkRenderKey}`}
								{#each chunks2 as chunk, i}
									<span class="chunk" class:visible={currentPhase >= slot2StartPhase + i}
										>{chunk}{' '}</span
									>
								{/each}
							{/key}
						</span>

						<span class="chunk" class:visible={currentPhase >= finalPhase}>.</span>
					</p>
				</button>
			</div>
		</div>
	</div>

	{#if y < 50}
		<div class="scroll-indicator" transition:fade={{ duration: 300 }}>
			<div class="mouse"></div>
			<span>Scroll</span>
		</div>
	{/if}
</section>

<style>
	.hero {
		scroll-snap-align: start;
		min-height: 100vh;
		min-height: 100svh;
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

	.name .bold {
		font-weight: 900;
		color: #fff;
	}
	.name .light {
		font-weight: 200;
		color: rgba(255, 255, 255, 0.4);
		margin-top: -0.5rem;
	}

	.progress-line-container {
		width: 200px; /* Doubled width */
		height: 6px; /* Thicker */
		background: rgba(255, 255, 255, 0.1);
		margin-top: 1.5rem;
		overflow: hidden;
		cursor: pointer;
		transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
		border: none;
		padding: 0;
		display: block;
		appearance: none;
	}

	.progress-line-container.is-paused .progress-line {
		animation: pausePulse 2s infinite ease-in-out !important;
		background: rgba(255, 255, 255, 0.6);
	}

	@keyframes pausePulse {
		0%,
		100% {
			opacity: 0.4;
		}
		50% {
			opacity: 1;
		}
	}

	.progress-line {
		height: 100%;
		background: #fff;
		width: 0;
		transition: width 0.1s linear;
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
		z-index: 20;
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

	.chevron.open {
		transform: rotate(180deg);
	}

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
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
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
		align-self: stretch;
		display: flex;
		align-items: flex-start;
		padding: 0 0 0 3rem;
		border-left: 1px solid rgba(255, 255, 255, 0.1);
		min-height: 250px;
		cursor: pointer;
		background: none;
		border-top: none;
		border-right: none;
		border-bottom: none;
		color: inherit;
		font: inherit;
		text-align: left;
	}

	.progress-line-container:focus-visible,
	.summary-box:focus-visible,
	.role-text-btn:focus-visible {
		outline: 2px solid rgba(255, 255, 255, 0.8);
		outline-offset: 4px;
	}

	.dynamic-statement {
		font-size: clamp(1.15rem, 2vw, 1.4rem);
		line-height: 1.8;
		color: rgba(255, 255, 255, 0.6);
		margin: 0;
		font-weight: 400;
		transition: color 0.3s ease;
	}

	.dynamic-statement:hover {
		color: rgba(255, 255, 255, 0.8);
	}

	.dynamic-statement.is-paused {
		color: rgba(255, 255, 255, 0.9);
	}

	.chunk {
		opacity: 0;
		transition: opacity 0.6s ease;
		display: inline;
	}

	.chunk.visible {
		opacity: 1;
	}

	.var-slot {
		display: inline;
	}

	.var-slot .chunk {
		color: rgba(255, 255, 255, 0.95);
		font-weight: 600;
		border-bottom: 1px solid rgba(255, 255, 255, 0.3);
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
		z-index: 6;
		pointer-events: none;
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
		0% {
			transform: translateY(0);
			opacity: 0;
		}
		50% {
			opacity: 1;
		}
		100% {
			transform: translateY(25px);
			opacity: 0;
		}
	}

	@media (max-width: 1024px) {
		.title-group {
			width: 220px;
		}
		.summary-box {
			padding-left: 2rem;
		}
	}

	@media (max-width: 900px) {
		.meta-container {
			flex-direction: column;
			gap: 2rem;
		}

		.summary-box {
			padding: 2rem 0 0;
			border-left: none;
			border-top: 1px solid rgba(255, 255, 255, 0.1);
			min-height: 220px;
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

		.title-group {
			width: 100%;
		}

		.dynamic-statement {
			font-size: 1.1rem;
			line-height: 1.6;
		}

		.scroll-indicator {
			left: 1.5rem;
			bottom: 2rem;
		}

		.progress-line-container {
			width: 150px;
		}
	}
</style>
