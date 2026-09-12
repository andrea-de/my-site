<script>
	import { tick } from 'svelte';
	import { emitVisitEvent } from '$lib/visit-events';
	import Hero from '../components/Hero.svelte';
	import Experience from '../components/Experience.svelte';
	import Software from '../components/Software.svelte';
	import KnowledgeTreeSpotlight from '../components/KnowledgeTreeSpotlight.svelte';
	import Skills from '../components/Skills.svelte';
	import Contact from '../components/Contact.svelte';
	import Hamburger from '../components/hamburger.svelte';
	import Menu from '../components/menu.svelte';
	import AIButton from '../components/AIButton.svelte';
	import ChatNudge from '../components/ChatNudge.svelte';
	import ContextTooltip from '../components/ContextTooltip.svelte';
	import {
		isChatOpen,
		chatInitialMessage,
		chatMessages,
		hasInteractedWithChat,
		isChatNudgeDismissed,
		dismissChatNudge as storeDismissChatNudge,
		toggleChat as storeToggleChat
	} from '$lib/stores/chat';

	const MENU_TRANSITION_MS = 320;

	let menuActive = false;
	let scrollY = 0;
	let tooltip = { x: 0, y: 0, isVisible: false, context: '' };
	let hasStartedScrolling = false;
	let showChatNudge = false;
	let hasAgentInteracted = false;
	let chatNudgeDismissed = false;

	$: hasStartedScrolling = scrollY > 10;

	function toggleChat(initialPrompt = null) {
		const willOpen = initialPrompt ? true : !$isChatOpen;

		if (willOpen) {
			emitVisitEvent('visit:chat_open');
			hasAgentInteracted = true;
			menuActive = false;
			tooltip.isVisible = false;
		}

		storeToggleChat(initialPrompt);
	}

	function openSuggestedChat(prompt) {
		toggleChat({ text: prompt.prompt, source: 'suggested' });
	}

	function dismissChatNudge() {
		chatNudgeDismissed = true;
		storeDismissChatNudge();
	}

	async function navigateToSection(id) {
		menuActive = false;
		tooltip.isVisible = false;
		await tick();
		await new Promise((resolve) => setTimeout(resolve, MENU_TRANSITION_MS));

		if (typeof window === 'undefined') return;

		window.history.pushState({}, '', `#${id}`);
		document.getElementById(id)?.scrollIntoView({
			behavior: 'smooth',
			block: 'start'
		});
	}

	function handleGlobalClick(e) {
		const target = e.target.closest('.job-card, .tag');
		if (target) {
			const contextText = target.innerText.split('\n')[0];
			tooltip = {
				x: e.clientX,
				y: e.clientY,
				isVisible: true,
				context: contextText
			};
		} else {
			tooltip.isVisible = false;
		}
	}

	function hideTooltip() {
		tooltip.isVisible = false;
	}

	// Mutual exclusivity: Menu closes chat
	$: if (menuActive) $isChatOpen = false;
	$: if (scrollY) hideTooltip();
	$: hasChattedWithAI =
		$hasInteractedWithChat ||
		hasAgentInteracted ||
		($chatMessages && $chatMessages.some((m) => m.role === 'user'));

	$: showChatNudge =
		hasStartedScrolling &&
		!$isChatOpen &&
		!menuActive &&
		!hasChattedWithAI &&
		!chatNudgeDismissed &&
		!$isChatNudgeDismissed;

	$: if (typeof document !== 'undefined') {
		const isMobile = window.innerWidth <= 768;
		const shouldLock = $isChatOpen && isMobile;
		document.documentElement.classList.toggle('no-scroll', shouldLock);
	}
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@200;400;500;600;700;800;900&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<svelte:window bind:scrollY on:click={handleGlobalClick} />

<main>
	<Menu
		isActive={menuActive}
		onClose={() => (menuActive = false)}
		onNavigate={navigateToSection}
		onChatClick={() => toggleChat()}
	/>
	<Hamburger bind:isActive={menuActive} onChatClick={() => toggleChat()} />
	<AIButton
		isDocked={hasStartedScrolling}
		isMenuActive={menuActive}
		onChatClick={() => toggleChat()}
	/>
	<ChatNudge isVisible={showChatNudge} onOpen={openSuggestedChat} onDismiss={dismissChatNudge} />
	<ContextTooltip
		{...tooltip}
		onClick={() =>
			toggleChat({
				text: `Tell me more about Andrea's experience with ${tooltip.context}.`,
				source: 'ask-agent'
			})}
	/>

	<Hero />
	<Experience />
	<Software
		onChatClick={(project) =>
			toggleChat({
				text: `I want to hear about the ${project} project.`,
				source: 'ask-agent'
			})}
	/>
	<KnowledgeTreeSpotlight />
	<Skills />
	<Contact />
</main>

<style>
	:global(html) {
		scroll-behavior: smooth;
		-webkit-tap-highlight-color: transparent;
	}

	:global(html, body) {
		background-color: #000;
		color: #fff;
		margin: 0;
		padding: 0;
		box-sizing: border-box;
		font-family:
			'Inter',
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			Roboto,
			sans-serif;
		width: 100%;
		overflow-x: hidden;
	}

	:global(html.no-scroll),
	:global(html.no-scroll body) {
		overflow: hidden !important;
		height: 100vh !important;
		height: 100svh !important;
		position: fixed;
		width: 100%;
	}

	:global(*) {
		box-sizing: inherit;
		-webkit-tap-highlight-color: transparent;
	}

	:global(button, a, [role='button']) {
		touch-action: manipulation;
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
