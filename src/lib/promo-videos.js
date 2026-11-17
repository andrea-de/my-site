// Where each project's videos, links and icon come from: the shared media buckets, read
// through /api/media when the page loads, so a cut approved into a bucket shows up here with
// no change to this site. $lib/media-buckets says which bucket and which slots each project
// shows; a project's first video is its card video, and the rest follow it in the reel and
// the shorts.
//
// Until that list arrives, or when a bucket can't be read, a project shows what this repo
// holds for it: the videos below, its still (showcase/projects.js), the links in
// projects.json and its icon in static/app-icons.
import { writable } from 'svelte/store';
import { BUCKET_PROJECTS } from '$lib/media-buckets';

// Videos kept in this repo, for when the bucket can't be read.
const LOCAL_VIDEOS = {
	gametsunami: {
		src: '/landing/hero-gameplay.mp4',
		poster: '/landing/hero-gameplay.jpg',
		width: 608,
		height: 744,
		title: 'Gameplay'
	},
	// The portrait trailer (phone render), re-encoded at 720x1280 (4 MB).
	'five-card-charlie': {
		src: '/five-card-charlie/trailer-portrait.mp4',
		poster: '/five-card-charlie/trailer-portrait.jpg',
		width: 720,
		height: 1280,
		title: 'Trailer'
	}
};

/**
 * @typedef {{ src: string, poster: string | null, width: number, height: number, title?: string, promo?: boolean, more?: PromoVideo[] }} PromoVideo
 * `more`: the project's other cuts, played after this one (the card video). `promo`: false
 * for a social short (it shows under its own title); anything else is a promo cut.
 */

/** project id → video; the repo's own until the buckets' list loads (or if it fails). */
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

/** The list of the projects' bucket media (also preloaded by the shorts page). */
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

/** Fetches the list once per page load; later calls reuse the same request. */
export function ensurePromoVideos() {
	if (!loading)
		loading = loadBucketMedia().then((media) => {
			/** @type {Record<string, PromoVideo>} */
			const videos = { ...LOCAL_VIDEOS };
			for (const [id, m] of Object.entries(media)) {
				// The bucket's cuts in the site's order: the first is the card video.
				const [card, ...more] = m.videos || [];
				if (card) videos[id] = more.length ? { ...card, more } : card;
			}
			bucketMedia.set(media);
			promoVideos.set(videos);
		});
	return loading;
}

/**
 * The projects' bucket media by project id; {} when it can't be read.
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
