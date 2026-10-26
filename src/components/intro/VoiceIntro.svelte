<script>
	import { onMount, onDestroy, tick } from 'svelte';
	import { preloadCode } from '$app/navigation';
	import { cubicOut, cubicIn, backOut } from 'svelte/easing';
	import { enterVoiceMode, openChat, isChatOpen, isChatCovering } from '$lib/stores/chat';
	import { emitVisitEvent } from '$lib/visit-events';
	import profile from '$lib/context/profile.json';
	import { promoVideos, ensurePromoVideos } from '$lib/promo-videos';
	import { INTRO_CLASS, introRequests } from './intro-gate';
	import ExperienceTimeline from './ExperienceTimeline.svelte';
	import { CAPABILITIES } from './capabilities';
	import ProjectCards from '../showcase/ProjectCards.svelte';
	import ProjectView from '../showcase/ProjectView.svelte';
	import { showcaseProjects, withMedia } from '../showcase/projects';

	// The same cards as the site's Software section (see withMedia).
	const allProjects = showcaseProjects();

	// What each employer does, for the row under the timeline (icon keys live in ExperienceTimeline).
	const INDUSTRIES = {
		'Advection Software': { label: 'AI Products & Apps', icon: 'apps' },
		'Mesa Cloud, Inc.': { label: 'K-12 Education Data', icon: 'education' },
		'Intellisense.io': { label: 'Mining Analytics', icon: 'mining' },
		'Giesecke + Devrient': { label: 'Digital Security & Identity', icon: 'security' },
		'AIA (Aplicaciones En Informática Avanzada)': { label: 'Applied AI & Modeling', icon: 'ai' }
	};

	const roles = profile.work.map((w) => ({
		// "AIA (Aplicaciones En Informática Avanzada)" shows its full name.
		name: w.name.replace(', Inc.', '').replace(/^\S+ \((.*)\)$/, '$1'),
		industry: INDUSTRIES[w.name]?.label || '',
		icon: INDUSTRIES[w.name]?.icon || 'apps',
		position: w.position,
		years: !w.endDate
			? `${w.startDate} to now`
			: w.endDate === w.startDate
				? w.startDate
				: `${w.startDate} to ${w.endDate}`
	}));

	const PAGES = ['cover', 'products', 'experience'];

	let visible = true;
	// Starts empty so the cover's entrance plays once the page has hydrated.
	let page = null;
	// +1 moving forward, -1 moving back, along the axis the visitor used:
	// 'x' for buttons and sideways swipes, 'y' for vertical swipes and the wheel.
	let dir = 1;
	let axis = 'x';
	// The first page to appear has nothing to wait for; later ones let the old page clear first.
	let firstShow = true;
	let leaving = false;
	let reduceMotion = false;
	let idle = false;
	let carousel;
	// project id → { src, poster } from the house-ads catalogue; empty until it loads.
	$: videos = $promoVideos;
	$: liveProjects = withMedia(allProjects, videos);
	$: coverThumbs = liveProjects.filter((p) => p.image || videos[p.id]?.poster).slice(0, 3);

	$: pageIndex = Math.max(0, PAGES.indexOf(page));

	// Two of the capabilities show at once; every few seconds one of them gives way to
	// the next in the list, alternating top and bottom.
	let shown = [0, 1];
	let turn = 0;
	let rotateTimer;

	function rotate() {
		if (page !== 'cover' || leaving || $isChatCovering) return;
		const next = (Math.max(...shown) + 1) % CAPABILITIES.length;
		shown[turn] = next === shown[1 - turn] ? (next + 1) % CAPABILITIES.length : next;
		turn = 1 - turn;
	}

	function askAbout(capability) {
		emitVisitEvent('visit:intro_talk', { page, source: 'capability' });
		emitVisitEvent('visit:chat_open');
		openChat({ text: capability.prompt, source: 'ask-agent' });
	}

	onMount(() => {
		visible = document.documentElement.classList.contains(INTRO_CLASS);
		reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (visible) {
			ensurePromoVideos();
			page = 'cover';
			emitVisitEvent('visit:intro_view');
			setTimeout(() => (firstShow = false), 50);
			wake();
		}
		rotateTimer = setInterval(rotate, 3800);
	});

	// The Welcome screen can be called back after closing (menu link, pulling down at the top).
	let reopened = false;
	const unsubscribeRequests = introRequests.subscribe((n) => {
		if (n > 0) reopen();
	});

	async function reopen() {
		if (visible && !leaving) return;
		document.documentElement.classList.add(INTRO_CLASS);
		leaving = false;
		detail = null;
		firstShow = true;
		peeked = false;
		dir = 1;
		axis = 'x';
		page = null;
		reopened = true;
		visible = true;
		await tick();
		page = 'cover';
		setTimeout(() => (firstShow = false), 50);
		emitVisitEvent('visit:intro_view', { via: 'reopen' });
		wake();
	}

	onDestroy(() => {
		clearTimeout(toShortsTimer);
		// Gone with the home page (as on the way to /shorts): nothing should keep its class.
		if (typeof document !== 'undefined' && toShorts)
			document.documentElement.classList.remove(INTRO_CLASS);
		unsubscribeRequests();
		clearTimeout(idleTimer);
		clearTimeout(peekTimer);
		clearTimeout(wheelTimer);
		clearInterval(rotateTimer);
	});

	function go(next, via = 'x') {
		if (!next || next === page) return;
		if (page === 'cover' && next === 'products' && coverOrb && !reduceMotion) launchFlight();
		axis = via;
		dir = PAGES.indexOf(next) > pageIndex ? 1 : -1;
		page = next;
		emitVisitEvent('visit:intro_page', { page: next, via });
		wake();
	}

	const back = () => go(PAGES[pageIndex - 1]);

	// ---- Orb to chat hand-off --------------------------------------------------------
	// Leaving the cover for the products page, the big voice orb flies down into the
	// Chat button; on the way its sound bars fold away and the site's prism icon spins in.

	let coverOrb;
	let flight = null; // { from: DOMRect } while the orb is in the air

	function launchFlight() {
		flight = { from: coverOrb.getBoundingClientRect() };
	}

	// With the orb inbound the button only fades in, so the spot it lands on stays put.
	function chatIn(node, params) {
		return flight
			? { delay: ms(params.delay || 0), duration: ms(300), css: (t) => `opacity: ${t}` }
			: pop(node, { ...params, from: 0.8 });
	}

	// The real orb hides at once while the flyer stands in for it. (A zero-length outro
	// would leave it showing until the rest of the page has gone; a held frame hides it.)
	function orbOut(node) {
		return flight ? { duration: 1, css: () => 'opacity: 0' } : exit(node, {});
	}

	// Steered every frame toward wherever the Chat icon actually is, so the landing is
	// exact even while the new page is still settling around it.
	function flyToChat(node, { from }) {
		let alive = true;
		const DURATION = 820;
		const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
		const timing = { duration: DURATION, easing: 'linear', fill: 'forwards' };
		node.querySelector('.flyer-bars')?.animate(
			[
				{ transform: 'scale(1) rotate(0deg)', opacity: 1 },
				{ transform: 'scale(0.55, 0.15) rotate(0deg)', opacity: 1, offset: 0.4 },
				{ transform: 'scale(0.2, 0.05) rotate(90deg)', opacity: 0, offset: 0.6 },
				{ transform: 'scale(0) rotate(90deg)', opacity: 0 }
			],
			timing
		);
		node.querySelector('.flyer-prism')?.animate(
			[
				{ transform: 'scale(0) rotate(-135deg)', opacity: 0 },
				{ transform: 'scale(0) rotate(-135deg)', opacity: 0, offset: 0.4 },
				{ transform: 'scale(1.2) rotate(12deg)', opacity: 1, offset: 0.82 },
				{ transform: 'scale(1) rotate(0deg)', opacity: 1 }
			],
			timing
		);
		const fx = from.left + from.width / 2;
		const fy = from.top + from.height / 2;
		const start = performance.now();
		const frame = (now) => {
			if (!alive) return;
			const target = document.querySelector('.page .chat-btn .chat-icon');
			if (!target) return (flight = null);
			const t = target.getBoundingClientRect();
			const p = Math.min(1, (now - start) / DURATION);
			const e = ease(p);
			const dx = (t.left + t.width / 2 - fx) * e;
			// A small lift on the way, like a hand passing it down.
			const dy = (t.top + t.height / 2 - fy) * e - 36 * Math.sin(Math.PI * e);
			const scale = 1 + (t.width / from.width - 1) * e;
			node.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
			if (p < 1) requestAnimationFrame(frame);
			else flight = null;
		};
		requestAnimationFrame(frame);
		return { destroy: () => (alive = false) };
	}

	// The site's own voice mode opens on top; closing it lands back on this page.
	function talk(source) {
		emitVisitEvent('visit:intro_talk', { page, source });
		emitVisitEvent('visit:chat_open');
		if (source === 'orb' && coverOrb && !reduceMotion) {
			handoff = { from: coverOrb.getBoundingClientRect() };
			orbAway = true;
		}
		enterVoiceMode();
		// The orb is the way into the site's own voice chat, so Welcome is done; it fades
		// away under the chat while the orb flies into it.
		if (source === 'orb') leave('talk');
	}

	// ---- Orb to voice mode ---------------------------------------------------------
	// Tapping the cover's orb carries it into the voice mode's own orb: it lifts off,
	// travels to wherever that orb is (steered every frame, as the window slides in),
	// and hands over as it lands. The cover's orb stays away until the chat closes.

	let handoff = null; // { from: DOMRect } while the orb is in the air
	let orbAway = false;
	$: if (!$isChatOpen && orbAway) orbAway = false;

	// The chat sits above this screen, so the flyer goes to the end of the page.
	function toBody(node) {
		document.body.appendChild(node);
		return { destroy: () => node.remove() };
	}

	function flyToVoice(node, { from }) {
		let alive = true;
		const DURATION = 760;
		const HAND_OVER = 0.62; // from here the real orb fades in under the flyer
		const root = document.documentElement;
		root.classList.add('orb-landing');
		root.style.setProperty('--orb-landing', '0');
		const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
		node.querySelector('.flyer-bars')?.animate(
			[
				{ transform: 'scaleY(1)', opacity: 1 },
				{ transform: 'scaleY(1.35)', opacity: 1, offset: 0.25 },
				{ transform: 'scaleY(0.1)', opacity: 0, offset: 0.7 },
				{ transform: 'scaleY(0.1)', opacity: 0 }
			],
			{ duration: DURATION, easing: 'ease-in-out', fill: 'forwards' }
		);
		const fx = from.left + from.width / 2;
		const fy = from.top + from.height / 2;
		const start = performance.now();
		const finish = () => {
			root.classList.remove('orb-landing');
			root.style.removeProperty('--orb-landing');
		};
		const frame = (now) => {
			if (!alive) return;
			const p = Math.min(1, (now - start) / DURATION);
			const e = ease(p);
			const target = document.querySelector('.voice-mode-container .orb-wrapper');
			const t = target?.getBoundingClientRect();
			const tx = t ? t.left + t.width / 2 : fx;
			const ty = t ? t.top + t.height / 2 : fy;
			const scale = 1 + ((t ? t.width : from.width) / from.width - 1) * e;
			// A small rise on the way, as if lifted out of the page.
			const lift = -28 * Math.sin(Math.PI * e);
			node.style.transform = `translate(${(tx - fx) * e}px, ${(ty - fy) * e + lift}px) scale(${scale})`;
			const handing = Math.max(0, (p - HAND_OVER) / (1 - HAND_OVER));
			node.style.opacity = String(1 - handing);
			root.style.setProperty('--orb-landing', String(handing));
			if (p < 1) requestAnimationFrame(frame);
			else {
				finish();
				handoff = null;
			}
		};
		requestAnimationFrame(frame);
		return {
			destroy() {
				alive = false;
				finish();
			}
		};
	}

	// Off to /shorts: the intro doesn't fade away (the home page showed under it while the
	// shorts page loaded); its content fades to black and it stays until /shorts replaces the
	// home page, black to black. Should the page not change, it leaves as usual.
	let toShorts = false;
	let toShortsTimer;

	// The shorts page's code is fetched while a link that opens it is on screen.
	$: if ((page === 'products' || page === 'cover') && typeof window !== 'undefined') preloadCode('/shorts').catch(() => {});

	function leave(reason) {
		if (leaving || toShorts) return;
		if (reason === 'shorts' && !reduceMotion) {
			emitVisitEvent('visit:intro_leave', { reason, page });
			toShorts = true;
			toShortsTimer = setTimeout(() => {
				toShorts = false;
				leaving = true;
				visible = false;
				document.documentElement.classList.remove(INTRO_CLASS);
			}, 5000);
			return;
		}
		emitVisitEvent('visit:intro_leave', { reason, page });
		leaving = true;
		setTimeout(
			() => {
				visible = false;
				document.documentElement.classList.remove(INTRO_CLASS);
			},
			reduceMotion ? 0 : 450
		);
	}

	// ---- Idle ------------------------------------------------------------------
	// After a few still seconds the page starts hinting at what's next.

	let idleTimer;
	let peekTimer;
	let peeked = false;
	let peeking = false;

	function wake() {
		idle = false;
		clearTimeout(idleTimer);
		clearTimeout(peekTimer);
		idleTimer = setTimeout(() => (idle = true), 4500);
		if (page === 'products' && !peeked) peekTimer = setTimeout(peekCarousel, 2600);
	}

	// Nudges the carousel once so it reads as swipeable.
	function peekCarousel() {
		if (!carousel || reduceMotion || carousel.scrollLeft > 0) return;
		peeked = true;
		peeking = true;
		// Snapping would turn a small peek into a jump to the next card.
		carousel.style.scrollSnapType = 'none';
		carousel.scrollBy({ left: 70, behavior: 'smooth' });
		setTimeout(() => carousel?.scrollTo({ left: 0, behavior: 'smooth' }), 650);
		setTimeout(() => {
			peeking = false;
			if (carousel) carousel.style.scrollSnapType = '';
		}, 1400);
	}

	// ---- Project view ----------------------------------------------------------------
	// Lives in ProjectView; the intro only needs to know whether one is open (to pause
	// its cards and stand back from gestures) and which card the hero came from.

	let projectView;
	let detail = null;
	let heroCardId = null;

	const cardMedia = (id) =>
		carousel?.querySelector(`[data-project="${id}"] .shot, [data-project="${id}"] .placeholder`);

	// ---- Swipe, drag and wheel ---------------------------------------------------
	// The page follows the finger (with resistance and parallax), then either springs
	// back or moves on. Up or left goes forward; down or right goes back; going forward
	// off the last page enters the site.

	const SWIPE = 64;
	// How far the current drag (or wheel) has pulled towards a page change, -1..1:
	// positive towards the next page, negative towards the previous. Only the progress
	// bar shows it; the page itself holds still until the change happens.
	let drag = 0;
	$: pull = Math.max(-1, Math.min(1, -drag / SWIPE));

	// On the last page there's no next bar to fill: pulling forward instead makes Welcome
	// shrink back and dim, and once far enough "Enter the site" fills and says to let go. Held while leaving,
	// so the exit carries on from where the pull left it.
	let exitPull = 0;
	$: if (!leaving) exitPull = page === PAGES[PAGES.length - 1] && pull > 0 ? pull : 0;
	$: exitReady = exitPull >= 1;
	$: if (exitReady && typeof navigator !== 'undefined') navigator.vibrate?.(12);
	let dragging = false;
	let gesture = null;
	let suppressClick = false;

	function settle(delta, via) {
		dragging = false;
		const target = delta < 0 ? PAGES[pageIndex + 1] : PAGES[pageIndex - 1];
		const passed = Math.abs(delta) > SWIPE;
		if (passed && target) {
			go(target, via);
		} else if (passed && delta < 0 && pageIndex === PAGES.length - 1) {
			leave('swipe');
		}
		drag = 0;
	}

	function onPointerDown(e) {
		if (e.button > 0 || $isChatCovering || leaving || detail) return;
		const roles = e.target.closest?.('.roles');
		gesture = {
			id: e.pointerId,
			x: e.clientX,
			y: e.clientY,
			axis: null,
			inCarousel: !!e.target.closest?.('.carousel'),
			rolesScroll: roles && roles.scrollHeight > roles.clientHeight + 2
		};
		wake();
	}

	function onPointerMove(e) {
		if (!gesture || e.pointerId !== gesture.id) return;
		const mx = e.clientX - gesture.x;
		const my = e.clientY - gesture.y;
		if (!gesture.axis) {
			if (Math.hypot(mx, my) < 10) return;
			gesture.axis = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
			// The carousel owns sideways swipes, and a scrollable roles list owns vertical ones.
			if ((gesture.axis === 'x' && gesture.inCarousel) || (gesture.axis === 'y' && gesture.rolesScroll)) {
				gesture = null;
				return;
			}
			dragging = true;
		}
		drag = gesture.axis === 'x' ? mx : my;
	}

	function onPointerUp(e) {
		if (!gesture || e.pointerId !== gesture.id) return;
		const { axis: a, x, y } = gesture;
		gesture = null;
		if (!a) return;
		suppressClick = true;
		setTimeout(() => (suppressClick = false), 50);
		settle(a === 'x' ? e.clientX - x : e.clientY - y, a);
	}

	function onPointerCancel() {
		gesture = null;
		dragging = false;
		drag = 0;
	}

	// A drag must not also count as a tap on whatever it started over.
	function onClickCapture(e) {
		if (suppressClick) {
			e.preventDefault();
			e.stopPropagation();
		}
	}

	let wheelAccum = 0;
	let wheelTimer;
	let wheelLocked = false;

	function onWheel(e) {
		if ($isChatCovering || leaving || wheelLocked || detail) return;
		if (e.target.closest?.('.carousel') && Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
		wake();
		wheelAccum += e.deltaY;
		dragging = true;
		drag = (-wheelAccum * SWIPE) / 140;
		clearTimeout(wheelTimer);
		if (Math.abs(wheelAccum) > 140) {
			wheelLocked = true;
			settle(-wheelAccum, 'y');
			wheelAccum = 0;
			setTimeout(() => (wheelLocked = false), 900);
			return;
		}
		wheelTimer = setTimeout(() => {
			wheelAccum = 0;
			dragging = false;
			drag = 0;
		}, 160);
	}

	function onKeydown(e) {
		if (!visible || leaving || $isChatCovering || detail) return;
		if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') {
			if (pageIndex === PAGES.length - 1) leave('key');
			else go(PAGES[pageIndex + 1], e.key === 'ArrowRight' ? 'x' : 'y');
		} else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
			go(PAGES[pageIndex - 1], e.key === 'ArrowLeft' ? 'x' : 'y');
		} else if (e.key === 'Escape') {
			leave('escape');
		}
	}

	// Listeners go on through an action: the dialog itself isn't a control.
	// Links and images would otherwise start a native drag and cancel the swipe.
	const noNativeDrag = (e) => e.preventDefault();

	function gestures(node) {
		node.addEventListener('dragstart', noNativeDrag);
		node.addEventListener('wheel', onWheel, { passive: true });
		node.addEventListener('pointerdown', onPointerDown);
		node.addEventListener('click', onClickCapture, true);
		return {
			destroy() {
				node.removeEventListener('dragstart', noNativeDrag);
				node.removeEventListener('wheel', onWheel);
				node.removeEventListener('pointerdown', onPointerDown);
				node.removeEventListener('click', onClickCapture, true);
			}
		};
	}

	// ---- Motion ----------------------------------------------------------------
	// Pages overlap in one grid cell while they swap. The old page leaves quickly
	// towards where it came from; the new page waits a beat, then arrives from the
	// side (or edge) the visitor is heading towards.

	const ms = (n) => (reduceMotion ? 0 : n);

	// How pages swap. 'dissolve': nothing moves sideways; the old page blurs out and the
	// new one fades up part by part. 'slide': parts slide out and in along the swipe.
	// ?effect=slide on the URL shows the old one, for comparing.
	const effect =
		typeof location !== 'undefined' && /[?&]effect=slide\b/.test(location.search) ? 'slide' : 'dissolve';
	const SWAP_WAIT = 150;

	function offset(u, x, y, sign) {
		return axis === 'y' ? `translate(0, ${u * Math.max(Math.abs(x), 40) * sign}px)` : `translate(${u * x * sign}px, ${u * y}px)`;
	}

	function enter(node, { delay = 0, x = 48, y = 10, duration = 520, now = false } = {}) {
		return {
			delay: ms(delay + (firstShow || now ? 0 : SWAP_WAIT)),
			duration: ms(effect === 'dissolve' ? duration + 120 : duration),
			easing: cubicOut,
			css: (t, u) =>
				effect === 'dissolve'
					? `opacity: ${t}; transform: translateY(${u * 8}px); filter: blur(${u * 6}px)`
					: `opacity: ${t}; transform: ${offset(u, x, y, dir)}`
		};
	}

	function exit(node, { delay = 0, x = 36, duration = 220 } = {}) {
		return {
			delay: ms(delay),
			duration: ms(effect === 'dissolve' ? duration + 60 : duration),
			easing: cubicIn,
			css: (t, u) =>
				effect === 'dissolve'
					? `opacity: ${t}; filter: blur(${u * 6}px)`
					: `opacity: ${t}; transform: ${offset(u, x, 0, -dir)}`
		};
	}

	// Headline lines slide up out of a mask.
	function lineIn(node, { delay = 0 } = {}) {
		return {
			delay: ms(delay + (firstShow ? 0 : SWAP_WAIT)),
			duration: ms(650),
			easing: cubicOut,
			css: (t, u) =>
				effect === 'dissolve'
					? `opacity: ${t}; transform: translateY(${u * 14}%); filter: blur(${u * 8}px)`
					: `transform: translateY(${u * 105}%)`
		};
	}

	function lineOut(node, { delay = 0 } = {}) {
		return {
			delay: ms(delay),
			duration: ms(effect === 'dissolve' ? 260 : 220),
			easing: cubicIn,
			css: (t, u) =>
				effect === 'dissolve'
					? `opacity: ${t}; filter: blur(${u * 8}px)`
					: `transform: translateY(${-u * 105}%)`
		};
	}

	// A capability giving way to the next: the old one blurs out, the new one sharpens in.
	function skillIn(node) {
		return {
			duration: ms(520),
			easing: cubicOut,
			css: (t, u) => `opacity: ${t}; transform: translateY(${u * 6}px); filter: blur(${u * 5}px)`
		};
	}

	function skillOut(node) {
		return {
			duration: ms(300),
			easing: cubicIn,
			css: (t, u) => `opacity: ${t}; filter: blur(${u * 5}px)`
		};
	}

	function pop(node, { delay = 0, from = 0.5 } = {}) {
		return {
			delay: ms(delay),
			duration: ms(760),
			easing: backOut,
			css: (t) => `opacity: ${Math.min(1, t * 2)}; transform: scale(${from + (1 - from) * t})`
		};
	}

	function ripple(node, { delay = 0 } = {}) {
		return {
			delay: ms(delay),
			duration: ms(1000),
			easing: cubicOut,
			css: (t) => `opacity: ${t}; transform: scale(${0.4 + 0.6 * t})`
		};
	}

	// Keeps the arriving page above the one leaving while they overlap.
	function raise(node) {
		return { duration: ms(1000), css: () => 'z-index: 2' };
	}

	// Shared elements: the cover's thumbnails grow into the product cards (and shrink
	// back). Unlike Svelte's crossfade this
	// scales uniformly, so screenshots never squash on the way.
	function sharedPair() {
		const sending = new Map();
		const receiving = new Map();

		function morph(other, node, params, intro) {
			const a = other.getBoundingClientRect();
			const b = node.getBoundingClientRect();
			const mx = a.left + a.width / 2 - (b.left + b.width / 2);
			const my = a.top + a.height / 2 - (b.top + b.height / 2);
			const s = a.width / b.width;
			return {
				delay: ms(params.delay || 0),
				duration: ms(params.duration || 620),
				easing: cubicOut,
				css: (t, u) =>
					`transform-origin: center; z-index: 3; position: relative;
					transform: translate(${mx * u}px, ${my * u}px) scale(${1 + (s - 1) * u});
					opacity: ${intro ? Math.min(1, t * 3) : t * t}`
			};
		}

		const make = (mine, theirs, intro) => (node, params) => {
			mine.set(params.key, node);
			return () => {
				const other = theirs.get(params.key);
				if (other) {
					theirs.delete(params.key);
					return morph(other, node, params, intro);
				}
				mine.delete(params.key);
				return intro ? enter(node, params) : exit(node, params);
			};
		};

		return [make(sending, receiving, false), make(receiving, sending, true)];
	}

	// Typed loosely: params carry key plus enter/exit options.
	const [send, receive] = /** @type {[any, any]} */ (sharedPair());
