<script>
	import resume from '$lib/resume.json';
	import Section from './Section.svelte';

	const profiles = resume.profiles;
	let submitted = false;
	let loading = false;

	async function handleSubmit(e) {
		e.preventDefault();
		loading = true;
		const formData = new FormData(e.target);
		const data = Object.fromEntries(formData);

		try {
			await fetch('/api/log', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					type: 'direct_contact',
					contactInfo: data
				})
			});
			submitted = true;
		} catch (error) {
			console.error('Failed to send message:', error);
		} finally {
			loading = false;
		}
	}
</script>

<Section title="Contact" id="contact">
	<div class="contact-content">
		<p class="cta">Let's build something extraordinary together.</p>
		
		<div class="contact-grid">
			<div class="contact-form-container">
				{#if submitted}
					<div class="success-msg">
						<h3>Message Sent</h3>
						<p>Thanks for reaching out! Your message has been sent successfully. Andrea will get back to you as soon as possible.</p>
						<button class="reset-btn" on:click={() => submitted = false}>Send another?</button>
					</div>
				{:else}
					<form class="main-contact-form" on:submit={handleSubmit}>
						<div class="input-group">
							<input name="name" placeholder="Your Name" required />
							<input name="email" type="email" placeholder="Your Email" required />
						</div>
						<textarea name="note" placeholder="What's on your mind?" required></textarea>
						<button type="submit" disabled={loading}>
							{loading ? 'Sending...' : 'Send Message ↗'}
						</button>
					</form>
				{/if}
			</div>

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

	.contact-grid {
		display: grid;
		grid-template-columns: 1.5fr 1fr;
		gap: 4rem;
		margin-bottom: 6rem;
	}

	.main-contact-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.input-group {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.main-contact-form input, .main-contact-form textarea {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: #fff;
		padding: 1.2rem;
		border-radius: 12px;
		font-size: 1rem;
		font-family: inherit;
		transition: all 0.3s ease;
	}

	.main-contact-form input:focus, .main-contact-form textarea:focus {
		border-color: rgba(255, 255, 255, 0.3);
		background: rgba(255, 255, 255, 0.05);
		outline: none;
	}

	.main-contact-form textarea {
		height: 150px;
		resize: none;
	}

	.main-contact-form button {
		background: #fff;
		color: #000;
		border: none;
		padding: 1.2rem;
		border-radius: 12px;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
	}

	.main-contact-form button:hover:not(:disabled) {
		transform: translateY(-3px);
		box-shadow: 0 10px 30px rgba(255, 255, 255, 0.2);
	}

	.main-contact-form button:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.success-msg {
		background: rgba(255, 255, 255, 0.03);
		padding: 3rem;
		border-radius: 24px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		text-align: center;
	}

	.success-msg h3 { font-size: 1.5rem; margin-bottom: 1rem; }
	.success-msg p { color: rgba(255, 255, 255, 0.6); margin-bottom: 2rem; line-height: 1.6; }

	.reset-btn {
		background: none;
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: #fff;
		padding: 0.6rem 1.5rem;
		border-radius: 2rem;
		cursor: pointer;
		font-weight: 600;
	}

	.links {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
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

	@media (max-width: 900px) {
		.contact-grid {
			grid-template-columns: 1fr;
			gap: 3rem;
		}
	}

	@media (max-width: 768px) {
		.cta { margin-bottom: 3rem; }
		.input-group { grid-template-columns: 1fr; }
		.success-msg { padding: 2rem; }
	}
</style>
