<script>
	import Section from './Section.svelte';

	const domains = [
		{
			icon: '🛠️',
			title: 'Tools & Harnesses',
			count: '7 Blueprints',
			desc: 'Autonomous agent loops, deterministic media pipelines, and zero-quota store deployers.',
			links: [
				{ title: 'AI Dev Harnesses', slug: 'tools/agentic-development-harnesses', badge: 'Dev Multiplier' },
				{ title: 'Deterministic Media Engine', slug: 'tools/media-harnesses', badge: 'Automated Creative' },
				{ title: 'Zero-Quota Store Deployers', slug: 'tools/store-publishers', badge: 'asc.mjs / play.mjs' },
				{ title: 'Discord Agentic Chat-Ops', slug: 'tools/discord-agent-gateway', badge: 'Realtime Relay' }
			]
		},
		{
			icon: '📐',
			title: 'Architecture & Systems',
			count: '5 Blueprints',
			desc: 'Full-lifecycle CI/CD, real-time agent-UI streaming protocols, and local-first foundations.',
			links: [
				{ title: 'Full-Lifecycle Pipelines', slug: 'architecture/full-lifecycle-pipelines', badge: 'Concept to Store' },
				{ title: 'Agent-UI Protocols', slug: 'architecture/agent-ui-protocols', badge: 'SSE / Live Stream' },
				{ title: 'Local-First Mobile Systems', slug: 'architecture/local-first-mobile-systems', badge: 'Room / SQLite' },
				{ title: 'Multi-Agent Orchestration', slug: 'architecture/multi-agent-systems', badge: 'MCP Loops' }
			]
		},
		{
			icon: '📦',
			title: 'Shipped Products',
			count: '8 Blueprints',
			desc: 'Production web apps, mobile apps, and game engines delivering zero-to-one experiences.',
			links: [
				{ title: 'GameTsunami', slug: 'products/gametsunami', badge: '🚀 Production' },
				{ title: 'Cruffled', slug: 'products/cruffled', badge: '🚀 Production' },
				{ title: 'Five Card Charlie', slug: 'products/five-card-charlie', badge: '📦 Pre-Release' },
				{ title: 'Square Swaps', slug: 'products/square-godot', badge: '🚀 Production' }
			]
		},
		{
			icon: '🧪',
			title: 'Functional Prototypes',
			count: '4 Blueprints',
			desc: 'Rapid zero-to-one systems validating novel mechanics, AI workflows, and social cooperation.',
			links: [
				{ title: 'InWork Coop Formation', slug: 'prototypes/inwork', badge: '🧪 Prototype' },
				{ title: 'Alpha Foundry', slug: 'prototypes/foundry', badge: '🧪 Prototype' },
				{ title: 'AudioTales Dynamic Audio', slug: 'prototypes/audio-tales', badge: '🧪 Prototype' },
				{ title: 'Fluenics Real-Time Voice', slug: 'prototypes/fluenics', badge: '🧪 Prototype' }
			]
		}
	];
</script>

