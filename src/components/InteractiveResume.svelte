<script>
	import { browser } from '$app/environment';
	import resumeData from '$lib/context/resume.json';
	import profileData from '$lib/context/profile.json';
	import { openChat } from '$lib/stores/chat';

	export let theme = 'paper'; // 'paper' | 'dark'

	// Active filter for cross-highlighting
	let selectedTech = null;
	let hoveredTech = null;
	let activeRoleDrawer = null; // job object if drawer is open
	let isPlayingAudio = false;

	// Tree slug mapping for each company
	const companyTreeSlugs = {
		'Advection Software, LLC': 'roles/advection',
		'Advection Software': 'roles/advection',
		'Mesa Cloud, Inc.': 'roles/mesa-cloud',
		'Mesa Cloud': 'roles/mesa-cloud',
		'Intellisense.io': 'roles/intellisense',
		'Giesecke + Devrient': 'roles/gandd',
		'Aplicaciones En Informática Avanzada': 'roles/aia',
		'Aplicaciones En Inform\u00e1tica Avanzada': 'roles/aia'
	};

	// Product slug mapping
	const productTreeSlugs = {
		'GameTsunami': 'products/gametsunami',
		'Cruffled': 'products/cruffled',
		'Weatherie': 'products/weatherie',
		'Square Swaps': 'products/square-swaps'
	};

	// Helper to extract unique tech chips from job responsibilities
	function getJobTechList(job) {
		if (!job || !Array.isArray(job.responsibilities)) return [];
		const uniqueTech = [];
		const seen = new Set();
		for (const resp of job.responsibilities) {
			if (!resp || typeof resp !== 'object' || !resp.tech) continue;
			const list = String(resp.tech)
				.replace(/<[^>]+>/g, '')
				.split(',')
				.map((t) => t.trim())
				.filter(Boolean);
			for (const t of list) {
				const norm = t.toLowerCase();
				if (!seen.has(norm)) {
					seen.add(norm);
					uniqueTech.push(t);
				}
			}
		}
		return uniqueTech;
	}

	// Check if a job uses a particular tech
	function jobUsesTech(job, tech) {
		if (!tech) return false;
		const norm = tech.toLowerCase();
		const list = getJobTechList(job);
		return list.some((t) => t.toLowerCase() === norm);
	}

	// Toggle tech filter
	function toggleTechFilter(tech) {
		if (selectedTech === tech) {
			selectedTech = null;
		} else {
			selectedTech = tech;
		}
	}

	// Ask AI about a specific bullet point
	function askAiAboutBullet(job, bullet) {
		const prompt = `In your resume under ${job.company} (${job.jobTitle}), you state: "${bullet}". Can you explain the architectural implementation, the key technical challenges, and the impact of this work?`;
		openChat({ text: prompt, source: 'resume-bullet' });
	}

	// Ask AI about an entire role
	function askAiAboutRole(job) {
		const prompt = `Can you provide a technical deep dive into Andrea's role as ${job.jobTitle} at ${job.company}, including system design, tech stack decisions, and major achievements?`;
		openChat({ text: prompt, source: 'resume-role' });
	}

	// Play authentic Italian name pronunciation
	function playPronunciation() {
		if (!browser) return;
		isPlayingAudio = true;
		if ('speechSynthesis' in window) {
			window.speechSynthesis.cancel();
			const utterance = new SpeechSynthesisUtterance('Andrea');
			utterance.lang = 'it-IT';
			utterance.rate = 0.85;
			utterance.onend = () => {
				isPlayingAudio = false;
			};
			utterance.onerror = () => {
				isPlayingAudio = false;
			};
			window.speechSynthesis.speak(utterance);
		} else {
			setTimeout(() => {
				isPlayingAudio = false;
			}, 1000);
		}
	}

	// Map icon key to asset path
	function getIconPath(iconName) {
		const iconMap = {
			'website-img': '/resume-icons/website-img.png',
			'linkedin-img': '/resume-icons/linkedin-img.png',
			'github-img': '/resume-icons/github-img.png',
			'email-img': '/resume-icons/email-img.png',
			'phone-img': '/resume-icons/phone-img.png',
			'apple-white': '/resume-icons/apple-white.webp',
			'android-white': '/resume-icons/android-white.png',
			'globe-white': '/resume-icons/globe-white.png'
		};
		return iconMap[iconName] || null;
	}

	$: activeTech = selectedTech || hoveredTech;
