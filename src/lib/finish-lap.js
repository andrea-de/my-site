// The shorts' loading light runs round a frame's edge (a CSS `orbit` animation). When loading
// ends mid-lap, rather than vanish (or snap back to the top), it races round to finish the
// lap and stops where it began. Returns how long that takes, in ms (0 when nothing orbits).

/**
 * @param {Element | null | undefined} node the element carrying the orbit animation
 * @param {{ period?: number, rate?: number }} [opts] the lap's length (ms) and the speed-up
 */
export function finishLap(node, { period = 1600, rate = 10 } = {}) {
	const orbit = node
		?.getAnimations?.()
		.find((a) => String(/** @type {any} */ (a).animationName).endsWith('orbit'));
	if (!orbit || typeof orbit.currentTime !== 'number') return 0;
	const now = orbit.currentTime;
	const end = Math.ceil(now / period) * period;
	const ms = (end - now) / rate;
	orbit.updatePlaybackRate(rate);
	setTimeout(() => {
		orbit.pause();
		orbit.currentTime = end;
	}, ms);
	return ms;
}
