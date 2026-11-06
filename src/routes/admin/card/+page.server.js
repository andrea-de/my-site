// Andrea's business card, shown from their phone at fairs: a QR that saves the contact, or, on
// a tap, opens the shorts feed with a ?ref= tag (default "card"), which the visit tracker
// records as the visit's source. Not a job link: nothing greets anyone. Admin only; the contact
// lines come from resume.json (gitignored), never the page source.
import { redirect } from '@sveltejs/kit';
import { hasAdminSession } from '$lib/server/admin';
import resume from '$lib/context/resume.json';

const SITE = 'https://www.andreadecandia.com';
const DEFAULT_REF = 'card';
const REF = /^[a-z0-9-]{1,30}$/;

export function load({ cookies, url, setHeaders }) {
	setHeaders({ 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex' });
	if (!hasAdminSession(cookies)) throw redirect(303, '/admin');

	const given = (url.searchParams.get('ref') || '').toLowerCase();
	const ref = REF.test(given) ? given : DEFAULT_REF;
	const contacts = resume.contact || [];
	const byIcon = (icon, region) =>
		contacts.find((c) => c.icon === icon && (!region || c.region === region)) || contacts.find((c) => c.icon === icon);
	const email = byIcon('email-img')?.text || '';
	const phone = byIcon('phone-img', url.searchParams.get('region') === 'us' ? 'us' : 'eu');

	return {
		ref,
		name: 'Andrea de Candia',
		family: 'de Candia',
		given: 'Andrea',
		title: 'Full-Stack Product Engineer',
		email,
		phone: phone?.text || '',
		phoneHref: phone?.href || '',
		site: 'andreadecandia.com',
		shortsUrl: `${SITE}/shorts?ref=${ref}`
	};
}
