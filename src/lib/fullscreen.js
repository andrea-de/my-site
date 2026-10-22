// Full screen for a whole page element (the /shorts page), with the prefixed API Safari on
// iPad and older macOS still needs. iPhone Safari has no element full screen (only a video's
// own player), so canFullscreen() is false there and the controls stay hidden.
import { writable } from 'svelte/store';

/** True while some element of this page is full screen (kept in sync with Esc and the system gestures). */
export const fullscreen = writable(false);

const current = () =>
	typeof document === 'undefined'
		? null
		: document.fullscreenElement || /** @type {any} */ (document).webkitFullscreenElement || null;

/** Whether this browser can put an element (not just a video) full screen. */
export function canFullscreen() {
	if (typeof document === 'undefined') return false;
	const doc = /** @type {any} */ (document);
	return !!(doc.fullscreenEnabled || doc.webkitFullscreenEnabled);
}

/**
 * Puts `el` full screen, or leaves full screen. Call it from a tap or a key press: browsers
 * refuse it otherwise.
 * @param {Element | null | undefined} el
 * @param {boolean} [on] defaults to the opposite of the current state
 */
export function setFullscreen(el, on = !current()) {
	const doc = /** @type {any} */ (document);
	const node = /** @type {any} */ (el);
	try {
		if (on && !current() && node) {
			(node.requestFullscreen?.() ?? node.webkitRequestFullscreen?.())?.catch?.(() => {});
		} else if (!on && current()) {
			(doc.exitFullscreen?.() ?? doc.webkitExitFullscreen?.())?.catch?.(() => {});
		}
	} catch {
		// Refused (no tap, or not allowed here): the page stays as it is.
	}
}

/** Starts keeping `fullscreen` in sync; returns the function that stops it. */
export function watchFullscreen() {
	const sync = () => fullscreen.set(!!current());
	document.addEventListener('fullscreenchange', sync);
	document.addEventListener('webkitfullscreenchange', sync);
	sync();
	return () => {
		document.removeEventListener('fullscreenchange', sync);
		document.removeEventListener('webkitfullscreenchange', sync);
	};
}