<Section title="Knowledge Tree" id="tree-spotlight">
	<div class="spotlight-header">
		<div class="eyebrow">DIGITAL GARDEN & ARCHITECTURAL BLUEPRINTS</div>
		<h3 class="headline">Inside the Engineering Brain</h3>
		<p class="subtitle">
			A public 31-node technical library documenting every system trade-off, algorithmic breakthrough, failure post-mortem, and full-lifecycle pipeline in production.
		</p>
	</div>

	<div class="domains-grid">
		{#each domains as domain}
			<div class="domain-card">
				<div class="card-top">
					<div class="domain-header">
						<span class="domain-icon">{domain.icon}</span>
						<div class="domain-title-wrap">
							<h4 class="domain-title">{domain.title}</h4>
							<span class="domain-count">{domain.count}</span>
						</div>
					</div>
					<p class="domain-desc">{domain.desc}</p>
				</div>

				<div class="blueprints-list">
					{#each domain.links as item}
						<a href="/tree/{item.slug}" class="blueprint-item">
							<div class="blueprint-info">
								<span class="blueprint-name">{item.title}</span>
								<span class="blueprint-badge">{item.badge}</span>
							</div>
							<span class="blueprint-arrow">→</span>
						</a>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<div class="spotlight-footer">
		<div class="footer-note">
			<span class="status-dot"></span>
			<span>Standardized executive overview cards, interactive code snippets, and Mermaid diagrams across all 31 notes.</span>
		</div>
		<a href="/tree" class="spotlight-cta">
			<span>Explore Complete Knowledge Tree (31 Notes)</span>
			<span class="arrow">→</span>
		</a>
	</div>
</Section>

<style>
	.spotlight-header {
		margin-bottom: 2.5rem;
	}

	.eyebrow {
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: #818cf8;
		margin-bottom: 0.6rem;
	}

	.headline {
		font-size: clamp(1.8rem, 4vw, 2.5rem);
		font-weight: 800;
		color: #ffffff;
		margin: 0 0 0.8rem 0;
		letter-spacing: -0.02em;
	}

	.subtitle {
		font-size: 1.05rem;
		line-height: 1.6;
		color: rgba(255, 255, 255, 0.65);
		max-width: 780px;
		margin: 0;
	}

	.domains-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2.5rem;
	}

	.domain-card {
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 14px;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		transition: all 0.3s ease;
	}

	.domain-card:hover {
		background: rgba(255, 255, 255, 0.04);
		border-color: rgba(129, 140, 248, 0.3);
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
	}

	.domain-header {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		margin-bottom: 0.8rem;
	}

	.domain-icon {
		font-size: 1.6rem;
		line-height: 1;
	}

	.domain-title-wrap {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.domain-title {
		font-size: 1.15rem;
		font-weight: 700;
		color: #ffffff;
		margin: 0;
		letter-spacing: -0.01em;
	}

	.domain-count {
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #818cf8;
	}

	.domain-desc {
		font-size: 0.88rem;
		line-height: 1.5;
		color: rgba(255, 255, 255, 0.55);
		margin: 0 0 1.25rem 0;
	}

	.blueprints-list {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		border-top: 1px solid rgba(255, 255, 255, 0.05);
		padding-top: 1rem;
	}

	.blueprint-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0.65rem;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid transparent;
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.blueprint-item:hover {
		background: rgba(99, 102, 241, 0.08);
		border-color: rgba(129, 140, 248, 0.2);
		transform: translateX(3px);
	}

	.blueprint-info {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		flex-wrap: wrap;
	}

	.blueprint-name {
		font-size: 0.85rem;
		font-weight: 600;
		color: #e2e8f0;
	}

	.blueprint-badge {
		font-size: 0.68rem;
		padding: 0.15rem 0.45rem;
		border-radius: 4px;
		background: rgba(255, 255, 255, 0.06);
		color: rgba(255, 255, 255, 0.5);
		font-weight: 500;
	}

	.blueprint-item:hover .blueprint-name {
		color: #ffffff;
	}

	.blueprint-item:hover .blueprint-badge {
		background: rgba(99, 102, 241, 0.2);
		color: #c7d2fe;
	}

	.blueprint-arrow {
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.3);
		transition: transform 0.2s ease, color 0.2s ease;
	}

	.blueprint-item:hover .blueprint-arrow {
		color: #818cf8;
		transform: translateX(2px);
	}

	.spotlight-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
	}

	.footer-note {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.5);
		max-width: 550px;
		line-height: 1.4;
	}

	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #10b981;
		box-shadow: 0 0 10px rgba(16, 185, 129, 0.6);
		flex-shrink: 0;
	}

	.spotlight-cta {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.85rem 1.75rem;
		background: #ffffff;
		color: #000000;
		border-radius: 8px;
		font-weight: 700;
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		text-decoration: none;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px rgba(255, 255, 255, 0.1);
	}

	.spotlight-cta:hover {
		background: #e2e8f0;
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(255, 255, 255, 0.2);
	}

	.spotlight-cta .arrow {
		transition: transform 0.2s ease;
	}

	.spotlight-cta:hover .arrow {
		transform: translateX(4px);
	}

	@media (max-width: 768px) {
		.domains-grid {
			grid-template-columns: 1fr;
			gap: 1.25rem;
		}

		.domain-card {
			padding: 1.25rem;
		}

		.spotlight-footer {
			flex-direction: column;
			align-items: stretch;
			text-align: center;
			gap: 1.25rem;
		}

		.footer-note {
			justify-content: center;
			text-align: left;
		}

		.spotlight-cta {
			width: 100%;
			justify-content: center;
			padding: 0.85rem 1.25rem;
			box-sizing: border-box;
		}
	}
</style>
