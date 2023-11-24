<script>
	import { onMount } from 'svelte';

	let projects = [
		{
			id: 'story',
			image: 'story.png',
			video: 'story.webm',
			url: 'https://ai-story-fe.vercel.app/',
			name: 'Story AI',
			description: 'Choose you own adventure stories with AI',
			technologies: ['react', 'nextjs', 'openai', 'mongodb atlas', 'vercel']
		},
		{
			id: 'squares',
			image: 'squares.png',
			video: 'squares.webm',
			url: 'https://squares-b05d9.web.app/',
			name: 'Squared Away',
			description: 'Arcade matching type javascript game',
			technologies: ['javascript', 'firebase']
		},
		{
			id: 'weather',
			image: 'weather.png',
			url: 'https://svelte-weather-basic.vercel.app/',
			name: 'My Weather',
			description: 'Themable weather appliction',
			technologies: ['svelte', 'javasctipt', 'vercel']
		},
		{
			id: 'mysite',
			image: 'mysite.png',
			video: 'mysite.webm',
			name: 'My Website',
			url: 'https://my-site-two-sigma.vercel.app/',
			description: 'Cross-platform activity based dating app',
			technologies: ['svelte', 'javasctipt', 'vercel']
		},
		{
			id: 'dating',
			image: 'dating.jpg',
			name: 'Venga',
			description: 'Cross-platform activity based dating app',
			technologies: ['flutter']
		}
		// {
		// 	id: 'crumble',
		// 	name: 'Crumble',
		// 	image: '',
		// 	color: 'red',
		// 	description: 'Daily Crossword Jumble Game',
		// }
	];

	let topProject = projects[0];

	projects = projects.map((project, index) => {
		project.index = index + 1;
		project.offset = (index + 1) * 40;
		return project;
	});

	const newTop = () => {
		if (topProject.video) document.querySelector(`#${topProject.id} video`).pause();
		topProject = projects.find((project) => project.index === 1);
		if (topProject.video) document.querySelector(`#${topProject.id} video`).play();
	};

	const next = () => {
		projects = projects.map((project) => {
			if (project.index == 1) {
				project.offset = 40 * projects.length;
				project.index = projects.length;
			} else {
				project.offset -= 40;
				project.index -= 1;
			}
			return project;
		});
		newTop();
	};

	const prev = () => {
		projects = projects.map((project) => {
			if (project.index == projects.length) {
				project.offset = 40;
				project.index = 1;
			} else {
				project.offset += 40;
				project.index += 1;
			}
			return project;
		});
		newTop();
	};

	let touchStartX, touchStartY;

	function handleTouchStart(event) {
		// if (event.target.tagName != 'A') event.preventDefault(); // Not working
		// event.preventDefault();
		touchStartY = event.touches[0].clientY;
		touchStartX = event.touches[0].clientX;
	}

	function handleTouchEnd(event) {
		if (event.target.tagName === 'A') window.open(event.target.href);
		// if (event.target.tagName != 'A') event.preventDefault(); // Not working
		const touchEndY = event.changedTouches[0].clientY;
		const touchEndX = event.changedTouches[0].clientX;
		const yDelta = touchEndY - touchStartY;
		const xDelta = touchEndX - touchStartX;
		touchStartY = 0;
		touchStartX = 0;

		// Left
		if (xDelta < 0 && Math.abs(xDelta) > 10) {
			next();
		}
		// Right
		else if (xDelta > 10) {
			prev();
		}
	}

	const resize = () => {
		const windowWidth = window.innerWidth;
		if (windowWidth < 500) {
			document.querySelector('.projects').style.transform = `scale(${0.8})`;
		}

		const windowHeight = window.innerHeight;
		document.querySelector('.projects').style.marginTop = ((windowHeight * 2) / 13) ** 1.05 + 'px';
	};

	onMount(() => {
		// Sizing
		window.addEventListener('resize', function () {
			resize();
		});
		resize();

		// Touch Events
		const projects = document.querySelector('.projects');
		projects.addEventListener('touchstart', handleTouchStart);
		projects.addEventListener('touchend', handleTouchEnd);

		// Scroll Events
		let isScrolling = false;
		projects.addEventListener('wheel', function (event) {
			if (!isScrolling) {
				isScrolling = true;
				// Handle scroll wheel event here
				if (event.deltaY > 70) next();
				else if (event.deltaX > 30) next();
				else if (event.deltaX < -30) prev();

				// Debounce logic
				setTimeout(function () {
					isScrolling = false;
				}, 300); // Adjust the debounce time (in milliseconds) as needed
			}
		});

		// Video Insturctions
		const videos = document.querySelectorAll('.project video');
		videos.forEach((/** @type {HTMLVideoElement} */ video) => {
			let observer = new IntersectionObserver((entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting && entry.target.classList.contains(topProject.id)) {
						video.play();
					} else {
						video.pause();
					}
				});
			});
			observer.observe(video);
		});
	});
