// The /shorts loading effect, one of three while Andrea compares them: Sheen, Prism or Develop.
// It shows on the cover while the feed loads and on a video whose frames haven't arrived. The
// cover is server-rendered and most of its wait passes before the page's code runs, so the
// pick is made by a tiny inline script in the page's <head> (PICK_SCRIPT), which sets
// html[data-loader] before the first paint; the cover's CSS keys on it. ?loader=sheen|prism|develop
// picks one.

export const LOADERS = ['sheen', 'prism', 'develop'];

export const PICK_SCRIPT = `(function(){try{var L=${JSON.stringify(
	LOADERS
)},d=document.documentElement,a=new URLSearchParams(location.search).get('loader');if(L.indexOf(a)<0&&L.indexOf(d.dataset.loader)>=0)return;d.dataset.loader=L.indexOf(a)>=0?a:L[Math.floor(Math.random()*L.length)]}catch(e){}})()`;

/**
 * This visit's effect. After a client-side navigation to /shorts the inline script never ran
 * (scripts added to the head that way don't), so the pick happens here.
 */
export function currentLoader() {
	if (typeof document === 'undefined') return LOADERS[0];
	const root = document.documentElement;
	if (!LOADERS.includes(root.dataset.loader)) {
		const asked = new URLSearchParams(location.search).get('loader');
		root.dataset.loader = LOADERS.includes(asked)
			? asked
			: LOADERS[Math.floor(Math.random() * LOADERS.length)];
	}
	return root.dataset.loader;
}
