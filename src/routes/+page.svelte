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
	let scroll = 1;

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
		scroll = 2 * (event.target.scrollTop / event.target.scrollHeight) - 0.5; // top = -0.5, bottom = 0.5
		if (scroll > 0 && rolesInterval != null) {
			clearInterval(rolesInterval);
			role = undefined;
			rolesInterval = null;
		}
		if (scroll < 0 && rolesInterval == null) {
			setRolesInterval();
			role = roles[rolesIndex];
		}
	}

	onDestroy(() => {
		clearInterval(rolesInterval);
	});
</script>

<main on:scroll={handleScroll}>
	<Menu isActive={menu} />
	<Hamburger bind:isActive={menu} />
	<div class="page-one" style="opacity: {scroll > -.25 ? Math.abs(scroll) * 2 : 1}">
		<div></div>
		<Roles {role} />
		<Animations {role} />
		<div></div>
		<Indicator {role} />
		<div></div>
	</div>
	<div class="page-two" style="opacity: {scroll > 0 ? Math.abs(scroll) * 2 : 0}">
		<Projects />
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
		scroll-snap-type: y mandatory;
		/* scroll-behavior: smooth; */
	}

	.page-one {
		scroll-snap-align: start;
		height: 99%;

		display: flex;
		flex-direction: column;
		justify-content: space-evenly;
		align-items: center;

		/* background-color: pink; */
	}

	.page-two {
		position: relative;
		scroll-snap-align: center;
		height: 100%;
		overflow: hidden;
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
