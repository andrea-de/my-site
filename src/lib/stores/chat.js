import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { INITIAL_CHAT_MESSAGES } from '$lib/chat-modal/constants';

const STORAGE_KEY_OPEN = 'my_site_chat_open';
const STORAGE_KEY_MESSAGES = 'my_site_chat_messages';
const STORAGE_KEY_INTERACTED = 'my_site_chat_interacted';
const STORAGE_KEY_NUDGE_DISMISSED = 'my_site_chat_nudge_dismissed';
const STORAGE_KEY_VOICE_ENABLED = 'my_site_chat_voice_enabled';

function getInitialVoiceEnabled() {
	if (!browser) return false;
	try {
		return localStorage.getItem(STORAGE_KEY_VOICE_ENABLED) === 'true';
	} catch {
		return false;
	}
}

function getInitialOpen() {
	if (!browser) return false;
	try {
		return localStorage.getItem(STORAGE_KEY_OPEN) === 'true';
	} catch {
		return false;
	}
}

function getInitialMessages() {
	if (!browser) return INITIAL_CHAT_MESSAGES;
	try {
		const stored = localStorage.getItem(STORAGE_KEY_MESSAGES);
		if (stored) {
			const parsed = JSON.parse(stored);
			if (Array.isArray(parsed) && parsed.length > 0) return parsed;
		}
	} catch (e) {
		console.warn('Failed to parse stored chat messages:', e);
	}
	return INITIAL_CHAT_MESSAGES;
}

function getInitialInteracted() {
	if (!browser) return false;
	try {
		if (localStorage.getItem(STORAGE_KEY_INTERACTED) === 'true') return true;
		const stored = localStorage.getItem(STORAGE_KEY_MESSAGES);
		if (stored) {
			const parsed = JSON.parse(stored);
			if (Array.isArray(parsed) && parsed.some((m) => m.role === 'user')) return true;
		}
	} catch {}
	return false;
}

function getInitialNudgeDismissed() {
	if (!browser) return false;
	try {
		return localStorage.getItem(STORAGE_KEY_NUDGE_DISMISSED) === 'true';
	} catch {
		return false;
	}
}

const STORAGE_KEY_VOICE = 'my_site_chat_voice';

export const isChatOpen = writable(getInitialOpen());
export const chatInitialMessage = writable(null);
export const chatMessages = writable(getInitialMessages());
export const hasInteractedWithChat = writable(getInitialInteracted());
export const isChatNudgeDismissed = writable(getInitialNudgeDismissed());
export const isVoiceEnabled = writable(getInitialVoiceEnabled());
export const isVoiceModeActive = writable(false);
export const selectedVoice = writable('Aoede');

if (browser) {
	try {
		localStorage.setItem(STORAGE_KEY_VOICE, 'Aoede');
	} catch {}

	isChatOpen.subscribe((open) => {
		try {
			localStorage.setItem(STORAGE_KEY_OPEN, String(open));
			if (open) {
				hasInteractedWithChat.set(true);
			}
		} catch {}
	});

	isVoiceEnabled.subscribe((enabled) => {
		try {
			localStorage.setItem(STORAGE_KEY_VOICE_ENABLED, String(enabled));
		} catch {}
	});

	selectedVoice.subscribe(() => {
		try {
			localStorage.setItem(STORAGE_KEY_VOICE, 'Aoede');
		} catch {}
	});

	hasInteractedWithChat.subscribe((interacted) => {
		try {
			if (interacted) {
				localStorage.setItem(STORAGE_KEY_INTERACTED, 'true');
			}
		} catch {}
	});

	isChatNudgeDismissed.subscribe((dismissed) => {
		try {
			if (dismissed) {
				localStorage.setItem(STORAGE_KEY_NUDGE_DISMISSED, 'true');
			}
		} catch {}
	});

	chatMessages.subscribe((msgs) => {
		try {
			if (Array.isArray(msgs)) {
				localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(msgs));
				if (msgs.some((m) => m.role === 'user')) {
					hasInteractedWithChat.set(true);
				}
			}
		} catch {}
	});
}

export function toggleVoiceEnabled() {
	isVoiceEnabled.update((val) => !val);
}

export function openChat(prompt = null) {
	if (prompt) {
		chatInitialMessage.set(prompt);
	}
	isChatOpen.set(true);
}

export function closeChat() {
	isChatOpen.set(false);
}

export function toggleChat(prompt = null) {
	if (prompt) {
		chatInitialMessage.set(prompt);
		isChatOpen.set(true);
	} else {
		isChatOpen.update((open) => !open);
	}
}

export function clearChat() {
	chatMessages.set(INITIAL_CHAT_MESSAGES);
}

export function dismissChatNudge() {
	isChatNudgeDismissed.set(true);
}

export function enterVoiceMode() {
	isVoiceModeActive.set(true);
	isVoiceEnabled.set(true);
	isChatOpen.set(true);
}

export function exitVoiceMode() {
	isVoiceModeActive.set(false);
}

export function toggleVoiceMode() {
	isVoiceModeActive.update((active) => {
		const next = !active;
		if (next) {
			isVoiceEnabled.set(true);
			isChatOpen.set(true);
		}
		return next;
	});
}
