<script>
	import ExternalLink from '../../components/svg/ExternalLink.svelte';
	import AIButton from '../../components/AIButton.svelte';
	import { openChat, toggleChat } from '$lib/stores/chat';

	export let data;

	const { manifest } = data;
	const { nodes, categories, tags } = manifest;

	// Filter out the hub INDEX itself from the card listing so only content nodes appear
	const contentNodes = nodes.filter((n) => n.category !== 'hub');

	let searchQuery = '';
	let selectedCategory = 'all';
	let selectedTag = 'all';

	const CATEGORY_ORDER = ['products', 'roles', 'prototypes', 'tools', 'architecture', 'philosophy'];

	function formatCategory(cat) {
		switch (cat) {
			case 'products':
				return 'Products';
			case 'roles':
				return 'Roles';
			case 'prototypes':
				return 'Prototypes';
			case 'tools':
				return 'Tools';
			case 'architecture':
				return 'Architecture';
			case 'philosophy':
				return 'Philosophy';
			default:
				return cat.charAt(0).toUpperCase() + cat.slice(1);
		}
	}

	$: sortedCategories = categories
		.filter((c) => c !== 'hub')
		.sort((a, b) => {
			const idxA = CATEGORY_ORDER.indexOf(a);
			const idxB = CATEGORY_ORDER.indexOf(b);
			if (idxA !== -1 && idxB !== -1) return idxA - idxB;
			if (idxA !== -1) return -1;
			if (idxB !== -1) return 1;
			return a.localeCompare(b);
		});

	function openChatWithPrompt(prompt) {
		openChat({ text: prompt, source: 'ask-agent' });
	}

	$: filteredNodes = contentNodes.filter((node) => {
		const matchesCategory = selectedCategory === 'all' || node.category === selectedCategory;
		const matchesTag = selectedTag === 'all' || (node.tags && node.tags.includes(selectedTag));

		if (!matchesCategory || !matchesTag) return false;

		if (!searchQuery.trim()) return true;

		const q = searchQuery.toLowerCase().trim();
		const inTitle = node.title.toLowerCase().includes(q);
		const inDesc = (node.description || '').toLowerCase().includes(q);
		const inTags = (node.tags || []).some((t) => t.toLowerCase().includes(q));
		const inCategory = node.category.toLowerCase().includes(q);

		return inTitle || inDesc || inTags || inCategory;
	});

	$: categoryCounts = {
		all: contentNodes.length,
		...contentNodes.reduce((acc, n) => {
			acc[n.category] = (acc[n.category] || 0) + 1;
			return acc;
		}, {})
	};
</script>

<svelte:head>
	<title>Knowledge Tree | Andrea de Candia</title>
	<meta
		name="description"
		content="Engineering knowledge tree, systems architecture blueprints, and deep-dive technical case studies by Andrea de Candia."
	/>
</svelte:head>

