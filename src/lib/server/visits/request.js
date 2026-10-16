import { clampNumber } from './shared';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const CODE_PATTERN = /^[a-z0-9]{3}$/;

export function wantsUniqueOnly(url) {
	const value = (url.searchParams.get('unique') || '').trim().toLowerCase();
	return value === '1' || value === 'true' || value === 'yes';
}

export function wantsJson(request, url) {
	if (url.searchParams.get('format') === 'json') return true;
	return request.headers.get('accept')?.includes('application/json') || false;
}

/** @param {URL} url @param {{ defaultLimit?: number }} [options] */
export function parseDashboardRequest(url, { defaultLimit = 20 } = {}) {
	return {
		limit: clampNumber(url.searchParams.get('limit'), defaultLimit, 1, 100),
		uniqueOnly: wantsUniqueOnly(url),
		date: DATE_PATTERN.test(url.searchParams.get('date') || '')
			? url.searchParams.get('date')
			: new Date().toISOString().slice(0, 10),
		wasWiped: url.searchParams.get('wiped') === '1',
		// Short visits with no sign of a person are kept but hidden unless asked for.
		includeUncounted: url.searchParams.get('uncounted') === '1',
		// Set by the redirect after a job-link action: which link, and what happened to it.
		jobNotice: CODE_PATTERN.test(url.searchParams.get('job') || '')
			? { code: url.searchParams.get('job'), result: url.searchParams.get('jobResult') || '' }
			: null
	};
}
