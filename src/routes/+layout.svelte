<script>
	import VisitTracker from '../components/VisitTracker.svelte';
	import OwnerScore from '../components/OwnerScore.svelte';
	import ChatModal from '../components/ChatModal.svelte';
	import { isChatOpen, chatInitialMessage, closeChat } from '$lib/stores/chat';
	import { page } from '$app/stores';

	export let data;

	// Owner mode (marked at /admin): this browser isn't counted or alerted. Its live visit
	// score shows top left instead.
	$: if (typeof window !== 'undefined') window.__siteOwner = !!data?.owner;
</script>

<!-- Both domains serve the site as they are; search engines are told which one is the main address. -->
<svelte:head>
	<link rel="canonical" href={`https://www.andreadecandia.com${$page.url.pathname}`} />
</svelte:head>

{#if data?.owner}
	<OwnerScore />
{/if}

<slot />
<VisitTracker owner={!!data?.owner} />

<ChatModal
	isOpen={$isChatOpen}
	initialMessage={$chatInitialMessage}
	onClose={closeChat}
/>
