<script>
	// The knowledge tree as a living graph: points of light on fine threads. You at the
	// center, each area a ringed point with one orbiting light per node, every node linked to
	// its area and to nodes it shares topics with. Tap a node to light its connections and
	// open its card. Both modes pan, pinch and zoom alike; "preview" is the home page's frame.
	import { onDestroy, onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY } from 'd3-force';
	import { select } from 'd3-selection';
	import { zoom as d3zoom, zoomIdentity } from 'd3-zoom';
	import 'd3-transition';
	import { fly } from 'svelte/transition';

	// d3 ships no types here; treat its builders as untyped.
	const selectAny = /** @type {any} */ (select);
	const forceLinkAny = /** @type {any} */ (forceLink);
	const zoomAny = /** @type {any} */ (d3zoom);

	/** @type {any[]} manifest nodes */
	export let nodes = [];
	/** @type {'full' | 'preview'} */
	export let mode = 'full';

	const CAT_ORDER = ['products', 'roles', 'prototypes', 'tools', 'architecture', 'philosophy', 'case-studies'];
	const CAT_LABEL = {
		hub: 'Index',
		products: 'Products',
		roles: 'Roles',
		prototypes: 'Prototypes',
		tools: 'Tools',
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
		architecture: '#93c5fd',
		philosophy: '#f5a8d0',
		'case-studies': '#c4b5fd'
	};

	let stage;
	let canvas;
	/** @type {any} the open card's node */
	let card = null;

	const hubNode = nodes.find((n) => n.category === 'hub');
	const leaves = nodes.filter((n) => n.category !== 'hub');
	const cats = CAT_ORDER.filter((c) => leaves.some((n) => n.category === c)).concat(
		[...new Set(leaves.map((n) => n.category))].filter((c) => !CAT_ORDER.includes(c))
	);

	const label = (n) => n.short || n.title.split(':')[0];
	const titleOf = (n) => n.title.split(':')[0].trim();
	const subtitleOf = (n) => (n.title.includes(':') ? n.title.slice(n.title.indexOf(':') + 1).trim() : '');
	const hrefOf = (n) => (n.slug === 'INDEX' ? '/tree' : `/tree/${n.slug}`);

	// Graph data: you, your areas, every node; tree links plus topic links (two shared tags).
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
	for (let i = 0; i < leaves.length; i++)
		for (let j = i + 1; j < leaves.length; j++) {
			const shared = (leaves[i].tags || []).filter((t) => (leaves[j].tags || []).includes(t)).length;
			if (shared >= 2) gLinks.push({ source: leaves[i].slug, target: leaves[j].slug, k: 'topic', s: shared });
		}
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

	function near(n) {
		if (!n) return null;
		const ids = new Set([n.id]);
		for (const l of gLinks) {
			if (l.source.id === n.id) ids.add(l.target.id);
			if (l.target.id === n.id) ids.add(l.source.id);
		}
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
		// Tall stages pull sideways harder, so the graph grows tall instead of wide.
		const portrait = h > w * 1.15;
		sim.force('x', forceX(w / 2).strength(portrait ? 0.11 : 0.04));
		sim.force('y', forceY(h / 2).strength(portrait ? 0.008 : 0.07));
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

	function pick(id) {
		selected = id ? byId.get(id) || null : null;
		card = selected;
		if (selected) {
			focusOn(selected);
			ripples.push({ n: selected, t: performance.now() });
		} else if (fitted) {
			// Back to the whole picture once nothing is chosen.
			moved = false;
			fit();
		}
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
		for (const l of gLinks) {
			const on = lit && (l.source.id === focusNode.id || l.target.id === focusNode.id);
			const mx = (l.source.x + l.target.x) / 2;
			const my = (l.source.y + l.target.y) / 2;
			const bx = mx - (l.target.y - l.source.y) * 0.08;
			const by = my + (l.target.x - l.source.x) * 0.08;
			const c1 = colorOf(l.source);
			const c2 = colorOf(l.target);
			const a = on ? 0.9 : (l.k === 'tree' ? 0.3 : 0.1) * dimF;
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
			const ly = n.y + (n.kind === 'leaf' ? r * (isFocus ? 1.2 : 1) + 6 : ringR + 6);
			if (n.kind === 'cat') {
				ctx.font = '700 9.5px Inter, -apple-system, sans-serif';
				ctx.fillStyle = col;
				ctx.fillText(n.s.toUpperCase().split('').join(String.fromCharCode(8202)), n.x, ly);
			} else {
				text(
					n.s,
					n.x,
					ly,
					isFocus || n.kind === 'hub' ? '#ffffff' : tint(col, lit && isOn ? 0.75 : 0.55),
					n.kind === 'hub' ? 13 : 10.5,
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

	onMount(() => {
		reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		sim = forceSimulation(gNodes)
			.force(
				'link',
				forceLinkAny(gLinks)
					.id((d) => d.id)
					.distance((l) => (l.k === 'tree' ? (l.source.kind === 'hub' ? 82 : 58) : 110))
					.strength((l) => (l.k === 'tree' ? 0.7 : 0.03 * l.s))
			)
			.force('charge', forceManyBody().strength((d) => (d.kind === 'hub' ? -600 : d.kind === 'cat' ? -420 : -130)))
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
			<button class="x" aria-label="Close" on:click={() => pick(null)}>×</button>
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
				</div>
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
