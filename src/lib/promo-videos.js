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
	},
	'found-teams': {
		src: 'https://foundteams.com/press/media/short.mp4',
		poster: 'https://foundteams.com/press/media/short-poster.webp',
		width: 1080,
		height: 1920
	},
	// The press kit's portrait trailer (phone render), re-encoded here at 720x1280 (4 MB): the
	// press host sends the whole 23 MB file for every request, with no byte ranges, which
	// iPhones refuse to play. `covers` names the press kit's copies of this same trailer (its
	// phone and table renders), so the press list doesn't repeat it.
	'five-card-charlie': {
		src: '/five-card-charlie/trailer-portrait.mp4',
		poster: '/five-card-charlie/trailer-portrait.jpg',
		width: 720,
		height: 1280,
		title: 'Trailer',
		covers: [
			'https://blackjackcharlie.com/press/dangerous-ideas-portrait.mp4',
			'https://blackjackcharlie.com/press/dangerous-ideas-table-portrait.mp4'
		]
	},
	// The portrait product tour (66 s, 6 MB) from the press kit.
	fluenics: {
		src: 'https://fluenics.com/press/media/tour-1080x1920.mp4',
		poster: 'https://fluenics.com/press/media/tour-1080x1920-poster.webp',
		width: 1080,
		height: 1920,
		title: 'Product tour'
	}
};

/**
 * Whether a press video is the card video itself (or a copy it stands in for, `covers`), so
 * the reel and the feeds don't show it twice. A ?v= cache-buster doesn't make another cut.
 */
export const sameCut = (card, src) => {
	const bare = (u) => u?.split('?')[0];
	return (
		!!card &&
		(bare(card.src) === bare(src) || (card.covers || []).some((c) => bare(c) === bare(src)))
	);
};

const absolute = (path) => (path?.startsWith('http') ? path : `${PROMO_ORIGIN}${path}`);

/** @typedef {{ src: string, poster: string | null, width: number, height: number, title?: string, covers?: string[] }} PromoVideo */

/** project id → video; local ones until the catalogue loads (or if it fails). */
export const promoVideos = writable(
	/** @type {Record<string, PromoVideo>} */ ({ ...LOCAL_VIDEOS })
);

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
