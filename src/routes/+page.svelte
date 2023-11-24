<script>
	import { onDestroy } from 'svelte';
	import Hamburger from '../components/hamburger.svelte';
	import Menu from '../components/menu.svelte';
	import Roles from '../components/Roles.svelte';
	import Animations from '../components/Animations.svelte';
	import Indicator from '../components/Indicator.svelte';
	import Projects from '../components/Projects.svelte';

	const roles = [
		'full stack engineer',
		'web designer',
		'game creator',
		'ai practitioner',
		'application developer',
		'aspiring entrepreneur'
	];

	let role;
	let rolesIndex = 0;
	let rolesInterval = null;
	let menu = false;
	let opacity = 1;

	const setRolesInterval = () => {
		role = roles[rolesIndex];
		rolesInterval = setInterval(() => {
			if (rolesIndex < roles.length - 1) rolesIndex++;
			else rolesIndex = 0;
			role = roles[rolesIndex];
		}, 4000);
	};

	setRolesInterval();

	function handleScroll(event /** @type {UIEvent} */) {
		const scrollTop = event.target.scrollTop;
		// console.log('scrollTop: ', scrollTop);
		opacity = 1 - scrollTop / 250;
		if (opacity <= 0 && rolesInterval != null) {
			clearInterval(rolesInterval);
			role = undefined;
			rolesInterval = null;
		}
		if (opacity > 0 && rolesInterval == null) {
			setRolesInterval();
			role = roles[rolesIndex];
		}
	}

	onDestroy(() => {
		clearInterval(rolesInterval);
	});
</script>

<!-- <main on:scroll={handleScroll}> -->
<main>
	<Menu isActive={menu} />
	<Hamburger bind:isActive={menu} />
	<div class="page-one" style="opacity: {opacity}">
		<div></div>
		<Roles {role} />
		<Animations {role} />
		<div></div>
		<Indicator {role} />
		<div></div>
	</div>
	<div class="page-two">
		<Projects />
		<!-- <div style="width: 50%; height: 60%; background-color: white"></div> -->
	</div>
</main>

<style>

	:global(body, html) {
		overflow: hidden;
		height: 100%;
		width: 100%;
		position: fixed;
	}

	main {
		width: 100%;
		height: 100%;

		overflow: scroll;
		background-color: black;
		/* transition: transform 0.5s ease; */

		scroll-snap-type: y mandatory;
		/* scroll-behavior: smooth; */
	}

	.page-one {
		scroll-snap-align: start;
		height: 100%;

		display: flex;
		flex-direction: column;
		justify-content: space-evenly;
		align-items: center;

		/* background-color: pink; */
	}

	.page-two {
		position: relative;
		scroll-snap-align: end;
		height: 100%;
		box-sizing: border-box;

		display: flex;
		justify-content: center;
		
		/* background-color: skyblue; */
	}

	@media (max-height: 700px) {
		.page-one {
			justify-content: center;
		}
	}
</style>
