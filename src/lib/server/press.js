// Reads the social videos off a product's generated /press page. Each product's
// gallery generator writes a different page, so several shapes are recognised:
//   - embedded JSON assets: {"group":…,"kind":"video","title":…,"url":…,"poster":…,"width":…,"height":…}
//   - <figure data-kind="video" data-full="….mp4" data-poster=… data-meta="W×H · …" data-slot=…>
//   - <div class='slot'>Title</div><video src='….mp4'> … <figcaption>name<br>W×H · …
//     (or <figcaption><b>Title</b><span class="meta">W×H · …)
//   - <div class=vid><h3>Short — Title</h3><p class=dim>W×H · …</p> … <video data-src="….mp4">
//   - <article class="video"> … <video poster=… src="….mp4"> … <h3>Title</h3><p class="meta">W×H · …
//     (files carry no "short" in a folder or prefix, so the portrait ones count as social)
//   - <article id=…><h2>Title · portrait</h2><p>W × H · …</p><video poster=…></video>
//     <button data-src="….mp4?v=…"> (the file loads on a tap; portrait ones count as social)
// The same cut published in several sizes (short-886x1920.mp4, short-1080x1920.mp4) is kept
// once, in the size closest to 9:16.

// The page list is shared with the browser, which only asks about projects that have one.
export { PRESS_PAGES } from '$lib/press-pages';

/** @typedef {{ src: string, poster: string | null, width: number, height: number, title: string }} PressVideo */

