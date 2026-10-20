// Shared input checks for the notes endpoints (history, archive).
import { HISTORY_TEXT_MAX } from './store';

/** The parsed JSON object, {} for an empty body, or null. */
export async function readJsonObject(request) {
	const text = await request.text();
	if (!text.trim()) return {};
	try {
		const body = JSON.parse(text);
		return body && typeof body === 'object' && !Array.isArray(body) ? body : null;
	} catch {
		return null;
	}
}

export function checkText(value, { required = false } = {}) {
	if (value === undefined || value === null || value === '') {
		return required ? { error: '"text" is required.' } : { value: '' };
	}
	if (typeof value !== 'string') return { error: '"text" must be a string.' };
	const text = value.replace(/\r\n?/g, '\n').trim();
	if (required && !text) return { error: '"text" is required.' };
	if (text.length > HISTORY_TEXT_MAX) return { error: `"text" is too long (max ${HISTORY_TEXT_MAX} characters).` };
	return { value: text };
}

export function checkAuthor(value) {
	if (value === undefined) return { value: 'claude' };
	if (value !== 'claude' && value !== 'andrea') return { error: '"by" must be "claude" or "andrea".' };
	return { value };
}
