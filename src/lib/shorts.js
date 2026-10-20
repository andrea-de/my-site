// The /shorts feed: every product video on the site, one after another, in the order the
// projects are shown. Per project, its card video comes first (the house-ads catalogue,
// see promo-videos.js), then the social cuts read off its /press page (/api/press).
import { get } from 'svelte/store';
import { ensurePromoVideos, promoVideos } from '$lib/promo-videos';
import { PRESS_PAGES } from '$lib/press-pages';
import { projectSlug, showcaseProjects, withMedia } from '../components/showcase/projects';

// One line per product for the info sheet, as approved for the feed; anything without
// one falls back to its card description.
const LINES = {
	audiotales:
		'Photograph a picture book and hear it read aloud in 139 languages, or in your own recorded voice.',
	weatherie:
		'A Flutter weather app where every scene is art from an AI-generated theme, with an eleven-theme store and a Cloud Run backend.',
	squares:
		'A match-2x2 puzzle game in Godot 4, with a deterministic simulation core kept apart from rendering and a self-hosted pipeline that builds, submits and makes its own promo media.',
	cruffled:
		'A multilingual crossword-jumble game with an embeddable Web Component applet, an offline puzzle catalogue and narrated promo videos generated from code.',
	'calculated-survival':
		"A roguelike where you type equations to hit target numbers while the calculator's keys wear out and break; React and TypeScript with Capacitor.",
	tackry:
		'An offline Android app for notes, lists, links, reminders and swiped-away notifications, in ten languages, with no cloud.',
	'section-launcher':
		'A Jetpack Compose Android launcher with user-defined sections and a Gaussian wave scroller.',
	'found-teams':
		'A nonprofit platform for joining, starting and hiring worker cooperatives, with explainable matching and mutual opt-in.',
	gametsunami:
		'A game platform where you describe a game in chat and an agent builds it, with p5.js and d3 engines and a sandboxed runtime.'
};

// The card cut's name where "Promo" would undersell it.
const CARD_TITLES = { cruffled: 'Feature tour', gametsunami: 'Gameplay' };

const PRESS_TIMEOUT_MS = 5000;

/**
 * The status the site shows, short: "Live · App Store & Google Play", "In testing", "Live demo".
 * Production apps (AudioTales and Weatherie included, ahead of the knowledge tree) name
 * the stores they are on.
 */
export function shortStatus(p) {
	const status = p.status || '';
	if (/production/i.test(status)) {
		const stores = [p.stores?.ios && 'App Store', p.stores?.android && 'Google Play'].filter(
			Boolean
		);
		return { label: stores.length ? `Live · ${stores.join(' & ')}` : 'Live', live: true };
	}
	if (/live demo/i.test(status)) return { label: 'Live demo', live: false };
	if (/testing/i.test(status)) return { label: 'In testing', live: false };
	return { label: status.replace(/^\S+\s/, ''), live: false };
}

/** A promise that gives up after `ms`, resolving to `fallback`. */
const within = (promise, ms, fallback) =>
	Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(fallback), ms))]);

async function loadPress(id, fetcher) {
	if (!PRESS_PAGES[id]) return [];
	try {
		const res = await within(fetcher(`/api/press?project=${id}`), PRESS_TIMEOUT_MS, null);
		if (!res?.ok) return [];
		const { videos } = await res.json();
		return videos || [];
	} catch {
		return [];
	}
}

/**
 * The feed: the projects that have a video, and one item per video in feed order.
 * Each item's id ("square-swaps-2") is also its link: /shorts#square-swaps-2.
 */
export async function loadShorts(fetcher = fetch) {
	await within(ensurePromoVideos(), 6000, null);
	const videos = get(promoVideos);
	const candidates = withMedia(showcaseProjects(), videos);
	const press = await Promise.all(candidates.map((p) => loadPress(p.id, fetcher)));

	const projects = [];
	const items = [];
	candidates.forEach((p, n) => {
		const card = videos[p.id];
		const cuts = [
			...(card ? [{ ...card, title: card.title || CARD_TITLES[p.id] || 'Promo' }] : []),
			...press[n].filter((v) => v.src !== card?.src)
		];
		if (!cuts.length) return;
		const slug = projectSlug(p);
		const project = {
			id: p.id,
			slug,
			name: p.name,
			line: LINES[p.id] || p.description,
			status: shortStatus(p),
			technologies: p.technologies || [],
			url: p.url,
			treeSlug: p.treeSlug,
			first: items.length,
			count: cuts.length
		};
		projects.push(project);
		cuts.forEach((v, ci) =>
			items.push({
				id: `${slug}-${ci + 1}`,
				project,
				ci,
				title: v.title,
				src: v.src,
				poster: v.poster || null,
				width: v.width || 1080,
				height: v.height || 1920
			})
		);
	});
	return { projects, items };
}

/** The item a "#square-swaps-2" (or "#square-swaps", its first video) names, as an index, or -1. */
export function indexForHash(items, hash) {
	const key = decodeURIComponent((hash || '').replace(/^#/, '')).toLowerCase();
	if (!key) return -1;
	const exact = items.findIndex((it) => it.id === key);
	if (exact >= 0) return exact;
	return items.findIndex((it) => it.project.slug === key || it.project.id === key);
}
