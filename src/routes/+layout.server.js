import { isOwner } from '$lib/server/owner';

// Pages show a faint ghost when Andrea's own browser (?ignore=true) is being ignored.
export function load({ url, cookies }) {
	return { owner: isOwner({ url, cookies }) };
}
