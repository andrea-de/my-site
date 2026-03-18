<script>
	import { onMount, tick } from 'svelte';
	import { emitVisitEvent } from '$lib/visit-events';
	import { chatSuggestions } from '$lib/chat-prompts';
	import { requestAssistantReply, submitDirectContact, syncChatSession } from '$lib/chat-modal/api';
	import { syncComposerHeight } from '$lib/chat-modal/composer';
	import { CHAT_CHAR_LIMIT, INITIAL_CHAT_MESSAGES } from '$lib/chat-modal/constants';
	import {
		createUserMessage,
		normalizeInitialMessage,
		resolveMessageSource
	} from '$lib/chat-modal/messages';
	import ChatComposer from './chat/ChatComposer.svelte';
	import ChatModalHeader from './chat/ChatModalHeader.svelte';
	import ChatMessageList from './chat/ChatMessageList.svelte';
	import ChatModalShell from './chat/ChatModalShell.svelte';

	export let isOpen = false;
	export let onClose = () => {};
	export let initialMessage = null;

	let messages = INITIAL_CHAT_MESSAGES;
	let inputMessage = '';
	let isLoading = false;
	let scrollContainer;
	let textareaElement;
	let contactSubmitted = false;
	let contactData = null;
	let lastSyncedCount = 1;
	let idleTimer;
	let suggestionIndex = 0;
	let suggestedDraft = '';
	let suggestedDraftPristine = false;
	let isComposerExpanded = false;
	let composerLineCount = 1;

	function resetSuggestedDraft() {
		suggestedDraft = '';
		suggestedDraftPristine = false;
	}

	async function scrollToBottom() {
		await tick();
		if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;
	}

	function updateComposerLayout() {
		composerLineCount = syncComposerHeight(textareaElement, isComposerExpanded);
	}

	function handleComposerInput(value) {
		inputMessage = value;
		if (suggestedDraftPristine && inputMessage !== suggestedDraft) {
			suggestedDraftPristine = false;
		}
	}

	function writeSuggestedDraft() {
		const nextSuggestion = chatSuggestions[suggestionIndex];
		if (!nextSuggestion) return;

		inputMessage = nextSuggestion.prompt;
		suggestedDraft = nextSuggestion.prompt;
		suggestedDraftPristine = true;
		suggestionIndex = (suggestionIndex + 1) % chatSuggestions.length;
		tick().then(() => {
			updateComposerLayout();
			textareaElement?.focus();
		});
	}

	function toggleComposerExpanded() {
		isComposerExpanded = !isComposerExpanded;
		tick().then(() => {
			updateComposerLayout();
			textareaElement?.focus();
		});
	}

	async function sendMessage(text = null, source = null) {
		const hasExplicitText = typeof text === 'string';
		const messageToSend = hasExplicitText ? text.trim() : inputMessage.trim();
		if (!messageToSend || isLoading) return;

		const messageSource = resolveMessageSource({
			hasExplicitText,
			providedSource: source,
			messageToSend,
			suggestedDraft,
			suggestedDraftPristine
		});

		const userMessage = createUserMessage(messageToSend, messageSource);
		emitVisitEvent('visit:chat_message', { length: messageToSend.length });

		const nextMessages = [...messages, userMessage];
		messages = nextMessages;
		inputMessage = '';
		isComposerExpanded = false;
		resetSuggestedDraft();
		isLoading = true;
		scrollToBottom();
		resetIdleTimer();

		try {
			const content = await requestAssistantReply(nextMessages);
			if (content) {
				messages = [...nextMessages, { role: 'assistant', content }];
			}
		} catch {
			messages = [
				...nextMessages,
				{ role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }
			];
		} finally {
			isLoading = false;
			scrollToBottom();
		}
	}

	function syncSession(isClosing = false) {
		if (messages.length <= lastSyncedCount && !contactData) return;

		syncChatSession({
			messages,
			contactInfo: contactData,
			type: isClosing ? 'final_sync' : 'heartbeat'
		});

		lastSyncedCount = messages.length;
	}

	function resetIdleTimer() {
		clearTimeout(idleTimer);
		idleTimer = setTimeout(() => syncSession(), 180000);
	}

	function handleContactSubmit(contactInfo) {
		contactData = contactInfo;
		contactSubmitted = true;
		submitDirectContact(contactInfo);
		emitVisitEvent('visit:contact_submit', { source: 'chat_modal' });
		messages = [
			...messages,
			{
				role: 'assistant',
				content: "Got it! I've sent your info to Andrea. Feel free to continue our chat."
			}
		];
		scrollToBottom();
	}

	function handleClose() {
		syncSession(true);
		isComposerExpanded = false;
		resetSuggestedDraft();
		onClose();
	}

	function handleComposerKeydown(event) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	onMount(() => {
		const handleVisibilityChange = () => {
			if (document.visibilityState === 'hidden') syncSession();
		};

		window.addEventListener('visibilitychange', handleVisibilityChange);
		return () => window.removeEventListener('visibilitychange', handleVisibilityChange);
	});

	$: currentSuggestion = chatSuggestions[suggestionIndex];
	$: hasUserMessages = messages.some((message) => message.role === 'user');
	$: showExpandButton = isComposerExpanded || inputMessage.length > 100 || composerLineCount > 2;
	$: if (isOpen && initialMessage) {
		const nextInitialMessage = normalizeInitialMessage(initialMessage);
		initialMessage = null;
		if (nextInitialMessage?.text) {
			tick().then(() => sendMessage(nextInitialMessage.text, nextInitialMessage.source));
		}
	}
	$: if (isOpen) {
		inputMessage;
		isComposerExpanded;
		tick().then(updateComposerLayout);
	}
	$: if (isOpen) scrollToBottom();
</script>

<ChatModalShell {isOpen} {isComposerExpanded} onClose={handleClose}>
	<ChatModalHeader {isLoading} onClose={handleClose} />
	<ChatMessageList
		{messages}
		{isLoading}
		{contactSubmitted}
		bind:scrollContainer
		on:contactsubmit={(event) => handleContactSubmit(event.detail)}
	/>
	<ChatComposer
		bind:textareaElement
		{inputMessage}
		{isLoading}
		charLimit={CHAT_CHAR_LIMIT}
		isExpanded={isComposerExpanded}
		{hasUserMessages}
		{currentSuggestion}
		{showExpandButton}
		on:input={(event) => handleComposerInput(event.detail)}
		on:keydown={(event) => handleComposerKeydown(event.detail)}
		on:suggest={writeSuggestedDraft}
		on:toggleexpand={toggleComposerExpanded}
		on:send={() => sendMessage()}
	/>
</ChatModalShell>
