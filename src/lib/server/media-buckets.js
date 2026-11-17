// Reads the shared media buckets for the projects in $lib/media-buckets: each bucket's
// index.json (every app's app.json: site, stores, icon, trailer, notes) and a listing of the
// app's folder, and returns what the site shows of them. Nothing here names a file: links and
// the icon come from app.json, videos from whatever sits in the project's slots.
//
// The buckets are public (no key). Their layout:
//   https://storage.googleapis.com/<bucket>/<app>/<stage>/<platform>/<slot>/[<set>/]<file>
// with a video's poster beside it as <stem>-poster.jpg.
import { BUCKET_PROJECTS, cutTitle } from '$lib/media-buckets';

const ORIGIN = 'https://storage.googleapis.com';
const TIMEOUT_MS = 4000;

/**
 * @typedef {{ src: string, poster: string | null, width: number, height: number, title?: string, promo: boolean }} BucketVideo
 * `promo`: a promo cut (a house ad or the trailer) rather than a social short. `title`: absent
 * for a promo cut with no name of its own (the site calls it "Promo").
 * @typedef {{ site: string | null, stores: { ios?: string, android?: string }, icon: string | null, videos: BucketVideo[] }} BucketProject
 */

async function getJson(url) {
	const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
	if (!res.ok) throw new Error(`${res.status} from ${url}`);
	return res.json();
}

/** A bucket's index.json as app id → its app.json fields. */
async function readIndex(bucket) {
	const { apps } = await getJson(`${ORIGIN}/${bucket}/index.json`);
	if (!Array.isArray(apps)) throw new Error(`${bucket}/index.json lists no apps`);
	return new Map(apps.map((a) => [a.id, a]));
}

/** Every object under <app>/<stage>/: its path inside the app's folder → size and probed shape. */
async function listStage(bucket, app, stage) {
	const files = new Map();
	const root = `${app}/`;
	let pageToken = '';
	for (let page = 0; page < 5; page++) {
		const query = new URLSearchParams({
			prefix: `${root}${stage}/`,
			fields: 'items(name,size,metadata(w,h,dur)),nextPageToken',
			maxResults: '1000',
			...(pageToken ? { pageToken } : {})
		});
		const { items = [], nextPageToken } = await getJson(
			`${ORIGIN}/storage/v1/b/${bucket}/o?${query}`
		);
		for (const it of items) files.set(it.name.slice(root.length), it);
		if (!nextPageToken) break;
		pageToken = nextPageToken;
	}
	return files;
}

