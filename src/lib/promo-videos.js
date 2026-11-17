// Where each project's videos come from.
//
// - A project in $lib/media-buckets: the shared media buckets, read through /api/media when
//   the page loads, so a cut approved into a bucket shows up here with no change to this
//   site. Its first video is its card video; the rest follow it in the reel and the shorts.
//   Its links and icon come with them (`bucketMedia`).
// - Any other project: the house-ads catalogue on advectionsoftware.com (a project's newest
//   cut is its card video, its older cuts follow), or the videos named here. `h264` is the
//   browser rendition (Theora is for the Godot clients).
import { writable } from 'svelte/store';
import { BUCKET_PROJECTS, cutTitle } from '$lib/media-buckets';

const PROMO_ORIGIN = 'https://www.advectionsoftware.com';
/** The catalogue of promo videos (also preloaded by the shorts page). */
export const PROMO_CATALOGUE = `${PROMO_ORIGIN}/api/catalogue`;

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

/**
 * @typedef {{ src: string, poster: string | null, width: number, height: number, title?: string | null, promo?: boolean, covers?: string[], more?: PromoVideo[] }} PromoVideo
 * `more`: the project's other cuts, played after this one (the card video). `promo`: false
 * for a social short (it shows under its own title); anything else is a promo cut.
 */

/** project id → video; local ones until the lists load (or if they fail). */
export const promoVideos = writable(
	/** @type {Record<string, PromoVideo>} */ ({ ...LOCAL_VIDEOS })
);

/**
 * project id → what its bucket gives besides videos: `site`, `stores` ({ ios, android }) and
 * `icon`. Empty until /api/media answers; a project it couldn't read is absent, and the
 * site shows what it has in code for it (projects.json, static/app-icons).
 */
export const bucketMedia = writable(
	/** @type {Record<string, { site: string | null, stores: { ios?: string, android?: string }, icon: string | null }>} */ ({})
);

/** The lists of bucket-backed projects' media (also preloaded by the shorts page). */
export const BUCKET_MEDIA = '/api/media';
const BUCKET_TIMEOUT_MS = 6000;

/**
 * A project's links as shown: its bucket's (app.json: `site`, `stores`) once read, else the
 * ones in projects.json.
 * @param {any} p a project
 * @param {Record<string, any>} media `bucketMedia`
 */
export function projectLinks(p, media) {
	const m = p && media[p.id];
	return m ? { url: m.site || p.url, stores: m.stores } : { url: p?.url, stores: p?.stores };
}

let loading = null;

/**
 * Fetches the lists once per page load; later calls reuse the same request. Each list shows
 * as it arrives: neither waits for the other.
 */
export function ensurePromoVideos() {
	if (!loading) {
		/** @type {Record<string, PromoVideo>} */
		let catalogue = { ...LOCAL_VIDEOS };
		/** @type {Record<string, any>} */
		let media = {};
		const show = () => {
			/** @type {Record<string, PromoVideo>} */
			const videos = { ...catalogue };
			for (const [id, m] of Object.entries(media)) {
				// The bucket's cuts in the site's order: the first is the card video.
				const [card, ...more] = m.videos || [];
				if (card) videos[id] = more.length ? { ...card, more } : card;
			}
			bucketMedia.set(media);
			promoVideos.set(videos);
		};
		loading = Promise.all([
			loadCatalogueVideos().then((v) => ((catalogue = v), show())),
			loadBucketMedia().then((m) => ((media = m), show()))
		]);
	}
	return loading;
}

/**
 * Bucket-backed projects' media by project id; {} when it can't be read.
 * @returns {Promise<Record<string, any>>}
 */
async function loadBucketMedia() {
	const gaveUp = new AbortController();
	const timer = setTimeout(() => gaveUp.abort(), BUCKET_TIMEOUT_MS);
	try {
		const res = await fetch(BUCKET_MEDIA, { signal: gaveUp.signal });
		if (!res.ok) return {};
		const { projects = {} } = await res.json();
		return Object.fromEntries(Object.entries(projects).filter(([id]) => BUCKET_PROJECTS[id]));
	} catch {
		return {};
	} finally {
		clearTimeout(timer);
	}
}

/** @returns {Promise<Record<string, PromoVideo>>} */
async function loadCatalogueVideos() {
	try {
		const res = await fetch(PROMO_CATALOGUE);
		if (!res.ok) return { ...LOCAL_VIDEOS };
		const { creatives = [] } = await res.json();
		/** @type {Record<string, PromoVideo>} */
		const videos = { ...LOCAL_VIDEOS };
		/** @type {Map<string, PromoVideo[]>} the catalogue's video cuts per project, in its order */
		const cuts = new Map();
		for (const c of creatives) {
			const project = APP_TO_PROJECT[c.app_id];
			const h264 = c.renditions?.h264?.url;
			// A bucket-backed project's videos come from its bucket, never from here.
			if (c.type !== 'video' || !project || BUCKET_PROJECTS[project] || !h264) continue;
			const title = cutTitle(c.id);
			if (!cuts.has(project)) cuts.set(project, []);
			cuts.get(project).push({
				src: absolute(h264),
				poster: c.renditions.poster?.url ? absolute(c.renditions.poster.url) : null,
				width: c.renditions.h264.width,
				height: c.renditions.h264.height,
				...(title ? { title } : {})
			});
		}
		// The catalogue appends new cuts, so a project's last one is its newest: that is the
		// card video (it plays first), and the earlier cuts follow it, newest first (`more`).
		for (const [project, list] of cuts) {
			const card = list[list.length - 1];
			const more = list.slice(0, -1).reverse();
			videos[project] = more.length ? { ...card, more } : card;
		}
		return videos;
	} catch {
		return { ...LOCAL_VIDEOS };
	}
}
