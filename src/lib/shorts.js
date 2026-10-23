// The /shorts feeds: every product video on the site, in the order the projects are shown.
// Per project, its card video (the house-ads catalogue, see promo-videos.js) and the social
// cuts read off its /press page (/api/press). See loadShorts for the two orders.
import { get } from 'svelte/store';
import { ensurePromoVideos, promoVideos, sameCut } from '$lib/promo-videos';
import { PRESS_PAGES } from '$lib/press-pages';
import { EXPERIENCE } from '$lib/experience-videos';
import { METHODOLOGIES } from '$lib/methodology-videos';
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
		'A game platform where you describe a game in chat and an agent builds it, with p5.js and d3 engines and a sandboxed runtime.',
	'five-card-charlie':
		'A blackjack roguelike on the five-card Charlie rule: survive a Night of three dealers, with shops, sit-outs and one Plaque per Night; rebuilt in Godot 4 from a LÖVE prototype, ahead of a Steam demo.',
	fluenics:
		'A speaking-practice app for any language: LLM-generated drills, every attempt scored by Azure pronunciation assessment, and a fluency map of the verbs, words and tenses you know, offline in SQLite.'
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

// The AI voice short: the Welcome screen's voice agent as the main feed's first item, under
// the cover and before the videos (an experiment; false takes it out everywhere).
export const VOICE_SHORT = true;

// A narrated intro for the voice short, played (once per visit) before the live agent takes
// over; its last frame should match VoiceShort's layout. Null: the agent shows at once.
// Set it to { src, poster, width: 1080, height: 1920 }, e.g. a file in static/, or null.
const VOICE_INTRO = {
	src: '/voice-agent/intro.mp4',
	poster: '/voice-agent/intro.jpg',
	width: 1080,
	height: 1920
};

const VOICE_PROJECT = {
	id: 'voice',
	slug: 'voice-agent',
	name: 'Voice agent',
	line: 'Ask my AI agent about my work, out loud.',
	status: null,
	technologies: [],
	count: 1,
	videos: []
};

/** The voice short, an item with no video (ShortsFeed shows VoiceShort in its frame). */
const voiceItem = () => ({
	id: VOICE_PROJECT.slug,
	project: VOICE_PROJECT,
	ci: 0,
	voice: true,
	intro: VOICE_INTRO,
	promo: false,
	title: 'Ask me anything',
	src: null,
	poster: null,
	width: 1080,
	height: 1920
});

/**
 * A project of narrated videos (Experience, Methodologies), in their own order (no promo to
 * move). `site` is where its "This project" link goes; without one, each video links to the
 * tree note it explains (`note`).
 */
function narratedProject(def, { site = null, notes = false } = {}) {
	const project = {
		id: def.id,
		slug: def.slug,
		name: def.name,
		line: def.line,
		// Not a product: no status, no stack.
		status: null,
		technologies: [],
		url: null,
		treeSlug: null,
		site,
		count: def.videos.length,
		videos: []
	};
	project.videos = def.videos.map((v, ci) => ({
		id: `${project.slug}-${ci + 1}`,
		project,
		ci,
		promo: false,
		heading: v.heading,
		title: v.role,
		note: notes ? v.treeSlug : null,
		src: v.src,
		poster: v.poster,
		width: v.width,
		height: v.height
	}));
	return project;
}

// Whether the main feed's second round shows each project's card video again before its
// press shorts. Off: round two holds only the press shorts.
const REPEAT_CARDS = false;

/** A feed's items, numbered within each project ("2/4" in the title row and the sheet). */
function numbered(videos) {
	const seen = new Map();
	return videos.map((v) => {
		const n = (seen.get(v.project) || 0) + 1;
		seen.set(v.project, n);
		return { ...v, n };
	});
}

