<script>
	export let isActive = false;
	export let onChatClick = () => {};

	function closeMenu() {
		isActive = false;
	}
</script>

<div class="menu {isActive ? 'active' : ''}">
	<nav class="nav">
		<a href="#experience" on:click={closeMenu}>Experience</a>
		<a href="#software" on:click={closeMenu}>Software</a>
		<a href="#skills" on:click={closeMenu}>Skills</a>
		<a href="#contact" on:click={closeMenu}>Contact</a>
	</nav>

	<div class="footer">
		<button class="ai-menu-btn" on:click={onChatClick}>
			<div class="prism-icon">
				<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="bevel"/>
					<path d="M12 6L13.5 10.5L18 12L13.5 13.5L12 18L10.5 13.5L6 12L10.5 10.5L12 6Z" fill="currentColor" class="inner-prism"/>
				</svg>
			</div>
			<span>Chat with AI Agent</span>
		</button>

		<a class="resume-btn" href="resume.pdf" target="_blank">
			View Resume PDF
		</a>
		<div class="socials">
			<a href="https://www.linkedin.com/in/a-decandia/" target="_blank">LinkedIn</a>
			<a href="https://github.com/andrea-de" target="_blank">GitHub</a>
			<a href="mailto:andy.decandia@gmail.com">Email</a>
		</div>
	</div>
</div>

<style>
	.menu {
		background-color: #000;
		color: #fff;
		position: fixed;
		width: 100vw;
		height: 100vh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		z-index: 98;
		top: 0;
		left: 100%;
		transition: left 0.4s cubic-bezier(0.77, 0, 0.175, 1);
		padding: 2rem;
		box-sizing: border-box;
	}

	.menu.active {
		left: 0;
	}

	.nav {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		text-align: center;
		margin-bottom: 4rem;
	}

	.nav a {
		font-size: clamp(2rem, 8vw, 4rem);
		font-weight: 800;
		text-transform: uppercase;
		text-decoration: none;
		color: #fff;
		transition: all 0.3s ease;
		letter-spacing: -0.02em;
	}

	.nav a:hover {
		color: #888;
		transform: scale(1.05);
	}

	.footer {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
	}

	.ai-menu-btn {
		background: #fff;
		color: #000;
		border: none;
		padding: 1rem 2rem;
		border-radius: 3rem;
		font-weight: 800;
		font-size: 0.9rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 1rem;
		transition: all 0.3s ease;
		width: 100%;
		max-width: 280px;
		justify-content: center;
	}

	.ai-menu-btn:hover {
		transform: scale(1.05);
		box-shadow: 0 10px 30px rgba(255, 255, 255, 0.2);
	}

	.prism-icon {
		width: 1.2rem;
		height: 1.2rem;
		animation: rotatePrism 8s infinite linear;
	}

	@keyframes rotatePrism {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.inner-prism {
		animation: pulseInner 2s infinite ease-in-out;
	}

	@keyframes pulseInner {
		0%, 100% { opacity: 0.4; transform: scale(0.8); }
		50% { opacity: 1; transform: scale(1); }
	}

	.resume-btn {
		padding: 1rem 2rem;
		border: 1px solid #fff;
		color: #fff;
		text-decoration: none;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-weight: 600;
		transition: all 0.3s ease;
	}

	.resume-btn:hover {
		background: #fff;
		color: #000;
	}

	.socials {
		display: flex;
		gap: 1.5rem;
	}

	.socials a {
		color: rgba(255, 255, 255, 0.5);
		text-decoration: none;
		font-size: 0.9rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.socials a:hover {
		color: #fff;
	}
</style>