</script>

<svelte:head>
	<link
		href="https://fonts.googleapis.com/css?family=Nunito:400,600,700,800&display=swap"
		rel="stylesheet"
	/>
	<link
		href="https://fonts.googleapis.com/css?family=Montserrat:500,700,800,900&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<!-- Interactive Resume Sheet Container -->
<div class="interactive-resume-wrapper" class:dark-mode={theme === 'dark'}>
	<!-- Active Tech Filter Banner (if selected) -->
	{#if selectedTech}
		<div class="filter-banner">
			<div class="filter-pill">
				<span>Highlighting skill: <strong>{selectedTech}</strong></span>
				<button class="clear-btn" on:click={() => (selectedTech = null)} title="Clear skill highlight">
					✕
				</button>
			</div>
		</div>
	{/if}

	<!-- 1-Page Document Canvas -->
	<article class="resume-sheet">
		<!-- Sidebar Column (28%) -->
		<aside class="resume-sidebar">
			<!-- Monogram Initials Box with Cutout -->
			<div class="initials-box" aria-label="Andrea de Candia monogram">
				AD
			</div>

			<!-- Candidate Name with Pronunciation Speaker -->
			<div class="name-block">
				<h1 class="candidate-name">
					<a href="/" class="name-link">
						Andrea<br />de Candia
					</a>
				</h1>
				<button
					type="button"
					class="audio-pronounce-btn"
					class:playing={isPlayingAudio}
					on:click={playPronunciation}
					title="Listen to Italian pronunciation: /anˈdrɛ.a/"
					aria-label="Play authentic pronunciation"
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="audio-icon">
						<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
						<path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
						<path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
					</svg>
					<span class="pronounce-tooltip">/anˈdrɛ.a/</span>
				</button>
			</div>

			<!-- Candidate Role -->
			<div class="candidate-title">
				{resumeData.personalInfo?.title || 'Product Engineer'}
			</div>

			<!-- Summary / About -->
			{#if resumeData.about}
				<div class="about-block">
					<p>{resumeData.about}</p>
				</div>
			{/if}

			<!-- Links & Contact -->
			<div class="sidebar-section">
				<h2 class="sidebar-heading">Links & Contact</h2>
				<ul class="contact-list">
					{#each resumeData.contact as contactItem}
						<li class="contact-item">
							{#if getIconPath(contactItem.icon)}
								<img
									src={getIconPath(contactItem.icon)}
									alt=""
									class="contact-icon"
									aria-hidden="true"
								/>
							{/if}
							{#if contactItem.text.includes('@')}
								<div class="contact-text-wrap">
									<a href={contactItem.href} class="contact-link">
										{contactItem.text.split('@')[0]}
									</a>
									<span class="sub-handle">@{contactItem.text.split('@')[1]}</span>
								</div>
							{:else}
								<a
									href={contactItem.href}
									class="contact-link"
									target={contactItem.href.startsWith('http') ? '_blank' : undefined}
									rel={contactItem.href.startsWith('http') ? 'noopener' : undefined}
								>
									{contactItem.text}
								</a>
							{/if}
						</li>
					{/each}
				</ul>
			</div>

			<!-- Education -->
			{#if resumeData.education}
				<div class="sidebar-section">
					<h2 class="sidebar-heading">Education</h2>
					<div class="education-block">
						<h3 class="school-name">{resumeData.education.school}</h3>
						{#if Array.isArray(resumeData.education.degrees)}
							{#each resumeData.education.degrees as degree}
								<div class="degree-title">{degree}</div>
							{/each}
						{/if}
						{#if resumeData.education.description}
							<p class="education-desc">{resumeData.education.description}</p>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Core Skills / Technologies -->
			{#if Array.isArray(resumeData.technologies?.primary)}
				<div class="sidebar-section skills-section">
					<h2 class="sidebar-heading">Core Stack</h2>
					<div class="sidebar-tech-chips">
						{#each resumeData.technologies.primary as tech}
							{@const isSelected = selectedTech === tech}
							{@const isHovered = hoveredTech === tech}
							<button
								type="button"
								class="sidebar-tech-chip"
								class:selected={isSelected}
								class:active={isHovered}
								on:click={() => toggleTechFilter(tech)}
								on:mouseenter={() => (hoveredTech = tech)}
								on:mouseleave={() => (hoveredTech = null)}
								title="Filter and highlight roles using {tech}"
							>
								{tech}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Products & Showcase -->
			{#if Array.isArray(resumeData.projects)}
				<div class="sidebar-section products-section">
					<h2 class="sidebar-heading">Products</h2>
					<ul class="products-list">
						{#each resumeData.projects as project}
							<li class="product-item">
								<div class="product-info">
									<a
										href={project.url}
										target="_blank"
										rel="noopener"
										class="product-link"
										title="Visit live product"
									>
										{project.name}
									</a>
									{#if productTreeSlugs[project.name]}
										<a
											href="/tree/{productTreeSlugs[project.name]}"
											class="product-tree-badge"
											title="View architectural note in Knowledge Tree"
										>
											Arch ↗
										</a>
									{/if}
								</div>
								{#if Array.isArray(project.platforms)}
									<div class="platform-icons">
										{#each project.platforms as platform}
											{#if getIconPath(platform)}
												<img
													src={getIconPath(platform)}
													alt=""
													class="platform-icon"
													aria-hidden="true"
												/>
											{/if}
										{/each}
									</div>
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</aside>

		<!-- Main Column (72%) -->
		<main class="resume-main">
			<div class="main-header">
				<h2 class="section-title">Work Experience</h2>
				<span class="interactive-hint">✦ Click skills to cross-highlight • Tap company for breakdown</span>
			</div>

			<ul class="experience-list">
				{#each resumeData.workExperience as job}
					{@const jobTech = getJobTechList(job)}
					{@const isMatch = activeTech ? jobUsesTech(job, activeTech) : false}
					{@const isDimmed = activeTech ? !isMatch : false}

					<li
						class="job-card"
						class:highlight-job={isMatch}
						class:dimmed-job={isDimmed}
					>
						<!-- Job Header -->
						<div class="job-meta-row">
							<div class="title-and-company">
								<h3 class="job-title-line">
									{#if job.jobTitlePrefix && !job.hidePrefix}
										<span class="title-prefix">{job.jobTitlePrefix}</span>{' '}
									{/if}
									<span class="title-core">{job.jobTitle}</span>
								</h3>
								<div class="company-and-cta">
									<button
										type="button"
										class="company-btn"
										on:click={() => (activeRoleDrawer = job)}
										title="Click to view architecture breakdown"
									>
										<span class="company-name">{job.company}</span>
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="chevron-icon">
											<polyline points="9 18 15 12 9 6" />
										</svg>
									</button>
								</div>
							</div>

							<div class="time-and-action">
								<span class="job-time">{job.time}</span>
							</div>
						</div>

						<!-- Scope Subheading -->
						{#if job.unifiedScope}
							<div class="job-scope">
								{job.unifiedScope}
							</div>
						{/if}

						<!-- Responsibilities & Highlights -->
						<ul class="responsibilities-list">
							{#each job.responsibilities as resp}
								{#if Array.isArray(resp.details)}
									{#each resp.details as detail}
										<li class="bullet-item">
											<span class="bullet-text">{detail}</span>
											<button
												type="button"
												class="bullet-ask-btn"
												on:click={() => askAiAboutBullet(job, detail)}
												title="Ask Andrea's AI Assistant to explain this technical challenge"
											>
												<span class="sparkle">✦</span>
												<span class="ask-label">Ask AI</span>
											</button>
										</li>
									{/each}
								{:else if resp.description}
									<li class="bullet-item">
										<span class="bullet-text">{resp.description}</span>
										<button
											type="button"
											class="bullet-ask-btn"
											on:click={() => askAiAboutBullet(job, resp.description)}
											title="Ask Andrea's AI Assistant to explain this technical challenge"
										>
											<span class="sparkle">✦</span>
											<span class="ask-label">Ask AI</span>
										</button>
									</li>
								{/if}
							{/each}
						</ul>

						<!-- Interactive Job Tech Chips -->
						{#if jobTech.length > 0}
							<div class="job-tech-chips">
								{#each jobTech as tech}
									{@const isSelected = selectedTech === tech}
									{@const isHovered = hoveredTech === tech}
									<button
										type="button"
										class="tech-chip"
										class:selected={isSelected}
										class:active={isHovered}
										on:click={() => toggleTechFilter(tech)}
										on:mouseenter={() => (hoveredTech = tech)}
										on:mouseleave={() => (hoveredTech = null)}
										title="Filter and highlight roles using {tech}"
									>
										{tech}
									</button>
								{/each}
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		</main>
	</article>

	<!-- Slide-Over Architecture Breakdown Modal / Drawer -->
	{#if activeRoleDrawer}
		<div class="drawer-backdrop" on:click={() => (activeRoleDrawer = null)}>
			<div class="drawer-panel" on:click|stopPropagation>
				<div class="drawer-header">
					<div>
						<span class="drawer-pretitle">Architecture Breakdown</span>
						<h3 class="drawer-title">{activeRoleDrawer.company}</h3>
						<span class="drawer-meta">{activeRoleDrawer.jobTitle} &bull; {activeRoleDrawer.time}</span>
					</div>
					<button
						class="drawer-close-btn"
						on:click={() => (activeRoleDrawer = null)}
						aria-label="Close drawer"
					>
						✕
					</button>
				</div>

				<div class="drawer-body">
					{#if activeRoleDrawer.unifiedScope}
						<div class="drawer-scope-pill">
							{activeRoleDrawer.unifiedScope}
						</div>
					{/if}

					<div class="drawer-section">
						<h4>Technical Highlights</h4>
						<ul class="drawer-bullets">
							{#each activeRoleDrawer.responsibilities as resp}
								{#if Array.isArray(resp.details)}
									{#each resp.details as detail}
										<li>{detail}</li>
									{/each}
								{:else if resp.description}
									<li>{resp.description}</li>
								{/if}
							{/each}
						</ul>
					</div>

					<div class="drawer-section">
						<h4>Core Technologies</h4>
						<div class="drawer-chips">
							{#each getJobTechList(activeRoleDrawer) as tech}
								<span class="drawer-tech-tag">{tech}</span>
							{/each}
						</div>
					</div>

					<div class="drawer-actions">
						{#if companyTreeSlugs[activeRoleDrawer.company]}
							<a
								href="/tree/{companyTreeSlugs[activeRoleDrawer.company]}"
								class="drawer-btn primary"
							>
								Read Full Architecture Breakdown &rarr;
							</a>
						{/if}
						<button
							type="button"
							class="drawer-btn secondary"
							on:click={() => {
								askAiAboutRole(activeRoleDrawer);
								activeRoleDrawer = null;
							}}
						>
							✦ Ask AI Recruiter About This Role
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Container & Sheet Wrapper */
	.interactive-resume-wrapper {
		width: 100%;
		max-width: 960px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		position: relative;
	}

	/* Filter Banner */
	.filter-banner {
		position: sticky;
		top: 4.5rem;
		z-index: 40;
		margin-bottom: 0.75rem;
		animation: slideDown 0.2s ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.filter-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.4rem 0.9rem;
		border-radius: 2rem;
		background: #0f766e;
		color: #fff;
		font-size: 0.8125rem;
		box-shadow: 0 4px 14px rgba(15, 118, 110, 0.4);
	}

	.filter-pill strong {
		color: #a7f3d0;
	}

	.clear-btn {
		background: rgba(255, 255, 255, 0.2);
		border: none;
		color: #fff;
		border-radius: 50%;
		width: 1.25rem;
		height: 1.25rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		font-size: 0.75rem;
		line-height: 1;
		transition: background 0.15s ease;
	}

	.clear-btn:hover {
		background: rgba(255, 255, 255, 0.4);
	}

	/* The Authentically Styled Resume Canvas */
	.resume-sheet {
		width: 100%;
		display: flex;
		background: #ffffff;
		color: #333333;
		font-family: 'Nunito', sans-serif;
		font-size: 0.9em;
		line-height: 1.35;
		border-radius: 4px;
		box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1);
		overflow: hidden;
		min-height: 1100px;
		transition: background 0.3s ease, color 0.3s ease;
	}

	/* Dark Mode Variant */
	.dark-mode .resume-sheet {
		background: #121212;
		color: #e0e0e0;
		box-shadow: 0 16px 48px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.15);
	}

	/* Sidebar Column (30%) */
	.resume-sidebar {
		width: 30%;
		box-sizing: border-box;
		background: #14b8a6;
		color: #ffffff;
		padding: 2em 1.35em;
		display: flex;
		flex-direction: column;
		gap: 1.4em;
		flex-shrink: 0;
	}

	.dark-mode .resume-sidebar {
		background: #0f766e;
	}

	/* Initials Box with 4px border & bottom-right triangle cutout */
	.initials-box {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 120px;
		height: 120px;
		background: rgba(255, 255, 255, 0.1);
		border: 4px solid #ffffff;
		font-family: 'Montserrat', sans-serif;
		font-weight: 900;
		font-size: 3.8em;
		color: #ffffff;
		margin-bottom: 0.3em;
		letter-spacing: -0.05em;
		border-radius: 2px;
		overflow: hidden;
	}

	.initials-box::after {
		content: '';
		position: absolute;
		bottom: 0;
		right: 0;
		width: 0;
		height: 0;
		border-style: solid;
		border-width: 0 0 20px 60px;
		border-color: transparent transparent #ffffff transparent;
	}

	/* Candidate Name Block with Pronunciation Button */
	.name-block {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		position: relative;
	}

	.candidate-name {
		margin: 0;
		font-family: 'Montserrat', sans-serif;
		font-weight: 800;
		font-size: 2.5em;
		line-height: 1.08;
		letter-spacing: -0.03em;
	}

	.name-link {
		color: #ffffff;
		text-decoration: none;
	}

	.name-link:hover {
		opacity: 0.95;
	}

	.audio-pronounce-btn {
		background: rgba(255, 255, 255, 0.15);
		border: 1px solid rgba(255, 255, 255, 0.3);
		color: #ffffff;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		margin-top: 0.25rem;
		position: relative;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.audio-pronounce-btn:hover {
		background: #ffffff;
		color: #14b8a6;
		transform: scale(1.1);
	}

	.audio-pronounce-btn.playing {
		animation: pulseAudio 0.8s infinite alternate;
		background: #ffffff;
		color: #14b8a6;
	}

	@keyframes pulseAudio {
		from {
			transform: scale(1);
		}
		to {
			transform: scale(1.15);
		}
	}

	.audio-icon {
		width: 15px;
		height: 15px;
	}

	.pronounce-tooltip {
		position: absolute;
		left: 115%;
		top: 50%;
		transform: translateY(-50%);
		background: rgba(0, 0, 0, 0.85);
		color: #ffffff;
		font-size: 0.75rem;
		font-weight: 600;
		padding: 2px 7px;
		border-radius: 4px;
		white-space: nowrap;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.15s ease;
	}

	.audio-pronounce-btn:hover .pronounce-tooltip {
		opacity: 1;
	}

	.candidate-title {
		font-style: italic;
		font-weight: 600;
		font-size: 1.25em;
		opacity: 0.95;
		margin-top: -0.1em;
	}

	.about-block {
		font-size: 1.16em;
		line-height: 1.5;
		opacity: 0.95;
	}

	.about-block p {
		margin: 0;
	}

	/* Sidebar Headings */
	.sidebar-section {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
	}

	.sidebar-heading {
		font-family: 'Montserrat', sans-serif;
		font-size: 0.95em;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		border-bottom: 1.5px solid rgba(255, 255, 255, 0.3);
		padding-bottom: 0.3em;
		margin: 0.6em 0 0.25em;
	}

	/* Contact List */
	.contact-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.7em;
	}

	.contact-item {
		display: flex;
		align-items: flex-start;
		gap: 0.65em;
		font-size: 1.05em;
	}

	.contact-icon {
		width: 1.25em;
		height: 1.25em;
		object-fit: contain;
		filter: brightness(0) invert(1);
		flex-shrink: 0;
		margin-top: 0.1em;
	}

	.contact-link {
		color: #ffffff;
		text-decoration: none;
		word-break: break-all;
		transition: opacity 0.15s ease;
	}

	.contact-link:hover {
		opacity: 0.85;
		text-decoration: underline;
	}

	.contact-text-wrap {
		display: flex;
		flex-direction: column;
	}

	.sub-handle {
		font-size: 0.85em;
		opacity: 0.85;
		line-height: 1.1;
	}

	/* Education */
	.education-block {
		font-size: 1.02em;
	}

	.school-name {
		font-size: 1.2em;
		font-weight: 800;
		margin: 0 0 0.15em;
	}

	.degree-title {
		font-style: italic;
		opacity: 0.92;
		line-height: 1.3;
	}

	.education-desc {
		font-size: 0.92em;
		opacity: 0.85;
		margin: 0.4em 0 0;
		line-height: 1.4;
	}

	/* Sidebar Tech Chips */
	.sidebar-tech-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45em;
		margin-top: 0.25em;
	}

	.sidebar-tech-chip {
		background: rgba(255, 255, 255, 0.16);
		border: 1px solid rgba(255, 255, 255, 0.35);
		color: #ffffff;
		padding: 0.3em 0.7em;
		border-radius: 5px;
		font-size: 0.88em;
		font-weight: 700;
		cursor: pointer;
		font-family: inherit;
		transition: all 0.15s ease;
	}

	.sidebar-tech-chip:hover,
	.sidebar-tech-chip.active,
	.sidebar-tech-chip.selected {
		background: #ffffff;
		color: #0f766e;
		border-color: #ffffff;
		transform: scale(1.05);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}

	/* Products Section */
	.products-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.65em;
	}

	.product-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 1.05em;
	}

	.product-info {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.product-link {
		color: #ffffff;
		text-decoration: none;
		font-weight: 700;
		border-bottom: 1px solid rgba(255, 255, 255, 0.4);
		transition: all 0.15s ease;
	}

	.product-link:hover {
		border-bottom-color: #ffffff;
		opacity: 0.85;
	}

	.product-tree-badge {
		font-size: 0.72em;
		font-weight: 700;
		color: #14b8a6;
		background: #ffffff;
		padding: 1px 5px;
		border-radius: 3px;
		text-decoration: none;
		transition: transform 0.15s ease;
	}

	.product-tree-badge:hover {
		transform: scale(1.05);
	}

	.platform-icons {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.platform-icon {
		width: 0.95em;
		height: 0.95em;
		object-fit: contain;
		filter: brightness(0) invert(1);
	}

	/* Main Column (70%) */
	.resume-main {
		width: 70%;
		box-sizing: border-box;
		padding: 1.1em 1.4em;
		border-left: 1px solid rgba(0, 0, 0, 0.06);
		display: flex;
		flex-direction: column;
	}

	.dark-mode .resume-main {
		border-left-color: rgba(255, 255, 255, 0.08);
	}

	.main-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		border-bottom: 2px solid rgba(20, 184, 166, 0.2);
		padding-bottom: 0.4em;
		margin-bottom: 1em;
	}

	.section-title {
		margin: 0;
		font-family: 'Montserrat', sans-serif;
		font-weight: 800;
		font-size: 1.35em;
		text-transform: uppercase;
		letter-spacing: -0.01em;
		color: #0f766e;
	}

	.dark-mode .section-title {
		color: #2dd4bf;
	}

	.interactive-hint {
		font-size: 0.75rem;
		color: #888;
		font-weight: 500;
	}

	.dark-mode .interactive-hint {
		color: #aaa;
	}

	/* Experience List */
	.experience-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 1.2em;
	}

	.job-card {
		padding: 0.4em 0.5em 0.8em;
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
		border-radius: 6px;
		transition: all 0.25s ease;
		position: relative;
	}

	.dark-mode .job-card {
		border-bottom-color: rgba(255, 255, 255, 0.06);
	}

	.job-card:last-child {
		border-bottom: none;
	}

	.job-card.highlight-job {
		background: rgba(20, 184, 166, 0.06);
		border-left: 3px solid #0f766e;
		padding-left: 0.75em;
	}

	.dark-mode .job-card.highlight-job {
		background: rgba(20, 184, 166, 0.12);
		border-left-color: #2dd4bf;
	}

	.job-card.dimmed-job {
		opacity: 0.4;
		filter: grayscale(0.5);
	}

	/* Job Meta Row */
	.job-meta-row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.25em;
	}

	.title-and-company {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.job-title-line {
		margin: 0;
		font-size: 1.05em;
		font-weight: 800;
		color: #1a1a1a;
	}

	.dark-mode .job-title-line {
		color: #ffffff;
	}

	.title-prefix {
		color: #0f766e;
	}

	.dark-mode .title-prefix {
		color: #2dd4bf;
	}

	.company-and-cta {
		display: inline-flex;
		align-items: baseline;
	}

	.company-btn {
		background: transparent;
		border: none;
		padding: 0;
		cursor: pointer;
		font-family: inherit;
		font-size: 0.95em;
		font-style: italic;
		font-weight: 700;
		color: #0f766e;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		transition: color 0.15s ease;
	}

	.dark-mode .company-btn {
		color: #2dd4bf;
	}

	.company-btn:hover {
		color: #042f2e;
		text-decoration: underline;
	}

	.dark-mode .company-btn:hover {
		color: #5eead4;
	}

	.chevron-icon {
		width: 12px;
		height: 12px;
	}

	.job-time {
		font-size: 0.85em;
		font-weight: 700;
		color: rgba(0, 0, 0, 0.55);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.dark-mode .job-time {
		color: rgba(255, 255, 255, 0.55);
	}

	.job-scope {
		font-size: 0.8em;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: rgba(0, 0, 0, 0.45);
		margin-bottom: 0.4em;
	}

	.dark-mode .job-scope {
		color: rgba(255, 255, 255, 0.45);
	}

	/* Responsibilities & Bullet Items */
	.responsibilities-list {
		list-style: disc;
		padding-left: 1.1em;
		margin: 0 0 0.5em;
		display: flex;
		flex-direction: column;
		gap: 0.25em;
	}

	.bullet-item {
		font-size: 0.92em;
		line-height: 1.32;
		color: #333333;
		position: relative;
		padding-right: 4.5rem;
	}

	.dark-mode .bullet-item {
		color: #cccccc;
	}

	.bullet-text {
		display: inline;
	}

	/* Subtle "✦ Ask AI" micro-button on hover */
	.bullet-ask-btn {
		position: absolute;
		right: 0;
		top: 50%;
		transform: translateY(-50%);
		background: rgba(15, 118, 110, 0.08);
		border: 1px solid rgba(15, 118, 110, 0.2);
		color: #0f766e;
		font-size: 0.72rem;
		font-weight: 700;
		padding: 1px 6px;
		border-radius: 4px;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 3px;
		opacity: 0;
		transition: all 0.15s ease;
	}

	.dark-mode .bullet-ask-btn {
		background: rgba(45, 212, 191, 0.1);
		border-color: rgba(45, 212, 191, 0.3);
		color: #2dd4bf;
	}

	.bullet-item:hover .bullet-ask-btn {
		opacity: 1;
	}

	.bullet-ask-btn:hover {
		background: #0f766e;
		color: #ffffff;
		border-color: #0f766e;
		transform: translateY(-50%) scale(1.05);
	}

	.dark-mode .bullet-ask-btn:hover {
		background: #2dd4bf;
		color: #000000;
		border-color: #2dd4bf;
	}

	.sparkle {
		font-size: 0.75rem;
	}

	/* Job Tech Chips */
	.job-tech-chips {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 0.35em;
		margin-top: 0.4em;
	}

	.tech-chip {
		display: inline-block;
		padding: 0.2em 0.65em;
		border: 1px solid rgba(20, 184, 166, 0.25);
		border-radius: 5px;
		background: rgba(20, 184, 166, 0.06);
		color: #0f766e;
		font-size: 0.8em;
		font-weight: 700;
		line-height: 1.2;
		cursor: pointer;
		transition: all 0.15s ease;
		font-family: inherit;
	}

	.dark-mode .tech-chip {
		background: rgba(45, 212, 191, 0.08);
		border-color: rgba(45, 212, 191, 0.2);
		color: #2dd4bf;
	}

	.tech-chip:hover {
		background: rgba(20, 184, 166, 0.18);
		border-color: #14b8a6;
		transform: translateY(-1px);
	}

	.tech-chip.active,
	.tech-chip.selected {
		background: #0f766e;
		color: #ffffff;
		border-color: #0f766e;
		box-shadow: 0 2px 6px rgba(15, 118, 110, 0.3);
		transform: scale(1.05);
	}

	.dark-mode .tech-chip.active,
	.dark-mode .tech-chip.selected {
		background: #2dd4bf;
		color: #000000;
		border-color: #2dd4bf;
	}

	/* Slide-Over Drawer / Popover */
	.drawer-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.65);
		backdrop-filter: blur(4px);
		z-index: 1000;
		display: flex;
		justify-content: flex-end;
		animation: fadeIn 0.2s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.drawer-panel {
		width: 100%;
		max-width: 480px;
		height: 100%;
		background: #111111;
		color: #ededed;
		display: flex;
		flex-direction: column;
		border-left: 1px solid rgba(255, 255, 255, 0.12);
		box-shadow: -10px 0 40px rgba(0, 0, 0, 0.8);
		animation: slideLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1);
		overflow-y: auto;
	}

	@keyframes slideLeft {
		from {
			transform: translateX(100%);
		}
		to {
			transform: translateX(0);
		}
	}

	.drawer-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		background: #181818;
	}

	.drawer-pretitle {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #14b8a6;
		font-weight: 700;
	}

	.drawer-title {
		margin: 0.2rem 0;
		font-size: 1.4rem;
		font-weight: 800;
		color: #ffffff;
	}

	.drawer-meta {
		font-size: 0.85rem;
		color: #999999;
	}

	.drawer-close-btn {
		background: rgba(255, 255, 255, 0.1);
		border: none;
		color: #cccccc;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		font-size: 1rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s ease;
	}

	.drawer-close-btn:hover {
		background: rgba(255, 255, 255, 0.2);
		color: #ffffff;
	}

	.drawer-body {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.drawer-scope-pill {
		display: inline-block;
		background: rgba(20, 184, 166, 0.12);
		border: 1px solid rgba(20, 184, 166, 0.3);
		color: #2dd4bf;
		font-size: 0.8125rem;
		font-weight: 600;
		padding: 0.35rem 0.75rem;
		border-radius: 6px;
		align-self: flex-start;
	}

	.drawer-section h4 {
		margin: 0 0 0.6rem;
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #888888;
	}

	.drawer-bullets {
		margin: 0;
		padding-left: 1.2rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		font-size: 0.9rem;
		line-height: 1.4;
		color: #cccccc;
	}

	.drawer-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.drawer-tech-tag {
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: #dddddd;
		padding: 0.25rem 0.6rem;
		border-radius: 4px;
		font-size: 0.8rem;
		font-weight: 600;
	}

	.drawer-actions {
		margin-top: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.drawer-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.drawer-btn.primary {
		background: #14b8a6;
		color: #000000;
		border: none;
	}

	.drawer-btn.primary:hover {
		background: #2dd4bf;
		transform: translateY(-1px);
	}

	.drawer-btn.secondary {
		background: rgba(255, 255, 255, 0.08);
		color: #ffffff;
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.drawer-btn.secondary:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	/* Mobile & Tablet Responsiveness */
	@media (max-width: 768px) {
		.resume-sheet {
			flex-direction: column;
			min-height: auto;
		}

		.resume-sidebar {
			width: 100%;
			padding: 1.5em;
		}

		.initials-box {
			width: 80px;
			height: 80px;
			font-size: 2.6em;
		}

		.initials-box::after {
			border-width: 0 0 15px 45px;
		}

		.candidate-name {
			font-size: 1.8em;
		}

		.resume-main {
			width: 100%;
			padding: 1.25em 1em;
			border-left: none;
			border-top: 1px solid rgba(0, 0, 0, 0.08);
		}

		.main-header {
			flex-direction: column;
			gap: 0.25rem;
		}

		.interactive-hint {
			font-size: 0.7rem;
		}

		.bullet-item {
			padding-right: 0;
		}

		.bullet-ask-btn {
			position: static;
			transform: none;
			margin-top: 0.25rem;
			display: inline-flex;
			opacity: 1;
		}

		.job-meta-row {
			flex-direction: column;
			gap: 0.2rem;
		}

		.job-tech-chips {
			justify-content: flex-start;
		}

		.drawer-panel {
			max-width: 100%;
		}
	}

	/* Print styles */
	@media print {
		.filter-banner,
		.bullet-ask-btn,
		.interactive-hint,
		.audio-pronounce-btn,
		.drawer-backdrop {
			display: none !important;
		}

		.resume-sheet {
			box-shadow: none !important;
			border: none !important;
			width: 100% !important;
			margin: 0 !important;
			min-height: 100vh !important;
			-webkit-print-color-adjust: exact !important;
			print-color-adjust: exact !important;
		}

		.resume-sidebar {
			background: #14b8a6 !important;
			-webkit-print-color-adjust: exact !important;
			print-color-adjust: exact !important;
		}

		.tech-chip {
			background: rgba(20, 184, 166, 0.05) !important;
			color: #0f766e !important;
			border: 1px solid rgba(20, 184, 166, 0.15) !important;
		}
	}
</style>
