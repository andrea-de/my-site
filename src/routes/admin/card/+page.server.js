// Andrea's business card, shown from their phone at fairs: a QR that saves the contact, or, on
// a tap, opens the shorts feed on a tracked job link (?code=, default gts, the Welcome IT Day
// link). Admin only; the contact lines come from resume.json (gitignored), never the page source.
import { redirect } from '@sveltejs/kit';
import { hasAdminSession } from '$lib/server/admin';
import resume from '$lib/context/resume.json';

const SITE = 'https://www.andreadecandia.com';
const DEFAULT_CODE = 'gts';
const CODE = /^[a-z0-9]{2,8}$/;

export function load({ cookies, url, setHeaders }) {
	setHeaders({ 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex' });
	if (!hasAdminSession(cookies)) throw redirect(303, '/admin');

	const given = (url.searchParams.get('code') || '').toLowerCase();
	const code = CODE.test(given) ? given : DEFAULT_CODE;
	const contacts = resume.contact || [];
	const byIcon = (icon, region) =>
		contacts.find((c) => c.icon === icon && (!region || c.region === region)) || contacts.find((c) => c.icon === icon);
	const email = byIcon('email-img')?.text || '';
	const phone = byIcon('phone-img', url.searchParams.get('region') === 'us' ? 'us' : 'eu');

	return {
		code,
		name: 'Andrea de Candia',
		family: 'de Candia',
		given: 'Andrea',
		title: 'Full-Stack Product Engineer',
		email,
		phone: phone?.text || '',
		phoneHref: phone?.href || '',
		site: 'andreadecandia.com',
		shortsUrl: `${SITE}/shorts/${code}`
	};
}
