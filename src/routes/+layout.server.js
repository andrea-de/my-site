import { isOwner } from '$lib/server/owner';

// Pages show a faint ghost when Andrea's own browser (marked at /admin) is being ignored.
export function load({ cookies }) {
	return { owner: isOwner({ cookies }) };
}
