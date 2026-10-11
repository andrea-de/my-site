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

/**
 * The projects shown as cards, the same on the Welcome screen and in the Software
 * section: every visible project with a video or a real screenshot. To keep one out
 * of both, mark it "hidden" in projects.json.
 * @param {any[]} projects from showcaseProjects()
 * @param {Record<string, any>} videos project id → promo video
 */
export const withMedia = (projects, videos) => projects.filter((p) => p.image || videos[p.id]);
