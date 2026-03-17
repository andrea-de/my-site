export function emitVisitEvent(name, detail = {}) {
	if (typeof window === 'undefined') return;
	window.dispatchEvent(new CustomEvent(name, { detail }));
}
