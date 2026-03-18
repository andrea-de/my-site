export function createUserMessage(content, source = 'typed') {
	return {
		role: 'user',
		content,
		source
	};
}

export function normalizeInitialMessage(value) {
	if (!value) return null;

	if (typeof value === 'string') {
		return { text: value, source: 'ask-agent' };
	}

	if (typeof value === 'object' && typeof value.text === 'string') {
		return { text: value.text, source: value.source || 'ask-agent' };
	}

	return null;
}

export function resolveMessageSource({
	hasExplicitText,
	providedSource,
	messageToSend,
	suggestedDraft,
	suggestedDraftPristine
}) {
	if (providedSource) return providedSource;

	if (!hasExplicitText && suggestedDraftPristine && messageToSend === suggestedDraft) {
		return 'suggested';
	}

	return 'typed';
}
