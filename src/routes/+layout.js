import { dev } from '$app/environment';
import { injectAnalytics } from '@vercel/analytics/sveltekit';

// Andrea's own browser (owner mode, see +layout.svelte) sends no analytics either.
injectAnalytics({
	mode: dev ? 'development' : 'production',
	beforeSend: (event) => (typeof window !== 'undefined' && window.__siteOwner ? null : event)
});

export const load = ({ data }) => data;
