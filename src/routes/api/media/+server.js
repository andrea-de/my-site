import { json } from '@sveltejs/kit';
import { BUCKET_PROJECTS } from '$lib/media-buckets';
import { readBucketProjects } from '$lib/server/media-buckets';

// What the shared media buckets hold for the site's projects (links, icon, videos), read
// when asked for, so a file swapped in a bucket shows here with no deploy. Kept five
// minutes per instance and by the CDN.
const TTL_MS = 5 * 60 * 1000;
let cached = { at: 0, projects: /** @type {Record<string, any>} */ ({}) };

export async function GET() {
	if (Date.now() - cached.at >= TTL_MS) {
		// A project that can't be read now keeps what was last read for it.
		const projects = { ...cached.projects, ...(await readBucketProjects()) };
		cached = { at: Date.now(), projects };
	}
	const whole = Object.keys(BUCKET_PROJECTS).every((id) => cached.projects[id]);
	// A partial answer (a bucket didn't respond) is not kept: the next request tries again.
	if (!whole) cached.at = 0;
	return json(
		{ projects: cached.projects },
		{
			headers: {
				'cache-control': whole
					? 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400'
					: 'public, max-age=0, s-maxage=20'
			}
		}
	);
}
