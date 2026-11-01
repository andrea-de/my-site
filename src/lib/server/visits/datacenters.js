// Towns whose traffic is almost all cloud data centres, not people: a page load from one is
// an automated fetch (an email link checker opening a job link minutes after an application,
// Google re-rendering the home page every few days). Vercel's x-vercel-ip-city names them.
const DATACENTER_CITIES = new Set(
	[
		'Boydton', // Microsoft, Virginia
		'Moses Lake', // Microsoft, Washington
		'Quincy', // Microsoft, Washington
		'Cheyenne', // Microsoft, Wyoming
		'Council Bluffs', // Google, Iowa
		'The Dalles', // Google, Oregon
		'Lenoir', // Google, North Carolina
		'Pryor', // Google, Oklahoma
		'Papillion', // Google, Nebraska
		'Lithia Springs', // Google, Georgia
		'Boardman', // Amazon, Oregon
		'Umatilla', // Amazon, Oregon
		'Prineville' // Meta and Apple, Oregon
	].map((c) => c.toLowerCase())
);

/** Whether a (possibly URL-encoded) city header names a data-centre town. */
export function isDatacenterCity(city) {
	if (!city) return false;
	let name = String(city);
	try {
		name = decodeURIComponent(name);
	} catch {
		// keep the raw value
	}
	return DATACENTER_CITIES.has(name.trim().toLowerCase());
}
