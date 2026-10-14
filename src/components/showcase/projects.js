import projectsData from '$lib/context/projects.json';

// Stills for cards whose project has no promo video yet (or before the catalogue loads).
const PROJECT_IMAGES = {
	audiotales: 'audiotales.webp',
	gametsunami: 'game-modern.png',
	squares: 'squares.png',
	tackry: 'tackry-1.png',
	cruffled: 'cruffled.png',
	weatherie: 'weatherie.png'
};

/**
 * Visible projects in projects.json order, ready for the cards and the project view.
 * @param {(project: any) => boolean} [include]
 */
export function showcaseProjects(include = () => true) {
	return projectsData
		.filter((p) => !p.hidden && include(p))
		.map((p) => ({
			...p,
			image: PROJECT_IMAGES[p.id] || null,
			href: p.treeSlug ? `/tree/${p.treeSlug}` : p.url
		}));
}

/** A project's link on the home page, from its name: "Rogue Calculator" → #rogue-calculator. */
export const projectSlug = (p) =>
	p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** The project a "#rogue-calculator" (or its id) names, or undefined. */
export const projectForHash = (projects, hash) => {
	const key = decodeURIComponent(hash.replace(/^#/, '')).toLowerCase();
	return key ? projects.find((p) => projectSlug(p) === key || p.id === key) : undefined;
};

/**
 * The projects shown as cards, the same on the Welcome screen and in the Software
 * section: every visible project with a video or a real screenshot. To keep one out
 * of both, mark it "hidden" in projects.json.
 * @param {any[]} projects from showcaseProjects()
 * @param {Record<string, any>} videos project id → promo video
 */
export const withMedia = (projects, videos) => projects.filter((p) => p.image || videos[p.id]);
