// Reads the social videos off a product's generated /press page. Each product's
// gallery generator writes a different page, so three shapes are recognised:
//   - embedded JSON assets: {"group":…,"kind":"video","title":…,"url":…,"poster":…,"width":…,"height":…}
//   - <figure data-kind="video" data-full="….mp4" data-poster=… data-meta="W×H · …" data-slot=…>
//   - <div class='slot'>Title</div><video src='….mp4'> … <figcaption>name<br>W×H · …
//   - <div class=vid><h3>Short — Title</h3><p class=dim>W×H · …</p> … <video data-src="….mp4">

export const PRESS_PAGES = {
	audiotales: 'https://tales.audio/press/',
	cruffled: 'https://www.cruffled.com/press/',
	squares: 'https://squareswaps.com/press/',
	weatherie: 'https://www.weatherie.com/press/'
};

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

// Social cuts sit in a shorts/ folder or are named short-*/social-* (JSON pages group them instead).
const looksSocial = (src) => /\/shorts\/|\/(short|social)[-_][^/]+\.mp4$/.test(src);

// "Social short · toxic and bossy" → "Toxic and bossy"; "circuits-avocado — cyberpunk" → "Circuits avocado".
const tidyTitle = (t) => {
	const s = t.includes(' · ')
		? t.split(' · ').slice(1).join(' · ')
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
		const size = dims(after.match(/<figcaption>[\s\S]*?<\/figcaption>/)?.[0]);
		if (!size) continue;
		const slots = [...before.matchAll(/class=["']slot["']>([^<]*)</g)];
		found.push({
			title: decode(slots.at(-1)?.[1] || ''),
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

	const seen = new Set();
	return found
		.filter((v) => v.social && v.src && !seen.has(v.src) && seen.add(v.src))
		.map(({ social, title, ...v }) => ({ ...v, title: tidyTitle(title) }));
}
