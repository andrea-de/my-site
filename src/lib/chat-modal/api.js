export async function streamAssistantReply(
	messages,
	{ onThought, onToolCall, onToolResult, onContent, onDone, onError }
) {
	const response = await fetch('/api/chat', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ messages })
	});

	if (!response.ok || !response.body) {
		throw new Error(`Chat request failed with status: ${response.status}`);
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;

		buffer += decoder.decode(value, { stream: true });
		const blocks = buffer.split('\n\n');
		buffer = blocks.pop() || '';

		for (const block of blocks) {
			const lines = block.split('\n');
			let event = 'message';
			let dataStr = '';

			for (const line of lines) {
				if (line.startsWith('event:')) {
					event = line.slice(6).trim();
				} else if (line.startsWith('data:')) {
					dataStr = line.slice(5).trim();
				}
			}

			if (!dataStr) continue;

			try {
				const parsed = JSON.parse(dataStr);
				switch (event) {
					case 'thought':
						onThought?.(parsed.delta);
						break;
					case 'tool_call':
						onToolCall?.(parsed);
						break;
					case 'tool_result':
						onToolResult?.(parsed);
						break;
					case 'content':
						onContent?.(parsed.delta);
						break;
					case 'done':
						onDone?.(parsed);
						break;
					case 'error':
						onError?.(parsed);
						break;
				}
			} catch (e) {
				console.warn('Failed to parse SSE payload:', dataStr, e);
			}
		}
	}
}

export async function requestAssistantReply(messages) {
	let content = '';
	await streamAssistantReply(messages, {
		onContent(delta) {
			content += delta;
		}
	});
	return content;
}

import { getOrCreateSessionId } from '$lib/session';

export function syncChatSession({ messages, contactInfo, type, sessionId }) {
	const activeSessionId = sessionId || getOrCreateSessionId();
	fetch('/api/log', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ messages, contactInfo, type, sessionId: activeSessionId }),
		keepalive: true
	});
}

export function submitDirectContact(contactInfo, sessionId) {
	const activeSessionId = sessionId || getOrCreateSessionId();
	fetch('/api/log', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ type: 'direct_contact', contactInfo, sessionId: activeSessionId }),
		keepalive: true
	});
}
