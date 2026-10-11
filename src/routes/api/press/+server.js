import { json, error } from '@sveltejs/kit';
import { PRESS_PAGES, parsePressVideos } from '$lib/server/press';

// The press pages mostly don't allow cross-origin reads, so the project view asks here.
// Results are kept for an hour per instance, and the CDN keeps them as long.
const TTL_MS = 60 * 60 * 1000;
const cache = new Map();

export async function GET({ url, fetch }) {
	const project = url.searchParams.get('project');
	const pageUrl = PRESS_PAGES[project];
	if (!pageUrl) throw error(404, 'No press page for this project');

	const hit = cache.get(project);
	let videos = hit && Date.now() - hit.at < TTL_MS ? hit.videos : null;

	if (!videos) {
		try {
			const res = await fetch(pageUrl);
			if (!res.ok) throw new Error(`press page answered ${res.status}`);
			videos = parsePressVideos(await res.text(), pageUrl);
			cache.set(project, { at: Date.now(), videos });
		} catch (err) {
			console.warn('[press]', project, err?.message);
			// A stale list beats none; an empty one lets the view show just the promo cut.
			videos = hit?.videos || [];
		}
	}

	return json(
		{ videos },
		{ headers: { 'cache-control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400' } }
	);
}
