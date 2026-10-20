<script>
	// The full project view: a card grows into it (hero), with a sideways reel of the
	// promo cut and the product's social videos, the story, store links, the note and
	// Chat. Phones get one column; wide screens put the reel beside the text.
	// Used by the Welcome screen and the site's Software section.
	import { onDestroy, onMount, tick } from 'svelte';
	import { cubicOut, cubicIn, backOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';
	import { openChat, isChatOpen, isChatCovering } from '$lib/stores/chat';
	import { emitVisitEvent } from '$lib/visit-events';
	import { promoVideos } from '$lib/promo-videos';
	import { projectSlug } from './projects';

	export let projects = [];
	/** The open project, or null. Read it; open and close through open() and close(). */
	export let project = null;
	/** The card the hero stands in for while open or shrinking home; the parent hides its media. */
	export let heroCardId = null;
	/** Finds a card's media element, for the hero to shrink back into. */
	export let findCardMedia = (id) => null;
	/** Pauses the reel, e.g. while the Welcome screen is leaving. */
	export let paused = false;
	export let zIndex = 1900;
	/** Stops the page behind from scrolling while open (the site; the Welcome screen locks itself). */
	export let lockScroll = false;
	/** Called before a link inside the view takes the visitor elsewhere. */
	export let onNavigate = (reason) => {};
	/** Opens the chat about a project. */
	export let onChat = (p) => {
		emitVisitEvent('visit:chat_open');
		openChat({ text: `Tell me about ${p.name}.`, source: 'ask-agent' });
	};

	$: videos = $promoVideos;
	const reduceMotion =
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const ms = (n) => (reduceMotion ? 0 : n);

	// Where the hero grows from (the tapped card's media), or null when moving between projects.
	let heroFrom = null;
	let closing = false;
	// +1 moving to the next project, -1 to the previous; transitions read it to pick a side.
	let dir = 1;

	$: index = project ? projects.findIndex((p) => p.id === project.id) : -1;
	const projectAt = (i) => projects[(i + projects.length) % projects.length];

	// The address bar names the open project (#rogue-calculator), so it can be shared.
	// Only a hash this view wrote is cleared on close, never a section's (#experience).
	let linkedHash = null;
	$: if (typeof window !== 'undefined') syncHash(project);

	// Phones get the share sheet; elsewhere the link is copied, and the icon says so.
	let copied = false;
	let copiedTimer;

	async function share(p) {
		const url = `${location.origin}/#${projectSlug(p)}`;
		emitVisitEvent('visit:project_share', { project: p.id });
		if (navigator.share && matchMedia('(pointer: coarse)').matches) {
			try {
				await navigator.share({ title: p.name, url });
				return;
			} catch (e) {
				if (e?.name === 'AbortError') return;
			}
		}
		try {
			await navigator.clipboard.writeText(url);
			copied = true;
			clearTimeout(copiedTimer);
			copiedTimer = setTimeout(() => (copied = false), 1800);
		} catch {}
	}

	function syncHash(p) {
		const hash = p ? `#${projectSlug(p)}` : null;
		if (hash === linkedHash) return;
		if (hash) history.replaceState(history.state, '', hash);
		else if (location.hash === linkedHash) history.replaceState(history.state, '', location.pathname + location.search);
		linkedHash = hash;
	}

	$: if (typeof document !== 'undefined' && lockScroll) {
		document.documentElement.classList.toggle('project-open', !!project);
	}

	onDestroy(() => {
		clearTimeout(settleTimer);
		clearTimeout(controlsTimer);
		clearTimeout(copiedTimer);
		if (typeof document !== 'undefined' && lockScroll) document.documentElement.classList.remove('project-open');
	});

	export function open(p, media) {
		heroFrom = media?.getBoundingClientRect() || null;
		heroCardId = p.id;
		closing = false;
		dir = 1;
		reelMuted = false;
		loadPress(p.id);
		project = p;
		emitVisitEvent('visit:project_open', { project: p.id });
	}

	export function close() {
		if (!project) return;
		findCardMedia(project.id)?.closest('.product')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
		// The promo cut is the one that shrinks home, so bring it back into view first.
		reel?.scrollTo({ left: 0 });
		heroCardId = project.id;
		closing = true;
		project = null;
		setTimeout(() => (heroCardId = closing ? null : heroCardId), ms(620));
	}

	// Moving between projects wraps around the list.
	function step(by) {
		if (!project) return;
		heroFrom = null;
		heroCardId = null;
		closing = false;
		dir = by;
		project = projectAt(index + by);
		loadPress(project.id);
		emitVisitEvent('visit:project_open', { project: project.id, via: by > 0 ? 'next' : 'previous' });
	}

	// ---- Video reel ----------------------------------------------------------------
	// The reel scrolls sideways from the promo cut through the product's social videos,
	// read off its /press page only once the project is opened.

	let press = {};
	const pressRequests = new Set();

	function loadPress(id) {
		if (pressRequests.has(id)) return;
		pressRequests.add(id);
		fetch(`/api/press?project=${id}`)
			.then((res) => (res.ok ? res.json() : { videos: [] }))
			.then(({ videos: list }) => (press = { ...press, [id]: list || [] }))
			.catch(() => {});
	}

	let reel;
	let activeSlide = 0;
	// The tap that opened the view counts as a gesture, so sound is usually allowed. Once
	// the browser refuses, or the visitor mutes, the following videos stay muted too.
	let reelMuted = false;

	// A press page can list the promo cut too; it stays first and is not repeated.
	$: slides = project
		? [
				...(videos[project.id] ? [{ title: 'Promo', ...videos[project.id] }] : []),
				...(press[project.id] || []).filter((v) => v.src !== videos[project.id]?.src)
		  ]
		: [];

	// Only the centred slide plays, and only once the reel has stopped moving; the ones
	// beside it fetch their first frame, the rest wait.
	// A video the browser itself took fullscreen (iPhone, or a browser that ignores
	// controlsList) has left the reel as far as visibility goes, so that never pauses it;
	// when it ends there, the next cut plays in the same player until fullscreen is left.
	function reelVideo(node, params) {
		let { index, paused, list, active, settled, quiet } = params;
		let away = false; // another cut has been centred since this one last played
		let chain = null;
		const root = node.closest('.reel');
		const nativeFullscreen = () =>
			document.fullscreenElement === node || !!(/** @type {any} */ (node).webkitDisplayingFullscreen);
		const near = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting && node.preload === 'none') node.preload = 'metadata';
			},
			{ root, rootMargin: '0px 40% 0px 40%' }
		);
		const seen = new IntersectionObserver(
			([entry]) => {
				// The previous project's reel, still sliding out, has no say.
				if (nativeFullscreen() || root !== reel) return;
				if (entry.isIntersecting) activeSlide = index;
			},
			{ root, threshold: 0.6 }
		);
		// Only the visitor's own mute or unmute is remembered for the next cuts. Muting set
		// here (the browser refusing sound, or a call going on) is not their choice, which
		// used to leave every later cut muted after one refusal.
		let ours = node.muted;
		const onVolume = () => {
			if (node.muted === ours) return;
			ours = node.muted;
			if (!quiet) reelMuted = node.muted;
			if (!node.muted && soundBlocked === index) soundBlocked = null;
		};
		// A pause while the cut is meant to be playing came from the visitor (a tap, or the
		// player's own button), and holds until they play it again.
		const onPause = () => {
			if (active && settled && !paused && !node.ended) node.dataset.held = '1';
			if (active) showControls(node);
		};
		const onPlay = () => {
			delete node.dataset.held;
			if (active) showControls(node);
		};
		const onEnded = () => {
			if (nativeFullscreen()) {
				const next = (chain ?? index) + 1;
				if (list[next]) {
					chain = next;
					node.src = list[next];
					node.play().catch(() => {});
					return;
				}
			}
			showUpNext(index);
		};
		const onNativeExit = () => {
			if (nativeFullscreen() || chain === null) return;
			const reached = chain;
			chain = null;
			node.src = list[index];
			goToSlide(reached, false);
		};
		function sync() {
			if (!active) away = true;
			// Moving between cuts always starts the arriving one from the top.
			if (active && settled && away) {
				away = false;
				if (node.currentTime > 0) node.currentTime = 0;
				delete node.dataset.held;
			}
			if (active && settled && !paused && !node.dataset.held) {
				node.muted = ours = reelMuted || quiet;
				if (soundBlocked === index && !node.muted) soundBlocked = null;
				node.play().catch(() => {
					// No sound without a fresh tap (iPhones ask for one per video): play
					// silently and offer the sound on the next tap.
					node.muted = ours = true;
					if (!reelMuted && !quiet) soundBlocked = index;
					node.play().catch(() => {});
				});
			} else if (!nativeFullscreen() && !node.paused) {
				node.pause();
			}
		}
		near.observe(node);
		seen.observe(node);
		sync();
		node.addEventListener('volumechange', onVolume);
		node.addEventListener('pause', onPause);
		node.addEventListener('play', onPlay);
		node.addEventListener('ended', onEnded);
		node.addEventListener('webkitendfullscreen', onNativeExit);
		document.addEventListener('fullscreenchange', onNativeExit);
		return {
			update(next) {
				({ index, paused, list, active, settled, quiet } = next);
				sync();
			},
			destroy() {
				near.disconnect();
				seen.disconnect();
				node.removeEventListener('volumechange', onVolume);
				node.removeEventListener('pause', onPause);
				node.removeEventListener('play', onPlay);
				node.removeEventListener('ended', onEnded);
				node.removeEventListener('webkitendfullscreen', onNativeExit);
				document.removeEventListener('fullscreenchange', onNativeExit);
			}
		};
	}

	// Pads the reel so its first and last slides can sit in the middle, again whenever
	// it changes size (entering or leaving fullscreen), keeping the current one centred.
	function centerSlides(node) {
		const pad = () => {
			const first = node.querySelector('.slide');
			if (first) node.style.paddingInline = `${Math.max(0, (node.clientWidth - first.offsetWidth) / 2)}px`;
		};
		pad();
		activeSlide = 0;
		const resize = new ResizeObserver(() => {
			pad();
			goToSlide(activeSlide, false);
			measureCaption();
		});
		resize.observe(node);
		return { destroy: () => resize.disconnect() };
	}

	// The reel counts as settled once it has stopped scrolling; until then no cut plays
	// or shows its controls, so nothing slides past mid-swipe with a play button on it.
	let settled = true;
	let settleTimer;
	function reelScrolled() {
		settled = false;
		clearTimeout(settleTimer);
		settleTimer = setTimeout(() => (settled = true), 180);
	}
	function reelSettled() {
		clearTimeout(settleTimer);
		settled = true;
	}

	function goToSlide(k, smooth = true) {
		const el = reel?.querySelectorAll('.slide')[k];
		if (!el) return;
		reel.scrollTo({
			left: el.offsetLeft - (reel.clientWidth - el.offsetWidth) / 2,
			behavior: smooth && !reduceMotion ? 'smooth' : 'auto'
		});
	}

	// A tap (or click) on a playing cut pauses it and another plays it again, with a
	// glyph in the middle to say which. The browser's own click-to-play is held back so
	// the two don't cancel out.
	let tapGlyph = null; // { index, kind: 'play' | 'pause', n }

	// The cut the browser would only play muted, still waiting for a tap to get its sound.
	let soundBlocked = null;

	// Phones show the cut's title pill only while the player's controls are up: always
	// when paused, otherwise for a few seconds after a tap or the start of playback,
	// about as long as iOS and Chrome keep their controls.
	const CONTROLS_MS = 3000;
	let controlsUp = false;
	let controlsTimer;
	function showControls(video) {
		controlsUp = true;
		clearTimeout(controlsTimer);
		if (video && !video.paused) controlsTimer = setTimeout(() => (controlsUp = false), CONTROLS_MS);
	}

	function togglePlay(video, index) {
		showControls(video);
		if (soundBlocked === index && !video.paused) {
			soundBlocked = null;
			video.muted = false;
			return;
		}
		const play = video.paused;
		if (play) {
			delete video.dataset.held;
			video.play().catch(() => {});
		} else {
			video.dataset.held = '1';
			video.pause();
		}
		tapGlyph = { index, kind: play ? 'play' : 'pause', n: (tapGlyph?.n || 0) + 1 };
	}

	// Computers (a mouse or trackpad, or simply a wide screen) keep the browser's own
	// fullscreen, one video at a time; phones and tablets get the reel's, which keeps Up
	// next and swiping.
	let finePointer = false;
	onMount(() => {
		const query = window.matchMedia('(hover: hover), (any-pointer: fine), (min-width: 900px)');
		const check = () => (finePointer = query.matches);
		check();
		query.addEventListener('change', check);
		return () => query.removeEventListener('change', check);
	});

	// Wide screens put the cut's title under it, in a row as wide as the cut.
	let captionWidth = 0;
	function measureCaption() {
		captionWidth = reel?.querySelectorAll('.slide')[activeSlide]?.offsetWidth || 0;
	}
	$: if (reel && slides && activeSlide >= 0) tick().then(measureCaption);

	// ---- Up next -------------------------------------------------------------------
	// When a cut ends, the next one is offered over it with a short countdown, the way
	// YouTube does; tapping it (or waiting) slides on and plays, fullscreen or not.

	const UP_NEXT_MS = 3000;
	let upNext = null; // index of the slide that just ended
	let upNextTimer;

	function showUpNext(i) {
		clearTimeout(upNextTimer);
		upNext = i;
		if (slides[i + 1]) upNextTimer = setTimeout(playNext, UP_NEXT_MS);
	}

	function cancelUpNext() {
		clearTimeout(upNextTimer);
		upNext = null;
	}

	function playNext() {
		if (upNext === null) return;
		const next = upNext + 1;
		cancelUpNext();
		goToSlide(next);
	}

	// Leaves fullscreen if it's on, then the project view itself.
	function exitProject() {
		cancelUpNext();
		if (reelFullscreen) toggleFullscreen(activeSlide);
		close();
	}

	function replay(i) {
		cancelUpNext();
		const v = reel?.querySelectorAll('.slide video')[i];
		if (!v) return;
		v.currentTime = 0;
		v.play().catch(() => {});
	}

	$: if (upNext !== null && activeSlide !== upNext) cancelUpNext();
	$: if (!project) cancelUpNext();

	// ---- Fullscreen ------------------------------------------------------------------
	// The whole reel goes fullscreen rather than one video, so Up next shows on top and
	// the cuts can still be swiped. iPhones only allow a video itself fullscreen.

	let heroMedia;
	let reelFullscreen = false;

	// Holds the reel and its frame for whichever project is current. bind:this would be
	// cleared when the previous project's copy finishes sliding out, after the new one
	// had already set it, leaving fullscreen (and the rest) pointing at nothing.
	function ref(node, set) {
		set(node);
		return { destroy: () => set(null, node) };
	}
	const setHero = (node, old) => {
		if (!old || heroMedia === old) heroMedia = node;
	};
	const setReel = (node, old) => {
		if (!old || reel === old) reel = node;
	};

	// Safari still names parts of the Fullscreen API with a webkit prefix.
	const doc = () => /** @type {any} */ (document);

	function toggleFullscreen(i) {
		if (doc().fullscreenElement || doc().webkitFullscreenElement) {
			(doc().exitFullscreen || doc().webkitExitFullscreen).call(document);
			return;
		}
		const host = /** @type {any} */ (heroMedia);
		const video = /** @type {any} */ (reel?.querySelectorAll('.slide video')[i]);
		// iPhones expose the element API but refuse it; only the video itself can go
		// fullscreen there, and fullscreenEnabled says which kind of browser this is.
		const elementFullscreen = doc().fullscreenEnabled || doc().webkitFullscreenEnabled;
		const enterFull = elementFullscreen && (host?.requestFullscreen || host?.webkitRequestFullscreen);
		const videoFullscreen = () => {
			try {
				if (video?.webkitEnterFullscreen) video.webkitEnterFullscreen();
				else video?.requestFullscreen?.();
			} catch (err) {
				console.warn('[ProjectView] Fullscreen refused:', err);
			}
		};
		if (!enterFull) return videoFullscreen();
		try {
			const pending = enterFull.call(host);
			pending?.catch?.(videoFullscreen);
		} catch {
			videoFullscreen();
		}
	}

	function onFullscreenChange() {
		reelFullscreen = !!(doc().fullscreenElement || doc().webkitFullscreenElement);
	}

	// ---- Swipes and keys -------------------------------------------------------------
	// Sideways swipes outside the reel move between projects (left: next, right:
	// previous); a downward swipe goes back. The reel owns sideways swipes over it.

	const SWIPE = 64;
	let dx = 0;
	let dy = 0;
	let dragging = false;
	let gesture = null;
	let suppressClick = false;

	const resist = (d) => Math.sign(d) * Math.min(140, Math.abs(d) * 0.45);

	function onPointerDown(e) {
		if (e.button > 0 || $isChatCovering || reelFullscreen) return;
		// The player's control strip (scrubber, mute) is not a swipe; the rest of the video is.
		const player = e.target.closest?.('video[controls]');
		if (player) showControls(player);
		if (player && e.clientY > player.getBoundingClientRect().bottom - 56) return;
		const desc = e.target.closest?.('.detail-desc');
		gesture = {
			id: e.pointerId,
			x: e.clientX,
			y: e.clientY,
			axis: null,
			inReel: !!e.target.closest?.('.reel'),
			video: e.target.closest?.('.slide video'),
			descScroll: desc && desc.scrollHeight > desc.clientHeight + 2
		};
	}

	function onPointerMove(e) {
		if (!gesture || e.pointerId !== gesture.id) return;
		const mx = e.clientX - gesture.x;
		const my = e.clientY - gesture.y;
		if (!gesture.axis) {
			if (Math.hypot(mx, my) < 10) return;
			gesture.axis = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
			if ((gesture.axis === 'x' && gesture.inReel) || (gesture.axis === 'y' && gesture.descScroll)) {
				gesture = null;
				return;
			}
			dragging = true;
		}
		if (gesture.axis === 'x') dx = resist(mx);
		else dy = resist(my);
	}

	function onPointerUp(e) {
		if (!gesture || e.pointerId !== gesture.id) return;
		const { axis, x, y, video } = gesture;
		gesture = null;
		if (!axis) {
			if (video && video.contains(/** @type {Node} */ (e.target))) {
				togglePlay(video, Number(video.dataset.index));
			}
			return;
		}
		suppressClick = true;
		setTimeout(() => (suppressClick = false), 50);
		const delta = axis === 'x' ? e.clientX - x : e.clientY - y;
		dragging = false;
		if (axis === 'y' && delta > SWIPE) close();
		else if (axis === 'x' && delta > SWIPE) step(-1);
		else if (axis === 'x' && delta < -SWIPE) step(1);
		dx = 0;
		dy = 0;
	}

	function onPointerCancel() {
		gesture = null;
		dragging = false;
		dx = 0;
		dy = 0;
	}

	function onKeydown(e) {
		if (!project || $isChatCovering || reelFullscreen) return;
		if (e.key === 'Escape') close();
		else if (e.key === 'ArrowLeft') step(-1);
		else if (e.key === 'ArrowRight') step(1);
		else return;
		e.stopPropagation();
	}

	// Links and images would otherwise start a native drag and cancel the swipe; and a
	// drag must not also count as a tap on whatever it started over.
	function gestures(node) {
		const noDrag = (e) => e.preventDefault();
		const onClick = (e) => {
			// Taps on a cut are handled on pointerup; the player's control strip keeps its own.
			const video = e.target.closest?.('.slide video');
			if (video && e.clientY < video.getBoundingClientRect().bottom - 56) e.preventDefault();
			if (!suppressClick) return;
			e.preventDefault();
			e.stopPropagation();
		};
		node.addEventListener('dragstart', noDrag);
		node.addEventListener('pointerdown', onPointerDown);
		node.addEventListener('click', onClick, true);
		return {
			destroy() {
				node.removeEventListener('dragstart', noDrag);
				node.removeEventListener('pointerdown', onPointerDown);
				node.removeEventListener('click', onClick, true);
			}
		};
	}

	// ---- Motion ----------------------------------------------------------------------

	// Moving between projects, the new one waits a beat for the old one to clear.
	const SWAP_WAIT = 150;
	const wait = () => (heroFrom ? 0 : SWAP_WAIT);

	function enter(node, { delay = 0, x = 48, y = 10, duration = 520, now = false } = {}) {
		const lag = now ? 0 : wait();
		return {
			delay: ms(delay + lag),
			duration: ms(duration),
			easing: cubicOut,
			css: (t, u) => `opacity: ${t}; transform: translate(${u * x * dir}px, ${u * y}px)`
		};
	}

	function exit(node, { delay = 0, x = 36, duration = 220 } = {}) {
		return {
			delay: ms(delay),
			duration: ms(duration),
			easing: cubicIn,
			css: (t, u) => `opacity: ${t}; transform: translateX(${-u * x * dir}px)`
		};
	}

	function lineIn(node, { delay = 0 } = {}) {
		const lag = wait();
		return {
			delay: ms(delay + lag),
			duration: ms(650),
			easing: cubicOut,
			css: (t, u) => `transform: translateY(${u * 105}%)`
		};
	}

	function lineOut(node, { delay = 0 } = {}) {
		return {
			delay: ms(delay),
			duration: ms(220),
			easing: cubicIn,
			css: (t, u) => `transform: translateY(${-u * 105}%)`
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

	function backdrop(node, { duration = 320 } = {}) {
		return { duration: ms(duration), css: (t) => `opacity: ${t}` };
	}

	// The hero grows out of the tapped card, then shrinks back into it on close.
	function heroMorph(node, rect, intro) {
		const b = node.getBoundingClientRect();
		const mx = rect.left + rect.width / 2 - (b.left + b.width / 2);
		const my = rect.top + rect.height / 2 - (b.top + b.height / 2);
		const s = rect.width / b.width;
		return {
			duration: ms(intro ? 560 : 480),
			easing: intro ? cubicOut : cubicIn,
			css: (t, u) =>
				`transform-origin: center; transform: translate(${mx * u}px, ${my * u}px) scale(${1 + (s - 1) * u}); border-radius: ${20 + 10 * u}px`
		};
	}

	// The media block slides as one when moving between projects; when opening or
	// closing, its first slide does the morph instead and the rest simply fade.
	function mediaIn(node) {
		return heroFrom ? { duration: 0 } : enter(node, { x: 70, y: 0 });
	}

	function mediaOut(node) {
		return closing ? { duration: 0 } : exit(node, { x: 60 });
	}

	function heroIn(node, { first = false, delay = 0 } = {}) {
		if (!first) return enter(node, { x: 60, y: 0, delay, now: true });
		const from = heroFrom;
		if (!from) return { duration: 0 };
		return () => heroMorph(node, from, true);
	}

	function heroOut(node, { first = false } = {}) {
		if (!closing) return { duration: 0 };
		if (!first) return exit(node, { x: 0 });
		return () => {
			const card = findCardMedia(heroCardId);
			return card ? heroMorph(node, card.getBoundingClientRect(), false) : exit(node, {});
		};
	}
</script>

<svelte:document on:fullscreenchange={onFullscreenChange} />

<svelte:window
	on:pointermove={onPointerMove}
	on:pointerup={onPointerUp}
	on:pointercancel={onPointerCancel}
	on:keydown|capture={onKeydown}
/>

{#if project}
	<div
		class="detail"
		class:dragging
		style="z-index: {zIndex}"
		role="dialog"
		aria-modal="true"
		aria-label={project.name}
		use:gestures
	>
		<div class="detail-bg" in:backdrop out:backdrop={{ duration: 420 }}></div>
		{#key project.id}
			<article class="detail-body" style="--dx: {dx}px; --dy: {dy}px">
				<div class="detail-top">
					<button class="back round" on:click={close} aria-label="Back to all projects" in:enter|global={{ delay: 120, x: -24, y: 0, now: true }} out:exit|global>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
					</button>
					<span class="counter" in:enter|global={{ delay: 200, x: 0, y: -8, now: true }} out:exit|global>{index + 1} / {projects.length}</span>
				</div>

				<div class="hero-media" class:fullscreen={reelFullscreen} use:ref={setHero} in:mediaIn|global out:mediaOut|global>
					<div class="reel" class:moving={!settled} use:ref={setReel} use:centerSlides on:scroll={reelScrolled} on:scrollend={reelSettled}>
						{#each slides as v, i (v.src)}
							<div
								class="slide"
								style="aspect-ratio: {v.width} / {v.height}"
								in:heroIn|global={{ first: i === 0, delay: 80 * i }}
								out:heroOut|global={{ first: i === 0 }}
							>
								<!-- svelte-ignore a11y-media-has-caption -- the promo and social cuts ship without caption tracks -->
								<video
									src={v.src}
									poster={v.poster}
									controls={settled && i === activeSlide}
									controlslist={finePointer ? undefined : 'nofullscreen'}
									playsinline
									data-index={i}
									preload={i === 0 ? 'auto' : 'none'}
									aria-label="{project.name}: {v.title}"
									use:reelVideo={{ index: i, paused: $isChatCovering || paused, quiet: $isChatOpen, list: slides.map((x) => x.src), active: i === activeSlide, settled }}
								></video>
								{#if slides.length > 1 && upNext !== i}<span class="slide-title" class:shown={reelFullscreen || (controlsUp && settled && i === activeSlide)}>{v.title}</span>{/if}
								{#if soundBlocked === i && upNext !== i}
									<span class="tap-sound" transition:fade={{ duration: 200 }}>
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" /></svg>
										Tap for sound
									</span>
								{/if}
								{#if tapGlyph?.index === i}
									{#key tapGlyph.n}
										<span class="tap-glyph" aria-hidden="true">
											<svg viewBox="0 0 24 24" fill="currentColor">
												{#if tapGlyph.kind === 'play'}<path d="M8 5.5v13l11-6.5z" />{:else}<path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />{/if}
											</svg>
										</span>
									{/key}
								{/if}
								{#if !finePointer}
									<button class="fs-btn" on:pointerdown|stopPropagation on:click|stopPropagation={() => toggleFullscreen(i)} aria-label={reelFullscreen ? 'Exit full screen' : 'Full screen'}>
										{#if reelFullscreen}
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></svg>
										{:else}
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
										{/if}
									</button>
								{/if}
								{#if upNext === i}
									<div class="up-next" in:enter={{ x: 0, y: 12, duration: 300, now: true }} out:exit={{ x: 0 }}>
										{#if slides[i + 1]}
											<span class="up-next-label">Up next</span>
											<button class="up-next-card" on:click={playNext} aria-label="Play next: {slides[i + 1].title}">
												<span class="up-next-thumb">
													{#if slides[i + 1].poster}<img draggable="false" src={slides[i + 1].poster} alt="" />{/if}
												</span>
												<span class="up-next-row">
													<svg class="countdown" viewBox="0 0 48 48" aria-hidden="true">
														<circle cx="24" cy="24" r="21" class="track" />
														<circle cx="24" cy="24" r="21" class="ring" pathLength="1" style="animation-duration: {UP_NEXT_MS}ms" />
														<path d="M20 16l12 8-12 8z" class="play" />
													</svg>
													<span class="up-next-title">{slides[i + 1].title}</span>
												</span>
											</button>
											<div class="up-next-actions">
												<button on:click={cancelUpNext}>Cancel</button>
												<button on:click={() => replay(i)}>Replay</button>
											</div>
										{:else}
											<span class="up-next-label">That's all for {project.name}</span>
											<div class="up-next-actions">
												<button on:click={() => replay(i)}>Replay</button>
												<button on:click={() => goToSlide(0)}>Back to the start</button>
												<button on:click={exitProject}>Exit</button>
											</div>
										{/if}
									</div>
								{/if}
							</div>
						{:else}
							<div class="slide" style="aspect-ratio: 1 / 2" in:heroIn|global={{ first: true }} out:heroOut|global={{ first: true }}>
								{#if project.image}
									<img draggable="false" src={project.image} alt="{project.name} screenshot" />
								{:else}
									<span class="placeholder">{project.name[0]}</span>
								{/if}
							</div>
						{/each}
					</div>
					{#if slides.length}
						<div class="reel-caption" style={captionWidth ? `--caption-width: ${captionWidth}px` : ''} in:enter|global={{ delay: 400, x: 0, y: 6 }} out:exit|global>
							<span class="reel-title">{slides.length > 1 ? slides[activeSlide]?.title || '' : ''}</span>
							<div class="reel-dots" aria-hidden="true">
								{#if slides.length > 1}{#each slides as _, i}<span class:on={i === activeSlide}></span>{/each}{/if}
							</div>
							<!-- The same videos as a vertical feed of this project's (press shorts, then the card video). -->
							<a draggable="false" class="shorts-link" href="/shorts?project={projectSlug(project)}" on:click={() => onNavigate('shorts')}>
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="3" width="12" height="18" rx="3" /><path d="M10.5 9.5v5l4-2.5z" fill="currentColor" stroke="none" /></svg>
								Watch as shorts
							</a>
						</div>
					{/if}
				</div>

				<div class="detail-text">
					<h2 class="detail-name">
						<span class="mask"><span class="line" in:lineIn|global={{ delay: 220 }} out:lineOut|global>{project.name}</span></span>
					</h2>
					{#if project.status}
						<span class="status-chip" in:pop|global={{ delay: 380 }} out:exit|global>{project.status.replace(/^\S+\s/, '')}</span>
					{/if}
					<p class="detail-desc" in:enter|global={{ delay: 320, x: 30, y: 6 }} out:exit|global={{ delay: 20 }}>{project.description}</p>
					<div class="tech">
						{#each project.technologies || [] as tech, i}
							<span class="tech-tag" in:pop|global={{ delay: 420 + i * 60, from: 0.7 }} out:exit|global>{tech}</span>
						{/each}
					</div>

					<div class="detail-actions">
						<div class="visit-row">
							<a draggable="false" class="primary" href={project.url} target="_blank" rel="noopener noreferrer" in:enter|global={{ delay: 480, x: 0, y: 18 }} out:exit|global={{ delay: 30 }}>
								Visit {project.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
							</a>
							{#if project.stores?.ios}
								<a draggable="false" class="store" href={project.stores.ios} target="_blank" rel="noopener noreferrer" aria-label="{project.name} on the App Store" in:pop|global={{ delay: 540 }} out:exit|global={{ delay: 30 }}>
									<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.37 12.82c-.02-2.03 1.66-3 1.73-3.05-.94-1.38-2.41-1.57-2.93-1.59-1.25-.13-2.44.73-3.07.73-.64 0-1.61-.71-2.65-.69-1.36.02-2.62.79-3.32 2.01-1.42 2.46-.36 6.1 1.02 8.1.67.98 1.47 2.07 2.52 2.03 1.01-.04 1.39-.65 2.61-.65 1.22 0 1.56.65 2.63.63 1.09-.02 1.78-.99 2.44-1.97.77-1.13 1.09-2.22 1.1-2.28-.02-.01-2.11-.81-2.13-3.22zM14.36 6.86c.56-.68.93-1.62.83-2.56-.8.03-1.78.53-2.36 1.21-.52.6-.97 1.56-.85 2.48.9.07 1.81-.46 2.38-1.13z" /></svg>
								</a>
							{/if}
							{#if project.stores?.android}
								<a draggable="false" class="store" href={project.stores.android} target="_blank" rel="noopener noreferrer" aria-label="{project.name} on Google Play" in:pop|global={{ delay: 600 }} out:exit|global={{ delay: 30 }}>
									<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.6 9.48l1.84-3.18a.38.38 0 0 0-.66-.38l-1.87 3.23A11.43 11.43 0 0 0 12 8.18c-1.8 0-3.5.39-4.91 1L5.22 5.94a.38.38 0 0 0-.66.38L6.4 9.48A10.78 10.78 0 0 0 1 18h22a10.78 10.78 0 0 0-5.4-8.52zM7 15.25A1.25 1.25 0 1 1 8.25 14 1.25 1.25 0 0 1 7 15.25zm10 0A1.25 1.25 0 1 1 18.25 14 1.25 1.25 0 0 1 17 15.25z" /></svg>
								</a>
							{/if}
						</div>
						<div class="action-row">
							{#if project.treeSlug}
								<a draggable="false" class="band small" href="/tree/{project.treeSlug}" on:click={() => onNavigate('note')} in:enter|global={{ delay: 550, x: 0, y: 18 }} out:exit|global={{ delay: 40 }}>
									<span class="band-text"><span class="band-title">Read the note</span><span class="band-sub">How it's built</span></span>
								</a>
							{/if}
							<button class="share-btn" class:copied on:click={() => share(project)} aria-label={copied ? 'Link copied' : `Share a link to ${project.name}`} title={copied ? 'Link copied' : 'Share link'} in:enter|global={{ delay: 585, x: 0, y: 18 }} out:exit|global={{ delay: 45 }}>
								{#if copied}
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
								{:else}
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" /><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" /></svg>
								{/if}
							</button>
							<button class="chat-btn" on:click={() => onChat(project)} aria-label="Chat with my agent about {project.name}" in:enter|global={{ delay: 620, x: 0, y: 18 }} out:exit|global={{ delay: 50 }}>
								<span class="chat-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="bevel" /><path class="inner-prism" d="M12 6L13.5 10.5L18 12L13.5 13.5L12 18L10.5 13.5L6 12L10.5 10.5L12 6Z" fill="currentColor" /></svg></span>
								Chat
							</button>
						</div>
					</div>
				</div>
			</article>
		{/key}
	</div>
{/if}

<style>
	.mask {
		display: block;
		overflow: hidden;
		padding-bottom: 0.06em;
	}

	.line {
		display: block;
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

	/* Quieter than its neighbours: no fill, a dim outline, just the link glyph. */
	.share-btn {
		flex: 0 0 52px;
		border-radius: 18px;
		border: 1px solid #27272a;
		background: none;
		color: #a1a1aa;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition:
			color 0.2s ease,
			border-color 0.2s ease;
	}

	.share-btn:hover {
		color: #fff;
		border-color: #3f3f46;
	}

	.share-btn.copied {
		color: #86efac;
	}

	.share-btn svg {
		width: 20px;
		height: 20px;
	}

	/* The narrowest phones: the note keeps its title on one line, the share button narrows. */
	@media (max-width: 359px) {
		.share-btn {
			flex-basis: 44px;
		}

		.action-row .band.small {
			padding: 10px;
		}

		.action-row .band-sub {
			display: none;
		}

		.action-row .band-title {
			white-space: nowrap;
			font-size: 0.92rem;
		}

		.chat-btn {
			padding: 0 12px 0 10px;
		}
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

	.placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		background: #1e1b4b;
		font-size: 4rem;
		font-weight: 800;
		color: #a5b4fc;
	}

	/* Projects swap in one shared cell, so the outgoing one never squeezes beside the next. */
	.detail {
		position: fixed;
		inset: 0;
		color: #fff;
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		overscroll-behavior: contain;
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
		display: grid;
		grid-template-columns: minmax(0, 440px);
		/* One screen-tall row, so the body (and the reel inside it) has a definite height. */
		grid-template-rows: minmax(0, 1fr);
		justify-content: center;
	}

	.detail-bg {
		position: absolute;
		inset: 0;
		background: #000;
	}

	.detail-body {
		grid-area: 1 / 1;
		min-width: 0;
		position: relative;
		width: 100%;
		max-width: 440px;
		height: 100%;
		box-sizing: border-box;
		padding: 14px 24px max(3vh, 20px);
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.detail-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 44px;
	}

	.back.round {
		flex: 0 0 44px;
		min-height: 44px;
		height: 44px;
		border-radius: 50%;
	}

	.counter {
		font-size: 0.85rem;
		font-variant-numeric: tabular-nums;
		color: #a1a1aa;
	}

	/* Takes whatever height the text leaves. Inside, a sideways reel of videos, each
	   slide as wide as its own video's shape, centred one at a time. */
	.hero-media {
		flex: 1 1 0;
		min-height: 160px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		position: relative;
		z-index: 2;
	}

	.reel {
		flex: 1;
		min-height: 0;
		margin: 0 -24px;
		display: flex;
		gap: 12px;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		scrollbar-width: none;
		touch-action: pan-x;
	}

	/* Chrome fades its controls out after they're switched off; while moving, they go at once. */
	.reel.moving video::-webkit-media-controls {
		display: none !important;
	}

	.reel::-webkit-scrollbar {
		display: none;
	}

	.slide {
		position: relative;
		flex: none;
		height: 100%;
		max-width: calc(100vw - 48px);
		scroll-snap-align: center;
		border-radius: 20px;
		overflow: hidden;
		background: #111114;
		border: 1px solid #27272a;
	}

	.slide video,
	.slide img,
	.slide .placeholder {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.slide-title {
		position: absolute;
		top: 10px;
		left: 10px;
		max-width: calc(100% - 20px);
		padding: 4px 9px;
		border-radius: 10px;
		background: rgba(0, 0, 0, 0.6);
		font-size: 0.75rem;
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.25s ease;
	}

	.slide-title.shown {
		opacity: 1;
	}

	.fs-btn {
		position: absolute;
		top: 8px;
		right: 8px;
		width: 34px;
		height: 34px;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.55);
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}

	.fs-btn svg {
		width: 18px;
		height: 18px;
	}

	/* The reel fullscreen: slides grow to the screen's height, still swipeable. */
	.hero-media.fullscreen {
		background: #000;
		padding: 12px 0;
		box-sizing: border-box;
	}

	.hero-media.fullscreen .reel {
		margin: 0;
	}

	.hero-media.fullscreen .slide {
		max-width: 100vw;
		border: 0;
	}

	.up-next {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 12px 10px;
		background: rgba(0, 0, 0, 0.78);
		backdrop-filter: blur(6px);
		text-align: center;
	}

	.up-next-label {
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #a5b4fc;
	}

	.up-next-card {
		flex: 1;
		min-height: 0;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
		padding: 0;
		border: 0;
		background: none;
		color: #fff;
		font: 700 1rem 'Inter', sans-serif;
		cursor: pointer;
	}

	/* As big as the slide allows, leaving room for the countdown row and buttons. */
	.up-next-thumb {
		position: relative;
		height: min(72%, 460px);
		max-width: 92%;
		aspect-ratio: 9 / 16;
		border-radius: 14px;
		overflow: hidden;
		background: #18181b;
		border: 1px solid #3f3f46;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.up-next-thumb img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.up-next-row {
		display: flex;
		align-items: center;
		gap: 10px;
		max-width: 100%;
	}

	.countdown {
		flex-shrink: 0;
		width: 40px;
		height: 40px;
	}

	.countdown .track {
		fill: rgba(0, 0, 0, 0.55);
		stroke: rgba(255, 255, 255, 0.25);
		stroke-width: 3;
	}

	/* Fills once over the countdown, then the next cut plays. */
	.countdown .ring {
		fill: none;
		stroke: #a5b4fc;
		stroke-width: 3;
		stroke-dasharray: 1;
		stroke-dashoffset: 1;
		transform: rotate(-90deg);
		transform-origin: center;
		animation: countdown linear forwards;
	}

	.countdown .play {
		fill: #fff;
	}

	@keyframes countdown {
		to {
			stroke-dashoffset: 0;
		}
	}

	.up-next-title {
		min-width: 0;
		text-align: left;
	}

	.up-next-actions {
		display: flex;
		gap: 8px;
	}

	.up-next-actions button {
		height: 36px;
		padding: 0 14px;
		border-radius: 18px;
		border: 1px solid #3f3f46;
		background: rgba(0, 0, 0, 0.4);
		color: #e4e4e7;
		font: 600 0.85rem 'Inter', sans-serif;
		cursor: pointer;
	}

	.reel-caption {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 12px;
		position: relative;
		min-height: 6px;
	}

	/* Quiet, at the right of the dots row. */
	.shorts-link {
		position: absolute;
		right: 0;
		top: 50%;
		translate: 0 -50%;
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 4px 0;
		font: 600 0.78rem 'Inter', sans-serif;
		color: #a1a1aa;
		text-decoration: none;
		white-space: nowrap;
	}

	.shorts-link:hover {
		color: #e4e4e7;
	}

	.shorts-link svg {
		width: 15px;
		height: 15px;
		flex: none;
	}

	.hero-media.fullscreen .shorts-link {
		display: none;
	}

	/* Phones keep the title on the cut itself. */
	.reel-title {
		display: none;
	}

	.reel-dots {
		display: flex;
		justify-content: center;
		gap: 6px;
		height: 6px;
	}

	.tap-sound {
		position: absolute;
		left: 50%;
		bottom: 64px;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		border-radius: 999px;
		background: rgba(0, 0, 0, 0.65);
		color: #fff;
		font: 600 0.78rem 'Inter', sans-serif;
		white-space: nowrap;
		pointer-events: none;
	}

	.tap-sound svg {
		width: 15px;
		height: 15px;
	}

	.tap-glyph {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 64px;
		height: 64px;
		margin: -32px 0 0 -32px;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.55);
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
		opacity: 0;
		animation: tap-glyph 0.7s ease-out;
	}

	.tap-glyph svg {
		width: 28px;
		height: 28px;
	}

	@keyframes tap-glyph {
		0% {
			opacity: 1;
			transform: scale(0.8);
		}
		30% {
			opacity: 1;
			transform: scale(1);
		}
		100% {
			opacity: 0;
			transform: scale(1.25);
		}
	}

	.reel-dots span {
		width: 6px;
		height: 6px;
		border-radius: 3px;
		background: #3f3f46;
		transition:
			width 0.3s ease,
			background-color 0.3s ease;
	}

	.reel-dots span.on {
		width: 18px;
		background: #a5b4fc;
	}

	.detail-text {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.detail-name {
		margin: 0;
		font-size: 1.9rem;
		font-weight: 800;
		letter-spacing: -0.02em;
		line-height: 1.1;
	}

	.status-chip {
		align-self: flex-start;
		font-size: 0.75rem;
		font-weight: 600;
		color: #c7d2fe;
		background: #1e1b4b;
		border: 1px solid #3730a3;
		border-radius: 10px;
		padding: 3px 9px;
	}

	/* Abridged to three lines; the rest scrolls inside. */
	.detail-desc {
		margin: 0;
		max-height: 4.5em;
		overflow-y: auto;
		font-size: 1rem;
		line-height: 1.5;
		color: #d4d4d8;
		touch-action: pan-y;
		scrollbar-width: none;
		mask-image: linear-gradient(to bottom, #000 70%, transparent);
	}

	.tech {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.tech-tag {
		font-size: 0.78rem;
		color: #d4d4d8;
		border: 1px solid #3f3f46;
		border-radius: 8px;
		padding: 3px 8px;
	}

	.detail-actions {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-top: 6px;
	}

	.visit-row {
		display: flex;
		gap: 10px;
	}

	.visit-row .primary {
		flex: 1;
		min-width: 0;
		padding: 0 14px;
		font-size: 0.98rem;
		white-space: nowrap;
		text-decoration: none;
	}

	.store {
		flex: 0 0 64px;
		height: 64px;
		border-radius: 18px;
		border: 1px solid #3f3f46;
		background: #0f0f13;
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			background-color 0.2s ease,
			transform 0.2s ease;
	}

	.store:hover {
		background: #18181b;
		transform: translateY(-2px);
	}

	.store svg {
		width: 24px;
		height: 24px;
	}

	.action-row {
		display: flex;
		gap: 10px;
		align-items: stretch;
		height: 64px;
	}

	.band.small {
		padding: 10px 12px;
		text-decoration: none;
	}

	.detail-body .detail-text,
	.detail-body .hero-media {
		transition: translate 0.6s cubic-bezier(0.2, 0.9, 0.25, 1.15);
	}

	.detail-body .hero-media {
		translate: calc(var(--dx) * 0.8) calc(var(--dy) * 0.8);
	}

	.detail-body .detail-text {
		translate: var(--dx) var(--dy);
	}

	.detail.dragging .detail-body .detail-text,
	.detail.dragging .detail-body .hero-media {
		transition: none;
	}

	/* Opened from the site, the page behind stays put. */
	:global(html.project-open),
	:global(html.project-open body) {
		overflow: hidden;
	}

	/* ---- Wide screens: the reel on the left, the story on the right ---------- */
	@media (min-width: 900px) {
		.detail {
			grid-template-columns: minmax(0, 1120px);
		}

		.detail-bg {
			background: rgba(4, 4, 8, 0.9);
			backdrop-filter: blur(10px);
		}

		.detail-body {
			max-width: none;
			display: grid;
			grid-template-columns: minmax(0, 1.25fr) minmax(320px, 1fr);
			grid-template-rows: auto minmax(0, 1fr);
			column-gap: 48px;
			row-gap: 20px;
			padding: 28px 40px 40px;
		}

		.detail-top {
			grid-column: 1 / -1;
		}

		.hero-media {
			min-height: 0;
		}

		.reel {
			margin: 0;
		}

		/* The cut's title sits at the left of the row under it, the dots at the right. */
		.slide-title {
			display: none;
		}

		/* Title on the left, dots still centred under the cut. */
		.reel-caption {
			align-self: center;
			width: var(--caption-width, 100%);
			max-width: 100%;
			display: grid;
			grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
			min-height: 20px;
		}

		.reel-title {
			display: block;
			min-width: 0;
			font-size: 0.85rem;
			font-weight: 600;
			color: #d4d4d8;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.reel-dots {
			grid-column: 2;
		}

		.shorts-link {
			position: static;
			translate: none;
			grid-column: 3;
			justify-self: end;
		}

		.detail-text {
			align-self: center;
			gap: 14px;
		}

		.detail-name {
			font-size: 2.6rem;
		}

		.detail-desc {
			max-height: 9em;
			font-size: 1.05rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.chat-icon svg,
		.inner-prism {
			animation: none;
		}
	}
</style>