</script>

<svelte:window on:pointermove={onPointerMove} on:pointerup={onPointerUp} on:pointercancel={onPointerCancel} on:keydown={onKeydown} />

{#if visible}
	<div
		class="intro"
		class:leaving
		class:to-shorts={toShorts}
		class:pulling={dragging && exitPull > 0}
		style="--exit: {exitPull}"
		class:idle
		class:reopened
		class:dissolve={effect === 'dissolve'}
		role="dialog"
		aria-modal="true"
		aria-label="Welcome"
		use:gestures
	>
		<div class="frame">
			<div class="topbar">
				<div class="progress" class:dragging aria-label="Page {pageIndex + 1} of {PAGES.length}">
					{#each PAGES as p, i}
						<button
							class="seg"
							class:done={i <= pageIndex}
							class:next={i === pageIndex + 1}
							style={pull > 0 && i === pageIndex + 1 ? `--fill: ${pull}` : pull < 0 && i === pageIndex && i > 0 ? `--fill: ${1 + pull}` : ''}
							on:click={() => go(p)}
							aria-label="Go to page {i + 1}"
						></button>
					{/each}
				</div>
				<button class="view-site" on:click={() => leave('view_site')}>View site</button>
			</div>

			<div class="pages" class:dragging>
				{#if page === 'cover'}
					<section class="page" in:raise>
						<h1 class="headline">
							<span class="mask"><span class="line" in:lineIn|global={{ delay: 80 }} out:lineOut|global>Andrea de Candia,</span></span>
							<span class="mask"><span class="line accent" in:lineIn|global={{ delay: 180 }} out:lineOut|global={{ delay: 40 }}>product engineer.</span></span>
						</h1>
						<p class="lede" in:enter|global={{ delay: 300 }} out:exit|global={{ delay: 40 }}>
							My agent knows my work inside out. Tap the orb and ask it anything.
						</p>

						<div class="stage-orb">
							<span class="orbit" in:ripple|global={{ delay: 640 }} out:exit|global>
								<span class="moon m1"></span>
								<span class="moon m2"></span>
								<span class="moon m3"></span>
							</span>
							<span class="ring ring-outer" in:ripple|global={{ delay: 540 }} out:exit|global></span>
							<span class="ring ring-inner" in:ripple|global={{ delay: 440 }} out:exit|global></span>
							<span class="float">
								<button
									class="orb idle"
									class:away={orbAway}
									aria-label="Talk to the voice agent"
									on:click={() => talk('orb')}
									bind:this={coverOrb}
									in:pop|global={{ delay: 320 }}
									out:orbOut|global
								>
									{#each [10, 22, 34, 44, 34, 22, 10] as h, i}
										<span class="bar" style="height: {h}px; animation-delay: {i * 120}ms"></span>
									{/each}
								</button>
							</span>
						</div>

						<div class="skills" in:enter|global={{ delay: 480 }} out:exit|global={{ delay: 60 }}>
							{#each shown as k, slot (slot)}
								<div class="skill-slot">
									{#key k}
										<button class="skill" on:click={() => askAbout(CAPABILITIES[k])} in:skillIn out:skillOut>
											<svg class="skill-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="bevel" /><path d="M12 6L13.5 10.5L18 12L13.5 13.5L12 18L10.5 13.5L6 12L10.5 10.5L12 6Z" fill="currentColor" /></svg>
											<span>{CAPABILITIES[k].label}</span>
										</button>
									{/key}
								</div>
							{/each}
						</div>

						<div class="stack">
							<a class="shorts-link" href="/shorts" on:click={(e) => !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button > 0) && leave('shorts')} in:enter|global={{ delay: 520, x: 0, y: 24, now: dir < 0 }} out:exit|global={{ delay: 70 }}>
								<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6.5v11l9-5.5z" /></svg>
								Watch as shorts
							</a>
							<div class="bottom">
								<button class="band" on:click={() => go('products')} in:enter|global={{ delay: 560, x: 0, y: 24, now: dir < 0 }} out:exit|global={{ delay: 80 }}>
									<span class="thumbs" aria-hidden="true">
										{#each coverThumbs as p, i (p.id)}
											<img draggable="false" src={videos[p.id]?.poster || p.image} alt="" style="animation-delay: {i * 260}ms" in:receive|global={{ key: p.id, delay: dir < 0 ? i * 40 : 0 }} out:send|global={{ key: p.id, delay: i * 50 }} />
										{/each}
									</span>
									<span class="band-text">
										<span class="band-title">Software products</span>
									</span>
									<svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
								</button>
							</div>
						</div>
					</section>
				{:else if page === 'products'}
					<section class="page" in:raise>
						<h1 class="headline small">
							<span class="mask"><span class="line" in:lineIn|global={{ delay: 60 }} out:lineOut|global>Architected, built,</span></span>
							<span class="mask"><span class="line accent" in:lineIn|global={{ delay: 150 }} out:lineOut|global={{ delay: 40 }}>production-grade.</span></span>
						</h1>
						<p class="lede" in:enter|global={{ delay: 240 }} out:exit|global={{ delay: 40 }}>
							Tap one for the full story, or ask the agent about any of them.
						</p>

						<div class="cards">
							<ProjectCards
								projects={liveProjects}
								{videos}
								paused={$isChatCovering || leaving || !!detail}
								hiddenId={heroCardId}
								shortsTile
								onShorts={() => leave('shorts')}
								bind:scroller={carousel}
								onScroll={() => peeking || wake()}
								onOpen={(p, media) => {
									projectView.open(p, media);
									wake();
								}}
								cardIn={receive}
								cardOut={send}
							/>
						</div>

						<div class="stack">
							<div class="bottom">
								<button class="back" on:click={back} aria-label="Back" in:enter|global={{ delay: 420, x: -24, y: 0 }} out:exit|global={{ delay: 60 }}>
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
								</button>
								<button class="chat-btn" on:click={() => talk('products')} aria-label="Chat with my agent" in:chatIn|global={{ delay: 450 }} out:exit|global={{ delay: 60 }}>
									<span class="chat-icon" class:awaiting={flight} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="bevel" /><path class="inner-prism" d="M12 6L13.5 10.5L18 12L13.5 13.5L12 18L10.5 13.5L6 12L10.5 10.5L12 6Z" fill="currentColor" /></svg></span>
									Chat
								</button>
								<button class="band" on:click={() => go('experience')} in:enter|global={{ delay: 480, x: 0, y: 24 }} out:exit|global={{ delay: 80 }}>
									<span class="band-text">
										<span class="band-title">Experience</span>
									</span>
									<svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
								</button>
							</div>
						</div>
					</section>
				{:else if page === 'experience'}
					<section class="page" in:raise>
						<h1 class="headline small">
							<span class="mask"><span class="line" in:lineIn|global={{ delay: 60 }} out:lineOut|global>Putting AI to work</span></span>
							<span class="mask"><span class="line accent" in:lineIn|global={{ delay: 150 }} out:lineOut|global={{ delay: 40 }}>in the real world.</span></span>
						</h1>

						<ExperienceTimeline {roles} {enter} {exit} {reduceMotion} />

						<div class="stack">
							<div class="bottom">
								<button class="back" on:click={back} aria-label="Back" in:enter|global={{ delay: 640, x: -24, y: 0 }} out:exit|global={{ delay: 60 }}>
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
								</button>
								<button class="chat-btn" on:click={() => talk('experience')} aria-label="Chat with my agent" in:pop|global={{ delay: 670, from: 0.8 }} out:exit|global={{ delay: 60 }}>
									<span class="chat-icon" class:awaiting={flight} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="bevel" /><path class="inner-prism" d="M12 6L13.5 10.5L18 12L13.5 13.5L12 18L10.5 13.5L6 12L10.5 10.5L12 6Z" fill="currentColor" /></svg></span>
									Chat
								</button>
								<button class="primary grow" class:ready={exitReady} on:click={() => leave('enter_site')} in:enter|global={{ delay: 700, x: 0, y: 24 }} out:exit|global={{ delay: 80 }}>
									<span class="primary-label">{exitReady ? 'Let go to enter' : 'Enter the site'}</span>
								</button>
							</div>
						</div>
					</section>
				{/if}
			</div>
		</div>


		{#if flight}
			<div
				class="flyer"
				style="left: {flight.from.left}px; top: {flight.from.top}px; width: {flight.from.width}px; height: {flight.from.height}px"
				use:flyToChat={flight}
				aria-hidden="true"
			>
				<span class="flyer-bars">
					{#each [10, 22, 34, 44, 34, 22, 10] as h}<span class="bar" style="height: {h}px"></span>{/each}
				</span>
				<svg class="flyer-prism" viewBox="0 0 24 24" fill="none"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="bevel" /><path class="inner-prism" d="M12 6L13.5 10.5L18 12L13.5 13.5L12 18L10.5 13.5L6 12L10.5 10.5L12 6Z" fill="currentColor" /></svg>
			</div>
		{/if}

		<ProjectView
			bind:this={projectView}
			bind:project={detail}
			bind:heroCardId
			projects={liveProjects}
			zIndex={10}
			paused={leaving}
			findCardMedia={cardMedia}
			onNavigate={(reason) => leave(reason)}
		/>
	</div>
{/if}

<!-- Outside the screen itself, so the orb can finish its flight as Welcome closes. -->
{#if handoff}
	<div
		class="flyer handoff"
		style="left: {handoff.from.left}px; top: {handoff.from.top}px; width: {handoff.from.width}px; height: {handoff.from.height}px"
		use:toBody
		use:flyToVoice={handoff}
		aria-hidden="true"
	>
		<span class="flyer-bars">
			{#each [10, 22, 34, 44, 34, 22, 10] as h}<span class="bar" style="height: {h}px"></span>{/each}
		</span>
	</div>
{/if}

<style>
	.intro {
		display: none;
		position: fixed;
		inset: 0;
		z-index: 5000;
		background: #000;
		color: #fff;
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		overscroll-behavior: contain;
		touch-action: none;
		overflow: hidden;
		user-select: none;
		-webkit-user-select: none;
		-webkit-user-drag: none;
		transition:
			opacity 0.45s ease,
			transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
	}

	:global(html.show-intro) .intro {
		display: flex;
		justify-content: center;
	}

	/* Keep the page underneath from scrolling, including touch scrolling on iOS. */
	:global(html.show-intro),
	:global(html.show-intro body) {
		overflow: hidden;
		overscroll-behavior: none;
	}

	/* The site's voice mode opens over the intro, not under it. */
	:global(html.show-intro .chat-wrapper) {
		/* Important: the chat's own (scoped, so more specific) rule would otherwise win. */
		z-index: 6000 !important;
	}

	/* Coming back from the site fades in over it rather than cutting. */
	.intro.reopened {
		animation: intro-in 0.35s ease-out;
	}

	@keyframes intro-in {
		from {
			opacity: 0;
		}
	}

	.intro.leaving {
		opacity: 0;
		transform: scale(1.04);
		pointer-events: none;
	}

	/* On the way to /shorts: the black stays, the content fades out of it. */
	.intro.to-shorts {
		pointer-events: none;
	}

	.intro.to-shorts .frame {
		opacity: 0;
		transform: scale(0.97);
		transition:
			opacity 0.3s ease,
			transform 0.3s ease;
	}

	.frame {
		width: 100%;
		max-width: 440px;
		height: 100%;
		box-sizing: border-box;
		padding: 14px 24px max(3vh, 20px);
		display: flex;
		flex-direction: column;
		transform: scale(calc(1 - var(--exit, 0) * 0.07));
		transition: transform 0.35s cubic-bezier(0.34, 1.3, 0.64, 1);
	}

	/* Everything but the bottom row dims, so "Let go to enter" stands out. */
	.topbar,
	.page > :global(:not(.stack)) {
		opacity: calc(1 - var(--exit, 0) * 0.5);
		transition: opacity 0.35s ease;
	}

	.intro.pulling .topbar,
	.intro.pulling .page > :global(:not(.stack)) {
		transition: none;
	}

	.intro.pulling .frame {
		transition: none;
	}

	.intro.pulling {
		transition: none;
	}

	.topbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
		min-height: 44px;
	}

	.progress {
		flex: 1;
		max-width: 180px;
		display: flex;
		gap: 5px;
	}

	.seg {
		flex: 1;
		height: 20px;
		padding: 0;
		border: 0;
		background: none;
		cursor: pointer;
		position: relative;
	}

	.seg::before,
	.seg::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: 8px;
		height: 3px;
		border-radius: 2px;
		background: #3f3f46;
	}

	.seg::after {
		background: #e4e4e7;
		transform: scaleX(var(--fill, 0));
		transform-origin: left;
		transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
	}

	.seg.done::after {
		transform: scaleX(var(--fill, 1));
	}

	/* The bar tracks the finger directly while dragging, then eases. */
	.progress.dragging .seg::after {
		transition: none;
	}

	/* Dissolving lines blur, so their masks must not clip the blur. */
	.intro.dissolve .mask {
		overflow: visible;
	}

	.view-site {
		height: 36px;
		padding: 0 16px;
		border-radius: 18px;
		border: 1px solid #3f3f46;
		background: none;
		color: #e4e4e7;
		font: 600 0.9rem 'Inter', sans-serif;
		cursor: pointer;
		white-space: nowrap;
		transition:
			background-color 0.2s ease,
			border-color 0.2s ease;
	}

	.view-site:hover {
		background: #18181b;
		border-color: #52525b;
	}

	/* Both pages share one cell while they swap. */
	.pages {
		flex: 1;
		min-height: 0;
		display: grid;
		grid-template-columns: minmax(0, 1fr);
	}

	.page {
		grid-area: 1 / 1;
		min-width: 0;
		min-height: 0;
		display: flex;
		flex-direction: column;
		padding-top: max(5vh, 20px);
	}

	.headline {
		margin: 0;
		display: flex;
		flex-direction: column;
		font-size: clamp(2.4rem, 9vw, 3.2rem);
		font-weight: 800;
		line-height: 1.08;
		letter-spacing: -0.03em;
	}

	.headline.small {
		font-size: clamp(2rem, 8vw, 2.6rem);
	}

	.mask {
		display: block;
		overflow: hidden;
		padding-bottom: 0.06em;
	}

	.line {
		display: block;
	}

	.accent {
		color: #a5b4fc;
	}

	.lede {
		margin: 1rem 0 0;
		font-size: 1.05rem;
		line-height: 1.5;
		color: #d4d4d8;
	}

	.stage-orb {
		flex: 1;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 180px;
	}

	.ring {
		position: absolute;
		border-radius: 50%;
		border: 1px solid rgba(165, 180, 252, 0.35);
	}

	.ring-outer {
		width: 230px;
		height: 230px;
		border-color: rgba(165, 180, 252, 0.2);
		animation: pulse 3.2s ease-in-out 1.4s infinite;
	}

	.ring-inner {
		width: 170px;
		height: 170px;
		border-color: rgba(165, 180, 252, 0.5);
		animation: pulse 3.2s ease-in-out 1.2s infinite;
	}

	.orb {
		position: relative;
		width: 120px;
		height: 120px;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: #4f46e5;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		cursor: pointer;
		transition:
			background-color 0.2s ease,
			opacity 0.35s ease,
			transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.orb:hover {
		background: #5b52f0;
	}

	.bar {
		width: 4px;
		border-radius: 2px;
		background: #fff;
	}

	.orb.idle .bar {
		animation: breathe 2.4s ease-in-out infinite;
	}

	@keyframes breathe {
		0%,
		100% {
			transform: scaleY(1);
		}
		50% {
			transform: scaleY(0.55);
		}
	}

	@keyframes pulse {
		0%,
		100% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(1.06);
			opacity: 0.55;
		}
	}

	.stack {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		gap: 14px;
		margin-top: 14px;
	}

	/* The same height on every page, so the row never jumps between them. */
	.bottom {
		display: flex;
		gap: 10px;
		align-items: stretch;
		height: 64px;
	}

	/* The cover's way to the shorts, in the Watch as shorts card's colours: a gold ring with a
	   light running round it and a slow glow. */
	.shorts-link {
		align-self: center;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		height: 44px;
		padding: 0 20px 0 16px;
		box-sizing: border-box;
		border-radius: 999px;
		border: 2px solid transparent;
		background:
			linear-gradient(#111114, #111114) padding-box,
			conic-gradient(from var(--gold-turn), #8a6a1f, #f5d77a, #fff4c7, #d4a93a, #8a6a1f 40%, #b8892b 70%, #8a6a1f) border-box;
		color: #fff4c7;
		font: 700 0.92rem 'Inter', sans-serif;
		text-decoration: none;
		animation:
			gold-turn 4s linear infinite,
			gold-glow 3s ease-in-out infinite;
	}

	.shorts-link svg {
		width: 18px;
		height: 18px;
		fill: #f5d77a;
	}

	@property --gold-turn {
		syntax: '<angle>';
		inherits: false;
		initial-value: 0deg;
	}

	@keyframes gold-turn {
		to {
			--gold-turn: 360deg;
		}
	}

	@keyframes gold-glow {
		0%,
		100% {
			box-shadow: 0 0 0 rgba(227, 179, 65, 0);
		}
		50% {
			box-shadow: 0 0 22px rgba(227, 179, 65, 0.35);
		}
	}

	.chat-btn {
		flex: 0 0 auto;
		padding: 0 16px 0 12px;
		gap: 8px;
		border-radius: 18px;
		border: 1px solid #4338ca;
		background: #1e1b4b;
		color: #fff;
		font: 600 0.95rem 'Inter', sans-serif;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.chat-btn:hover {
		background: #272463;
	}

	.chat-icon {
		width: 30px;
		height: 30px;
		border-radius: 50%;
		background: #4f46e5;
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* The same motion as the site's AI button: a slow turn, the inner star breathing. */
	.chat-icon svg {
		width: 18px;
		height: 18px;
		animation: prism-turn 8s linear infinite;
	}

	/* Starts at full brightness, the state the flying star lands in. */
	.inner-prism {
		transform-box: fill-box;
		transform-origin: center;
		animation: prism-pulse 2s ease-in-out -1s infinite;
	}

	/* Held still until the flying orb lands, so the hand-over doesn't jump. */
	.chat-icon.awaiting svg,
	.chat-icon.awaiting .inner-prism {
		animation-play-state: paused;
	}

	@keyframes prism-turn {
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes prism-pulse {
		0%,
		100% {
			opacity: 0.4;
			transform: scale(0.8);
		}
		50% {
			opacity: 1;
			transform: scale(1);
		}
	}

	/* Hidden while the flying orb is on its way to take its place. */
	.chat-icon.awaiting {
		visibility: hidden;
	}

	.flyer {
		position: fixed;
		z-index: 20;
		border-radius: 50%;
		background: #4f46e5;
		color: #fff;
		display: grid;
		place-items: center;
		transform-origin: center;
		pointer-events: none;
	}

	/* Above the chat window, which sits above this screen. */
	.flyer.handoff {
		z-index: 6100;
		box-shadow: 0 0 40px rgba(79, 70, 229, 0.45);
	}

	:global(html.orb-landing .voice-mode-container .orb-wrapper) {
		opacity: var(--orb-landing, 0);
	}

	/* While the chat it flew into is open, the cover's orb stays away. */
	.orb.away {
		opacity: 0;
		transform: scale(0.6);
	}

	/* Under the orb, what I build, two at a time, taking turns to change. */
	.skills {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 8px;
	}

	.skill-slot {
		display: grid;
	}

	.skill {
		grid-area: 1 / 1;
		min-height: 3.4rem;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 9px 14px;
		border: 1px solid #27272a;
		border-radius: 16px;
		background: #111114;
		color: #d4d4d8;
		font: 500 0.9rem/1.35 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		text-align: left;
		cursor: pointer;
		transition:
			border-color 0.2s ease,
			background-color 0.2s ease;
	}

	.skill:active {
		background: #18181b;
		border-color: #4338ca;
	}

	.skill-icon {
		flex-shrink: 0;
		width: 18px;
		height: 18px;
		color: #a5b4fc;
	}

	/* Short screens keep one, so the orb still has room. */
	@media (max-height: 720px) {
		.skill-slot:nth-child(2) {
			display: none;
		}
	}

	.flyer-bars,
	.flyer-prism {
		grid-area: 1 / 1;
	}

	.flyer-bars {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.flyer-prism {
		width: 60%;
		height: 60%;
		opacity: 0;
	}

	.primary {
		height: 64px;
		border: 0;
		border-radius: 28px;
		background: #fff;
		color: #1e1b4b;
		font: 700 1.05rem 'Inter', sans-serif;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		cursor: pointer;
		transition: transform 0.2s ease;
	}

	/* Fills from the left as the pull nears the point of no return. */
	.primary {
		position: relative;
		overflow: hidden;
		isolation: isolate;
	}

	.primary::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: -1;
		background: #c7d2fe;
		transform-origin: left;
		transform: scaleX(var(--exit, 0));
		transition: transform 0.35s ease;
	}

	.intro.pulling .primary::before {
		transition: none;
	}

	.primary.ready {
		animation: ready-pulse 0.5s ease-out;
	}

	@keyframes ready-pulse {
		0% {
			transform: scale(1);
		}
		40% {
			transform: scale(1.04);
		}
		100% {
			transform: scale(1);
		}
	}

	.primary.grow {
		flex: 1;
		height: auto;
		border-radius: 18px;
	}

	.primary:hover {
		transform: translateY(-2px);
	}

	.back {
		flex: 0 0 64px;
		border-radius: 18px;
		border: 1px solid #27272a;
		background: #0f0f13;
		color: #e4e4e7;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition:
			background-color 0.2s ease,
			transform 0.2s ease;
	}

	.back:hover {
		background: #18181b;
		transform: translateX(-2px);
	}

	.back svg {
		width: 22px;
		height: 22px;
	}

	.band {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 12px 14px;
		border-radius: 18px;
		border: 1px solid #27272a;
		background: #0f0f13;
		color: #fff;
		text-align: left;
		font-family: 'Inter', sans-serif;
		cursor: pointer;
		transition: border-color 0.2s ease;
	}

	.band:hover {
		border-color: #4338ca;
	}

	.thumbs {
		display: flex;
	}

	.thumbs img {
		width: 34px;
		height: 34px;
		border-radius: 9px;
		object-fit: cover;
		object-position: top;
		border: 2px solid #0f0f13;
	}

	.thumbs img + img {
		margin-left: -10px;
	}

	.band-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.band-title {
		font-weight: 700;
		font-size: 1rem;
	}

	.band-sub {
		font-size: 0.85rem;
		color: #a1a1aa;
	}


	/* The timeline spine draws itself down as the roles arrive. */
	@keyframes draw {
		from {
			transform: scaleY(0);
		}
		to {
			transform: scaleY(1);
		}
	}

	/* The card row may bleed to the screen edges. */
	.cards {
		flex: 1;
		min-height: 0;
		margin-top: 22px;
		--cards-margin: 0 -24px;
		--cards-padding: 0 24px;
		--cards-scroll-padding: 0 24px;
	}

	/* ---- Idle motion ------------------------------------------------------ */
	.float {
		display: flex;
		animation: float 6s ease-in-out infinite;
	}

	.orbit {
		position: absolute;
		width: 290px;
		height: 290px;
		border-radius: 50%;
		border: 1px dashed rgba(165, 180, 252, 0.18);
		animation: spin 48s linear infinite;
	}

	.moon {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 8px;
		height: 8px;
		margin: -4px;
		border-radius: 50%;
		background: #818cf8;
	}

	.m1 {
		transform: rotate(-40deg) translateX(145px);
	}

	.m2 {
		width: 6px;
		height: 6px;
		margin: -3px;
		background: #c7d2fe;
		transform: rotate(100deg) translateX(145px);
	}

	.m3 {
		width: 5px;
		height: 5px;
		margin: -2.5px;
		background: #6366f1;
		transform: rotate(210deg) translateX(145px);
	}

	.thumbs img {
		animation: bob 3.2s ease-in-out infinite;
	}

	/* A light travels down the timeline spine. */
	/* After a few still seconds, point at what's next. */
	.intro.idle .seg.next::before {
		animation: hint 1.8s ease-in-out infinite;
	}

	.intro.idle .band {
		animation: glow 2.4s ease-in-out infinite;
	}

	@keyframes float {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-7px);
		}
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes bob {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-3px);
		}
	}

	@keyframes hint {
		0%,
		100% {
			background: #3f3f46;
		}
		50% {
			background: #a5b4fc;
		}
	}

	@keyframes glow {
		0%,
		100% {
			border-color: #27272a;
		}
		50% {
			border-color: #4338ca;
		}
	}

	/* Mirrors the back button's chevron, so a row reads < … > */
	.chevron {
		flex-shrink: 0;
		width: 22px;
		height: 22px;
		color: #e4e4e7;
	}

	@media (prefers-reduced-motion: reduce) {
		.orb.idle .bar,
		.ring-outer,
		.ring-inner,
		.orbit,
		.float,
		.thumbs img,
		.intro.idle .seg.next::before,
		.intro.idle .band,
		.chat-icon svg,
		.inner-prism {
			animation: none;
		}
		.intro,
		.seg::after {
			transition: none;
		}
	}
</style>
