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

/** "just now", "5m ago", "3h ago", "2d ago", "4w ago", or the date past ~3 months. */
export function formatRelative(timestamp, now = Date.now()) {
	const time = new Date(timestamp || '').getTime();
	if (!timestamp || Number.isNaN(time)) return '';
	const minutes = Math.round((now - time) / 60000);
	if (minutes < 1) return 'just now';
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.round(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.round(hours / 24);
	if (days < 14) return `${days}d ago`;
	if (days < 90) return `${Math.round(days / 7)}w ago`;
	return new Date(time).toISOString().slice(0, 10);
}

export function formatTimestamp(timestamp) {
	const date = new Date(timestamp);
	if (Number.isNaN(date.getTime())) return timestamp;
	return date.toISOString().replace('T', ' ').slice(0, 16);
}
