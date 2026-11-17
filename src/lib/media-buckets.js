// Which of Andrea's shared media buckets each project's media and links are read from, and
// what the site shows of it. The buckets hold the files; the selection, the order and the
// wording stay here.
//
// A bucket's layout is <app>/<stage>/<platform>/<slot>/[<set>/]<file>: the path says what a
// file is. So a project names slots, never files, and whatever is approved into a slot shows
// up here with no change to this site (see src/lib/server/media-buckets.js, /api/media).
//
// - `slots`: the slots whose portrait videos the site shows, in this order. The first video
//   is the project's card video.
// - `lead`: which cut of those goes first, by a word of its file name; without one, or when
//   nothing matches, the bucket's own order stands.
// - `leadTitle`: what the site calls that leading cut.
// - `titles`: the site's own names for cuts, by a word of the file name, in the order the
//   site shows them (ahead of the slot's other cuts). A cut without one takes its label from
//   the app's notes (app.json), or else its file name, tidied.
//
// An app's `trailer` (app.json) is shown too when it is portrait (the cards and the feeds are
// phone-shaped): in place of the same cut in another shape, or else right after the lead.
//
// Found Teams is Andrea's personally, not the company's: it reads its own bucket and never
// the company's.

const ADVECTION = 'advection-media';
const FOUND_TEAMS = 'foundteams-media';

const HOUSE_AD = 'house-ads/interstitial';
const SHORTS = 'youtube/shorts';

/** @type {Record<string, { bucket: string, app: string, slots: string[], lead?: RegExp, leadTitle?: string, titles?: [RegExp, string][] }>} */
export const BUCKET_PROJECTS = {
	audiotales: { bucket: ADVECTION, app: 'narretta', slots: [HOUSE_AD, SHORTS] },
	weatherie: {
		bucket: ADVECTION,
		app: 'weatherie',
		slots: [HOUSE_AD, SHORTS],
		lead: /narrated/,
		titles: [
			[/rain/, 'Rain, but make it Van Gogh'],
			[/automaton/, 'The Tin Traveller']
		]
	},
	squares: { bucket: ADVECTION, app: 'square-swaps', slots: [HOUSE_AD, SHORTS] }
};

/** A promo cut's name, from its file name or id, where "Promo" would undersell it; null otherwise. */
export const cutTitle = (name = '') =>
	/hype/i.test(name) ? 'Hype cut' : /feature-tour/i.test(name) ? 'Feature tour' : null;
