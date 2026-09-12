import { marked } from 'marked';

marked.use({
	renderer: {
		link({ href, title, tokens }) {
			const text = this.parser.parseInline(tokens);
			const titleAttr = title ? ` title="${title}"` : '';
			let finalHref = href || '';
			if (finalHref.startsWith('/brain/')) {
				finalHref = finalHref.replace(/^\/brain\//, '/tree/');
			}
			const isInternal =
				finalHref.startsWith('/') ||
				finalHref.startsWith('#') ||
				finalHref.includes('nur:4173') ||
				finalHref.includes('localhost:4173') ||
				finalHref.includes('andy-engineer.vercel.app') ||
				finalHref.includes('andrea-dev.com');
			const targetAttr = isInternal ? '' : ' target="_blank" rel="noopener noreferrer"';
			return `<a href="${finalHref}"${titleAttr}${targetAttr}>${text}</a>`;
		}
	}
});

marked.setOptions({
	gfm: true,
	breaks: true
});

export function renderMarkdown(content) {
	if (!content) return '';
	return marked.parse(content);
}
