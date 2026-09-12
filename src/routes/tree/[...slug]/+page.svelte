<script>
	import { onMount } from 'svelte';
	import ExternalLink from '../../../components/svg/ExternalLink.svelte';
	import AIButton from '../../../components/AIButton.svelte';
	import { openChat, toggleChat } from '$lib/stores/chat';

	export let data;

	const { node, html, relatedNodes } = data;

	let activeHeadingId = '';

	function formatCategory(cat) {
		switch (cat) {
			case 'products':
				return 'Product';
			case 'roles':
				return 'Role & Experience';
			case 'prototypes':
				return 'Prototype';
			case 'tools':
				return 'Developer Tool';
			case 'architecture':
				return 'Architecture';
			case 'philosophy':
				return 'Philosophy';
			default:
				return cat.charAt(0).toUpperCase() + cat.slice(1);
		}
	}

	function openChatWithPrompt(prompt) {
		openChat({ text: prompt, source: 'ask-agent' });
	}

	onMount(() => {
		// Initialize Mermaid if diagrams exist
		const mermaidElements = document.querySelectorAll('.mermaid');
		if (mermaidElements.length > 0) {
			import('https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs')
				.then((m) => {
					const mermaid = m.default;
					mermaid.initialize({
						startOnLoad: false,
						theme: 'dark',
						themeVariables: {
							darkMode: true,
							background: '#0a0a0a',
							primaryColor: '#1890ff',
							primaryTextColor: '#fff',
							primaryBorderColor: '#303030',
							lineColor: '#595959',
							secondaryColor: '#722ed1',
							tertiaryColor: '#141414'
						}
					});
					mermaid.run({ querySelector: '.mermaid' });
				})
				.catch((err) => {
					console.warn('Could not load Mermaid renderer dynamically:', err);
				});
		}

		// Setup IntersectionObserver for sticky Table of Contents
		const headingElements = node.headings
			.map((h) => document.getElementById(h.id))
			.filter(Boolean);

		if (headingElements.length > 0) {
			const observer = new IntersectionObserver(
				(entries) => {
					for (const entry of entries) {
						if (entry.isIntersecting) {
							activeHeadingId = entry.target.id;
							break;
						}
					}
				},
				{ rootMargin: '-80px 0px -60% 0px' }
			);

			headingElements.forEach((el) => observer.observe(el));
			return () => observer.disconnect();
		}
	});

	function handleContainerClick(e) {
		const btn = e.target.closest('.copy-code-btn');
		if (!btn) return;
		const code = decodeURIComponent(btn.dataset.code || '');
		if (navigator.clipboard) {
			navigator.clipboard.writeText(code).then(() => {
				const originalText = btn.innerHTML;
				btn.classList.add('copied');
				btn.innerText = 'Copied!';
				setTimeout(() => {
					btn.classList.remove('copied');
					btn.innerHTML = originalText;
				}, 1800);
			});
		}
	}
</script>

<svelte:head>
	<title>{node.title} | Knowledge Tree</title>
	<meta name="description" content={node.description} />
</svelte:head>

