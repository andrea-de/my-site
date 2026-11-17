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

	// The canonical address keeps a shareable video's ?video= (src/lib/share-videos.js): it is a
	// different page to a link preview, which may follow the canonical to read its card.
	$: video = $page.url.searchParams.get('video');
	$: canonical = `https://www.andreadecandia.com${$page.url.pathname}${
		video && /^[a-z0-9-]+$/i.test(video) ? `?video=${video.toLowerCase()}` : ''
	}`;
</script>

<!-- Both domains serve the site as they are; search engines are told which one is the main address. -->
<svelte:head>
	<link rel="canonical" href={canonical} />
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
