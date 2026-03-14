<script>
	import resume from '$lib/resume.json';
	import Section from './Section.svelte';
</script>

<Section title="Skills" id="skills">
	<div class="skills-grid">
		{#each resume.skills as skillGroup}
			<div class="skill-group">
				<h3 class="group-title">{skillGroup.name}</h3>
				<div class="tags">
					{#each skillGroup.keywords as keyword}
						<span class="tag">{keyword}</span>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</Section>

<style>
	.skills-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 3rem;
	}

	.group-title {
		font-size: 1.2rem;
		font-weight: 700;
		color: #fff;
		margin-bottom: 1.5rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.8rem;
	}

	.tag {
		padding: 0.5rem 1rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.9rem;
		font-weight: 500;
		transition: all 0.3s ease;
	}

	.tag:hover {
		background: #fff;
		color: #000;
		border-color: #fff;
		transform: translateY(-2px);
	}
</style>
