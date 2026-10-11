<script>
	import { onMount, onDestroy } from 'svelte';
	import { cubicOut, cubicIn } from 'svelte/easing';

	/** @type {{ name: string, position: string, years: string, industry: string, icon: string }[]} */
	export let roles = [];
	// The intro's own page transitions, so this list moves with the rest of the page.
	export let enter;
	export let exit;
	export let reduceMotion = false;

	// Line drawings per industry (96×96). Each part draws in on its own (pathLength=1):
	//   line: the main outline · soft: quieter detail · bar: thick strokes · fill: solid accents
	// and some keep moving once drawn (anim): twinkle, swing, flow, blink, scan.
	const circle = (x, y, r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
	const sparkle = (x, y, r) =>
		`M${x} ${y - r}l${r * 0.29} ${r * 0.71} ${r * 0.71} ${r * 0.29}-${r * 0.71} ${r * 0.29}-${r * 0.29} ${r * 0.71}-${r * 0.29}-${r * 0.71}-${r * 0.71}-${r * 0.29} ${r * 0.71}-${r * 0.29}z`;
	const NET = { in: [[16, 32], [16, 64]], mid: [[48, 20], [48, 48], [48, 76]], out: [[80, 34], [80, 62]] };
	const links = (a, b) => a.flatMap(([x1, y1]) => b.map(([x2, y2]) => `M${x1 + 4.5} ${y1}L${x2 - 4.5} ${y2}`)).join('');

	const ICONS = {
		apps: [
			{ kind: 'line', d: 'M32 10h32a8 8 0 0 1 8 8v60a8 8 0 0 1-8 8H32a8 8 0 0 1-8-8V18a8 8 0 0 1 8-8z' },
			{ kind: 'soft', d: 'M43 16h10M42 79h12' },
			{ kind: 'line', d: 'M36 28h10v10H36zM50 28h10v10H50zM36 42h10v10H36z' },
			{ kind: 'fill', anim: 'twinkle', d: sparkle(55, 47, 6.5) },
			{ kind: 'soft', d: 'M36 60h24M36 66h15' },
			{ kind: 'fill', anim: 'twinkle', d: sparkle(82, 20, 5) },
			{ kind: 'fill', anim: 'twinkle', d: sparkle(13, 44, 3.5) }
		],
		education: [
			{ kind: 'line', d: 'M14 30L48 16l34 14-34 14z' },
			{ kind: 'line', d: 'M28 36v9c0 4.5 9 9 20 9s20-4.5 20-9v-9' },
			{ kind: 'soft', anim: 'swing', d: 'M82 30v13' },
			{ kind: 'fill', anim: 'swing', d: 'M79 43h6l-1 7h-4z' },
			{ kind: 'soft', d: 'M12 87h72' },
			{ kind: 'bar', d: 'M22 84V77M34 84V71M46 84V74M58 84V66M70 84V60' },
			{ kind: 'soft', anim: 'flow', d: 'M22 70l12-6 12 3 12-8 12-6' }
		],
		mining: [
			{ kind: 'line', d: 'M6 82l20-32 11 14 15-24 38 42z' },
			{ kind: 'soft', d: 'M52 40l5 8 5-5M26 50l4 6' },
			{ kind: 'line', d: 'M42 82v-7a6 6 0 0 1 12 0v7' },
			{ kind: 'fill', anim: 'blink', d: 'M30 67l3 3-3 3-3-3zM64 65l3 3-3 3-3-3zM70 76l2.5 2.5-2.5 2.5-2.5-2.5z' },
			{ kind: 'line', anim: 'flow', d: 'M8 28l14-8 12 7 14-13 14 6 18-11' },
			{ kind: 'fill', d: `${circle(22, 20, 2.4)}${circle(48, 14, 2.4)}${circle(80, 9, 2.4)}` }
		],
		security: [
			{ kind: 'line', d: 'M48 8l30 11v22c0 21-13 37-30 45C31 78 18 62 18 41V19z' },
			{ kind: 'soft', d: 'M48 16l22 8v17c0 16-9 28-22 35-13-7-22-19-22-35V24z' },
			{ kind: 'line', d: 'M38 48a10 10 0 0 1 20 0v5M42 51a6 6 0 0 1 12 0v9M48 52v15' },
			{ kind: 'line', d: 'M38 56c0 5 1.5 9 4 12M58 58c0 5-1 9-3 12' },
			{ kind: 'fill', anim: 'scan', d: 'M28 44h40v2.4H28z' }
		],
		ai: [
			{ kind: 'soft', anim: 'flow', d: links(NET.in, NET.mid) },
			{ kind: 'soft', anim: 'flow', d: links(NET.mid, NET.out) },
			{ kind: 'line', d: [...NET.in, ...NET.mid].map(([x, y]) => circle(x, y, 4.5)).join('') },
			{ kind: 'fill', anim: 'blink', d: NET.out.map(([x, y]) => circle(x, y, 5)).join('') }
		]
	};

	const GLYPHS = '▚▞▖▗▘▝░▒#%&01';

	let list;
	let dots = []; // dot centres, top to bottom, relative to the list
	let active = roles.length - 1; // the pulse starts at the earliest role, at the bottom
	// The industry name, one entry per character: `glyph` is the noise drawn over a
	// character that hasn't decoded yet. The real text always holds the layout, so
	// the noise can never re-wrap the name or change its line count.
	let label = [...(roles[active]?.industry || '')].map((ch) => ({ ch, glyph: '' }));
	let flash = 0;
	let pulseEl;
	let trailEl;
	let alive = true;

	const wait = (ms) => new Promise((r) => setTimeout(r, ms));

	function measure() {
		if (!list) return;
		const top = list.getBoundingClientRect().top;
		dots = [...list.querySelectorAll('.dot')].map((d) => {
			const r = d.getBoundingClientRect();
			return r.top + r.height / 2 - top;
		});
	}

	// The industry name decodes from noise into the new words, left to right.
	function scrambleTo(text) {
		if (reduceMotion) {
			label = [...text].map((ch) => ({ ch, glyph: '' }));
			return;
		}
		const start = performance.now();
		const duration = 650;
		const frame = (now) => {
			if (!alive) return;
			const p = Math.min(1, (now - start) / duration);
			label = [...text].map((ch, i) => ({
				ch,
				glyph: ch === ' ' || i / text.length < p ? '' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
			}));
			if (p < 1) requestAnimationFrame(frame);
		};
		requestAnimationFrame(frame);
	}

	function arrive(i) {
		active = i;
		flash += 1;
		scrambleTo(roles[i].industry);
	}

	// A light climbs the spine from one role to the next, lighting the segment it
	// crossed, then rests on the node before moving on. At the top it starts over.
	async function travel(from, to) {
		if (!pulseEl || !trailEl || dots.length !== roles.length) return;
		const y0 = dots[from];
		const y1 = dots[to];
		const opts = { duration: 700, easing: 'cubic-bezier(0.6, 0, 0.2, 1)', fill: 'forwards' };
		trailEl.style.top = `${y1}px`;
		trailEl.style.height = `${y0 - y1}px`;
		trailEl.animate(
			[
				{ transform: 'scaleY(0)', opacity: 1 },
				{ transform: 'scaleY(1)', opacity: 1, offset: 0.7 },
				{ transform: 'scaleY(1)', opacity: 0 }
			],
			{ ...opts, duration: 1100 }
		);
		await pulseEl.animate(
			[
				{ transform: `translateY(${y0}px)`, opacity: 1 },
				{ transform: `translateY(${y1}px)`, opacity: 1 }
			],
			opts
		).finished;
	}

	async function run() {
		await wait(1400);
		while (alive) {
			if (reduceMotion) {
				arrive((active - 1 + roles.length) % roles.length);
				await wait(2600);
				continue;
			}
			measure();
			for (let i = roles.length - 1; i > 0 && alive; i--) {
				await travel(i, i - 1);
				if (!alive) return;
				arrive(i - 1);
				await wait(1800);
			}
			await wait(1400);
			if (!alive) return;
			pulseEl?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' });
			arrive(roles.length - 1);
			await wait(1800);
		}
	}

	onMount(() => {
		measure();
		window.addEventListener('resize', measure);
		run();
	});

	onDestroy(() => {
		alive = false;
		if (typeof window !== 'undefined') window.removeEventListener('resize', measure);
	});

	$: spineTop = dots[0] ?? 0;
	$: spineHeight = dots.length ? dots[dots.length - 1] - dots[0] : 0;

	// Lines draw along their length; filled accents pop in once the outline is there.
	function drawIn(node, { delay = 0, fill = false } = {}) {
		return {
			delay: reduceMotion ? 0 : delay,
			duration: reduceMotion ? 0 : fill ? 450 : 700,
			easing: cubicOut,
			css: (t) =>
				fill
					? `opacity: ${t}; transform: scale(${0.3 + 0.7 * t})`
					: `stroke-dasharray: 1; stroke-dashoffset: ${1 - t}`
		};
	}

	function drawOut(node, { fill = false } = {}) {
		return {
			duration: reduceMotion ? 0 : 300,
			easing: cubicIn,
			css: (t) =>
				fill
					? `opacity: ${t}; transform: scale(${0.6 + 0.4 * t})`
					: `stroke-dasharray: 1; stroke-dashoffset: ${t - 1}; opacity: ${t}`
		};
	}

	function iconSwap(node, { out = false } = {}) {
		return {
			duration: reduceMotion ? 0 : out ? 300 : 600,
			easing: out ? cubicIn : cubicOut,
			css: (t, u) =>
				`transform: scale(${0.85 + 0.15 * t}) rotate(${(out ? 10 : -10) * u}deg); opacity: ${t}`
		};
	}
</script>

<div class="timeline" out:exit|global>
	<div class="track" bind:this={list}>
		<span class="spine" style="top: {spineTop}px; height: {spineHeight}px" aria-hidden="true"></span>
		<span class="trail" bind:this={trailEl} aria-hidden="true"></span>
		<span class="pulse" bind:this={pulseEl} aria-hidden="true"></span>
		<ul class="roles">
		{#each roles as role, i}
			<li class:lit={i === active} in:enter|global={{ delay: 220 + (roles.length - 1 - i) * 90, x: 40, y: 0 }}>
				<span class="dot" aria-hidden="true">
					{#key i === active ? flash : -1}<span class="ping"></span>{/key}
				</span>
				<span class="role-name">{role.name}<span class="position">{role.position}</span></span>
				<span class="years">{role.years}</span>
			</li>
		{/each}
		</ul>
	</div>
</div>

<div class="industry" in:enter|global={{ delay: 640, x: 0, y: 16 }} out:exit|global>
	<div class="industry-text">
		<span class="industry-caption">Industry · {roles[active]?.name}</span>
		{#key flash}
			<span class="industry-name flash" aria-live="polite" aria-label={roles[active]?.industry}
				>{#each label as c}<span class="ch" class:noise={c.glyph} data-glyph={c.glyph}>{c.ch}</span>{/each}</span
			>
		{/key}
	</div>
	<div class="industry-icon" aria-hidden="true">
		{#key roles[active]?.icon}
			<svg viewBox="0 0 96 96" fill="none" stroke-linecap="round" stroke-linejoin="round" in:iconSwap|global out:iconSwap|global={{ out: true }}>
				{#each ICONS[roles[active]?.icon] || [] as part, i}
					<path
						d={part.d}
						pathLength="1"
						class="{part.kind} {part.anim || ''}"
						style="--i: {i}"
						in:drawIn|global={{ delay: 120 + i * 100, fill: part.kind === 'fill' }}
						out:drawOut|global={{ fill: part.kind === 'fill' }}
					/>
				{/each}
			</svg>
		{/key}
	</div>
</div>

<style>
	.timeline {
		flex-shrink: 0;
		margin-top: 20px;
	}

	.track {
		position: relative;
	}

	.roles {
		list-style: none;
		margin: 0;
		padding: 0 0 0 22px;
	}

	/* The spine runs exactly from the first node to the last, drawn bottom-up. */
	.spine {
		position: absolute;
		left: 4px;
		width: 1px;
		background: #3730a3;
		transform-origin: bottom;
		animation: draw 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) 0.2s both;
	}

	.trail {
		position: absolute;
		left: 3.5px;
		width: 2px;
		border-radius: 1px;
		background: #a5b4fc;
		transform-origin: bottom;
		transform: scaleY(0);
		pointer-events: none;
	}

	.pulse {
		position: absolute;
		left: -0.5px;
		top: -5px;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: #c7d2fe;
		box-shadow: 0 0 12px 3px rgba(129, 140, 248, 0.7);
		opacity: 0;
		pointer-events: none;
		z-index: 1;
	}

	@keyframes draw {
		from {
			transform: scaleY(0);
		}
		to {
			transform: scaleY(1);
		}
	}

	li {
		position: relative;
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 12px;
		padding: 11px 0;
		border-bottom: 1px solid #1c1c22;
		font-size: 0.95rem;
		transition: color 0.4s ease;
	}

	li:last-child {
		border-bottom: 0;
	}

	.dot {
		position: absolute;
		left: -22px;
		top: 17px;
		width: 9px;
		height: 9px;
		border-radius: 50%;
		background: #000;
		border: 2px solid #4f46e5;
		box-sizing: border-box;
		transition:
			background-color 0.3s ease,
			border-color 0.3s ease;
	}

	li.lit .dot {
		background: #a5b4fc;
		border-color: #a5b4fc;
	}

	.ping {
		position: absolute;
		inset: -2px;
		border-radius: 50%;
		border: 2px solid #a5b4fc;
		opacity: 0;
	}

	li.lit .ping {
		animation: ping 1.1s cubic-bezier(0, 0, 0.2, 1);
	}

	@keyframes ping {
		0% {
			transform: scale(1);
			opacity: 0.9;
		}
		100% {
			transform: scale(3);
			opacity: 0;
		}
	}

	.role-name {
		display: flex;
		flex-direction: column;
		gap: 3px;
		font-weight: 600;
		color: #d4d4d8;
		transition: color 0.4s ease;
	}

	li.lit .role-name {
		color: #fff;
	}

	.position {
		font-weight: 400;
		font-size: 0.82rem;
		color: #a1a1aa;
	}

	.years {
		color: #a1a1aa;
		white-space: nowrap;
	}

	/* Fills the space left under the list. */
	.industry {
		flex: 1;
		min-height: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		margin-top: 12px;
		padding-top: 12px;
		border-top: 1px solid #27272a;
		overflow: hidden;
	}

	.industry-text {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 0;
	}

	.industry-caption {
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #a1a1aa;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Room for two lines whatever the name, so nothing around it moves. */
	.industry-name {
		height: 2.2em;
		font-size: clamp(1.3rem, 6vw, 1.7rem);
		font-weight: 800;
		letter-spacing: -0.02em;
		line-height: 1.1;
		color: #fff;
	}

	.ch.noise {
		position: relative;
		color: transparent;
	}

	.ch.noise::after {
		content: attr(data-glyph);
		position: absolute;
		left: 0;
		top: 0;
		color: #a5b4fc;
	}

	.industry-name.flash {
		animation: flash 0.9s ease-out;
	}

	@keyframes flash {
		0% {
			color: #a5b4fc;
			filter: blur(2px);
		}
		60% {
			filter: blur(0);
		}
		100% {
			color: #fff;
		}
	}

	.industry-icon {
		flex-shrink: 0;
		display: grid;
		width: min(34vw, 132px);
		max-height: 100%;
		aspect-ratio: 1;
		color: #818cf8;
	}

	.industry-icon svg {
		grid-area: 1 / 1;
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	.industry-icon .line {
		stroke: #818cf8;
		stroke-width: 2.2;
	}

	.industry-icon .soft {
		stroke: #4f46e5;
		stroke-width: 1.5;
	}

	.industry-icon .bar {
		stroke: #6366f1;
		stroke-width: 6;
	}

	.industry-icon .fill {
		fill: #c7d2fe;
		stroke: none;
		transform-box: fill-box;
		transform-origin: center;
	}

	/* Idle motion starts the moment each part finishes drawing in (the draw-in holds
	   the animation slot until then). Twinkles start partway through their cycle, so
	   they stay out of step without waiting. */
	.industry-icon .twinkle {
		animation: twinkle 2.6s ease-in-out calc(var(--i) * -0.45s) infinite;
	}

	.industry-icon .swing {
		transform-box: view-box;
		transform-origin: 82px 30px;
		animation: swing 3.2s ease-in-out infinite;
	}

	.industry-icon .flow {
		stroke-dasharray: 0.05 0.035;
		animation: flow 4s linear infinite;
	}

	.industry-icon .blink {
		animation: blink 2.2s ease-in-out infinite;
	}

	.industry-icon .scan {
		animation: scan 2.8s ease-in-out infinite;
	}

	@keyframes twinkle {
		0%,
		100% {
			opacity: 1;
			transform: scale(1) rotate(0deg);
		}
		50% {
			opacity: 0.45;
			transform: scale(0.7) rotate(45deg);
		}
	}

	@keyframes swing {
		0%,
		100% {
			transform: rotate(-9deg);
		}
		50% {
			transform: rotate(9deg);
		}
	}

	@keyframes flow {
		to {
			stroke-dashoffset: -0.85;
		}
	}

	@keyframes blink {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.35;
		}
	}

	@keyframes scan {
		0%,
		100% {
			transform: translateY(-14px);
			opacity: 0.25;
		}
		50% {
			transform: translateY(22px);
			opacity: 0.9;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.industry-icon .twinkle,
		.industry-icon .swing,
		.industry-icon .flow,
		.industry-icon .blink,
		.industry-icon .scan,
		.spine,
		li.lit .ping,
		.industry-name.flash {
			animation: none;
		}
	}
</style>
