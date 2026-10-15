import { applyOwnerParam } from '$lib/server/owner';

export async function handle({ event, resolve }) {
	applyOwnerParam(event);
	return resolve(event);
}
