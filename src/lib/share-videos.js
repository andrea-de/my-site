// Videos with a link of their own, for places that take a link but not a video (a LinkedIn
// job entry's media, a chat message): /shorts?video=<key>. The page opens on that video in its
// feed with no cover, waiting for a tap that plays it with sound, as a link to /shorts#<id> does.
// Because the key is in the query, which the server sees (a hash it doesn't), the server gives
// the page that video's title, description and 1200x627 card (static/share/<key>-stack.png), which
// LinkedIn, Slack and chat apps show for the link.
// A LinkedIn job entry shows the card about 108px wide with its own link icon over the centre,
// so a card is two of the role's technology icons, left and right, with the centre left empty,
// and the title carries the rest: what the video is about and that it is a short video. No
// company in the title: the link sits under that company's job entry.
// A redrawn card needs a new file name: LinkedIn keeps its copy of an image by address, so a
// new picture at the old address never shows (the first cards were /share/<key>.png).
import { experienceShortHref } from '$lib/experience-videos';

/** key → the role note it plays (experience-videos.js) and what the link preview says */
export const SHARE_VIDEOS = {
	intellisense: {
		treeSlug: 'roles/intellisense',
		title: 'Modeling mine stockpiles · 1-minute video',
		description:
			'A one-minute walkthrough of the library I wrote to convert between two stockpile models without losing tonnage or grade, and the Node services that kept the model live as ore was stacked and reclaimed.'
	},
	mesa: {
		treeSlug: 'roles/mesa-cloud',
		title: 'Rebuilding flag detection · 1-minute video',
		description:
			"A one-minute walkthrough of the flag detection service I pulled out of a monolith, and the checks it runs every day on school districts' student data."
	},
	gandd: {
		treeSlug: 'roles/gandd',
		title: 'Building secure mobility software · 1-minute video',
		description:
			"A one-minute walkthrough of the software I developed for a fingerprint reader, shown in G+D's demo at Mobile World Congress 2019, and the telecom messaging services and test framework I built."
	},
	aia: {
		treeSlug: 'roles/aia',
		title: 'Turning predictive models into products · 45-second video',
		description:
			"A 45-second walkthrough of the front end and services I built around a car maker's sales forecasting model, an RNA sequencing tool's interface and reports, and the infrastructure that linked model runs to their charts."
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
	return { key, ...v, project: 'experience', hash: `#${hash}`, image: `/share/${key}-stack.png` };
}
