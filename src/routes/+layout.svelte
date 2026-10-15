<script>
	import VisitTracker from '../components/VisitTracker.svelte';
	import ChatModal from '../components/ChatModal.svelte';
	import { isChatOpen, chatInitialMessage, closeChat } from '$lib/stores/chat';

	export let data;

	// Owner mode (marked at /admin): this browser isn't counted or alerted. The ghost says so.
	$: if (typeof window !== 'undefined') window.__siteOwner = !!data?.owner;
</script>

{#if data?.owner}
	<div class="owner-ghost" title="Owner mode: your visits aren't counted (undo at /admin)" aria-hidden="true">
		<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a8 8 0 0 0-8 8v11.2a.8.8 0 0 0 1.3.6l1.6-1.3 1.7 1.4a.8.8 0 0 0 1 0L11.3 20.5l1.7 1.4a.8.8 0 0 0 1 0l1.7-1.4 1.6 1.3a.8.8 0 0 0 1.3-.6V10a8 8 0 0 0-8-8Zm-3 7.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" /></svg>
	</div>
{/if}

<slot />
<VisitTracker />

<ChatModal
	isOpen={$isChatOpen}
	initialMessage={$chatInitialMessage}
	onClose={closeChat}
/>

<style>
	/* Barely there: a hint for Andrea, invisible to anyone not looking for it. */
	.owner-ghost {
		position: fixed;
		top: 6px;
		left: 6px;
		width: 14px;
		height: 14px;
		color: #fff;
		opacity: 0.16;
		pointer-events: none;
		z-index: 2147483000;
	}

	.owner-ghost svg {
		width: 100%;
		height: 100%;
		display: block;
	}
</style>
