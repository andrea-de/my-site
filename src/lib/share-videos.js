// Videos with a link of their own, for places that take a link but not a video (a LinkedIn
// job entry's media, a chat message): /shorts?video=<key>. The page opens on that video in its
// feed, playing muted with no cover, as a link to /shorts#<id> does; and because the key is in
// the query, which the server sees (a hash it doesn't), the server gives the page that video's
// title, description and 1200x627 card (static/share/<key>.png), which LinkedIn, Slack and
// chat apps show for the link. Cards are drawn from the video's own frames, captions off.
import { experienceShortHref } from '$lib/experience-videos';

/** key → the role note it plays (experience-videos.js) and what the link preview says */
export const SHARE_VIDEOS = {
	mesa: {
		treeSlug: 'roles/mesa-cloud',
		title: 'Rebuilding flag detection at Mesa Cloud',
		description:
			"A one-minute walkthrough of the flag detection service I pulled out of a monolith, and the checks it runs every day on school districts' student data."
	}
};

/**
 * The shareable video a URL names (?video=<key>), with the feed and item it opens on, or null.
 * @param {URL | undefined | null} url
 */
export function shareVideo(url) {
	const key = url?.searchParams.get('video')?.toLowerCase();
	const v = key ? SHARE_VIDEOS[key] : null;
	const hash = v ? experienceShortHref(v.treeSlug)?.split('#')[1] : null;
	if (!v || !hash) return null;
	return { key, ...v, project: 'experience', hash: `#${hash}`, image: `/share/${key}.png` };
}