/**
 * The videos and the two kinds of feed.
 *
 * - The main feed (/shorts): the voice short (VOICE_SHORT), the first Methodologies video
 *   (Brain), the first Experience video, every product's first video (its card video) in
 *   project order, the other Experience videos, project by project the rest of each
 *   product's videos (its press shorts), then the other Methodologies videos.
 * - A project's feed (/shorts?project=square-swaps): its press shorts, then its card
 *   video last. Experience's (?project=experience) and Methodologies' keep their own order.
 *
 * Each video's id ("square-swaps-2", the project's own order: card video first) is also
 * its link, the same in both feeds: /shorts#square-swaps-2, /shorts?project=square-swaps#square-swaps-2.
 */
export async function loadShorts(fetcher = fetch) {
	await within(ensurePromoVideos(), 6000, null);
	const promos = get(promoVideos);
	const candidates = withMedia(showcaseProjects(), promos);
	const press = await Promise.all(candidates.map((p) => loadPress(p.id, fetcher)));

	const projects = [];
	candidates.forEach((p, n) => {
		const card = promos[p.id];
		const cuts = [
			...(card
				? [{ ...card, title: card.title || CARD_TITLES[p.id] || 'Promo', promo: true }]
				: []),
			...press[n].filter((v) => !sameCut(card, v.src))
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
			count: cuts.length,
			videos: []
		};
		project.videos = cuts.map((v, ci) => ({
			id: `${slug}-${ci + 1}`,
			project,
			ci,
			promo: !!v.promo,
			title: v.title,
			src: v.src,
			poster: v.poster || null,
			width: v.width || 1080,
			height: v.height || 1920
		}));
		projects.push(project);
	});

	const experience = narratedProject(EXPERIENCE, { site: `/#${EXPERIENCE.slug}` });
	const methodologies = narratedProject(METHODOLOGIES, { notes: true });
	const all = {
		project: null,
		items: numbered([
			...(VOICE_SHORT ? [voiceItem()] : []),
			...methodologies.videos.slice(0, 1),
			experience.videos[0],
			...projects.map((p) => p.videos[0]),
			...experience.videos.slice(1),
			...projects.flatMap((p) => p.videos.slice(REPEAT_CARDS ? 0 : 1)),
			...methodologies.videos.slice(1)
		])
	};
	// Methodologies before Experience: a feed that ends continues with the next project, and
	// Methodologies runs on into Experience (in the main feed), as on a job link's row.
	projects.push(methodologies, experience);
	const feeds = new Map();
	/** A project's feed, by slug or id; null for an unknown one. */
	const feedFor = (key) => {
		const project = projects.find((p) => p.slug === key || p.id === key);
		if (!project) return null;
		if (!feeds.has(project)) {
			const [first, ...rest] = project.videos;
			feeds.set(project, {
				project,
				items: numbered(first.promo ? [...rest, first] : project.videos)
			});
		}
		return feeds.get(project);
	};
	return { projects, all, feedFor, items: all.items };
}

/** The item a "#square-swaps-2" (or "#square-swaps", its project's first in the feed) names, as an index, or -1. */
export function indexForHash(items, hash) {
	const key = decodeURIComponent((hash || '').replace(/^#/, '')).toLowerCase();
	if (!key) return -1;
	const exact = items.findIndex((it) => it.id === key);
	if (exact >= 0) return exact;
	return items.findIndex((it) => it.project.slug === key || it.project.id === key);
}

/**
 * The cover's filters for the main feed, with what each holds (names for its list): Work is
 * Experience, Developer is Methodologies, Products every product. The voice short is in none
 * and always plays. Known without loading anything, so the cover's early copy matches.
 */
export function coverGroups() {
	return [
		{ key: 'work', label: 'Work', items: EXPERIENCE.videos.map((v) => v.short || v.heading) },
		{ key: 'developer', label: 'Developer', items: METHODOLOGIES.videos.map((v) => v.heading) },
		{ key: 'products', label: 'Products', items: showcaseProjects().map((p) => p.name) }
	];
}

/** Which cover filter an item belongs to, or null (the voice short, always kept). */
export const groupOf = (it) =>
	it.voice
		? null
		: it.project.id === EXPERIENCE.id
		  ? 'work'
		  : it.project.id === METHODOLOGIES.id
		    ? 'developer'
		    : 'products';
