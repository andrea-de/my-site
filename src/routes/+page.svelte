<script>
	import { onMount } from 'svelte';
	import Hero from '../components/Hero.svelte';
	import Experience from '../components/Experience.svelte';
	import Software from '../components/Software.svelte';
	import Skills from '../components/Skills.svelte';
	import Contact from '../components/Contact.svelte';
	import Hamburger from '../components/hamburger.svelte';
	import Menu from '../components/menu.svelte';
	import AIButton from '../components/AIButton.svelte';
	import ChatModal from '../components/ChatModal.svelte';
	import ContextTooltip from '../components/ContextTooltip.svelte';

	let menuActive = false;
	let chatOpen = false;
	let chatInitialMessage = '';
	let scrollY = 0;
	let tooltip = { x: 0, y: 0, visible: false, context: '' };

	$: isScrolled = scrollY > 100;

	function toggleChat(initialMsg = '') {
		if (initialMsg) {
			chatInitialMessage = initialMsg;
			chatOpen = true;
		} else {
			chatOpen = !chatOpen;
		}
		
		if (chatOpen) {
			menuActive = false;
			tooltip.visible = false;
		}
	}

	function handleGlobalClick(e) {
		const target = e.target.closest('.job-card, .tag');
		if (target) {
			const contextText = target.innerText.split('\n')[0];
			tooltip = {
				x: e.clientX,
				y: e.clientY,
				visible: true,
				context: contextText
			};
		} else {
			tooltip.visible = false;
		}
	}

	function hideTooltip() { tooltip.visible = false; }

	// Mutual exclusivity: Menu closes chat
	$: if (menuActive) chatOpen = false;
	$: if (scrollY) hideTooltip();

	$: if (typeof document !== 'undefined') {
		const isMobile = window.innerWidth <= 768;
		const shouldLock = menuActive || (chatOpen && isMobile);
		document.documentElement.classList.toggle('no-scroll', shouldLock);
	}
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@200;400;500;600;700;800;900&display=swap" rel="stylesheet">
</svelte:head>

<svelte:window bind:scrollY={scrollY} on:click={handleGlobalClick} />

<main>
	<Menu isActive={menuActive} onChatClick={() => toggleChat()} />
	<Hamburger bind:isActive={menuActive} onChatClick={() => toggleChat()} />
	<AIButton isDocked={isScrolled} isMenuActive={menuActive} onChatClick={() => toggleChat()} />
	<ChatModal isOpen={chatOpen} initialMessage={chatInitialMessage} onClose={() => chatOpen = false} />
	<ContextTooltip 
		{...tooltip} 
		isVisible={tooltip.visible} 
		onClick={() => toggleChat(`Tell me more about Andrea's experience with ${tooltip.context}.`)} 
	/>
	
	<Hero />
	<Experience />
	<Software onChatClick={(project) => toggleChat(`I want to hear about the ${project} project.`)} />
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

	:global(html.no-scroll), :global(html.no-scroll body) {
		overflow: hidden !important;
		height: 100vh !important;
		height: 100svh !important;
		position: fixed;
		width: 100%;
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
