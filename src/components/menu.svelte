<script>
	export let isActive = false;

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
		gap: 2rem;
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
