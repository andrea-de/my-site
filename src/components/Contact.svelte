<script>
	import resume from '$lib/resume.json';
	import Section from './Section.svelte';

	const profiles = resume.profiles;
</script>

<Section title="Contact" id="contact">
	<div class="contact-content">
		<p class="cta">Let's build something extraordinary together.</p>
		
		<div class="links">
			<a href="mailto:{resume.email}" class="contact-link">
				<span class="label">Email</span>
				<span class="value">{resume.email}</span>
			</a>
			
			{#each profiles as profile}
				<a href={profile.url} target="_blank" class="contact-link">
					<span class="label">{profile.network}</span>
					<span class="value">@{profile.username}</span>
				</a>
			{/each}
		</div>

		<footer class="footer">
			<p>&copy; {new Date().getFullYear()} {resume.name}. All Rights Reserved.</p>
		</footer>
	</div>
</Section>

<style>
	.contact-content {
		text-align: left;
	}

	.cta {
		font-size: clamp(1.5rem, 4vw, 2.5rem);
		color: #fff;
		font-weight: 800;
		margin-bottom: 4rem;
		max-width: 600px;
		line-height: 1.1;
		letter-spacing: -0.02em;
	}

	.links {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
		margin-bottom: 6rem;
	}

	.contact-link {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: 1.5rem;
		background: rgba(255, 255, 255, 0.02);
		border-radius: 12px;
		text-decoration: none;
		border: 1px solid rgba(255, 255, 255, 0.05);
		transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
	}

	.contact-link:hover {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.2);
		transform: translateY(-4px);
	}

	.label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: rgba(255, 255, 255, 0.3);
		font-weight: 700;
	}

	.value {
		font-size: 1.1rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.8);
	}

	.footer {
		padding-top: 4rem;
		border-top: 1px solid rgba(255, 255, 255, 0.05);
		color: rgba(255, 255, 255, 0.2);
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	@media (max-width: 768px) {
		.cta {
			margin-bottom: 3rem;
		}

		.links {
			grid-template-columns: 1fr;
			gap: 1rem;
			margin-bottom: 4rem;
		}

		.contact-link {
			padding: 1.2rem;
		}

		.value {
			font-size: 1rem;
		}
	}
</style>