const httpsLink = (u) => (typeof u === 'string' && /^https:\/\//.test(u) ? u : undefined);
const baseName = (rel) => rel.slice(rel.lastIndexOf('/') + 1).replace(/\.[a-z0-9]+$/i, '');
/** The same cut in another size or shape runs exactly as long. */
const sameLength = (a, b) => a.dur > 0 && Math.abs(a.dur - b.dur) < 0.06;

/** An app's label for a file ("Story trailer, 9:16"), without the shape. */
const cleanLabel = (label) =>
	typeof label === 'string' ? label.replace(/\s*[,·]\s*\d+:\d+\s*$/, '').trim() || null : null;

/** A title from a file name: "short-circuits-avocado-1080x1920" → "Circuits avocado". */
function tidyName(name) {
	const s = name
		.replace(/([-_]\d+x\d+)+$/, '')
		.replace(/^short[-_]/, '')
		.replace(/[-_]portrait$/, '')
		.replace(/[-_]+/g, ' ')
		.trim();
	return s ? s.charAt(0).toUpperCase() + s.slice(1) : name;
}

/**
 * What the site shows of one project, from its app.json fields and its folder's listing.
 * @param {(typeof BUCKET_PROJECTS)[string]} cfg
 * @param {any} entry the app's index.json entry
 * @param {Map<string, any>} files path inside the app's folder → listed object
 * @param {string} stage
 * @returns {BucketProject}
 */
export function projectFromBucket(cfg, entry, files, stage) {
	const url = (rel) =>
		`${ORIGIN}/${cfg.bucket}/${cfg.app}/${rel.split('/').map(encodeURIComponent).join('/')}`;

	const video = (rel) => {
		const f = files.get(rel);
		if (!f) return null;
		const stem = rel.replace(/\.mp4$/i, '');
		const poster = files.has(`${stem}-poster.jpg`)
			? url(`${stem}-poster.jpg`)
			: files.has(`${stem}.webp`)
			  ? url(`${stem}.webp`)
			  : null;
		const m = f.metadata || {};
		return {
			rel,
			name: baseName(rel),
			src: url(rel),
			poster,
			width: Number(m.w) || 0,
			height: Number(m.h) || 0,
			dur: Number(m.dur) || 0,
			bytes: Number(f.size) || 0
		};
	};
	// The cards and the feeds are phone-shaped: only portrait cuts. One the bucket hasn't
	// measured is taken on trust, since these slots hold vertical video.
	const portrait = (v) => !(v.width && v.height) || v.height > v.width;

	const cuts = [];
	for (const slot of cfg.slots) {
		const dir = `${stage}/${slot}/`;
		const own = [];
		const served = [];
		for (const rel of [...files.keys()].sort()) {
			if (!rel.startsWith(dir) || !/\.mp4$/i.test(rel)) continue;
			const rest = rel.slice(dir.length);
			// The slot's own files, and the ad server's renditions of them (served/). Other
			// sets (a slot's no-music originals, say) are not what the slot shows.
			if (!rest.includes('/')) own.push(video(rel));
			else if (/^served\/[^/]+$/.test(rest)) served.push(video(rel));
		}
		// The site's own order for the cuts it names (`titles`); the rest keep the bucket's.
		const rank = (v) => {
			const at = (cfg.titles || []).findIndex(([re]) => re.test(v.name));
			return at < 0 ? Infinity : at;
		};
		own.sort((a, b) => rank(a) - rank(b));
		const promo = slot.startsWith('house-ads/');
		const title = (v) =>
			(cfg.titles || []).find(([re]) => re.test(v.name))?.[1] ||
			(promo
				? cutTitle(v.name)
				: cleanLabel(entry.notes?.[v.rel.slice(stage.length + 1)]?.label) || tidyName(v.name));
		for (const v of own.filter(portrait)) {
			// A smaller rendition of the same cut is what a browser should fetch.
			const at = served.findIndex((s) => portrait(s) && sameLength(s, v) && s.bytes < v.bytes);
			const light = at >= 0 ? served.splice(at, 1)[0] : null;
			cuts.push({
				...v,
				...(light
					? {
							src: light.src,
							poster: light.poster || v.poster,
							width: light.width,
							height: light.height,
							bytes: light.bytes
					  }
					: {}),
				title: title(v),
				promo
			});
		}
		for (const v of served.filter(portrait)) cuts.push({ ...v, title: title(v), promo });
	}

	// The site's own order: the cut it leads with.
	let led = false;
	if (cfg.lead) {
		const at = cuts.findIndex((c) => cfg.lead.test(c.name));
		if (at >= 0) {
			const [lead] = cuts.splice(at, 1);
			cuts.unshift(cfg.leadTitle ? { ...lead, title: cfg.leadTitle } : lead);
			led = true;
		}
	}
	// The app's trailer (app.json), when it is portrait and not in these slots already: it
	// stands in for the same cut in another shape, or else follows the lead.
	const trailer = typeof entry.trailer === 'string' ? video(entry.trailer) : null;
	if (
		trailer &&
		/\.mp4$/i.test(trailer.rel) &&
		trailer.height > trailer.width &&
		!cuts.some((c) => c.rel === trailer.rel)
	) {
		const cut = { ...trailer, title: cutTitle(trailer.name), promo: true };
		const twin = cuts.findIndex((c) => c.promo && sameLength(c, trailer));
		if (twin < 0) cuts.splice(led ? 1 : 0, 0, cut);
		// A lighter rendition of that cut is already there: it stays.
		else if (cuts[twin].bytes >= trailer.bytes)
			cuts[twin] = cuts[twin].title && !cut.title ? { ...cut, title: cuts[twin].title } : cut;
	}

	const stores = {};
	const ios = httpsLink(entry.stores?.appstore);
	const android = httpsLink(entry.stores?.play);
	if (ios) stores.ios = ios;
	if (android) stores.android = android;

	return {
		site: httpsLink(entry.site) || null,
		stores,
		icon: typeof entry.icon === 'string' && entry.icon ? url(entry.icon) : null,
		videos: cuts.map((c) => ({
			src: c.src,
			poster: c.poster,
			width: c.width || 1080,
			height: c.height || 1920,
			...(c.title ? { title: c.title } : {}),
			promo: c.promo
		}))
	};
}

/**
 * Every bucket-backed project that could be read, by project id. One that couldn't (its
 * bucket is down, the app left the index, the listing failed) is simply absent, and the site
 * shows what it has in code for it.
 * @returns {Promise<Record<string, BucketProject>>}
 */
export async function readBucketProjects() {
	const indexes = new Map();
	const indexOf = (bucket) => {
		if (!indexes.has(bucket)) indexes.set(bucket, readIndex(bucket));
		return indexes.get(bucket);
	};
	/** @type {Record<string, BucketProject>} */
	const projects = {};
	await Promise.all(
		Object.entries(BUCKET_PROJECTS).map(async ([id, cfg]) => {
			try {
				const entry = (await indexOf(cfg.bucket)).get(cfg.app);
				if (!entry) throw new Error(`${cfg.app} is not in ${cfg.bucket}/index.json`);
				// The stage app.json points into: assets (approved), or review for an app with
				// nothing approved yet.
				const stage = /^([a-z]+)\//.exec(entry.trailer || entry.icon || '')?.[1] || 'assets';
				projects[id] = projectFromBucket(cfg, entry, await listStage(cfg.bucket, cfg.app, stage), stage);
			} catch (err) {
				console.warn('[media]', id, err?.message);
			}
		})
	);
	return projects;
}
