<script>
	import { onMount } from 'svelte';
	import resume from '$lib/resume.json';
	import Section from './Section.svelte';

	let activeIndex = -1;

	onMount(() => {
		const observer = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					activeIndex = parseInt(entry.target.getAttribute('data-index'));
				}
			});
		}, {
			threshold: 0.7,
			rootMargin: '-10% 0px -10% 0px'
		});

		document.querySelectorAll('.job-card').forEach(card => observer.observe(card));
		return () => observer.disconnect();
	});
</script>

<Section title="Experience" id="experience">
	<div class="timeline-container">
		<div class="timeline-line"></div>
		
		{#each resume.work as job, i}
			<div class="job-card" class:active={i === activeIndex} data-index={i}>
				<div class="timeline-node"></div>
				<div class="card-content">
					<div class="card-header">
						<div class="job-identity">
							<h3 class="position">{job.position}</h3>
							<h4 class="company">{job.name}</h4>
						</div>
						<div class="date-tag">
							{job.startDate} — {job.endDate || 'Present'}
						</div>
					</div>
					
					<ul class="highlights">
						{#each job.highlights as highlight}
							<li>{highlight}</li>
						{/each}
					</ul>
				</div>
			</div>
		{/each}
	</div>
</Section>

<style>
	.timeline-container {
		position: relative;
		padding-left: 3rem;
		display: flex;
		flex-direction: column;
		gap: 4rem;
	}

	.timeline-line {
		position: absolute;
		left: 7px;
		top: 0;
		bottom: 0;
		width: 2px;
		background: linear-gradient(
			to bottom,
			rgba(255, 255, 255, 0.2) 0%,
			rgba(255, 255, 255, 0.05) 100%
		);
	}

	.job-card {
		position: relative;
		transition: all 0.4s ease;
	}

	.timeline-node {
		position: absolute;
		left: -3rem;
		top: 0.5rem;
		width: 16px;
		height: 16px;
		background: #000;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		z-index: 2;
		transition: all 0.3s ease;
	}

	.job-card:hover .timeline-node,
	.job-card.active .timeline-node {
		background: #fff;
		border-color: #fff;
		box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
		transform: scale(1.2);
	}

	.card-content {
		padding: 2rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
	}

	.job-card:hover .card-content,
	.job-card.active .card-content {
		background: rgba(255, 255, 255, 0.04);
		border-color: rgba(255, 255, 255, 0.15);
		transform: translateX(10px);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
		gap: 1.5rem;
	}

	.position {
		font-size: 1.6rem;
		font-weight: 800;
		color: #fff;
		margin: 0;
		letter-spacing: -0.01em;
	}

	.company {
		font-size: 1rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.5);
		margin: 0.4rem 0 0 0;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.date-tag {
		font-size: 0.85rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.4);
		background: rgba(255, 255, 255, 0.05);
		padding: 0.4rem 1rem;
		border-radius: 2rem;
		white-space: nowrap;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.highlights {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.highlights li {
		color: rgba(255, 255, 255, 0.7);
		line-height: 1.7;
		padding-left: 1.5rem;
		position: relative;
		font-size: 1.05rem;
	}

	.highlights li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.7rem;
		width: 4px;
		height: 4px;
		background: rgba(255, 255, 255, 0.3);
		border-radius: 50%;
	}

	@media (max-width: 768px) {
		.timeline-container {
			padding-left: 2rem;
			gap: 3rem;
		}
		
		.timeline-line {
			left: 4px;
		}

		.timeline-node {
			left: -2rem;
			width: 12px;
			height: 12px;
		}

		.card-header {
			flex-direction: column;
			gap: 1rem;
		}

		.position {
			font-size: 1.3rem;
		}

		.job-card.active .card-content {
			transform: translateX(5px);
		}
	}
</style>
