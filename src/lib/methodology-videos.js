// Narrated videos on how Andrea works with coding agents, served from this site
// (static/methodologies/, re-encoded for the web). Like Experience, they make one more
// "project": its own feed on /shorts (?project=methodologies) and, on a job link's row, the
// Methodologies card after Watch as shorts. Each video's note is the tree node it explains.

export const METHODOLOGIES_SLUG = 'methodologies';

export const METHODOLOGIES = {
	id: 'methodologies',
	slug: METHODOLOGIES_SLUG,
	name: 'Methodologies',
	line: 'Short narrated videos on how I work with AI agents.',
	/** The feed's own order; the card plays the first. Only videos Andrea has approved. */
	videos: [
		{
			key: 'brain',
			treeSlug: 'tools/the-brain',
			heading: 'Brain',
			role: 'A node-based knowledge tree',
			src: '/methodologies/brain.mp4',
			poster: '/methodologies/brain.jpg'
		},
		{
			key: 'media-harnesses',
			treeSlug: 'tools/media-harnesses',
			heading: 'Media harnesses',
			role: 'Agents that check their own work',
			src: '/methodologies/media-harnesses.mp4',
			poster: '/methodologies/media-harnesses.jpg'
		},
		{
			key: 'connectivity',
			treeSlug: 'architecture/deployment-pipelines',
			heading: 'Connectivity',
			role: 'Development from anywhere',
			src: '/methodologies/connectivity.mp4',
			poster: '/methodologies/connectivity.jpg'
		},
		{
			key: 'agentic-gateway',
			treeSlug: 'tools/agentic-gateway',
			heading: 'Agentic Gateway',
			role: 'Managing work across machines',
			src: '/methodologies/agentic-gateway.mp4',
			poster: '/methodologies/agentic-gateway.jpg'
		}
	].map((v) => ({ ...v, width: 1080, height: 1920 }))
};
