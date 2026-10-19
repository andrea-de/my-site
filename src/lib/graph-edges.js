// Which notes of the knowledge tree connect on the graph, and which of those are drawn at
// rest. Pure data in, data out, so the rules can be checked from Node:
//   node -e "import('./src/lib/graph-edges.js').then(...)"

// Things that were built. Two of them sharing a stack tag ("gemini", "vite") is noise:
// the stack already shows through the tech nodes they both connect to.
const WORK = new Set(['products', 'prototypes']);
// Tags that only name an area ("tools", "products") say nothing the tree doesn't.
const AREA_TAGS = ['products', 'tools', 'architecture', 'philosophy', 'roles', 'prototypes', 'tech'];

/**
 * @param {any[]} leaves manifest nodes, without the hub
 * @returns {any[]} topic links {source, target, k, s, x, rest}, strongest first
 */
export function topicLinks(leaves) {
	const areaTags = new Set([...AREA_TAGS, ...leaves.map((n) => n.category)]);
	// `links` are body links; `lineage` links ("where it carried on") don't count.
	const links = (a, b) => (a.links || []).includes(b.slug);
	/** @type {any[]} */
	const topics = [];
	for (let i = 0; i < leaves.length; i++)
		for (let j = i + 1; j < leaves.length; j++) {
			const [a, b] = [leaves[i], leaves[j]];
			const [ca, cb] = [a.category, b.category];
			const linked = links(a, b) || links(b, a);
			// Jobs connect to what they built and used, never to each other.
			if (ca === 'roles' && cb === 'roles') continue;
			// Products and prototypes never connect to each other.
			if (WORK.has(ca) && WORK.has(cb)) continue;
			// Two notes of one area (two tech, two tools) only when one names the other.
			if (ca === cb && !linked) continue;
			// A role connects only through what its note links to, not through tags alone.
			if (!linked && (ca === 'roles' || cb === 'roles')) continue;
			const shared = (a.tags || []).filter((t) => !areaTags.has(t) && (b.tags || []).includes(t)).length;
			const s = shared + (links(a, b) ? 2 : 0) + (links(b, a) ? 2 : 0);
			if (s >= 2) topics.push({ source: a.slug, target: b.slug, k: 'topic', s, x: ca !== cb });
		}
	topics.sort((p, q) => q.s - p.s || q.x - p.x);
	// Keep each note's strongest few at rest (roles and tech, the connective ones, a few
	// more), and at least one for any note that has a topic link at all.
	const capOf = (slug) => (/^(roles|tech)\//.test(slug) ? 5 : 3);
	const deg = new Map();
	const keep = (l) => {
		l.rest = true;
		for (const e of [l.source, l.target]) deg.set(e, (deg.get(e) || 0) + 1);
	};
	for (const l of topics)
		if ((deg.get(l.source) || 0) < capOf(l.source) && (deg.get(l.target) || 0) < capOf(l.target)) keep(l);
	for (const n of leaves)
		if (!deg.get(n.slug)) {
			const best = topics.find((l) => l.source === n.slug || l.target === n.slug);
			if (best) keep(best);
		}
	for (const l of topics) l.rest = !!l.rest;
	return topics;
}
