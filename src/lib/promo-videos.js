// Promo videos come from the house-ads catalogue on advectionsoftware.com, so a
// new cut published there shows up here with no change to this site.
// `h264` is the browser rendition (Theora is for the Godot clients).
import { writable } from 'svelte/store';

const PROMO_ORIGIN = 'https://www.advectionsoftware.com';

const APP_TO_PROJECT = {
	'com.audiotales.app': 'audiotales',
	'com.cruffled.app': 'cruffled',
	'com.tackry.app': 'tackry',
	'com.weatherie.app': 'weatherie',
	'com.squareswaps.app': 'squares',
	'com.sectionlauncher.app': 'section-launcher'
};

// Projects with no catalogue cut yet: served from this site, or straight from the
// product's own press kit.
const LOCAL_VIDEOS = {
	// The full story trailer leads; the press kit's other cuts repeat parts of it.
	'calculated-survival': {
		src: 'https://www.roguecalculator.com/press/video/story-portrait.mp4',
		poster: 'https://www.roguecalculator.com/press/video/story-portrait.jpg',
		width: 1080,
		height: 1920,
		title: 'Story trailer'
	},
	gametsunami: {
		src: '/landing/hero-gameplay.mp4',
		poster: '/landing/hero-gameplay.jpg',
		width: 608,
		height: 744
	}
};

const absolute = (path) => (path?.startsWith('http') ? path : `${PROMO_ORIGIN}${path}`);

/** @typedef {{ src: string, poster: string | null, width: number, height: number, title?: string }} PromoVideo */

/** project id → video; local ones until the catalogue loads (or if it fails). */
export const promoVideos = writable(/** @type {Record<string, PromoVideo>} */ ({ ...LOCAL_VIDEOS }));

let loading = null;

/** Fetches the catalogue once per page load; later calls reuse the same request. */
export function ensurePromoVideos() {
	if (!loading) loading = loadPromoVideos().then((videos) => promoVideos.set(videos));
	return loading;
}

async function loadPromoVideos() {
	try {
		const res = await fetch(`${PROMO_ORIGIN}/api/catalogue`);
		if (!res.ok) return { ...LOCAL_VIDEOS };
		const { creatives = [] } = await res.json();
		/** @type {Record<string, PromoVideo>} */
		const videos = { ...LOCAL_VIDEOS };
		const seen = new Set();
		for (const c of creatives) {
			const project = APP_TO_PROJECT[c.app_id];
			const h264 = c.renditions?.h264?.url;
			if (c.type !== 'video' || !project || !h264 || seen.has(project)) continue;
			seen.add(project);
			videos[project] = {
				src: absolute(h264),
				poster: c.renditions.poster?.url ? absolute(c.renditions.poster.url) : null,
				width: c.renditions.h264.width,
				height: c.renditions.h264.height
			};
		}
		return videos;
	} catch {
		return { ...LOCAL_VIDEOS };
	}
}
