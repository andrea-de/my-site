<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import AIButton from '../../components/AIButton.svelte';
	import InteractiveResume from '../../components/InteractiveResume.svelte';
	import ResumeImageZoom from '../../components/ResumeImageZoom.svelte';
	import { openChat, toggleChat } from '$lib/stores/chat';

	let activeView = 'interactive'; // 'interactive' | 'pdf' | 'image'
	let resumeTheme = 'paper'; // 'paper' | 'dark'
	let isMobile = false;

	onMount(() => {
		isMobile = window.innerWidth <= 768 || ('ontouchstart' in window && window.innerWidth <= 1024);
	});

	function handlePrint() {
		if (!browser) return;
		window.print();
	}

	function handleAskAgent() {
		openChat({
			text: "I'm viewing Andrea's resume. Can you give me a summary of his product engineering and agentic orchestration experience?",
			source: 'resume-viewer'
		});
	}
</script>

<svelte:head>
	<title>Resume — Andrea de Candia | Product & Systems Engineer</title>
	<meta
		name="description"
		content="Interactive resume of Andrea de Candia, Founding Product Engineer & Systems Architect. Multi-agent orchestration, streaming protocols, and high-scale distributed systems."
	/>
	<meta property="og:title" content="Andrea de Candia — Interactive Resume" />
	<meta
		property="og:description"
		content="View Andrea de Candia's interactive resume: cross-highlighting skills, architecture breakdowns, and verified project records."
	/>
	<meta property="og:image" content="/resume-preview.png" />
</svelte:head>

