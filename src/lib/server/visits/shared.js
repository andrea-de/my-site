export function clampNumber(value, fallback = 0, min = 0, max = Number.MAX_SAFE_INTEGER) {
	if (value === null || value === undefined) return fallback;
	if (typeof value === 'string' && value.trim() === '') return fallback;

	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return fallback;
	return Math.max(min, Math.min(max, parsed));
}

export function toShortString(value, fallback = '') {
	if (!value) return fallback;
	return String(value).slice(0, 240);
}

export function toArray(value, limit = 10) {
	if (!Array.isArray(value)) return [];

	return value
		.map((entry) => toShortString(entry))
		.filter(Boolean)
		.slice(0, limit);
}

export function escapeHtml(value) {
	return String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

export function decodeDisplayValue(value, fallback = '') {
	const text = toShortString(value, fallback);
	if (!text) return fallback;

	try {
		return decodeURIComponent(text);
	} catch {
		return text;
	}
}

export function formatDuration(durationMs) {
	const seconds = Math.max(0, Math.round(durationMs / 1000));
	if (seconds < 60) return `${seconds}s`;
	const minutes = Math.floor(seconds / 60);
	return `${minutes}m ${seconds % 60}s`;
}

export function formatTimestamp(timestamp) {
	const date = new Date(timestamp);
	if (Number.isNaN(date.getTime())) return timestamp;
	return date.toISOString().replace('T', ' ').slice(0, 16);
}
