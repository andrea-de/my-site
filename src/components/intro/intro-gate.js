import { writable } from 'svelte/store';

// Shared with the inline script in src/app.html, which adds INTRO_CLASS before first paint.
// Keep the two in sync.
export const INTRO_CLASS = 'show-intro';

// The Welcome screen is for phones and small tablets; wider screens get the site's own
// Software section, which shows the same cards and project view.
export const PHONE_QUERY = '(max-width: 899px)';

export const isPhoneWidth = () =>
	typeof window !== 'undefined' && window.matchMedia(PHONE_QUERY).matches;

// Bumped to bring the Welcome screen back after it has been closed (menu link, pull from the top).
export const introRequests = writable(0);

export function openIntro() {
	introRequests.update((n) => n + 1);
}
