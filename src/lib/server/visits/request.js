import { clampNumber } from './shared';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function wantsUniqueOnly(url) {
	const value = (url.searchParams.get('unique') || '').trim().toLowerCase();
	return value === '1' || value === 'true' || value === 'yes';
}

export function wantsJson(request, url) {
	if (url.searchParams.get('format') === 'json') return true;
	return request.headers.get('accept')?.includes('application/json') || false;
}

export function parseDashboardRequest(url) {
	return {
		limit: clampNumber(url.searchParams.get('limit'), 20, 1, 100),
		uniqueOnly: wantsUniqueOnly(url),
		date: DATE_PATTERN.test(url.searchParams.get('date') || '')
			? url.searchParams.get('date')
			: new Date().toISOString().slice(0, 10),
		wasWiped: url.searchParams.get('wiped') === '1'
	};
}
