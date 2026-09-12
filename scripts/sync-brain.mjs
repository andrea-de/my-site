import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const BRAIN_PUBLIC_PATH = process.env.BRAIN_PUBLIC_PATH || path.join(os.homedir(), 'brain', 'public');
const TARGET_DIR = path.resolve('src/lib/brain');

console.log(`[sync-brain] Source: ${BRAIN_PUBLIC_PATH}`);
console.log(`[sync-brain] Target: ${TARGET_DIR}`);

if (!fs.existsSync(BRAIN_PUBLIC_PATH)) {
	console.error(`[sync-brain] Error: Source path does not exist: ${BRAIN_PUBLIC_PATH}`);
	process.exit(1);
}

// Leak detection patterns
const SENSITIVE_PATTERNS = [
	{ name: 'Private IP', regex: /\b(?:192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})\b/ },
	{ name: 'Env File / Secret Assignment', regex: /(?:^|\n)\s*(?:[A-Z0-9_]*(?:KEY|SECRET|PASSWORD|TOKEN|AUTH)[A-Z0-9_]*\s*=)/i },
	{ name: 'Private Machine Hostname', regex: /\b(?:machines\/(?:hel|nur|xps|mac)\.md)\b/i },
	{ name: 'Private Brain Traversal', regex: /\.\.\/(?:machines|personal|projects|ci\.md|credentials\.md)/i },
	{ name: 'Credential File Reference', regex: /\bcredentials\.md\b/i }
];

function parseFrontmatter(fileContent, filePath) {
	const match = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
	if (!match) {
		throw new Error(`Missing frontmatter in ${filePath}`);
	}

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

function extractHeadings(markdown) {
	const headings = [];
	const headingRegex = /^(#{1,6})\s+(.+)$/gm;
	let match;
	while ((match = headingRegex.exec(markdown)) !== null) {
		const depth = match[1].length;
		const text = match[2].trim();
		const id = text
			.toLowerCase()
			.replace(/[^\w\s-]/g, '')
			.replace(/\s+/g, '-');
		headings.push({ depth, text, id });
	}
	return headings;
}

function scanDir(dir, relativeDir = '') {
	const files = [];
	const items = fs.readdirSync(dir, { withFileTypes: true });

	for (const item of items) {
		const fullPath = path.join(dir, item.name);
		const relPath = path.join(relativeDir, item.name);

		if (item.isDirectory()) {
			files.push(...scanDir(fullPath, relPath));
		} else if (item.isFile() && item.name.endsWith('.md')) {
			files.push({ fullPath, relPath });
		}
	}
	return files;
}

// 1. Scan files
const markdownFiles = scanDir(BRAIN_PUBLIC_PATH);
console.log(`[sync-brain] Discovered ${markdownFiles.length} markdown files.`);

const manifestNodes = [];
const allCategories = new Set();
const allTags = new Set();

// 2. Validate and process
for (const file of markdownFiles) {
	const content = fs.readFileSync(file.fullPath, 'utf8');

	// Leak checks
	for (const pattern of SENSITIVE_PATTERNS) {
		if (pattern.regex.test(content)) {
			throw new Error(`[Leak Detector] Sensitive pattern "${pattern.name}" detected in ${file.relPath}`);
		}
	}

	const { data, body } = parseFrontmatter(content, file.relPath);

	if (!data.slug || !data.title || !data.category) {
		throw new Error(`[Schema Error] ${file.relPath} missing mandatory frontmatter fields (slug, title, category)`);
	}

	const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
	const readingTime = Math.max(1, Math.ceil(wordCount / 200));
	const headings = extractHeadings(body);

	allCategories.add(data.category);
	if (Array.isArray(data.tags)) {
		for (const tag of data.tags) allTags.add(tag);
	}

	manifestNodes.push({
		slug: data.slug,
		title: data.title,
		category: data.category,
		description: data.description || '',
		tags: data.tags || [],
		featured: Boolean(data.featured),
		updated: data.updated || '',
		wordCount,
		readingTime: `${readingTime} min read`,
		headings,
		relPath: file.relPath
	});
}

// 3. Clean and populate TARGET_DIR
if (fs.existsSync(TARGET_DIR)) {
	fs.rmSync(TARGET_DIR, { recursive: true, force: true });
}
fs.mkdirSync(TARGET_DIR, { recursive: true });

for (const file of markdownFiles) {
	const destPath = path.join(TARGET_DIR, file.relPath);
	fs.mkdirSync(path.dirname(destPath), { recursive: true });
	fs.copyFileSync(file.fullPath, destPath);
}

// 4. Build manifest.json
const manifest = {
	generatedAt: new Date().toISOString(),
	totalCount: manifestNodes.length,
	categories: Array.from(allCategories).sort(),
	tags: Array.from(allTags).sort(),
	nodes: manifestNodes.sort((a, b) => {
		if (a.category === 'hub' && b.category !== 'hub') return -1;
		if (b.category === 'hub' && a.category !== 'hub') return 1;
		return (b.updated || '').localeCompare(a.updated || '');
	})
};

const manifestPath = path.join(TARGET_DIR, 'manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

console.log(`[sync-brain] Successfully synced ${manifestNodes.length} nodes to ${TARGET_DIR}`);
console.log(`[sync-brain] Manifest written: ${manifestPath}`);
