<script>
	// The home page's look at the knowledge tree: the living graph as a preview (tap a node
	// for its card; the page still scrolls over it), and the way into /tree.
	import Section from './Section.svelte';
	import KnowledgeGraph from './KnowledgeGraph.svelte';
	import manifest from '$lib/brain/manifest.json';

	const count = manifest.nodes.filter((n) => n.category !== 'hub').length;
</script>

<Section title="Knowledge Tree" id="tree-spotlight">
	<div class="spotlight-header">
		<div class="eyebrow">DIGITAL GARDEN & ARCHITECTURAL BLUEPRINTS</div>
		<h3 class="headline">Inside the Engineering Brain</h3>
		<p class="subtitle">
			A public {count}-node technical library documenting every system trade-off, algorithmic breakthrough, failure post-mortem, and full-lifecycle pipeline in production.
		</p>
	</div>

	<div class="graph">
		<KnowledgeGraph nodes={manifest.nodes} mode="preview" />
	</div>

	<div class="spotlight-footer">
		<div class="footer-note">
			<span class="status-dot"></span>
			<span>Standardized executive overview cards, interactive code snippets, and Mermaid diagrams across all {count} notes.</span>
		</div>
		<a href="/tree" class="spotlight-cta">
			<span>Explore Complete Knowledge Tree ({count} Notes)</span>
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

	/* The graph's frame: wide on desktop, most of the screen on phones. */
	.graph {
		height: 540px;
		margin-bottom: 2rem;
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 18px;
		overflow: hidden;
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
		.graph {
			height: min(60svh, 520px);
			margin-left: -1.5rem;
			margin-right: -1.5rem;
			border-radius: 0;
			border-left: 0;
			border-right: 0;
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
