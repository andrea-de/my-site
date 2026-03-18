export function syncComposerHeight(textarea, isExpanded) {
	if (!textarea) return 1;

	const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 22;
	const scrollHeight = textarea.scrollHeight;
	const lineCount = Math.max(1, Math.ceil((scrollHeight - 4) / lineHeight));

	if (isExpanded) {
		textarea.style.height = '100%';
		textarea.style.overflowY = 'auto';
		return lineCount;
	}

	textarea.style.height = 'auto';
	const maxHeight = lineHeight * 3 + 4;
	const nextHeight = Math.min(textarea.scrollHeight, maxHeight);

	textarea.style.height = `${Math.max(nextHeight, lineHeight + 10)}px`;
	textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';

	return lineCount;
}
