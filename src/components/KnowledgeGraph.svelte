<script>
	// The knowledge tree as a living graph: points of light on fine threads. You at the
	// center, each area a ringed point with one orbiting light per node, every node linked to
	// its area and to nodes it shares topics with. Tap a node to light its strongest few
	// connections and open its card (which lists the rest); the card's × keeps the node
	// chosen until another node or empty space is tapped. Both modes pan, pinch and zoom
	// alike; "preview" is the home page's frame.
	import { onDestroy, onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY } from 'd3-force';
	import { select } from 'd3-selection';
	import { zoom as d3zoom, zoomIdentity } from 'd3-zoom';
	import 'd3-transition';
	import { fly } from 'svelte/transition';
	import { topicLinks } from '$lib/graph-edges.js';

	// d3 ships no types here; treat its builders as untyped.
	const selectAny = /** @type {any} */ (select);
	const forceLinkAny = /** @type {any} */ (forceLink);
	const zoomAny = /** @type {any} */ (d3zoom);

	/** @type {any[]} manifest nodes */
	export let nodes = [];
	/** @type {'full' | 'preview'} */
	export let mode = 'full';

	// Clockwise from the top, neighbours sharing the most links: roles beside the tech they
	// used, tech beside what it built, tools beside the products they ship.
	const CAT_ORDER = ['roles', 'tech', 'prototypes', 'products', 'tools', 'architecture', 'philosophy'];
	const RING = 150;
	const CAT_LABEL = {
		hub: 'Index',
		products: 'Products',
		roles: 'Roles',
		prototypes: 'Prototypes',
		tools: 'Tools',
		tech: 'Tech',
		architecture: 'Architecture',
		philosophy: 'Philosophy',
		'case-studies': 'Case studies'
	};
	// One cool family at equal lightness, teal through the site's indigo to pink.
	const CAT_COLOR = {
		hub: '#e0e7ff',
		products: '#a5b4fc',
		roles: '#6fdcc8',
		prototypes: '#d8b4fe',
		tools: '#7dd3e8',
		tech: '#86efac',
		architecture: '#93c5fd',
		philosophy: '#f5a8d0',
		'case-studies': '#c4b5fd'
	};

	let stage;
	let canvas;
	/** @type {any} the open card's node */
	let card = null;
	// Whether the card lists every connection, grouped by area.
	let expanded = false;

	const hubNode = nodes.find((n) => n.category === 'hub');
	const leaves = nodes.filter((n) => n.category !== 'hub');
	const cats = CAT_ORDER.filter((c) => leaves.some((n) => n.category === c)).concat(
		[...new Set(leaves.map((n) => n.category))].filter((c) => !CAT_ORDER.includes(c))
	);

	const label = (n) => n.short || n.title.split(':')[0];
	const titleOf = (n) => n.title.split(':')[0].trim();
	const subtitleOf = (n) => (n.title.includes(':') ? n.title.slice(n.title.indexOf(':') + 1).trim() : '');
	const hrefOf = (n) => (n.slug === 'INDEX' ? '/tree' : `/tree/${n.slug}`);

	// Graph data: you, your areas, every node; tree links, plus topic links between notes
	// that link to each other or share topics. Only each note's strongest few topic links are
	// drawn at rest; a chosen note lights its own strongest few.
	/** @type {any[]} positions are added by the simulation */
	const gNodes = [
		{ id: 'hub', s: hubNode ? label(hubNode) : 'Andrea', c: 'hub', kind: 'hub', node: hubNode, w: 0 },
		...cats.map((c) => ({ id: 'cat:' + c, s: CAT_LABEL[c] || c, c, kind: 'cat' })),
		...leaves.map((n) => ({ id: n.slug, s: label(n), c: n.category, kind: 'leaf', node: n, w: n.wordCount || 400 }))
	];
	const byId = new Map(gNodes.map((n) => [n.id, n]));
	/** @type {any[]} ends become node objects once the simulation starts */
	const gLinks = [
		...cats.map((c) => ({ source: 'hub', target: 'cat:' + c, k: 'tree' })),
		...leaves.map((n) => ({ source: 'cat:' + n.category, target: n.slug, k: 'tree' }))
	];
	/** @type {any[]} every topic link, strongest first; rules in $lib/graph-edges.js */
	const topics = topicLinks(leaves);
	gLinks.push(...topics.filter((l) => l.rest));
	/** @type {any[]} weaker links, drawn only while one end is chosen; ends resolved on mount */
	const moreLinks = topics.filter((l) => !l.rest);
	// A chosen note draws only its strongest few connections; the card lists the rest.
	const SHOW = 5;
	/** @type {Map<string, any[]>} each note's topic links, strongest first */
	const linksOf = new Map(leaves.map((n) => [n.slug, topics.filter((l) => l.source === n.slug || l.target === n.slug)]));
	const otherEnd = (l, id) => {
		const e = (l.source.id ?? l.source) === id ? l.target : l.source;
		return e.id ?? e;
	};
	/** @type {Set<any>} the topic links drawn lit for the chosen or hovered note */
	let focusLinks = new Set();
	const kidsOf = new Map(cats.map((c) => ['cat:' + c, leaves.filter((n) => n.category === c).length]));
	const size = (n) => (n.kind === 'hub' ? 9 : n.kind === 'cat' ? 5.5 : 2.6 + Math.sqrt(n.w) / 11);

	/** @type {any} */ let ctx;
	/** @type {any} */ let sim;
	/** @type {any} */ let zoomer;
	let w, h, dpr, raf, resizeObs, visObs;
	let t = zoomIdentity;
	/** @type {any} */ let selected = null;
	/** @type {any} */ let hover = null;
	let fitted = 0;
	let moved = false;
	let glow = 0;
	let visible = true;
	let reduced = false;
	/** @type {any[]} */
	const ripples = [];
	const stars = Array.from({ length: 140 }, () => ({
		x: (Math.random() - 0.5) * 2400,
		y: (Math.random() - 0.5) * 2400,
		r: Math.random() * 0.9 + 0.2,
		a: Math.random() * 0.4 + 0.1,
		p: Math.random() * 6.28
	}));

	const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
	const rgba = (hex, a) => `rgba(${rgb(hex).join(',')},${a})`;
	const tint = (hex, f) => `rgb(${rgb(hex).map((v) => Math.round(v + (255 - v) * f)).join(',')})`;
	const colorOf = (n) => CAT_COLOR[n.c] || '#a5b4fc';

	// The chosen node, its tree neighbours and the ends of its lit topic links.
	function near(n) {
		if (!n) return null;
		const ids = new Set([n.id]);
		for (const l of gLinks) {
			if (l.k !== 'tree') continue;
			if (l.source.id === n.id) ids.add(l.target.id);
			if (l.target.id === n.id) ids.add(l.source.id);
		}
		for (const l of focusLinks) ids.add(otherEnd(l, n.id));
		return ids;
	}

	function measure() {
		const r = canvas.getBoundingClientRect();
		dpr = window.devicePixelRatio || 1;
		w = r.width;
		h = r.height;
		canvas.width = Math.round(w * dpr);
		canvas.height = Math.round(h * dpr);
		ctx = canvas.getContext('2d');
		// Each area has a home on a ring around you, stretched to the stage's shape, and its
		// nodes gather there, so the areas read as clusters instead of one tangle.
		const portrait = h > w * 1.15;
		const [ex, ey] = portrait ? [0.75, 1.7] : [1.45, 0.85];
		// Spaced evenly along the ellipse, not by angle, so no two areas crowd its ends.
		const steps = 720;
		const pts = Array.from({ length: steps + 1 }, (_, i) => {
			const a = -Math.PI / 2 + (i / steps) * Math.PI * 2;
			return [Math.cos(a) * ex, Math.sin(a) * ey];
		});
		const run = [0];
		for (let i = 1; i <= steps; i++) run.push(run[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
		const spots = cats.map((_, c) => pts[run.findIndex((d) => d >= (c / cats.length) * run[steps])]);
		const home = (n, r) => {
			const i = cats.indexOf(n.c);
			if (n.kind === 'hub' || i < 0) return [w / 2, h / 2];
			return [w / 2 + spots[i][0] * r, h / 2 + spots[i][1] * r];
		};
		const ring = (n) => (n.kind === 'leaf' ? RING * 1.55 : RING);
		const pull = (n) => (n.kind === 'hub' ? 0.2 : n.kind === 'cat' ? 0.12 : 0.045);
		sim.force('x', forceX((n) => home(n, ring(n))[0]).strength(pull));
		sim.force('y', forceY((n) => home(n, ring(n))[1]).strength(pull));
		fitted = 0;
		moved = false;
		sim.alpha(0.8).restart();
	}

	function fit() {
		const pad = 26;
		const xs = gNodes.map((n) => n.x);
		const ys = gNodes.map((n) => n.y);
		const [x0, x1, y0, y1] = [Math.min(...xs) - 44, Math.max(...xs) + 44, Math.min(...ys) - 20, Math.max(...ys) + 30];
		const k = Math.min(2, (w - pad * 2) / (x1 - x0), (h - pad * 2) / (y1 - y0));
		const target = zoomIdentity.translate(w / 2 - ((x0 + x1) / 2) * k, h / 2 - ((y0 + y1) / 2) * k).scale(k);
		selectAny(canvas).transition().duration(reduced ? 0 : 700).call(zoomer.transform, target);
	}

	// Glide to the chosen node, above where its card sits.
	function focusOn(n) {
		const k = Math.max(t.k, 1.25);
		selectAny(canvas)
			.transition()
			.duration(reduced ? 0 : 650)
			.call(zoomer.transform, zoomIdentity.translate(w / 2 - n.x * k, h * 0.3 - n.y * k).scale(k));
	}

	// Choose a node (or none, from a tap on empty space): its card opens, and with no node
	// chosen the view zooms back out to the whole picture.
	function pick(id) {
		selected = id ? byId.get(id) || null : null;
		card = selected;
		expanded = false;
		if (selected) {
			focusOn(selected);
			ripples.push({ n: selected, t: performance.now() });
		} else if (fitted) {
			// Back to the whole picture once nothing is chosen.
			moved = false;
			fit();
		}
	}

	// The card's ×: the node stays chosen and lit until another node or empty space is tapped.
	function closeCard() {
		card = null;
	}

	function hitAt(px, py, radius) {
		const [x, y] = t.invert([px, py]);
		return sim.find(x, y, radius / t.k) || null;
	}

	function text(s, x, y, color, size, weight) {
		ctx.font = `${weight} ${size}px Inter, -apple-system, sans-serif`;
		ctx.fillStyle = color;
		ctx.fillText(s, x, y);
	}

	function point(x, y, r, col, a = 1) {
		const halo = ctx.createRadialGradient(x, y, 0, x, y, r * 3.2);
		halo.addColorStop(0, rgba(col, 0.42 * a));
		halo.addColorStop(1, rgba(col, 0));
		ctx.fillStyle = halo;
		ctx.beginPath();
		ctx.arc(x, y, r * 3.2, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = col;
		ctx.beginPath();
		ctx.arc(x, y, r, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = 'rgba(255,255,255,0.75)';
		ctx.beginPath();
		ctx.arc(x, y, r * 0.4, 0, Math.PI * 2);
		ctx.fill();
	}

	function pulse(x, y, col, a) {
		const g = ctx.createRadialGradient(x, y, 0, x, y, 3.2);
		g.addColorStop(0, rgba('#ffffff', a));
		g.addColorStop(0.35, rgba(col, a * 0.9));
		g.addColorStop(1, rgba(col, 0));
		ctx.fillStyle = g;
		ctx.beginPath();
		ctx.arc(x, y, 3.2, 0, Math.PI * 2);
		ctx.fill();
	}

	const along = (l, bx, by, f) => {
		const u = 1 - f;
		return [
			u * u * l.source.x + 2 * u * f * bx + f * f * l.target.x,
			u * u * l.source.y + 2 * u * f * by + f * f * l.target.y
		];
	};

	// Labels keep a steady on-screen size, so zooming in makes room for more of them.
	let labelF = 1;
	const labelY = (n, isFocus) => n.y + (n.kind === 'leaf' ? size(n) * (isFocus ? 1.2 : 1) + 6 : size(n) + 11);
	/** @type {Map<string, number>} label widths at 10px */
	const widths = new Map();
	function widthOf(n) {
		const key = n.kind + n.s;
		if (!widths.has(key)) {
			ctx.font = `700 10px Inter, -apple-system, sans-serif`;
			const s = n.kind === 'cat' ? n.s.toUpperCase().split('').join(String.fromCharCode(8202)) : n.s;
			widths.set(key, ctx.measureText(s).width / 10);
		}
		return widths.get(key);
	}
	/** @type {Map<any, number>} */
	let lastShown = new Map();
	/** @type {Map<any, number>} 0 below its point, 1 above */
	const sides = new Map();
	// Most important first (the chosen node, you, the areas, what's lit, then bigger notes);
	// a label that would overlap one already placed, or another node's point, waits.
	function placeLabels(focusNode, lit) {
		labelF = Math.pow(Math.min(2.5, Math.max(0.4, t.k)), -0.3);
		const rank = (n) =>
			n === focusNode ? 0 : n.kind === 'hub' ? 1 : n.kind === 'cat' ? 2 : lit && lit.has(n.id) ? 3 : 4;
		const order = [...gNodes].sort((a, b) => rank(a) - rank(b) || (b.w || 0) - (a.w || 0));
		/** @type {number[][]} */
		const boxes = [];
		/** @type {Map<any, number>} each shown label's top */
		const shown = new Map();
		for (const n of order) {
			const fs = (n.kind === 'hub' ? 13 : n.kind === 'cat' ? 9.5 : 10.5) * labelF;
			const half = (widthOf(n) * fs) / 2;
			const pad = (lastShown.has(n) ? 1 : 4) / t.k;
			const below = labelY(n, n === focusNode);
			const r = rank(n);
			const free = (/** @type {number[]} */ box) =>
				!boxes.some((b) => b[0] < box[2] && box[0] < b[2] && b[1] < box[3] && box[1] < b[3]) &&
				!gNodes.some((m) => {
					if (m === n) return false;
					const rr = size(m) * 0.7;
					const cx = Math.max(box[0], Math.min(m.x, box[2]));
					const cy = Math.max(box[1], Math.min(m.y, box[3]));
					return (m.x - cx) ** 2 + (m.y - cy) ** 2 < rr * rr;
				});
			// Below the point if there's room, else above it; the top ranks always show, below.
			// A label keeps the side it had last frame while that side stays free, so none flicker.
			const tries = r < 3 ? [below] : [below, 2 * n.y - below - fs * 1.15];
			if (sides.get(n) === 1) tries.reverse();
			for (const y0 of tries) {
				const box = [n.x - half - pad, y0 - pad, n.x + half + pad, y0 + fs * 1.15 + pad];
				if (r < 3 || free(box)) {
					shown.set(n, y0);
					sides.set(n, y0 === below ? 0 : 1);
					boxes.push(box);
					break;
				}
			}
		}
		lastShown = shown;
		return shown;
	}

	function frame(now) {
		raf = requestAnimationFrame(frame);
		if (!visible || !ctx) return;
		// Fit once early, then again when settled, unless the visitor has moved it.
		if (fitted === 0 && sim.alpha() < 0.12) {
			fitted = 1;
			fit();
		}
		if (fitted === 1 && sim.alpha() < 0.03) {
			fitted = 2;
			if (!moved && !selected) fit();
		}
		const focusNode = selected || hover;
		glow += ((focusNode ? 1 : 0) - glow) * 0.15;
		focusLinks = new Set(focusNode?.kind === 'leaf' ? linksOf.get(focusNode.id).slice(0, SHOW) : []);
		const lit = near(focusNode);
		const sec = now / 1000;
		const dimF = 1 - glow * 0.82;

		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, w, h);
		// Stars, drifting at half the pan.
		for (const s of stars) {
			const x = w / 2 + (s.x + (t.x - w / 2) * 0.5) * 0.4;
			const y = h / 2 + (s.y + (t.y - h / 2) * 0.5) * 0.4;
			if (x < -2 || y < -2 || x > w + 2 || y > h + 2) continue;
			ctx.globalAlpha = s.a * (reduced ? 1 : 0.7 + 0.3 * Math.sin(sec * 0.7 + s.p));
			ctx.fillStyle = '#c7d2fe';
			ctx.beginPath();
			ctx.arc(x, y, s.r, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.globalAlpha = 1;
		ctx.setTransform(dpr * t.k, 0, 0, dpr * t.k, dpr * t.x, dpr * t.y);

		// The glow around you moves with the graph.
		const hub = gNodes[0];
		const bg = ctx.createRadialGradient(hub.x, hub.y, 0, hub.x, hub.y, 320);
		bg.addColorStop(0, 'rgba(129,140,248,0.13)');
		bg.addColorStop(1, 'rgba(129,140,248,0)');
		ctx.fillStyle = bg;
		ctx.beginPath();
		ctx.arc(hub.x, hub.y, 320, 0, Math.PI * 2);
		ctx.fill();

		const lw = 1 / Math.max(1, t.k * 0.8);
		// Weaker links stay hidden unless they are among the chosen node's strongest few.
		const drawn = [...gLinks, ...[...focusLinks].filter((l) => !l.rest)];
		for (const l of drawn) {
			const on =
				!!lit && (l.k === 'tree' ? l.source.id === focusNode.id || l.target.id === focusNode.id : focusLinks.has(l));
			const mx = (l.source.x + l.target.x) / 2;
			const my = (l.source.y + l.target.y) / 2;
			const bx = mx - (l.target.y - l.source.y) * 0.08;
			const by = my + (l.target.x - l.source.x) * 0.08;
			const c1 = colorOf(l.source);
			const c2 = colorOf(l.target);
			const a = on ? 0.9 : (l.k === 'tree' ? 0.3 : 0.09) * dimF;
			const g = ctx.createLinearGradient(l.source.x, l.source.y, l.target.x, l.target.y);
			g.addColorStop(0, rgba(c1, a));
			g.addColorStop(1, rgba(c2, a));
			ctx.beginPath();
			ctx.moveTo(l.source.x, l.source.y);
			ctx.quadraticCurveTo(bx, by, l.target.x, l.target.y);
			ctx.strokeStyle = g;
			ctx.lineWidth = on ? lw * 1.6 : lw;
			ctx.stroke();
			if (reduced) continue;
			if (on) {
				// A selected node streams light out along every connection.
				const out = l.source.id === focusNode.id;
				for (let i = 0; i < 3; i++) {
					let f = (sec * 0.6 + i / 3) % 1;
					if (!out) f = 1 - f;
					const [x, y] = along(l, bx, by, f);
					pulse(x, y, out ? c2 : c1, 0.95);
				}
			} else if (l.k === 'tree') {
				const f = (sec * 0.25 + (l.target.index || 0) * 0.173) % 1;
				const [x, y] = along(l, bx, by, f);
				pulse(x, y, c2, 0.75 * (lit ? dimF : 1));
			}
		}

		for (let i = ripples.length - 1; i >= 0; i--) {
			const rp = ripples[i];
			const age = (now - rp.t) / 800;
			if (age > 1) {
				ripples.splice(i, 1);
				continue;
			}
			ctx.beginPath();
			ctx.arc(rp.n.x, rp.n.y, size(rp.n) + 4 + age * 30, 0, Math.PI * 2);
			ctx.strokeStyle = rgba(colorOf(rp.n), 0.6 * (1 - age));
			ctx.lineWidth = lw;
			ctx.stroke();
		}

		const shown = placeLabels(focusNode, lit);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		for (const n of gNodes) {
			const col = colorOf(n);
			const r = size(n);
			const isOn = !lit || lit.has(n.id);
			const isFocus = focusNode === n;
			ctx.globalAlpha = isOn ? 1 : dimF;
			const ringR = r + 5;
			if (n.kind === 'hub') {
				for (let i = 0; i < 2; i++) {
					const ph = reduced ? 0.5 : (sec * 0.22 + i / 2) % 1;
					ctx.beginPath();
					ctx.arc(n.x, n.y, ringR + ph * 22, 0, Math.PI * 2);
					ctx.strokeStyle = rgba(col, 0.4 * (1 - ph));
					ctx.lineWidth = lw;
					ctx.stroke();
				}
			}
			if (n.kind !== 'leaf' || isFocus) {
				ctx.beginPath();
				ctx.arc(n.x, n.y, ringR, 0, Math.PI * 2);
				ctx.strokeStyle = rgba(col, isFocus ? 0.9 : 0.55);
				ctx.lineWidth = lw;
				ctx.stroke();
			}
			point(n.x, n.y, isFocus && n.kind === 'leaf' ? r * 1.2 : r, col, isFocus ? 1.4 : 1);
			if (n.kind === 'cat' && !reduced) {
				const m = kidsOf.get(n.id);
				for (let i = 0; i < m; i++) {
					const a = sec * 0.45 + (i / m) * Math.PI * 2;
					ctx.fillStyle = col;
					ctx.beginPath();
					ctx.arc(n.x + Math.cos(a) * ringR, n.y + Math.sin(a) * ringR, 1.3, 0, Math.PI * 2);
					ctx.fill();
				}
			}
			const ly = shown.get(n);
			if (ly === undefined) {
				// No room for this label at this zoom: it appears on zoom, hover or tap.
			} else if (n.kind === 'cat') {
				ctx.font = `700 ${9.5 * labelF}px Inter, -apple-system, sans-serif`;
				ctx.fillStyle = col;
				ctx.fillText(n.s.toUpperCase().split('').join(String.fromCharCode(8202)), n.x, ly);
			} else {
				text(
					n.s,
					n.x,
					ly,
					isFocus || n.kind === 'hub' ? '#ffffff' : tint(col, lit && isOn ? 0.75 : 0.55),
					(n.kind === 'hub' ? 13 : 10.5) * labelF,
					isFocus || n.kind === 'hub' || (lit && isOn) ? 700 : 500
				);
			}
			ctx.globalAlpha = 1;
		}
	}

	// A tap: pointer down and up close together, so it works with touch, mouse and the zoom.
	/** @type {any} */ let tapStart = null;
	function onPointerDown(e) {
		tapStart = { x: e.clientX, y: e.clientY, t: performance.now() };
	}
	function onPointerUp(e) {
		if (tapStart && Math.hypot(e.clientX - tapStart.x, e.clientY - tapStart.y) < 8 && performance.now() - tapStart.t < 500) {
			const r = canvas.getBoundingClientRect();
			const hit = hitAt(e.clientX - r.left, e.clientY - r.top, 30);
			pick(hit ? hit.id : null);
		}
		tapStart = null;
	}
	function onPointerMove(e) {
		if (e.pointerType !== 'mouse') return;
		const r = canvas.getBoundingClientRect();
		hover = hitAt(e.clientX - r.left, e.clientY - r.top, 18);
		canvas.style.cursor = hover ? 'pointer' : 'grab';
	}

	function openNode(n) {
		if (n.node) goto(hrefOf(n.node));
	}

	/** @type {any[]} the open card's connected notes, strongest first */
	$: conns = card?.kind === 'leaf' ? linksOf.get(card.id).map((l) => byId.get(otherEnd(l, card.id))) : [];
	$: groups = cats.map((c) => [c, conns.filter((n) => n.c === c)]).filter(([, ns]) => ns.length);

	onMount(() => {
		reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		for (const l of moreLinks) {
			l.source = byId.get(l.source);
			l.target = byId.get(l.target);
		}
		sim = forceSimulation(gNodes)
			.force(
				'link',
				forceLinkAny(gLinks)
					.id((d) => d.id)
					.distance((l) => (l.k === 'tree' ? (l.source.kind === 'hub' ? RING : 62) : 120))
					.strength((l) => (l.k === 'tree' ? (l.source.kind === 'hub' ? 0.25 : 0.5) : Math.min(0.08, 0.012 * l.s)))
			)
			.force(
				'charge',
				forceManyBody()
					.strength((d) => (d.kind === 'hub' ? -500 : d.kind === 'cat' ? -260 : -110))
					.distanceMax(320)
			)
			// Room for each label as well as the point.
			.force(
				'collide',
				forceCollide()
					.radius((d) => Math.max(size(d) + 16, d.s.length * (d.kind === 'cat' ? 4.2 : 3.2)))
					.iterations(2)
			)
			.alphaDecay(0.02)
			.stop();

		zoomer = zoomAny()
			.scaleExtent([0.4, 4])
			// Drag and pinch; the wheel zooms only with Ctrl (and trackpad pinch), so plain
			// scrolling still moves the page.
			.filter((e) => (e.type === 'wheel' ? e.ctrlKey : !e.button))
			.on('zoom', (e) => {
				t = e.transform;
				if (e.sourceEvent) moved = true;
			});
		selectAny(canvas).call(zoomer).on('dblclick.zoom', null);

		measure();
		sim.restart();
		raf = requestAnimationFrame(frame);
		// A gentle drift so it never quite freezes.
		const drift = setInterval(() => {
			if (!reduced && visible && sim.alpha() < 0.02) sim.alpha(0.02).restart();
		}, 3000);
		resizeObs = new ResizeObserver(() => measure());
		resizeObs.observe(canvas);
		visObs = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
		visObs.observe(canvas);
		return () => clearInterval(drift);
	});

	onDestroy(() => {
		if (typeof window === 'undefined') return;
		cancelAnimationFrame(raf);
		sim?.stop();
		resizeObs?.disconnect();
		visObs?.disconnect();
	});
</script>

<div class="stage {mode}" bind:this={stage}>
	<canvas
		bind:this={canvas}
		aria-label="Knowledge graph: Andrea's work areas and the projects, roles and tools in each"
		on:pointerdown|capture={onPointerDown}
		on:pointerup|capture={onPointerUp}
		on:pointermove={onPointerMove}
		on:pointerleave={() => (hover = null)}
	></canvas>
	<slot />
	<span class="hint">Tap a node · drag to move · pinch to zoom</span>
	{#if card}
		<div class="card" role="dialog" aria-live="polite" transition:fly={{ y: 40, duration: reduced ? 0 : 260 }}>
			<button class="x" aria-label="Close" on:click={closeCard}>×</button>
			{#if card.kind === 'cat'}
				<div class="eyebrow" style="color:{colorOf(card)}">Area · {kidsOf.get(card.id)} nodes</div>
				<h3>{CAT_LABEL[card.c] || card.c}</h3>
				<div class="kids">
					{#each leaves.filter((n) => n.category === card.c) as kid}
						<button class="kid" on:click={() => pick(kid.slug)}>{label(kid)}</button>
					{/each}
				</div>
			{:else if card.node}
				<div class="eyebrow" style="color:{colorOf(card)}">{CAT_LABEL[card.c] || card.c}</div>
				<h3>{titleOf(card.node)}</h3>
				{#if subtitleOf(card.node)}<p class="sub">{subtitleOf(card.node)}</p>{/if}
				<p class="desc">{card.node.description}</p>
				<div class="row">
					<a href={hrefOf(card.node)} on:click|preventDefault={() => openNode(card)}>Open</a>
					<span class="meta">{card.node.readingTime}</span>
					{#if conns.length > SHOW}
						<button class="more" aria-expanded={expanded} on:click={() => (expanded = !expanded)}>
							{expanded ? 'Less' : `+${conns.length - SHOW} more`}
						</button>
					{/if}
				</div>
				{#if expanded}
					<div class="groups">
						{#each groups as [c, ns]}
							<div class="group">
								<div class="eyebrow" style="color:{CAT_COLOR[c] || '#a5b4fc'}">{CAT_LABEL[c] || c}</div>
								<div class="kids">
									{#each ns as n}
										<button class="kid" on:click={() => pick(n.id)}>{n.s}</button>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			{/if}
		</div>
	{/if}
</div>

<style>
	.stage {
		position: relative;
		height: 100%;
		overflow: hidden;
		background: radial-gradient(ellipse at 50% 45%, #0b0b16 0%, #050508 70%);
		user-select: none;
		-webkit-user-select: none;
	}

	/* The graph owns its gestures. */
	.stage {
		touch-action: none;
	}

	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}

	canvas {
		cursor: grab;
	}

	.hint {
		position: absolute;
		left: 14px;
		top: 12px;
		font-size: 0.78rem;
		color: #71717a;
		pointer-events: none;
	}

	.card {
		position: absolute;
		left: 12px;
		right: 12px;
		bottom: 12px;
		max-width: 440px;
		padding: 16px 18px 18px;
		border: 1px solid #1f1f2a;
		border-radius: 16px;
		background: #111118;
		color: #f4f4f5;
		box-shadow: 0 18px 40px rgb(0 0 0 / 0.55);
		text-align: left;
	}

	.eyebrow {
		font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace;
		font-size: 0.7rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	h3 {
		margin: 6px 0 2px;
		font-size: 1.12rem;
		font-weight: 800;
		letter-spacing: -0.01em;
		padding-right: 24px;
	}

	.sub {
		margin: 0;
		color: #a1a1aa;
		font-size: 0.86rem;
	}

	.desc {
		margin: 10px 0 14px;
		color: #d4d4d8;
		font-size: 0.9rem;
		line-height: 1.5;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.row a {
		padding: 8px 16px;
		border-radius: 999px;
		background: #f4f4f5;
		color: #111;
		font-weight: 600;
		font-size: 0.88rem;
		text-decoration: none;
	}

	.meta {
		font-size: 0.75rem;
		color: #71717a;
	}

	.kids {
		display: flex;
		flex-wrap: wrap;
		gap: 6px 8px;
		margin-top: 10px;
	}

	.kid {
		padding: 5px 10px;
		border: 1px solid #27272a;
		border-radius: 999px;
		background: transparent;
		color: #e4e4e7;
		font: inherit;
		font-size: 0.84rem;
		cursor: pointer;
	}

	.more {
		margin-left: auto;
		padding: 5px 11px;
		border: 1px solid #27272a;
		border-radius: 999px;
		background: transparent;
		color: #a1a1aa;
		font: inherit;
		font-size: 0.8rem;
		cursor: pointer;
	}

	.groups {
		max-height: min(38svh, 300px);
		overflow-y: auto;
		margin-top: 14px;
		padding-top: 12px;
		border-top: 1px solid #1f1f2a;
		overscroll-behavior: contain;
		touch-action: pan-y;
	}

	.group + .group {
		margin-top: 12px;
	}

	.group .kids {
		margin-top: 6px;
	}

	.x {
		position: absolute;
		top: 8px;
		right: 8px;
		width: 32px;
		height: 32px;
		border: 0;
		border-radius: 50%;
		background: transparent;
		color: #a1a1aa;
		font-size: 1.2rem;
		cursor: pointer;
	}

	.x:focus-visible,
	.kid:focus-visible,
	.more:focus-visible,
	.row a:focus-visible {
		outline: 2px solid #a5b4fc;
		outline-offset: 2px;
	}

	/* Phones: clear of the floating chat button. */
	@media (max-width: 768px) {
		.card {
			bottom: 84px;
		}
	}
</style>
