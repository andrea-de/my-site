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
//   nothing matches, the bucket's own order stands. `leadTitle`: what the site calls it.
// - `order`: the site's own order for a slot's cuts, by a word of the file name; cuts it
//   doesn't name follow in the bucket's order.
// - `titles`: the site's own names for cuts, by a word of the file name. A cut without one
//   takes its label from the app's notes (app.json), or else its file name, tidied; a promo
//   cut (a house ad) with none is "Promo".
// - `skip`: cuts the site leaves out, by a word of the file name.
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

const LOOPS = 'web/loops';

/**
 * @typedef {{ bucket: string, app: string, slots: string[], lead?: RegExp, leadTitle?: string, order?: RegExp[], titles?: [RegExp, string][], skip?: RegExp }} BucketProject
 * @type {Record<string, BucketProject>}
 */
export const BUCKET_PROJECTS = {
	audiotales: { bucket: ADVECTION, app: 'narretta', slots: [HOUSE_AD, SHORTS] },
	weatherie: {
		bucket: ADVECTION,
		app: 'weatherie',
		slots: [HOUSE_AD, SHORTS],
		lead: /narrated/,
		order: [/rain/, /automaton/],
		titles: [
			[/rain/, 'Rain, but make it Van Gogh'],
			[/automaton/, 'The Tin Traveller']
		]
	},
	squares: { bucket: ADVECTION, app: 'square-swaps', slots: [HOUSE_AD, SHORTS] },
	cruffled: {
		bucket: ADVECTION,
		app: 'cruffled',
		slots: [HOUSE_AD, SHORTS],
		order: [/deep-cuts/, /toxic/, /shots/, /rent/, /fries/, /turkey/, /feature-cut/],
		titles: [
			[/deep-cuts/, 'Deep cuts'],
			[/toxic-bossy/, 'Toxic and bossy'],
			[/shots-texts-regret/, 'Shots, texts, regret'],
			[/rent-broke-kidney/, 'Rent, broke, kidney'],
			[/fries-steak-cake/, 'Fries, steak, cake'],
			[/turkey-aunt-debate/, 'Turkey, aunt, debate'],
			[/feature-cut/, 'Feature cut']
		]
	},
	// The full story trailer leads; the other cuts repeat parts of it.
	'calculated-survival': {
		bucket: ADVECTION,
		app: 'calculated-survival',
		slots: [SHORTS],
		lead: /^story/,
		leadTitle: 'Story trailer',
		order: [/^trailer/, /mock/, /challenge/, /accept/]
	},
	tackry: { bucket: ADVECTION, app: 'tackry', slots: [HOUSE_AD] },
	'section-launcher': {
		bucket: ADVECTION,
		app: 'section-launcher',
		slots: [HOUSE_AD],
		lead: /hype/
	},
	// The promo recut to 9:16 leads, as "Promo".
	'found-teams': {
		bucket: FOUND_TEAMS,
		app: 'found-teams',
		slots: [SHORTS],
		lead: /^short/,
		leadTitle: 'Promo',
		titles: [[/^client/, 'Client short']]
	},
	// The portrait product tour leads.
	fluenics: {
		bucket: ADVECTION,
		app: 'fluenics',
		slots: [SHORTS],
		lead: /^tour/,
		leadTitle: 'Product tour',
		order: [/^short/, /^chart/, /^commission/, /^laser/, /^say/, /^tracks/],
		titles: [
			[/^short/, 'Short version'],
			[/^chart/, 'The uncharted coast'],
			[/^commission/, 'A drill on anything'],
			[/^laser/, 'Laser Letters'],
			[/^say/, 'Every word scored'],
			[/^tracks/, 'A track for the day']
		]
	},
	// One trailer in two renders (a phone frame, the table itself): the phone render is shown.
	'five-card-charlie': {
		bucket: ADVECTION,
		app: 'five-card-charlie',
		slots: [SHORTS],
		lead: /phone/,
		leadTitle: 'Trailer',
		skip: /table/
	},
	// Hidden for now (projects.json): the gameplay loop is its card video.
	gametsunami: {
		bucket: ADVECTION,
		app: 'gametsunami',
		slots: [LOOPS, SHORTS],
		lead: /hero-gameplay/,
		leadTitle: 'Gameplay',
		titles: [[/train/, 'On the train']],
		// The landing page's other loops (one per genre, the 9:16 hero).
		skip: /^genre-|^hero-9x16/
	}
};

/** A promo cut's name, from its file name or id, where "Promo" would undersell it; null otherwise. */
export const cutTitle = (name = '') =>
	/hype/i.test(name) ? 'Hype cut' : /feature-tour/i.test(name) ? 'Feature tour' : null;