const decode = (s) =>
	s
		.replace(/&amp;/g, '&')
		.replace(/&quot;/g, '"')
		.replace(/&#x27;|&#39;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&nbsp;/g, ' ');

const attr = (tag, name) => {
	const m = tag.match(new RegExp(`${name}=(["'])(.*?)\\1`));
	return m ? decode(m[2]) : null;
};

const dims = (text) => {
	const m = text?.match(/(\d{3,4})\s*[×x]\s*(\d{3,4})/);
	return m ? { width: Number(m[1]), height: Number(m[2]) } : null;
};

// Social cuts sit in a shorts/ folder or are named short-*/social-* (JSON pages group them instead);
// a portrait trailer (the store preview) belongs with them.
const looksSocial = (src) =>
	/\/shorts\/|\/(short|social)[-_][^/]+\.mp4$|\/trailer[-_]portrait\.mp4$/.test(src);

// "Social short · toxic and bossy" (or "Social pilot · …") → "Toxic and bossy";
// "Short version · Play and social" → "Short version"; "circuits-avocado — cyberpunk" →
// "Circuits avocado".
const tidyTitle = (t) => {
	const [kind, ...rest] = t.split(' · ');
	const s = rest.length
		? /^(social\b.*|short)$/i.test(kind.trim())
			? rest.join(' · ')
			: kind
		: t.split(' — ')[0].replace(/-/g, ' ');
	return s.charAt(0).toUpperCase() + s.slice(1);
};

/** @returns {PressVideo[]} */
export function parsePressVideos(html, pageUrl) {
	const base = new URL(attr(html.match(/<base[^>]*>/)?.[0] || '', 'href') || pageUrl, pageUrl);
	const abs = (u) => (u ? new URL(u, base).href : null);
	/** @type {(PressVideo & { social: boolean })[]} */
	const found = [];

	for (const [, group, title, url, poster, width, height] of html.matchAll(
		/"group":"([^"]*)","kind":"video","title":"((?:[^"\\]|\\.)*)","url":"([^"]+)","poster":"([^"]*)","width":(\d+),"height":(\d+)/g
	)) {
		found.push({
			title: JSON.parse(`"${title}"`),
			social: group.includes('social'),
			src: abs(url),
			poster: abs(poster || null),
			width: Number(width),
			height: Number(height)
		});
	}

	for (const [tag] of html.matchAll(/<figure\b[^>]*data-kind=["']video["'][^>]*>/g)) {
		const src = attr(tag, 'data-full');
		const size = dims(attr(tag, 'data-meta')) || dims(src);
		if (!src || !size) continue;
		found.push({
			title: attr(tag, 'data-slot') || attr(tag, 'data-name') || '',
			social: looksSocial(abs(src)),
			src: abs(src),
			poster: abs(attr(tag, 'data-poster')),
			...size
		});
	}

	for (const m of html.matchAll(/<video\b[^>]*\ssrc=(["'])([^"']+\.mp4)\1[^>]*>/g)) {
		const before = html.slice(Math.max(0, m.index - 400), m.index);
		const after = html.slice(m.index, m.index + 600);
		// Long captions can run past the window; their opening (title, size) is enough.
		const caption = after.match(/<figcaption>[\s\S]*?(?:<\/figcaption>|$)/)?.[0];
		const size = dims(caption);
		if (!size) continue;
		const slots = [...before.matchAll(/class=["']slot["']>([^<]*)</g)];
		// "Feature trailer, 9:16 (store preview)" → "Feature trailer".
		const bold = caption?.match(/<b>([^<]*)<\/b>/)?.[1]?.replace(/,\s*\d+:\d+.*$/, '');
		found.push({
			title: decode(slots.at(-1)?.[1] || bold || ''),
			social: looksSocial(m[2]),
			src: abs(m[2]),
			poster: abs(attr(m[0], 'poster')),
			...size
		});
	}

	for (const [, heading, meta, src] of html.matchAll(
		/<div class=["']?vid["']?>\s*<h3>([^<]*)<\/h3>\s*<p[^>]*>([^<]*)<\/p>[\s\S]{0,200}?<video\b[^>]*\sdata-src=["']?([^"'\s>]+\.mp4)/g
	)) {
		const size = dims(meta);
		if (!size) continue;
		found.push({
			// "Short — Rain, but make it Van Gogh": the kind goes, the name stays.
			title: decode(heading).replace(/^(short|social)\s*[—–-]\s*/i, ''),
			social: looksSocial(abs(src)),
			src: abs(src),
			poster: null,
			...size
		});
	}

	for (const [, tag, heading, meta] of html.matchAll(
		/<article class=["']video["']>[\s\S]{0,120}?(<video\b[^>]*>)[\s\S]{0,120}?<h3>([^<]*)<\/h3>\s*<p class=["']meta["']>([^<]*)/g
	)) {
		const src = attr(tag, 'src');
		const size = dims(meta);
		if (!src || !size) continue;
		found.push({
			title: decode(heading),
			social: size.height > size.width,
			src: abs(src),
			poster: abs(attr(tag, 'poster')),
			...size
		});
	}

	for (const [, heading, meta, tag, src] of html.matchAll(
		/<article\b[^>]*>\s*<h2>([^<]*)<\/h2>\s*<p>([^<]*)<\/p>\s*(<video\b[^>]*>)[\s\S]{0,300}?\sdata-src=["']([^"']+\.mp4[^"']*)["']/g
	)) {
		const size = dims(meta);
		if (!size) continue;
		found.push({
			// "Phone render · portrait": the orientation goes, the size says it.
			title: decode(heading).replace(/\s*·\s*(portrait|landscape|square)$/i, ''),
			social: size.height > size.width,
			src: abs(src),
			poster: abs(attr(tag, 'poster')),
			...size
		});
	}

	// The same cut in another size: one file name once its WxH and query are taken out.
	const cut = (src) => src.split('?')[0].replace(/[-_]?\d{3,4}x\d{3,4}(?=\.mp4$)/, '');
	const shape = (v) => Math.abs(v.width / v.height - 9 / 16);
	const best = new Map();
	for (const v of found) {
		if (!v.social || !v.src) continue;
		const kept = best.get(cut(v.src));
		if (!kept || shape(v) < shape(kept)) best.set(cut(v.src), v);
	}
	return [...best.values()]
		.sort((a, b) => found.indexOf(a) - found.indexOf(b))
		.map(({ social, title, ...v }) => ({ ...v, title: tidyTitle(title) }));
}