<div class="reader-page">
	<div class="grain-overlay"></div>

	<!-- Top Nav -->
	<header class="top-nav">
		<a href="/tree" class="back-link">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="back-icon">
				<path d="M19 12H5M12 19l-7-7 7-7" />
			</svg>
			<span>Back to Knowledge Tree</span>
		</a>

		<div class="nav-actions">
			<button
				class="agent-chip"
				on:click={() =>
					openChatWithPrompt(
						`I'm reading your note on "${node.title}". Can you give me a quick high-level summary and highlight the biggest technical challenge?`
					)}
			>
				<div class="prism-icon mini">
					<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path
							d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
							stroke="currentColor"
							stroke-width="2"
							stroke-linejoin="bevel"
						/>
					</svg>
				</div>
				<span>Discuss Note</span>
			</button>
		</div>
	</header>

	<div class="reader-container">
		<!-- Note Header -->
		<header class="note-header">
			<div class="meta-row">
				<span class="category-badge {node.category}">
					{formatCategory(node.category)}
				</span>
				<span class="meta-item">{node.readingTime}</span>
				<span class="meta-item">·</span>
				<span class="meta-item">{node.wordCount} words</span>
				<span class="meta-item">·</span>
				<span class="meta-item">Updated {node.updated}</span>
			</div>

			<h1 class="title">{node.title}</h1>
			{#if node.description}
				<p class="description">{node.description}</p>
			{/if}

			{#if node.tags && node.tags.length > 0}
				<div class="tags-row">
					{#each node.tags as tag}
						<a href="/tree" class="tag-chip">#{tag}</a>
					{/each}
				</div>
			{/if}
		</header>

		<!-- Main Layout: Article + TOC -->
		<div class="layout-grid">
			<article class="article-content" on:click={handleContainerClick}>
				<div class="markdown-body">
					{@html html}
				</div>
			</article>

			<!-- Sticky Table of Contents -->
			{#if node.headings && node.headings.length > 1}
				<aside class="toc-sidebar">
					<div class="toc-sticky-box">
						<h4 class="toc-title">On this page</h4>
						<nav class="toc-nav">
							{#each node.headings as heading}
								<a
									href="#{heading.id}"
									class="toc-link depth-{heading.depth}"
									class:active={activeHeadingId === heading.id}
								>
									{heading.text}
								</a>
							{/each}
						</nav>

						<div class="toc-assistant-box">
							<p class="toc-assistant-text">Have questions on this design?</p>
							<button
								class="toc-assistant-btn"
								on:click={() =>
									openChatWithPrompt(
										`Can you explain how ${node.title} compares to alternative architectures?`
									)}
							>
								<span>Ask Assistant</span>
								<ExternalLink size={12} />
							</button>
						</div>
					</div>
				</aside>
			{/if}
		</div>

		<!-- Related Notes -->
		{#if relatedNodes && relatedNodes.length > 0}
			<section class="related-section">
				<h3 class="related-title">Related Technical Notes</h3>
				<div class="related-grid">
					{#each relatedNodes as related}
						<a href="/tree/{related.slug}" class="related-card">
							<div class="related-cat">{formatCategory(related.category)}</div>
							<h4 class="related-heading">{related.title}</h4>
							<p class="related-desc">{related.description}</p>
							<div class="related-footer">
								<span>{related.readingTime}</span>
								<span class="read-arrow">Read →</span>
							</div>
						</a>
					{/each}
				</div>
			</section>
		{/if}
	</div>

	<!-- Footer -->
	<footer class="reader-footer">
		<div class="footer-inner">
			<a href="/tree">← Return to Knowledge Tree</a>
			<span>&copy; {new Date().getFullYear()} Andrea de Candia</span>
		</div>
	</footer>

	<!-- Bottom Right Floating Chat Bubble -->
	<AIButton onChatClick={() => toggleChat()} />
</div>

<style>
	:global(html) {
		background-color: #000;
		color: #fff;
		scroll-behavior: smooth;
	}

	.reader-page {
		min-height: 100vh;
		background: #000;
		color: #fff;
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		position: relative;
	}

	.grain-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
		opacity: 0.04;
		pointer-events: none;
		z-index: 1;
	}

	/* Nav */
	.top-nav {
		position: sticky;
		top: 0;
		z-index: 40;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 2rem;
		background: rgba(0, 0, 0, 0.85);
		backdrop-filter: blur(16px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		color: rgba(255, 255, 255, 0.75);
		text-decoration: none;
		font-weight: 700;
		font-size: 0.92rem;
		transition: all 0.2s ease;
	}

	.back-link:hover {
		color: #fff;
		transform: translateX(-2px);
	}

	.back-icon {
		width: 18px;
		height: 18px;
	}

	.agent-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.15);
		color: #fff;
		padding: 0.5rem 1rem;
		border-radius: 9999px;
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		cursor: pointer;
		transition: all 0.25s ease;
	}

	.agent-chip:hover {
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 255, 255, 0.3);
		transform: translateY(-1px);
	}

	.prism-icon.mini {
		width: 14px;
		height: 14px;
	}

	/* Main Container */
	.reader-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 3.5rem 2rem 6rem;
		position: relative;
		z-index: 2;
	}

	/* Note Header */
	.note-header {
		margin-bottom: 3.5rem;
		padding-bottom: 2.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.meta-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
		margin-bottom: 1.25rem;
	}

	.category-badge {
		font-size: 0.7rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		padding: 0.3rem 0.7rem;
		border-radius: 6px;
		border: 1px solid transparent;
	}

	
	.category-badge.products {
		background: rgba(16, 185, 129, 0.15);
		color: #34d399;
		border-color: rgba(16, 185, 129, 0.3);
	}
	.category-badge.roles {
		background: rgba(59, 130, 246, 0.15);
		color: #60a5fa;
		border-color: rgba(59, 130, 246, 0.3);
	}
	.category-badge.prototypes {
		background: rgba(245, 158, 11, 0.15);
		color: #fbbf24;
		border-color: rgba(245, 158, 11, 0.3);
	}
	.category-badge.tools {
		background: rgba(168, 85, 247, 0.15);
		color: #c084fc;
		border-color: rgba(168, 85, 247, 0.3);
	}
	.category-badge.case-studies {
		background: rgba(24, 144, 255, 0.12);
		border-color: rgba(24, 144, 255, 0.25);
		color: #69c0ff;
	}

	.category-badge.architecture {
		background: rgba(114, 46, 209, 0.15);
		border-color: rgba(114, 46, 209, 0.3);
		color: #d3adf7;
	}

	.category-badge.philosophy {
		background: rgba(82, 196, 26, 0.12);
		border-color: rgba(82, 196, 26, 0.25);
		color: #95de64;
	}

	.meta-item {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.4);
	}

	.title {
		font-size: clamp(2.2rem, 5vw, 3.4rem);
		font-weight: 900;
		line-height: 1.1;
		letter-spacing: -0.03em;
		margin: 0 0 1rem 0;
	}

	.description {
		font-size: clamp(1.05rem, 2vw, 1.25rem);
		color: rgba(255, 255, 255, 0.7);
		line-height: 1.6;
		max-width: 800px;
		margin: 0 0 1.5rem 0;
	}

	.tags-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tag-chip {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		padding: 0.25rem 0.65rem;
		border-radius: 9999px;
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.tag-chip:hover {
		color: #fff;
		border-color: rgba(255, 255, 255, 0.25);
	}

	/* Layout Grid */
	.layout-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 280px;
		gap: 4rem;
		align-items: start;
	}

	.article-content {
		min-width: 0;
	}

	/* Markdown Presentation */
	.markdown-body :global(h1),
	.markdown-body :global(h2),
	.markdown-body :global(h3),
	.markdown-body :global(h4) {
		color: #fff;
		font-weight: 800;
		letter-spacing: -0.02em;
		scroll-margin-top: 100px;
	}

	.markdown-body :global(h1) {
		font-size: 2.2rem;
		margin: 2.5rem 0 1.2rem;
	}

	.markdown-body :global(h2) {
		font-size: 1.65rem;
		margin: 2.5rem 0 1rem;
		padding-bottom: 0.6rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.markdown-body :global(h3) {
		font-size: 1.3rem;
		margin: 2rem 0 0.8rem;
	}

	.markdown-body :global(h4) {
		font-size: 1.1rem;
		margin: 1.5rem 0 0.6rem;
	}

	.markdown-body :global(p) {
		font-size: 1.05rem;
		line-height: 1.75;
		color: rgba(255, 255, 255, 0.8);
		margin: 0 0 1.25rem;
	}

	.markdown-body :global(ul),
	.markdown-body :global(ol) {
		padding-left: 1.5rem;
		margin: 0 0 1.5rem;
		color: rgba(255, 255, 255, 0.8);
	}

	.markdown-body :global(li) {
		font-size: 1.02rem;
		line-height: 1.7;
		margin-bottom: 0.5rem;
	}

	.markdown-body :global(strong) {
		color: #fff;
		font-weight: 700;
	}

	.markdown-body :global(code:not(pre code)) {
		background: rgba(255, 255, 255, 0.08);
		color: #79c0ff;
		padding: 0.2rem 0.45rem;
		border-radius: 5px;
		font-size: 0.88em;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	}

	.markdown-body :global(a) {
		color: #58a6ff;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.markdown-body :global(a:hover) {
		color: #79c0ff;
	}

	.markdown-body :global(blockquote) {
		border-left: 3px solid #1890ff;
		background: rgba(24, 144, 255, 0.05);
		padding: 1rem 1.5rem;
		margin: 1.5rem 0;
		border-radius: 0 8px 8px 0;
		color: rgba(255, 255, 255, 0.75);
		font-style: italic;
	}

	/* Tables */
	.markdown-body :global(table) {
		width: 100%;
		border-collapse: collapse;
		margin: 2rem 0;
		font-size: 0.95rem;
		background: rgba(255, 255, 255, 0.02);
		border-radius: 10px;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	.markdown-body :global(th) {
		background: rgba(255, 255, 255, 0.06);
		padding: 0.9rem 1.2rem;
		text-align: left;
		font-weight: 700;
		color: #fff;
		border-bottom: 1px solid rgba(255, 255, 255, 0.12);
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.markdown-body :global(td) {
		padding: 0.9rem 1.2rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
		color: rgba(255, 255, 255, 0.8);
		vertical-align: top;
	}

	.markdown-body :global(tr:last-child td) {
		border-bottom: none;
	}

	/* Code Blocks */
	:global(.code-block-wrapper) {
		margin: 1.8rem 0;
		border-radius: 12px;
		background: #0d1117;
		border: 1px solid rgba(255, 255, 255, 0.12);
		overflow: hidden;
	}

	:global(.code-block-header) {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 1rem;
		background: rgba(255, 255, 255, 0.03);
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	:global(.code-lang) {
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: rgba(255, 255, 255, 0.4);
		font-weight: 700;
	}

	:global(.copy-code-btn) {
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.7);
		padding: 0.25rem 0.6rem;
		border-radius: 4px;
		font-size: 0.72rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	:global(.copy-code-btn:hover) {
		background: rgba(255, 255, 255, 0.15);
		color: #fff;
	}

	:global(.copy-code-btn.copied) {
		background: #238636;
		color: #fff;
		border-color: #2ea043;
	}

	:global(.code-block-wrapper pre) {
		margin: 0;
		padding: 1.25rem;
		overflow-x: auto;
	}

	:global(.code-block-wrapper code) {
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		font-size: 0.9rem;
		line-height: 1.6;
		color: #c9d1d9;
	}

	/* Mermaid Diagram */
	:global(.mermaid-container) {
		margin: 2rem 0;
		padding: 1.5rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 14px;
		display: flex;
		justify-content: center;
		overflow-x: auto;
	}

	:global(.mermaid) {
		text-align: center;
		font-family: inherit;
	}

	/* TOC Sidebar */
	.toc-sidebar {
		position: relative;
	}

	.toc-sticky-box {
		position: sticky;
		top: 90px;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 14px;
		padding: 1.5rem;
	}

	.toc-title {
		margin: 0 0 1rem 0;
		font-size: 0.75rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: rgba(255, 255, 255, 0.4);
	}

	.toc-nav {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
		max-height: 60vh;
		overflow-y: auto;
	}

	.toc-link {
		color: rgba(255, 255, 255, 0.5);
		text-decoration: none;
		font-size: 0.85rem;
		line-height: 1.4;
		transition: all 0.2s ease;
		border-left: 2px solid transparent;
		padding-left: 0.5rem;
	}

	.toc-link.depth-3 {
		padding-left: 1.25rem;
		font-size: 0.8rem;
	}

	.toc-link:hover {
		color: #fff;
		border-color: rgba(255, 255, 255, 0.3);
	}

	.toc-link.active {
		color: #69c0ff;
		font-weight: 600;
		border-color: #1890ff;
	}

	.toc-assistant-box {
		margin-top: 1.5rem;
		padding-top: 1.25rem;
		border-top: 1px solid rgba(255, 255, 255, 0.07);
	}

	.toc-assistant-text {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.5);
		margin: 0 0 0.75rem 0;
	}

	.toc-assistant-btn {
		width: 100%;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.12);
		color: #fff;
		padding: 0.6rem;
		border-radius: 8px;
		font-size: 0.8rem;
		font-weight: 700;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		transition: all 0.2s ease;
	}

	.toc-assistant-btn:hover {
		background: #fff;
		color: #000;
	}

	/* Related Notes */
	.related-section {
		margin-top: 5rem;
		padding-top: 3rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.related-title {
		font-size: 1.4rem;
		font-weight: 800;
		margin: 0 0 1.5rem 0;
	}

	.related-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1.25rem;
	}

	.related-card {
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 12px;
		padding: 1.5rem;
		text-decoration: none;
		color: inherit;
		display: flex;
		flex-direction: column;
		transition: all 0.25s ease;
	}

	.related-card:hover {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.2);
		transform: translateY(-2px);
	}

	.related-cat {
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		color: rgba(255, 255, 255, 0.4);
		font-weight: 700;
		margin-bottom: 0.5rem;
	}

	.related-heading {
		font-size: 1.1rem;
		font-weight: 700;
		margin: 0 0 0.5rem 0;
		color: #fff;
	}

	.related-desc {
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.6);
		line-height: 1.45;
		margin: 0 0 1rem 0;
		flex-grow: 1;
	}

	.related-footer {
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.4);
		padding-top: 0.75rem;
		border-top: 1px solid rgba(255, 255, 255, 0.05);
	}

	.read-arrow {
		color: #69c0ff;
		font-weight: 600;
	}

	/* Footer */
	.reader-footer {
		border-top: 1px solid rgba(255, 255, 255, 0.06);
		padding: 3rem 2rem;
		background: #000;
	}

	.footer-inner {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.4);
	}

	.footer-inner a {
		color: rgba(255, 255, 255, 0.6);
		text-decoration: none;
		font-weight: 600;
		transition: color 0.2s ease;
	}

	.footer-inner a:hover {
		color: #fff;
	}

	@media (max-width: 960px) {
		.layout-grid {
			grid-template-columns: 1fr;
			gap: 2rem;
		}

		.toc-sidebar {
			display: none;
		}
	}

	@media (max-width: 640px) {
		.top-nav {
			padding: 1rem 1.25rem;
		}

		.reader-container {
			padding: 2rem 1.25rem 4rem;
		}

		.footer-inner {
			flex-direction: column;
			gap: 1rem;
		}
	}
</style>
