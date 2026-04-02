<script>
	import Section from './Section.svelte';
	import ExternalLink from './svg/ExternalLink.svelte';
	import projectsData from '$lib/context/projects.json';
	import GamesparkDemo from './projects/GamesparkDemo.svelte';
	import CruffledDemo from './projects/CruffledDemo.svelte';

	const projects = projectsData.filter(p => !p.hidden);
</script>

<Section title="Projects" id="projects">
	<div class="projects-grid">
		{#each projects as project}
			<a href={project.url} target="_blank" class="project-card">
				<div class="image-container">
					{#if project.id === 'gamespark'}
						<div class="demo-wrapper">
							<GamesparkDemo />
						</div>
					{:else if project.id === 'cruffled'}
						<div class="demo-wrapper">
							<CruffledDemo />
						</div>
					{:else}
						<img src={project.image} alt={project.name} />
					{/if}
					<div class="overlay">
						<span class="overlay-label">
							<span>View Project</span>
							<ExternalLink size={15} />
						</span>
					</div>
				</div>
				<div class="info">
					<h3 class="name">{project.name}</h3>
					<p class="description">{project.description}</p>
					<div class="tech">
						{#each project.technologies as tech}
							<span class="tech-tag">{tech}</span>
						{/each}
					</div>
				</div>
			</a>
		{/each}
	</div>
</Section>

<style>
	.projects-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2.5rem;
	}

	.project-card {
		background: rgba(255, 255, 255, 0.03);
		border-radius: 12px;
		overflow: hidden;
		text-decoration: none;
		color: inherit;
		border: 1px solid rgba(255, 255, 255, 0.05);
		transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
		display: flex;
		flex-direction: column;
	}

	.project-card:hover {
		transform: translateY(-8px);
		border-color: rgba(255, 255, 255, 0.2);
		background: rgba(255, 255, 255, 0.06);
	}

	.image-container {
		position: relative;
		aspect-ratio: 16 / 9;
		overflow: hidden;
	}

	.image-container img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.6s ease;
	}

	.demo-wrapper {
		width: 100%;
		height: 100%;
		position: absolute;
		inset: 0;
	}

	.project-card:hover img {
		transform: scale(1.05);
	}

	.overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition: opacity 0.3s ease;
		color: #fff;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		z-index: 10;
	}

	.overlay-label {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
	}

	.project-card:hover .overlay {
		opacity: 1;
	}

	.info {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		flex-grow: 1;
	}

	.name {
		font-size: 1.4rem;
		font-weight: 700;
		color: #fff;
		margin: 0 0 0.5rem 0;
	}

	.description {
		font-size: 1rem;
		color: rgba(255, 255, 255, 0.6);
		margin: 0 0 1.5rem 0;
		line-height: 1.5;
	}

	.tech {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: auto;
	}

	.tech-tag {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: rgba(255, 255, 255, 0.4);
		background: rgba(255, 255, 255, 0.05);
		padding: 0.2rem 0.6rem;
		border-radius: 4px;
	}
</style>
