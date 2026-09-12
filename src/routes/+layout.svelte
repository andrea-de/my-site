<script>
	import VisitTracker from '../components/VisitTracker.svelte';
	import ChatModal from '../components/ChatModal.svelte';
	import { isChatOpen, chatInitialMessage, closeChat } from '$lib/stores/chat';
</script>

<slot />
<VisitTracker />

<ChatModal
	isOpen={$isChatOpen}
	initialMessage={$chatInitialMessage}
	onClose={closeChat}
/>
