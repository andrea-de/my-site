const SESSION_STORAGE_KEY = 'my_site_session_id';

function generateId() {
	if (typeof window === 'undefined') return '';

	const cryptoApi = window.crypto;
	if (typeof cryptoApi?.randomUUID === 'function') {
		return cryptoApi.randomUUID();
	}

	if (typeof cryptoApi?.getRandomValues === 'function') {
		const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
		bytes[6] = (bytes[6] & 0x0f) | 0x40;
		bytes[8] = (bytes[8] & 0x3f) | 0x80;

		const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
		return [
			hex.slice(0, 8),
			hex.slice(8, 12),
			hex.slice(12, 16),
			hex.slice(16, 20),
			hex.slice(20)
		].join('-');
	}

	return `fallback-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getOrCreateSessionId() {
	if (typeof window === 'undefined') return '';

	try {
		const existing =
			window.localStorage.getItem(SESSION_STORAGE_KEY) ||
			window.sessionStorage.getItem(SESSION_STORAGE_KEY);

		if (existing) {
			// Ensure both storages are populated for compatibility
			window.localStorage.setItem(SESSION_STORAGE_KEY, existing);
			window.sessionStorage.setItem(SESSION_STORAGE_KEY, existing);
			return existing;
		}

		const newId = generateId();
		window.localStorage.setItem(SESSION_STORAGE_KEY, newId);
		window.sessionStorage.setItem(SESSION_STORAGE_KEY, newId);
		return newId;
	} catch {
		return generateId();
	}
}

export function resetSessionId() {
	if (typeof window === 'undefined') return '';

	try {
		const newId = generateId();
		window.localStorage.setItem(SESSION_STORAGE_KEY, newId);
		window.sessionStorage.setItem(SESSION_STORAGE_KEY, newId);
		return newId;
	} catch {
		return generateId();
	}
}