<div class="brain-page">
	<div class="grain-overlay"></div>

	<!-- Navigation Bar -->
	<header class="top-nav">
		<a href="/" class="back-link">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="back-icon">
				<path d="M19 12H5M12 19l-7-7 7-7" />
			</svg>
			<span>Andrea de Candia</span>
		</a>
		<div class="nav-actions">
			<button class="agent-chip" on:click={() => openChatWithPrompt('What technical topics are covered in your knowledge tree?')}>
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
				<span>Ask Agent</span>
			</button>
		</div>
	</header>

	<main class="brain-container">
		<!-- Hero Section -->
		<section class="brain-hero">
			<div class="hero-badge">
				<span class="pulse-dot"></span>
				<span>Knowledge Tree</span>
			</div>
			<h1 class="hero-title">Engineering Knowledge Base</h1>
			<p class="hero-subtitle">
				A living collection of architectural blueprints, zero-to-one systems case studies, and engineering philosophies.
			</p>

			<div class="hero-stats">
				<div class="stat-pill">
					<span class="stat-num">{contentNodes.length}</span>
					<span class="stat-label">Notes</span>
				</div>
				<div class="stat-pill">
					<span class="stat-num">{sortedCategories.length}</span>
					<span class="stat-label">Domains</span>
				</div>
				<div class="stat-pill">
					<span class="stat-num">{tags.length}</span>
					<span class="stat-label">Topics</span>
				</div>
			</div>
		</section>

		<!-- Controls: Search & Category Tabs -->
		<section class="controls-section">
			<div class="search-bar-wrapper">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
					<circle cx="11" cy="11" r="8" />
					<path d="M21 21l-4.35-4.35" />
				</svg>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search technical notes, technologies (e.g. multi-agent, WASM, SvelteKit, Room)..."
					class="search-input"
				/>
				{#if searchQuery}
					<button class="clear-btn" on:click={() => (searchQuery = '')} aria-label="Clear search">✕</button>
				{/if}
			</div>

			<!-- Category Tabs -->
			<div class="category-tabs" role="tablist">
				<button
					class="tab-btn"
					class:active={selectedCategory === 'all'}
					on:click={() => (selectedCategory = 'all')}
					role="tab"
					aria-selected={selectedCategory === 'all'}
				>
					<span>All Notes</span>
					<span class="tab-count">{categoryCounts.all || 0}</span>
				</button>
				{#each sortedCategories as cat}
					<button
						class="tab-btn"
						class:active={selectedCategory === cat}
						on:click={() => (selectedCategory = cat)}
						role="tab"
						aria-selected={selectedCategory === cat}
					>
						<span>{formatCategory(cat)}</span>
						<span class="tab-count">{categoryCounts[cat] || 0}</span>
					</button>
				{/each}
			</div>

			<!-- Tag Filter Pills -->
			{#if tags.length > 0}
				<div class="tags-scroller">
					<button
						class="tag-pill"
						class:active={selectedTag === 'all'}
						on:click={() => (selectedTag = 'all')}
					>
						All Tags
					</button>
					{#each tags as tag}
						<button
							class="tag-pill"
							class:active={selectedTag === tag}
							on:click={() => (selectedTag = selectedTag === tag ? 'all' : tag)}
						>
							#{tag}
						</button>
					{/each}
				</div>
			{/if}
		</section>

		<!-- Notes Grid -->
		<section class="notes-section">
			{#if filteredNodes.length === 0}
				<div class="empty-state">
					<p class="empty-title">No notes match your filters</p>
					<p class="empty-desc">Try clearing your search or switching to another category.</p>
					<button
						class="reset-filters-btn"
						on:click={() => {
							searchQuery = '';
							selectedCategory = 'all';
							selectedTag = 'all';
						}}
					>
						Reset all filters
					</button>
				</div>
			{:else}
				<div class="notes-grid">
					{#each filteredNodes as node (node.slug)}
						<article class="note-card">
							<a href="/tree/{node.slug}" class="card-inner-link">
								<div class="card-top">
									<span class="category-badge {node.category}">
										{formatCategory(node.category)}
									</span>
									<span class="reading-time">{node.readingTime}</span>
								</div>

								<h2 class="note-title">{node.title}</h2>
								<p class="note-desc">{node.description}</p>

								{#if node.tags && node.tags.length > 0}
									<div class="note-tags">
										{#each node.tags.slice(0, 5) as tag}
											<span class="card-tag">#{tag}</span>
										{/each}
										{#if node.tags.length > 5}
											<span class="card-tag-more">+{node.tags.length - 5}</span>
										{/if}
									</div>
								{/if}

								<div class="card-footer">
									<span class="updated-date">Updated {node.updated}</span>
									<span class="read-link">
										<span>Read deep dive</span>
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="arrow-icon">
											<path d="M5 12h14m-7-7l7 7-7 7" />
										</svg>
									</span>
								</div>
							</a>
						</article>
					{/each}
				</div>
			{/if}
		</section>

		<!-- Conversational Assistant Callout Banner -->
		<section class="assistant-callout">
			<div class="callout-content">
				<div class="callout-icon">
					<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path
							d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linejoin="bevel"
						/>
						<path
							d="M12 6L13.5 10.5L18 12L13.5 13.5L12 18L10.5 13.5L6 12L10.5 10.5L12 6Z"
							fill="currentColor"
						/>
					</svg>
				</div>
				<div class="callout-text">
					<h3>Explore via Streaming Agentic Chat</h3>
					<p>
						Andrea's AI assistant can actively navigate this knowledge tree using live tool calls, inspect specific architectural notes, and answer technical questions tailored to your team's stack.
					</p>
				</div>
			</div>
			<button class="callout-cta" on:click={() => openChatWithPrompt('Can you walk me through the key architectural patterns Andrea uses across his projects?')}>
				<span>Chat with Assistant</span>
				<ExternalLink size={14} />
			</button>
		</section>
	</main>

	<!-- Footer -->
	<footer class="brain-footer">
		<div class="footer-links">
			<a href="/">Portfolio</a>
			<a href="/#experience">Experience</a>
			<a href="/#software">Projects</a>
			<a href="https://github.com/andrea-de/tree" target="_blank" rel="noopener">GitHub Repo</a>
			<a href="/resume">Resume</a>
		</div>
		<p class="copyright">&copy; {new Date().getFullYear()} Andrea de Candia. Open knowledge tree.</p>
	</footer>

	<!-- Bottom Right Floating Chat Bubble -->
	<AIButton onChatClick={() => toggleChat()} />
</div>

<style>
	:global(html) {
		background-color: #000;
		color: #fff;
	}

	.brain-page {
		min-height: 100vh;
		background: #000;
		color: #fff;
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		position: relative;
		overflow-x: hidden;
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

	/* Top Navigation */
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
		color: rgba(255, 255, 255, 0.8);
		text-decoration: none;
		font-weight: 700;
		font-size: 0.95rem;
		letter-spacing: -0.01em;
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
	.brain-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 3rem 2rem 5rem;
		position: relative;
		z-index: 2;
	}

	/* Hero */
	.brain-hero {
		text-align: left;
		margin-bottom: 3.5rem;
	}

	.hero-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.18em;
		color: rgba(255, 255, 255, 0.7);
		background: rgba(255, 255, 255, 0.04);
		padding: 0.4rem 0.9rem;
		border-radius: 9999px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		margin-bottom: 1.25rem;
	}

	.pulse-dot {
		width: 7px;
		height: 7px;
		background: #52c41a;
		border-radius: 50%;
		box-shadow: 0 0 8px #52c41a;
		animation: pulse 2s infinite ease-in-out;
	}

	@keyframes pulse {
		0%, 100% { opacity: 0.6; transform: scale(0.9); }
		50% { opacity: 1; transform: scale(1.15); }
	}

	.hero-title {
		font-size: clamp(2.5rem, 6vw, 4.2rem);
		font-weight: 900;
		line-height: 1.05;
		letter-spacing: -0.03em;
		margin: 0 0 1.25rem 0;
	}

	.hero-subtitle {
		font-size: clamp(1.05rem, 2vw, 1.25rem);
		color: rgba(255, 255, 255, 0.65);
		line-height: 1.6;
		max-width: 760px;
		margin: 0 0 2rem 0;
	}

	.hero-subtitle code {
		background: rgba(255, 255, 255, 0.08);
		padding: 0.2rem 0.45rem;
		border-radius: 4px;
		font-size: 0.9em;
		color: #e6f7ff;
	}

	.hero-stats {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.stat-pill {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.08);
		padding: 0.6rem 1.2rem;
		border-radius: 12px;
	}

	.stat-num {
		font-size: 1.4rem;
		font-weight: 800;
		color: #fff;
	}

	.stat-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: rgba(255, 255, 255, 0.4);
		font-weight: 600;
	}

	/* Controls Section */
	.controls-section {
		margin-bottom: 2.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.search-bar-wrapper {
		position: relative;
		display: flex;
		align-items: center;
		width: 100%;
	}

	.search-icon {
		position: absolute;
		left: 1.25rem;
		width: 18px;
		height: 18px;
		color: rgba(255, 255, 255, 0.4);
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 14px;
		padding: 1.1rem 3rem 1.1rem 3.2rem;
		color: #fff;
		font-size: 0.95rem;
		font-family: inherit;
		transition: all 0.25s ease;
	}

	.search-input:focus {
		outline: none;
		border-color: rgba(255, 255, 255, 0.4);
		background: rgba(255, 255, 255, 0.06);
		box-shadow: 0 0 20px rgba(255, 255, 255, 0.06);
	}

	.search-input::placeholder {
		color: rgba(255, 255, 255, 0.35);
	}

	.clear-btn {
		position: absolute;
		right: 1.25rem;
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.5);
		font-size: 1.1rem;
		cursor: pointer;
		padding: 0.2rem;
	}

	.clear-btn:hover {
		color: #fff;
	}

	/* Category Tabs */
	.category-tabs {
		display: flex;
		gap: 0.6rem;
		flex-wrap: wrap;
	}

	.tab-btn {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.08);
		color: rgba(255, 255, 255, 0.6);
		padding: 0.6rem 1.1rem;
		border-radius: 10px;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		transition: all 0.2s ease;
	}

	.tab-btn:hover {
		color: #fff;
		background: rgba(255, 255, 255, 0.07);
	}

	.tab-btn.active {
		background: #fff;
		color: #000;
		border-color: #fff;
		font-weight: 700;
	}

	.tab-count {
		font-size: 0.72rem;
		padding: 0.1rem 0.45rem;
		border-radius: 9999px;
		background: rgba(255, 255, 255, 0.1);
	}

	.tab-btn.active .tab-count {
		background: rgba(0, 0, 0, 0.15);
	}

	/* Tag Scroller */
	.tags-scroller {
		display: flex;
		gap: 0.5rem;
		overflow-x: auto;
		padding-bottom: 0.4rem;
		scrollbar-width: thin;
		scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
	}

	.tag-pill {
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.06);
		color: rgba(255, 255, 255, 0.5);
		padding: 0.35rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		white-space: nowrap;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.tag-pill:hover {
		color: #fff;
		border-color: rgba(255, 255, 255, 0.2);
	}

	.tag-pill.active {
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 255, 255, 0.35);
		color: #fff;
		font-weight: 600;
	}

	/* Notes Grid */
	.notes-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
		gap: 1.5rem;
	}

	.note-card {
		background: rgba(255, 255, 255, 0.025);
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 18px;
		transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
		display: flex;
		flex-direction: column;
	}

	.note-card:hover {
		background: rgba(255, 255, 255, 0.045);
		border-color: rgba(255, 255, 255, 0.2);
		transform: translateY(-4px);
		box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
	}

	.card-inner-link {
		padding: 1.75rem;
		display: flex;
		flex-direction: column;
		height: 100%;
		text-decoration: none;
		color: inherit;
		box-sizing: border-box;
	}

	.card-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.category-badge {
		font-size: 0.65rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		padding: 0.3rem 0.65rem;
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

	.reading-time {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.4);
	}

	.note-title {
		font-size: 1.35rem;
		font-weight: 800;
		letter-spacing: -0.02em;
		line-height: 1.25;
		margin: 0 0 0.8rem 0;
		color: #fff;
	}

	.note-desc {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.6);
		line-height: 1.55;
		margin: 0 0 1.25rem 0;
		flex-grow: 1;
	}

	.note-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-bottom: 1.5rem;
	}

	.card-tag {
		font-size: 0.68rem;
		color: rgba(255, 255, 255, 0.45);
		background: rgba(255, 255, 255, 0.03);
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
	}

	.card-tag-more {
		font-size: 0.68rem;
		color: rgba(255, 255, 255, 0.3);
		padding: 0.2rem 0.3rem;
	}

	.card-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 1.1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
		margin-top: auto;
	}

	.updated-date {
		font-size: 0.72rem;
		color: rgba(255, 255, 255, 0.35);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.read-link {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.8rem;
		font-weight: 700;
		color: #fff;
		transition: transform 0.2s ease;
	}

	.arrow-icon {
		width: 14px;
		height: 14px;
		transition: transform 0.2s ease;
	}

	.note-card:hover .read-link {
		color: #69c0ff;
	}

	.note-card:hover .arrow-icon {
		transform: translateX(3px);
	}

	/* Empty State */
	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px dashed rgba(255, 255, 255, 0.1);
		border-radius: 16px;
	}

	.empty-title {
		font-size: 1.25rem;
		font-weight: 700;
		margin: 0 0 0.5rem 0;
	}

	.empty-desc {
		color: rgba(255, 255, 255, 0.5);
		margin: 0 0 1.5rem 0;
		font-size: 0.9rem;
	}

	.reset-filters-btn {
		background: #fff;
		color: #000;
		border: none;
		padding: 0.6rem 1.4rem;
		border-radius: 8px;
		font-weight: 700;
		font-size: 0.85rem;
		cursor: pointer;
	}

	/* Assistant Callout Banner */
	.assistant-callout {
		margin-top: 4rem;
		background: linear-gradient(135deg, rgba(24, 144, 255, 0.08), rgba(114, 46, 209, 0.08));
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 20px;
		padding: 2.25rem 2.5rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 2rem;
	}

	.callout-content {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}

	.callout-icon {
		width: 44px;
		height: 44px;
		flex-shrink: 0;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #fff;
	}

	.callout-icon svg {
		width: 24px;
		height: 24px;
	}

	.callout-text h3 {
		margin: 0 0 0.4rem 0;
		font-size: 1.2rem;
		font-weight: 800;
	}

	.callout-text p {
		margin: 0;
		color: rgba(255, 255, 255, 0.65);
		font-size: 0.9rem;
		line-height: 1.5;
		max-width: 600px;
	}

	.callout-cta {
		flex-shrink: 0;
		background: #fff;
		color: #000;
		border: none;
		padding: 1rem 1.8rem;
		border-radius: 12px;
		font-weight: 800;
		font-size: 0.88rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		transition: all 0.3s ease;
	}

	.callout-cta:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(255, 255, 255, 0.2);
	}

	/* Footer */
	.brain-footer {
		border-top: 1px solid rgba(255, 255, 255, 0.06);
		padding: 3rem 2rem;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		background: #000;
		position: relative;
		z-index: 2;
	}

	.footer-links {
		display: flex;
		gap: 1.5rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.footer-links a {
		color: rgba(255, 255, 255, 0.4);
		text-decoration: none;
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-weight: 600;
		transition: color 0.2s ease;
	}

	.footer-links a:hover {
		color: #fff;
	}

	.copyright {
		color: rgba(255, 255, 255, 0.2);
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		margin: 0;
	}

	@media (max-width: 900px) {
		.assistant-callout {
			flex-direction: column;
			align-items: flex-start;
			padding: 1.75rem;
		}

		.callout-cta {
			width: 100%;
			justify-content: center;
		}

		.notes-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 640px) {
		.top-nav {
			padding: 1rem 1.25rem;
		}

		.brain-container {
			padding: 2rem 1.25rem 4rem;
		}
	}
</style>