</script>

<div class="projects">
	<div class="info">
		<button on:click={next}>Next</button>
		<button on:click={prev}>Previous</button>
		{#if topProject.url}
			<a href={topProject.url} target="_blank">
				<h1>{topProject.name}</h1>
			</a>
		{:else}
			<h1>{topProject.name}<span>Link not Available</span></h1>
		{/if}
		<h3 style="text-wrap: nowrap; text-overflow: ellipsis; overflow: hidden;">
			{topProject.description}
		</h3>
		<!-- <br/> -->
		<h4 style="text-wrap: nowrap; text-overflow: ellipsis; overflow: hidden;">
			{topProject.technologies.join(', ')}
		</h4>
	</div>
	{#each projects as project (project.id)}
		<div
			id={project.id.toString()}
			class="project"
			style="
				z-index: {projects.length - project.index + 1}; 
				top: {project.offset}px; 
				left:{project.offset / 2}px; 
				opacity: {project.index < 4 ? 1 : 0};
				background-color: {project.color};
			"
		>
			<img src={project.image} alt="" />
			{#if project.video}
				<video
					muted
					loop
					class={project.id + (project.id === topProject.id ? '' : ' off')}
					src={project.video}
				/>
			{/if}
		</div>
	{/each}
</div>

<style>
	.projects * {
		user-select: none;
	}

	.projects {
		position: sticky;
		width: 410px;
		/* overflow: hidden; */
	}

	.info {
		position: relative;
		width: 95%;
		top: -5em;
		color: white;
	}

	.info button {
		position: relative;
		float: right;
		border-radius: 20px;
		padding-inline: .7em;
		padding-block: .5em;
		box-sizing: border-box;
		margin-inline: .3em;
		right: 0;
		top: -1;
		color: white;
		background-color: black;
	}

	a {
		color: white;
	}
	
	h1 {
		margin-bottom: 0.5rem;
		width: fit-content;
	}

	h1 span {
		font-size: x-small;
		margin-left: 1rem;
		font-style: italic;
	}

	h4 {
		margin-top: 0.2rem;
		font-style: italic;
		font-weight: 300;
	}

	.project {
		position: absolute;
		/* overflow: hidden; */
		align-self: center;
		width: 300px;
		height: 500px;
		border: 10px solid;
		outline: 3px solid silver;
		border-radius: 40px;
		background-size: 100% auto;
		background-repeat: no-repeat;
		transition:
			top 0.5s ease,
			left 0.5s ease,
			z-index 0.5s ease,
			opacity 0.4s ease;
	}

	.project img,
	.project video {
		position: absolute;
		width: 300px;
		height: 500px;
		box-sizing: border-box;
		border-radius: 30px;
		margin-bottom: 10px;
	}

	.project::before {
		content: '|';
		z-index: 10;
		position: absolute;
		top: 70px;
		left: -18px;
		width: 5px;
		height: 50px;
		border-top-left-radius: 10px;
		border-bottom-left-radius: 10px;
		background-color: silver;
		color: silver;
	}

	.project::after {
		content: '|';
		z-index: 10;
		position: absolute;
		top: 140px;
		left: -18px;
		width: 5px;
		height: 80px;
		border-top-left-radius: 10px;
		border-bottom-left-radius: 10px;
		background-color: silver;
		color: silver;
	}
</style>
