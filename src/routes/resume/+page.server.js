import { resumeRegion } from '$lib/region';

export function load({ request, url }) {
	return { region: resumeRegion(request, url) };
}