<div class="resume-page">
	<!-- Top Navigation & Action Toolbar -->
	<header class="resume-nav">
		<div class="nav-left">
			<a href="/" class="back-link" title="Return to Portfolio">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon">
					<path d="M19 12H5M12 19l-7-7 7-7" />
				</svg>
				<span class="back-label">Portfolio</span>
			</a>
			<div class="header-divider"></div>
			<div class="candidate-meta">
				<h1 class="candidate-name">Andrea de Candia</h1>
				<span class="candidate-role">Founding Product Engineer</span>
			</div>
		</div>

		<div class="nav-center">
			<div class="view-toggle" role="tablist" aria-label="Resume View Mode">
				<button
					role="tab"
					aria-selected={activeView === 'interactive'}
					class="toggle-btn"
					class:active={activeView === 'interactive'}
					on:click={() => (activeView = 'interactive')}
				>
					<span class="btn-sparkle">✦</span>
					<span>Interactive</span>
				</button>
				<button
					role="tab"
					aria-selected={activeView === 'pdf'}
					class="toggle-btn"
					class:active={activeView === 'pdf'}
					on:click={() => (activeView = 'pdf')}
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="icon-sm">
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
						<polyline points="14 2 14 8 20 8" />
					</svg>
					<span>PDF</span>
				</button>
				<button
					role="tab"
					aria-selected={activeView === 'image'}
					class="toggle-btn"
					class:active={activeView === 'image'}
					on:click={() => (activeView = 'image')}
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="icon-sm">
						<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
						<circle cx="8.5" cy="8.5" r="1.5" />
						<polyline points="21 15 16 10 5 21" />
					</svg>
					<span>Image</span>
				</button>
			</div>
		</div>

		<div class="nav-right">
			{#if activeView === 'interactive'}
				<button
					type="button"
					class="action-btn theme-toggle-btn"
					on:click={() => (resumeTheme = resumeTheme === 'paper' ? 'dark' : 'paper')}
					title="Switch between Classic Paper and Dark Theme"
				>
					<span class="theme-icon">{resumeTheme === 'paper' ? '🌙' : '📄'}</span>
					<span class="btn-text">{resumeTheme === 'paper' ? 'Dark' : 'Paper'}</span>
				</button>
			{/if}

			<a
				href="/resume.pdf"
				target="_blank"
				rel="noopener noreferrer"
				class="action-btn open-tab-btn"
				title="Open raw PDF in native browser tab"
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm">
					<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
					<polyline points="15 3 21 3 21 9" />
					<line x1="10" y1="14" x2="21" y2="3" />
				</svg>
				<span class="btn-text">Open Tab</span>
			</a>

			<a
				href="/resume.pdf"
				download="Andrea_de_Candia_Resume.pdf"
				class="action-btn"
				title="Download PDF to your computer"
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm">
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
					<polyline points="7 10 12 15 17 10" />
					<line x1="12" y1="15" x2="12" y2="3" />
				</svg>
				<span class="btn-text">Download</span>
			</a>

			<button
				type="button"
				class="action-btn print-btn"
				on:click={handlePrint}
				title="Print Resume"
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm">
					<polyline points="6 9 6 2 18 2 18 9" />
					<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
					<rect x="6" y="14" width="12" height="8" />
				</svg>
				<span class="btn-text">Print</span>
			</button>

			<button
				type="button"
				class="action-btn agent-btn"
				on:click={handleAskAgent}
				title="Chat with Recruiter Assistant"
			>
				<div class="prism-icon">
					<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path
							d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linejoin="bevel"
						/>
					</svg>
				</div>
				<span class="btn-text">Ask Agent</span>
			</button>
		</div>
	</header>

	<!-- Sub-header quick context strip -->
	<div class="resume-meta-bar">
		<div class="meta-item">
			<span class="dot live-dot"></span>
			<span>Updated September 2026</span>
		</div>
		<div class="meta-item">
			<span>1-Page Clean Layout</span>
		</div>
		<div class="meta-item">
			<span>Founding Product Engineer &bull; New York City</span>
		</div>
		<div class="meta-item link-item">
			<a href="/tree">Browse Architecture Notes &rarr;</a>
		</div>
	</div>

	<!-- Main Resume Content Stage -->
	<main class="resume-stage">
		<div class="resume-container">
			{#if activeView === 'interactive'}
				<InteractiveResume theme={resumeTheme} />
			{:else if activeView === 'pdf'}
				<div class="pdf-wrapper">
					<object
						data="/resume.pdf#view=FitH"
						type="application/pdf"
						class="pdf-object"
						title="Andrea de Candia Resume PDF"
					>
						<!-- Fallback for browsers / devices that don't render embedded PDF objects -->
						<div class="pdf-fallback">
							<div class="fallback-card">
								<img
									src="/resume-preview.png"
									alt="Andrea de Candia Resume Preview"
									class="resume-image"
									loading="eager"
								/>
								<div class="fallback-overlay">
									<p>Embedded PDF preview is not supported by your browser.</p>
									<div class="fallback-actions">
										<a href="/resume.pdf" target="_blank" rel="noopener" class="fallback-btn primary">
											Open PDF in New Tab ↗
										</a>
										<a href="/resume.pdf" download="Andrea_de_Candia_Resume.pdf" class="fallback-btn">
											Download PDF ↓
										</a>
									</div>
								</div>
							</div>
						</div>
					</object>
				</div>
			{:else}
				<ResumeImageZoom
					src="/resume-preview.png"
					alt="Andrea de Candia Resume Preview"
				/>
			{/if}
		</div>
	</main>

	<!-- Footer -->
	<footer class="resume-footer">
		<div class="footer-inner">
			<div class="footer-links">
				<a href="/">Portfolio Home</a>
				<span class="footer-sep">&bull;</span>
				<a href="/#experience">Experience</a>
				<span class="footer-sep">&bull;</span>
				<a href="/#software">Shipped Software</a>
				<span class="footer-sep">&bull;</span>
				<a href="/tree">Knowledge Tree</a>
				<span class="footer-sep">&bull;</span>
				<a href="mailto:andy.decandia@gmail.com">andy.decandia@gmail.com</a>
			</div>
			<p class="copyright">
				&copy; {new Date().getFullYear()} Andrea de Candia. Built with SvelteKit.
			</p>
		</div>
	</footer>

	<!-- Bottom-right floating chat assistant button -->
	<AIButton onChatClick={() => toggleChat()} />
</div>

<style>
	:global(html) {
		background-color: #000;
		color: #fff;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
	}

	.resume-page {
		min-height: 100vh;
		background-color: #000;
		color: #ededed;
		display: flex;
		flex-direction: column;
	}

	/* Top Navigation Toolbar */
	.resume-nav {
		position: sticky;
		top: 0;
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.85rem 1.75rem;
		background: rgba(10, 10, 10, 0.88);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.nav-left {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		min-width: 0;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		color: #aaa;
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
		padding: 0.4rem 0.75rem;
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.back-link:hover {
		color: #fff;
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.16);
		transform: translateX(-2px);
	}

	.header-divider {
		width: 1px;
		height: 24px;
		background: rgba(255, 255, 255, 0.1);
	}

	.candidate-meta {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.candidate-name {
		font-size: 1rem;
		font-weight: 700;
		color: #fff;
		margin: 0;
		line-height: 1.2;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.candidate-role {
		font-size: 0.75rem;
		color: #888;
		font-weight: 500;
		line-height: 1.2;
	}

	/* View Toggle (Interactive vs PDF vs Crisp Image) */
	.nav-center {
		display: flex;
		align-items: center;
	}

	.view-toggle {
		display: flex;
		align-items: center;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		padding: 2px;
		gap: 2px;
	}

	.toggle-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		background: transparent;
		color: #888;
		border: none;
		padding: 0.35rem 0.75rem;
		font-size: 0.8125rem;
		font-weight: 500;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.toggle-btn:hover {
		color: #ddd;
	}

	.toggle-btn.active {
		background: rgba(255, 255, 255, 0.14);
		color: #fff;
		font-weight: 600;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
	}

	.btn-sparkle {
		color: #2dd4bf;
		font-size: 0.9em;
	}

	/* Nav Right Actions */
	.nav-right {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		flex-shrink: 0;
	}

	.action-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		background: rgba(255, 255, 255, 0.05);
		color: #ccc;
		border: 1px solid rgba(255, 255, 255, 0.1);
		padding: 0.45rem 0.85rem;
		border-radius: 6px;
		font-size: 0.8125rem;
		font-weight: 500;
		text-decoration: none;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.action-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #fff;
		border-color: rgba(255, 255, 255, 0.2);
	}

	.theme-toggle-btn {
		border-color: rgba(45, 212, 191, 0.3);
		color: #2dd4bf;
	}

	.theme-toggle-btn:hover {
		background: rgba(45, 212, 191, 0.1);
		color: #5eead4;
	}

	.theme-icon {
		font-size: 0.85rem;
	}

	.agent-btn {
		background: #fff;
		color: #000;
		border-color: #fff;
		font-weight: 600;
	}

	.agent-btn:hover {
		background: #ececec;
		color: #000;
		border-color: #ececec;
		transform: translateY(-1px);
	}

	.prism-icon {
		width: 14px;
		height: 14px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.prism-icon svg {
		width: 100%;
		height: 100%;
	}

	.icon {
		width: 18px;
		height: 18px;
	}

	.icon-sm {
		width: 15px;
		height: 15px;
	}

	/* Subheader Meta Bar */
	.resume-meta-bar {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		gap: 1.5rem;
		padding: 0.6rem 1.5rem;
		background: rgba(18, 18, 18, 0.6);
		border-bottom: 1px solid rgba(255, 255, 255, 0.04);
		font-size: 0.8125rem;
		color: #888;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.45rem;
	}

	.live-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #10b981;
		box-shadow: 0 0 6px #10b981;
	}

	.meta-item.link-item a {
		color: #60a5fa;
		text-decoration: none;
		font-weight: 500;
		transition: color 0.15s ease;
	}

	.meta-item.link-item a:hover {
		color: #93c5fd;
		text-decoration: underline;
	}

	/* Main Stage */
	.resume-stage {
		flex: 1;
		display: flex;
		justify-content: center;
		padding: 2rem 1.5rem;
		background: radial-gradient(circle at 50% 10%, rgba(30, 30, 30, 0.5) 0%, #000 70%);
	}

	.resume-container {
		width: 100%;
		max-width: 960px;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	/* PDF Wrapper */
	.pdf-wrapper {
		width: 100%;
		height: calc(100vh - 170px);
		min-height: 820px;
		background: #121212;
		border-radius: 12px;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.1);
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.7);
	}

	.pdf-object {
		width: 100%;
		height: 100%;
		display: block;
		border: none;
	}

	.pdf-fallback {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		background: #0d0d0d;
	}

	.fallback-card {
		max-width: 720px;
		width: 100%;
		position: relative;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
	}

	.fallback-overlay {
		padding: 1.25rem;
		background: rgba(18, 18, 18, 0.95);
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		text-align: center;
	}

	.fallback-overlay p {
		margin: 0 0 0.85rem;
		font-size: 0.875rem;
		color: #bbb;
	}

	.fallback-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.fallback-btn {
		display: inline-block;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		font-size: 0.8125rem;
		font-weight: 500;
		text-decoration: none;
		color: #ddd;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.12);
		transition: all 0.2s ease;
	}

	.fallback-btn:hover {
		background: rgba(255, 255, 255, 0.16);
		color: #fff;
	}

	.fallback-btn.primary {
		background: #fff;
		color: #000;
		border-color: #fff;
		font-weight: 600;
	}

	.fallback-btn.primary:hover {
		background: #e0e0e0;
	}

	/* Image Wrapper */
	.image-wrapper {
		width: 100%;
		max-width: 860px;
		display: flex;
		justify-content: center;
		border-radius: 12px;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.12);
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8);
		background: #111;
	}

	.resume-image {
		width: 100%;
		height: auto;
		display: block;
		background: #fff;
	}

	/* Footer */
	.resume-footer {
		border-top: 1px solid rgba(255, 255, 255, 0.06);
		padding: 2rem 1.5rem;
		background: #050505;
	}

	.footer-inner {
		max-width: 960px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		text-align: center;
	}

	.footer-links {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0.75rem;
		font-size: 0.85rem;
	}

	.footer-links a {
		color: #888;
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.footer-links a:hover {
		color: #fff;
	}

	.footer-sep {
		color: #444;
	}

	.copyright {
		margin: 0;
		font-size: 0.75rem;
		color: #555;
	}

	/* Mobile & Responsive Breakpoints */
	@media (max-width: 900px) {
		.resume-nav {
			padding: 0.75rem 1rem;
			gap: 0.75rem;
			flex-wrap: wrap;
		}

		.nav-left {
			order: 1;
		}

		.nav-right {
			order: 2;
			margin-left: auto;
		}

		.nav-center {
			order: 3;
			width: 100%;
			justify-content: center;
			padding-top: 0.4rem;
			border-top: 1px solid rgba(255, 255, 255, 0.04);
		}

		.view-toggle {
			width: 100%;
			max-width: 360px;
		}

		.toggle-btn {
			flex: 1;
			justify-content: center;
		}

		.candidate-role {
			display: none;
		}
	}

	@media (max-width: 640px) {
		.resume-nav {
			padding: 0.6rem 0.85rem;
			gap: 0.5rem;
		}

		.nav-left {
			gap: 0.5rem;
			flex-shrink: 0;
		}

		.back-label {
			display: none;
		}

		.back-link {
			width: 34px;
			height: 34px;
			padding: 0;
			display: inline-flex;
			align-items: center;
			justify-content: center;
		}

		.candidate-meta {
			min-width: max-content;
		}

		.candidate-name {
			font-size: 1rem;
			white-space: nowrap;
			overflow: visible;
			text-overflow: clip;
		}

		.header-divider {
			display: none;
		}

		.nav-right {
			gap: 0.35rem;
			flex-shrink: 0;
		}

		.action-btn {
			width: 34px;
			height: 34px;
			padding: 0;
			display: inline-flex;
			align-items: center;
			justify-content: center;
		}

		.action-btn .btn-text {
			display: none;
		}

		.theme-toggle-btn {
			width: 34px;
			height: 34px;
			padding: 0;
			display: inline-flex;
			align-items: center;
			justify-content: center;
		}

		.print-btn {
			display: none;
		}

		.resume-stage {
			padding: 1rem 0.75rem;
		}

		.resume-meta-bar {
			gap: 0.75rem;
			font-size: 0.75rem;
			padding: 0.5rem 0.75rem;
			text-align: center;
		}

		.pdf-wrapper {
			height: calc(100vh - 200px);
			min-height: 520px;
			border-radius: 8px;
		}
	}

	@media (max-width: 400px) {
		.open-tab-btn {
			display: none;
		}
	}

	/* Print styles */
	@media print {
		:global(body),
		.resume-page {
			background: white !important;
			color: black !important;
		}

		.resume-nav,
		.resume-meta-bar,
		.resume-footer,
		:global(.ai-button-wrapper) {
			display: none !important;
		}

		.resume-stage {
			padding: 0 !important;
			margin: 0 !important;
			background: none !important;
		}

		.resume-container {
			max-width: 100% !important;
			width: 100% !important;
			margin: 0 !important;
			padding: 0 !important;
			box-shadow: none !important;
			border: none !important;
		}

		.pdf-wrapper,
		.image-wrapper {
			display: none !important;
		}
	}
</style>
