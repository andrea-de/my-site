// The current visit as the tracker sees it, published only for the owner's score badge.
import { writable } from 'svelte/store';

/** @type {import('svelte/store').Writable<any>} */
export const liveVisit = writable(null);
