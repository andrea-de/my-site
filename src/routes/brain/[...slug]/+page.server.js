import { redirect } from '@sveltejs/kit';

export function load({ params }) {
	const slug = params.slug || '';
	let targetSlug = slug;
	if (targetSlug.startsWith('case-studies/foundry')) {
		targetSlug = targetSlug.replace('case-studies/foundry', 'prototypes/foundry');
	} else if (targetSlug.startsWith('case-studies/')) {
		targetSlug = targetSlug.replace('case-studies/', 'products/');
	} else if (targetSlug.startsWith('experience/')) {
		targetSlug = targetSlug.replace('experience/', 'roles/');
	}
	throw redirect(307, targetSlug ? `/tree/${targetSlug}` : '/tree');
}
