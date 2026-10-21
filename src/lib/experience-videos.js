// Narrated videos of Andrea's earlier roles, served from this site (static/experience/,
// re-encoded for the web). They make one more "project" after every product: the
// Experience card last in the project cards, and its own feed on /shorts
// (?project=experience). Titles and roles follow src/lib/brain/roles/*.md.

export const EXPERIENCE_SLUG = 'experience';

export const EXPERIENCE = {
	id: 'experience',
	slug: EXPERIENCE_SLUG,
	name: 'Experience',
	line: 'Short narrated videos of my work at Intellisense.io, Mesa Cloud, G+D and AIA.',
	/** The feed's own order; the card plays the first. */
	videos: [
		{
			key: 'intellisense',
			heading: 'Intellisense.io',
			role: 'Staff Software Engineer · 2020–2022',
			src: '/experience/intellisense.mp4',
			poster: '/experience/intellisense.jpg'
		},
		{
			key: 'mesa',
			heading: 'Mesa Cloud',
			role: 'Software Engineer · 2022–2023',
			src: '/experience/mesa.mp4',
			poster: '/experience/mesa.jpg'
		},
		{
			key: 'gandd',
			heading: 'Giesecke+Devrient',
			role: 'Full Stack Engineer · 2018–2020',
			src: '/experience/gandd.mp4',
			poster: '/experience/gandd.jpg'
		},
		{
			key: 'aia',
			heading: 'AIA',
			role: 'Junior Software Developer · 2018',
			src: '/experience/aia.mp4',
			poster: '/experience/aia.jpg'
		}
	].map((v) => ({ ...v, width: 1080, height: 1920 }))
};
