export async function requestAssistantReply(messages) {
	const response = await fetch('/api/chat', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ messages })
	});

	const data = await response.json();
	return data.content || '';
}

export function syncChatSession({ messages, contactInfo, type }) {
	fetch('/api/log', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ messages, contactInfo, type }),
		keepalive: true
	});
}

export function submitDirectContact(contactInfo) {
	fetch('/api/log', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ type: 'direct_contact', contactInfo }),
		keepalive: true
	});
}
