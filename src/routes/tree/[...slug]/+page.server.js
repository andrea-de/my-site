import { error } from '@sveltejs/kit';
import { marked } from 'marked';
import manifest from '$lib/brain/manifest.json';

const brainFiles = import.meta.glob('$lib/brain/**/*.md', { query: '?raw', eager: true });

function parseFrontmatter(fileContent) {
	const match = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
	if (!match) return { data: {}, body: fileContent };

	const rawYaml = match[1];
	const body = match[2];
	const data = {};

	for (const line of rawYaml.split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const colonIdx = trimmed.indexOf(':');
		if (colonIdx === -1) continue;
		const key = trimmed.slice(0, colonIdx).trim();
		let val = trimmed.slice(colonIdx + 1).trim();

		if (val.startsWith('[') && val.endsWith(']')) {
			data[key] = val
				.slice(1, -1)
				.split(',')
				.map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
				.filter(Boolean);
		} else if (val === 'true') {
			data[key] = true;
		} else if (val === 'false') {
			data[key] = false;
		} else {
			data[key] = val.replace(/^['"]|['"]$/g, '');
		}
	}

	return { data, body };
}

function escapeHtml(str) {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

export function load({ params }) {
	const targetSlug = (params.slug || '').replace(/\/$/, '');

	// Match node in manifest
	const node = manifest.nodes.find((n) => n.slug === targetSlug || n.slug.endsWith(`/${targetSlug}`));

	if (!node) {
		throw error(404, `Knowledge Tree node not found: "${targetSlug}"`);
	}

	// Locate file in glob
	let rawFileContent = null;
	for (const [filePath, fileModule] of Object.entries(brainFiles)) {
		if (filePath.endsWith(node.relPath)) {
			rawFileContent = typeof fileModule === 'string' ? fileModule : fileModule.default;
			break;
		}
	}

	if (!rawFileContent) {
		throw error(404, `Markdown file not found for: "${node.relPath}"`);
	}

	const { body } = parseFrontmatter(rawFileContent);

	// Setup marked renderer
	const renderer = {
		heading({ text, depth }) {
			const id = text
				.toLowerCase()
				.replace(/[^\w\s-]/g, '')
				.replace(/\s+/g, '-');
			return `<h${depth} id="${id}">${text}</h${depth}>\n`;
		},
		code({ text, lang }) {
			if (lang === 'mermaid') {
				return `<div class="mermaid-container"><pre class="mermaid">${escapeHtml(text)}</pre></div>\n`;
			}
			const language = lang || 'text';
			const encoded = encodeURIComponent(text);
			return `
				<div class="code-block-wrapper">
					<div class="code-block-header">
						<span class="code-lang">${language}</span>
						<button class="copy-code-btn" data-code="${encoded}" type="button" aria-label="Copy code">
							<span>Copy</span>
						</button>
					</div>
					<pre><code class="language-${language}">${escapeHtml(text)}</code></pre>
				</div>
			`;
		},
		link({ href, title, text }) {
			const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
			let finalHref = href;
			if (href.endsWith('.md')) {
				finalHref = href.replace(/\.md$/, '');
				if (!finalHref.startsWith('/') && !finalHref.startsWith('http')) {
					finalHref = `/tree/${finalHref}`;
				}
			} else if (href.startsWith('/brain/')) {
				finalHref = href.replace(/^\/brain\//, '/tree/');
			}
			const isExternal = finalHref.startsWith('http');
			const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
			return `<a href="${finalHref}"${titleAttr}${targetAttr}>${text}</a>`;
		}
	};

	marked.use({ renderer, gfm: true, breaks: true });
	const html = marked.parse(body);

	// Find related nodes
	const relatedNodes = manifest.nodes
		.filter((n) => n.slug !== node.slug && n.category !== 'hub')
		.map((n) => {
			let score = 0;
			if (n.category === node.category) score += 2;
			const sharedTags = (n.tags || []).filter((t) => (node.tags || []).includes(t));
			score += sharedTags.length * 3;
			return { ...n, score, sharedTags };
		})
		.filter((n) => n.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, 3);

	return {
		node,
		html,
		relatedNodes
	};
}
