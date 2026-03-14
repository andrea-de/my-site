<script>
	import { onMount } from 'svelte';
	import Hero from '../components/Hero.svelte';
	import Experience from '../components/Experience.svelte';
	import Software from '../components/Software.svelte';
	import Skills from '../components/Skills.svelte';
	import Contact from '../components/Contact.svelte';
	import Hamburger from '../components/hamburger.svelte';
	import Menu from '../components/menu.svelte';

	let menuActive = false;
	let softwareInView = false;

	onMount(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				softwareInView = entry.isIntersecting;
			},
			{ threshold: 0.1 }
		);

		const softwareSection = document.getElementById('software');
		if (softwareSection) observer.observe(softwareSection);

		return () => observer.disconnect();
	});
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@200;400;500;600;700;800;900&display=swap" rel="stylesheet">
</svelte:head>

<main>
	<Menu isActive={menuActive} />
	<Hamburger bind:isActive={menuActive} hideName={softwareInView} />
	
	<Hero />
	<Experience />
	<Software />
	<Skills />
	<Contact />
</main>

<style>
	:global(html) {
		scroll-snap-type: y proximity;
		scroll-behavior: smooth;
	}

	:global(html, body) {
		background-color: #000;
		color: #fff;
		margin: 0;
		padding: 0;
		box-sizing: border-box;
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		width: 100%;
		overflow-x: hidden;
	}

	:global(*) {
		box-sizing: inherit;
	}

	main {
		width: 100%;
		min-height: 100vh;
	}

	:global(::-webkit-scrollbar) {
		width: 8px;
		height: 8px;
	}

	:global(::-webkit-scrollbar-track) {
		background: #000;
	}

	:global(::-webkit-scrollbar-thumb) {
		background: #333;
		border-radius: 4px;
	}

	:global(::-webkit-scrollbar-thumb:hover) {
		background: #444;
	}
</style>
