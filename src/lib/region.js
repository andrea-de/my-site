// Visitors in Europe get the European résumé (cv.pdf, Spanish number); everyone else the
// US one (resume.pdf). Vercel names the visitor's country in a request header.

// The EU and EEA, the UK and Switzerland, the microstates and the rest of Europe west of
// Russia and Belarus (Turkey counted out).
const EUROPE = new Set(
	'AD AL AT AX BA BE BG CH CY CZ DE DK EE ES FI FO FR GB GG GI GR HR HU IE IM IS IT JE LI LT LU LV MC MD ME MK MT NL NO PL PT RO RS SE SI SK SM UA VA XK'.split(
		' '
	)
);

/**
 * 'eu' or 'us' for this request; ?region=eu or ?region=us overrides it (for checking).
 * @param {Request} request
 * @param {URL} [url]
 */
export function resumeRegion(request, url) {
	const asked = url?.searchParams.get('region');
	if (asked === 'eu' || asked === 'us') return asked;
	return EUROPE.has(request.headers.get('x-vercel-ip-country') || '') ? 'eu' : 'us';
}

/** Contact entries for a region: one tagged "region" shows only in that region's version. */
export const contactsFor = (contacts = [], region) =>
	contacts.filter((c) => !c.region || c.region === region);

/** The PDF and its preview image for a region. */
export const resumeFiles = (region) =>
	region === 'eu'
		? { pdf: '/cv.pdf', preview: '/cv-preview.png' }
		: { pdf: '/resume.pdf', preview: '/resume-preview.png' };
