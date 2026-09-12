<script>
	import { onMount, tick } from 'svelte';
	import { emitVisitEvent } from '$lib/visit-events';
	import { chatSuggestions } from '$lib/chat-prompts';
	import { streamAssistantReply, requestAssistantReply, submitDirectContact, syncChatSession } from '$lib/chat-modal/api';
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
	import VoiceModeView from './chat/VoiceModeView.svelte';
	import { chatMessages, isVoiceEnabled, isVoiceModeActive, selectedVoice, exitVoiceMode, enterVoiceMode } from '$lib/stores/chat';
	import { playVoice, stopVoice, SentenceChunker, audioStreamQueue } from '$lib/chat-modal/voice';

	export let isOpen = false;
	export let onClose = () => {};
	export let initialMessage = null;

	let messages = $chatMessages || INITIAL_CHAT_MESSAGES;

	$: if (messages && messages.length > 0) {
		chatMessages.set(messages);
	}
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

		stopVoice();

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
		const assistantMsg = {
			role: 'assistant',
			content: '',
			thoughts: '',
			toolSteps: [],
			sources: [],
			isStreaming: true,
			startTime: Date.now(),
			durationMs: 0
		};

		messages = [...nextMessages, assistantMsg];
		inputMessage = '';
		isComposerExpanded = false;
		resetSuggestedDraft();
		isLoading = true;
		scrollToBottom();
		resetIdleTimer();

		let sentenceChunker = null;
		if ($isVoiceEnabled || $isVoiceModeActive) {
			sentenceChunker = new SentenceChunker((chunk) => {
				audioStreamQueue.enqueue(chunk, $selectedVoice);
			});
		}

		try {
			await streamAssistantReply(nextMessages, {
				onThought(delta) {
					assistantMsg.thoughts += delta;
					messages = [...messages];
					scrollToBottom();
				},
				onToolCall(call) {
					assistantMsg.toolSteps = [
						...assistantMsg.toolSteps,
						{ tool: call.tool, args: call.args, status: 'running' }
					];
					messages = [...messages];
					scrollToBottom();
				},
				onToolResult(res) {
					const runningIdx = assistantMsg.toolSteps.findIndex(
						(s) => s.tool === res.tool && s.status === 'running'
					);
					if (runningIdx !== -1) {
						assistantMsg.toolSteps[runningIdx].status = 'done';
						assistantMsg.toolSteps[runningIdx].result = res;
					} else {
						assistantMsg.toolSteps.push({ tool: res.tool, status: 'done', result: res });
					}
					messages = [...messages];
					scrollToBottom();
				},
				onContent(delta) {
					assistantMsg.content += delta;
					messages = [...messages];
					scrollToBottom();
					if (sentenceChunker) {
						sentenceChunker.push(delta);
					}
				},
				onDone(data) {
					assistantMsg.sources = data.sources || [];
					assistantMsg.warning = data.warning || null;
					assistantMsg.isStreaming = false;
					assistantMsg.durationMs = Date.now() - assistantMsg.startTime;
					messages = [...messages];
					scrollToBottom();

					if (sentenceChunker) {
						sentenceChunker.flush();
					}
				},
				onError(err) {
					console.warn('SSE stream error:', err);
				}
			});
		} catch (e) {
			console.error('Chat error:', e);
			if (!assistantMsg.content) {
				assistantMsg.content = "Andrea is a Senior Product Engineer and Systems Architect specializing in autonomous multi-agent systems, cross-platform mobile apps, and real-time streaming protocols.";
				assistantMsg.warning = 'Personal message threshold reached for today. Running in offline Knowledge Tree mode.';
			}
		} finally {
			assistantMsg.isStreaming = false;
			if (!assistantMsg.durationMs) {
				assistantMsg.durationMs = Date.now() - assistantMsg.startTime;
			}
			messages = [...messages];
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
		stopVoice();
		exitVoiceMode();
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

<ChatModalShell {isOpen} isComposerExpanded={$isVoiceModeActive ? false : isComposerExpanded} onClose={handleClose}>
	{#if $isVoiceModeActive}
		<VoiceModeView
			{messages}
			{isLoading}
			on:send={(event) => sendMessage(event.detail)}
			on:speechTurn={(event) => {
				const { user, assistant, sources } = event.detail;
				if (user && assistant && user.length >= 2 && assistant.length >= 2) {
					messages = [
						...messages,
						{ role: 'user', content: user },
						{ role: 'assistant', content: assistant, sources: sources || [] }
					];
					syncSession();
				}
			}}
			on:switchtotext={exitVoiceMode}
			on:close={handleClose}
		/>
	{:else}
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
			on:startlivechat={enterVoiceMode}
			on:input={(event) => handleComposerInput(event.detail)}
			on:keydown={(event) => handleComposerKeydown(event.detail)}
			on:suggest={writeSuggestedDraft}
			on:toggleexpand={toggleComposerExpanded}
			on:send={() => sendMessage()}
		/>
	{/if}
</ChatModalShell>
