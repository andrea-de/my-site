// The job link (/r/<code>) this visit came in on, if any. The page sets it; the chat and
// voice agents send it so the server can brief them on the job. Kept for the browsing
// session, so the agent stays briefed after a click through to the rest of the site.
import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'my_site_ref';

function initial() {
	if (!browser) return null;
	try {
		return sessionStorage.getItem(STORAGE_KEY) || null;
	} catch {
		return null;
	}
}

export const activeRef = writable(initial());

/** The code to send along with agent requests, or undefined. */
export const currentRef = () => get(activeRef) || undefined;

/** Posts a visitor event against the active job link; fire-and-forget. */
export function sendRefEvent(type, detail = {}) {
	const code = get(activeRef);
	if (!browser || !code) return;
	try {
		fetch(`/api/r/${encodeURIComponent(code)}/event`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ type, ...detail }),
			// Survives a click that leaves the page (e.g. the résumé link).
			keepalive: true
		}).catch(() => {});
	} catch {}
}

if (browser) {
	activeRef.subscribe((code) => {
		try {
			if (code) sessionStorage.setItem(STORAGE_KEY, code);
			else sessionStorage.removeItem(STORAGE_KEY);
		} catch {}
	});

	// The site already announces what visitors do (see $lib/visit-events); while a job
	// link is active, the interesting ones go to its log too, on whichever page they happen.
	window.addEventListener('visit:project_open', (/** @type {any} */ e) =>
		sendRefEvent('project_open', { project: e.detail?.project })
	);
	window.addEventListener('visit:chat_open', () => sendRefEvent('chat_open'));
	window.addEventListener('visit:chat_message', () => sendRefEvent('chat_question'));
}
