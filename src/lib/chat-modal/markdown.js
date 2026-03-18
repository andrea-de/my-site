import { marked } from 'marked';

marked.setOptions({
	gfm: true,
	breaks: true
});

export function renderMarkdown(content) {
	return marked(content);
}
