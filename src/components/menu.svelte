<script>
	export let isActive = false;

	// function toggleMenu() {
	// 	isActive = !isActive;
	// }
</script>

<div class="menu {isActive ? 'active' : ''}">
	<br />
	<div class="about">
		Dedicated backend developer with broad full stack experience and strong analytical and
		collaborative skills.
	</div>
	<div class="resume">
		<img src="resume.svg" alt="Resume" />
		<span>Resume</span>
	</div>
	<div class="contact">
		<a href="">
			<img src="linkedin-svgrepo-com.svg" alt="linkedin" />
		</a>
		<a href="">
			<img src="mail-svgrepo-com.svg" alt="linkedin" />
		</a>
		<a href="">
			<img src="whatsapp-svgrepo-com.svg" alt="linkedin" />
		</a>
		<a href="">
			<img src="github-svgrepo-com.svg" alt="linkedin" />
		</a>
	</div>
	<br />
</div>

<style>
	.menu {
		background-color: white;
		color: black;
		position: fixed;
		width: 100dvw;
		height: 100dvh;
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		align-items: center;
		z-index: 98;
		left: 100%;
		transition: left 0.5s ease-in-out;
	}

	.about {
		width: 60%;
		max-width: 300px;
		font-size: 1rem;
		text-align: center;
	}

	.menu.active {
		left: 0;
	}

	.menu span {
		font-size: 30px;
	}

	.resume {
		display: flex;
		align-items: center;
		flex-direction: column;
	}

	.resume img {
		height: 8rem;
		width: 8rem;
		margin-inline: 0.5rem;
		padding: 0.3rem;
		box-sizing: border-box;
	}

	.resume span {
		margin-top: 0.5rem;
		font-size: 3rem;
		font-weight: bold;
		color: #f4cc7a;
		/* font-family: Verdana, Geneva, Tahoma, sans-serif; */
		font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif;
		-webkit-text-stroke: 1px black; /* width and color */
	}

	.contact {
		display: flex;
	}

	.contact img {
		height: 3rem;
		width: 3rem;
		margin-inline: 0.5rem;
		padding: 0.3rem;
		box-sizing: border-box;
	}
</style>
