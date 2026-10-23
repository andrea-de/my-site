<script>
	// The /shorts player: one product video at a time in a rounded frame, nothing over it
	// while it plays; under it a thin progress bar, then the title row (opens the sheet) and
	// three icons: this project's page, the playlist (ShortsPlaylist: every item of the feed,
	// a tap jumps there) and Exit. On the cover the row holds Welcome, Resume, Playlist and
	// Close shorts (ShortsLeave).
	// Paused, the video blurs behind Mute, Like and Share, a link to the project's own feed
	// and the Pause at end switch. When a video ends the feed moves straight on to the next
	// one; with Pause at end on (kept per viewer), a countdown to it instead, with that same
	// link under it.
	//
	// Two feeds (see $lib/shorts): every project, or one. Moving between them keeps the
	// video that is playing and swaps the list around it.
	//
	// Gestures: a vertical drag pulls the neighbouring video in from above or below and
	// snaps to it (or back) on release; a sideways drag on the video, or a drag along the
	// progress bar, scrubs; a plain tap pauses and resumes. Wheel and arrow keys move the
	// same way.
	//
	// Sound: one <video> element plays every cut, taking each one's src in turn, because
	// iPhones only allow sound on an element a tap has already started. The neighbours
	// are muted stills (poster or first frame; the next one preloads). Moves made by a
	// swipe start the next cut inside the touchend handler. When the browser still
	// refuses sound, the cut plays muted with a "Tap for sound" chip.
	//
	// The cover (ShortsCover) sits above the first video like one more item: a swipe up, the
	// wheel, ↓ or Space (or a tap on its cue) start the feed, and a swipe down from the first
	// video brings it back, pausing the video. Its Sound switch (on by default) and Full screen
	// switch are taps, so they also start and pause the shared <video> (prime): iPhones then
	// let the first video play with sound after the swipe. Where sound is still refused, the
	// video plays muted with "Tap for sound".
	//
	// Full screen is the whole page (`fullscreenTarget`), so the rows and swipes keep working;
	// the cover and the paused screen switch it, where the browser can (not iPhone Safari).
	//
	// Every item, the cover included, gets the same frame in the same place, a rounded
	// container filling the stage, so a swipe never changes its size: a cut fits inside it,
	// whole, over a blurred copy of its poster that fills the rest.
	//
	// The AI voice short (an item with `voice`, see $lib/shorts) shows VoiceShort in its frame
	// instead of a video: the shared <video> pauses and hides there, with no progress line or
	// countdown, and moving on closes any voice call or chat it opened. With an `intro`, the
	// shared <video> plays that first (so it has sound on iPhones too), once per visit, and
	// its end hands over to VoiceShort, whose layout its last frame matches and which holds
	// still under it (`waiting`) until then; it never moves on by itself. A tap pauses and
	// resumes the intro like any video (its Skip intro chip pulses while it waits); only that
	// chip skips to the live agent, and a Replay intro chip there plays it again.
	import { createEventDispatcher, onDestroy, onMount, tick } from 'svelte';
	import { emitVisitEvent } from '$lib/visit-events';
	import {
		closeChat,
		enterVoiceMode,
		exitVoiceMode,
		isChatCovering,
		openChat
	} from '$lib/stores/chat';
	import { stopVoice } from '$lib/chat-modal/voice';
	import { canFullscreen, fullscreen, setFullscreen } from '$lib/fullscreen';
	import ShortsSheet from './ShortsSheet.svelte';
	import ShortsPlaylist from './ShortsPlaylist.svelte';
	import ShortsCover from './ShortsCover.svelte';
	import ShortsLeave from './ShortsLeave.svelte';
	import VoiceShort from './VoiceShort.svelte';
	import { coverGroups, groupOf, NOTHING } from '$lib/shorts';

	/** What loadShorts() gave: the main feed (`all`) and `feedFor(slug)`. */
	export let shorts;
	/** The feed to open: shorts.all or a project's. */
	export let startFeed = shorts.all;
	export let startIndex = 0;
	/** Opens on the cover (a direct load: sound needs a tap); false starts playing at once. */
	export let withCover = false;
	/** A job link's company and code (/shorts/<code>), for the cover. */
	export let company = null;
	export let code = null;
	/** The job link's résumé region, for the cover's Resume link. */
	export let region = null;
	/** The element full screen applies to: the whole shorts page. */
	export let fullscreenTarget = null;
	/** Where the feed's links live: /shorts, or /shorts/<code> so the greeting stays. */
	export let base = '/shorts';

	const dispatch = createEventDispatcher();
	const LIKES_KEY = 'shorts-liked';
	// The voice agent's public engineering note, the voice short's "this project".
	const VOICE_NOTE = 'products/portfolio-agent';
	const PAUSE_AT_END_KEY = 'shorts-pause-at-end';

	const reduceMotion =
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// False until the cover has been left the first time.
	let started = !withCover;
	let feed = startFeed;
	let items = feed.items;
	let i = Math.max(0, Math.min(items.length - 1, startIndex));
	let W = 0;
	let H = 0;
	let video;
	let barEl;
	let trackEl;

	// ---- Position --------------------------------------------------------------------
	// The track holds the current cell at 0 and its neighbours a stage height above and
	// below; `offset` moves it with the finger and the snap animation. A jump to a cut
	// that isn't a neighbour (Next project, the sheet, wrapping round) puts that cut in
	// the neighbour's place for the move.

	let offset = 0;
	let incoming = null; // { k, dir }
	let animating = false;
	// The cell the playing video sits in: the current one, or the one being moved to.
	let playing = i;
	// The cut the playing element has a frame of, so its still underneath can go.
	let ready = -1;
	// The cut moved away from shows its last frame while it slides out.
	let snapK = -1;

	$: prevK = incoming?.dir === -1 ? incoming.k : i - 1;
	$: nextK = incoming?.dir === 1 ? incoming.k : i + 1;
	// In a feed of two, both neighbours are the same cut: the side it is coming in from wins.
	$: cells = (
		incoming?.dir === -1
			? [
					{ k: i, slot: 0 },
					{ k: prevK, slot: -1 },
					{ k: nextK, slot: 1 }
			  ]
			: [
					{ k: i, slot: 0 },
					{ k: nextK, slot: 1 },
					{ k: prevK, slot: -1 }
			  ]
	).filter(
		(c, n, all) => c.k >= 0 && c.k < items.length && all.findIndex((o) => o.k === c.k) === n
	);
	$: slotOf = (k) => cells.find((c) => c.k === k)?.slot ?? 0;

	$: item = items[i];
	$: project = item?.project;
	// Whether the voice short's intro video has played (or been ended) this visit.
	let introDone = false;
	/** What the shared <video> plays for an item: the item, the voice short's intro, or null. */
	const media = (it, done = introDone) =>
		it?.quote ? null : it?.voice ? (it.intro && !done ? it.intro : null) : it;
	// The voice short with nothing playing: VoiceShort itself.
	$: onVoice = !!item?.voice && !media(item, introDone);

	// Every item's frame fills the stage (less 20px), inside the page's gutters (the cover's
	// .box and the cells' .frame size themselves in CSS the same way; this is for the row and
	// the line).
	$: size = { w: W, h: Math.max(0, H - 20) };
	$: rowWidth = Math.max(size.w, Math.min(W, 340));

	const ease = (t) => 1 - Math.pow(1 - t, 3);
	let raf = 0;

	function animateOffset(to, done) {
		cancelAnimationFrame(raf);
		const from = offset;
		const duration = reduceMotion ? 0 : Math.min(340, 160 + Math.abs(to - from) * 0.35);
		if (!duration) {
			offset = to;
			done?.();
			return;
		}
		animating = true;
		const t0 = performance.now();
		const stepFrame = (now) => {
			const t = Math.min(1, (now - t0) / duration);
			offset = from + (to - from) * ease(t);
			if (t < 1) raf = requestAnimationFrame(stepFrame);
			else {
				animating = false;
				done?.();
			}
		};
		raf = requestAnimationFrame(stepFrame);
	}

	/**
	 * Moves to cut k, sliding it in from below (dir 1) or above (-1). Starts it playing
	 * at once, so a call from a touchend handler plays with sound on iPhones too.
	 */
	function go(k, dir = Math.sign(k - i)) {
		if (k === i || k < 0 || k >= items.length || !dir) return;
		endVoice();
		cancelUpNext();
		if (animating) finishMove();
		closeSheet(false);
		closePlaylist(false);
		if (k !== i + dir) incoming = { k, dir };
		snapshot();
		snapK = i;
		playing = k;
		load(k);
		animateOffset(-dir * H, () => commit(k));
	}

	function commit(k) {
		i = k;
		offset = 0;
		incoming = null;
		snapK = -1;
		syncHash();
		if (items[k]?.voice) voiceEvent('view');
	}

	function finishMove() {
		cancelAnimationFrame(raf);
		animating = false;
		commit(playing);
	}

	function snapBack() {
		animateOffset(0);
	}

	// ---- Cover -----------------------------------------------------------------------
	// `shift` 0: the cover fills the screen and the feed waits one screen below it; 1: the
	// feed is in place and the cover has gone up out of sight. A drag moves both together
	// and the same snap animation finishes the move, as between two videos.

	let coverOn = withCover;
	let shift = withCover ? 0 : 1;
	let shiftRaf = 0;
	// A deep link (/shorts#square-swaps-2) opens on the cover too; it names the video.
	const startsOn =
		withCover && i > 0 && items[i]
			? `${items[i].project.name} · ${items[i].heading || items[i].title}`
			: null;

	function animateShift(to, done) {
		cancelAnimationFrame(shiftRaf);
		const from = shift;
		const duration = reduceMotion
			? 0
			: Math.min(340, 160 + Math.abs(to - from) * Math.max(H, 1) * 0.35);
		if (!duration) {
			shift = to;
			done?.();
			return;
		}
		const t0 = performance.now();
		const stepFrame = (now) => {
			const t = Math.min(1, (now - t0) / duration);
			shift = from + (to - from) * ease(t);
			if (t < 1) shiftRaf = requestAnimationFrame(stepFrame);
			else done?.();
		};
		shiftRaf = requestAnimationFrame(stepFrame);
	}

	/**
	 * Leaves the cover for the video under it. Plays first, so a call from a tap or a
	 * touchend handler has sound on iPhones; without a gesture the browser may refuse the
	 * sound, and the video plays muted with "Tap for sound".
	 * @param {'swipe' | 'cue' | 'playlist'} via what started it (a swipe, the wheel or a key;
	 *   a tap on the cue; the playlist), for the visit report
	 */
	function enterFeed(via) {
		if (!coverOn) return;
		coverOn = false;
		// The sound is the cover's Sound switch (or, back from the feed, as the visitor left it).
		if (muted) soundBlocked = false;
		started = true;
		paused = false;
		if (items[i]?.voice && !media(items[i])) {
			prime();
			voiceEvent('view');
		} else {
			if (items[i]?.voice) voiceEvent('view');
			play();
		}
		emitVisitEvent('visit:short_cover', { action: via });
		syncHash();
		animateShift(1);
	}

	/** Back up to the cover from the first video, which pauses while it shows. */
	function showCover() {
		if (coverOn) return;
		endVoice();
		cancelUpNext();
		closeSheet(false);
		if (animating) finishMove();
		coverOn = true;
		video?.pause();
		// The cover is the feed's first item: its address is the feed's own, with no video.
		const url = `${base}${feed.project ? `?project=${feed.project.slug}` : ''}`;
		history.replaceState(history.state, '', url);
		animateShift(0);
	}

	function onCoverLeave(e) {
		emitVisitEvent('visit:short_cover', { action: e.detail.to });
	}

	// The cover's switches. Each is a tap, so it also primes the shared <video> for sound.
	function toggleCoverSound() {
		muted = !muted;
		soundBlocked = false;
		if (video) video.muted = muted;
		prime();
		emitVisitEvent('visit:short_cover', { action: muted ? 'sound_off' : 'sound_on' });
	}

	function toggleCoverFullscreen() {
		const on = !$fullscreen;
		setFullscreen(fullscreenTarget, on);
		prime();
		emitVisitEvent('visit:short_cover', { action: on ? 'fullscreen_on' : 'fullscreen_off' });
	}

	const fullscreenable = canFullscreen();

	// ---- Voice short -------------------------------------------------------------------
	// Its orb opens the site's voice mode and its capabilities the chat, as on the Welcome
	// screen. Moving on from it (or leaving the feed) closes whichever it opened, which ends
	// the call, stops the speech and releases the microphone.

	let voiceOpened = false;
	const voiceSeen = new Set();

	/** Logs what the visitor did with the voice short ('view' once per visit). */
	function voiceEvent(action) {
		if (voiceSeen.has(action)) return;
		voiceSeen.add(action);
		emitVisitEvent('visit:short_voice', { action });
	}

	function voiceTalk() {
		voiceOpened = true;
		voiceEvent('talk');
		emitVisitEvent('visit:chat_open');
		enterVoiceMode();
	}

	function voiceAsk(capability) {
		voiceOpened = true;
		voiceEvent('ask');
		emitVisitEvent('visit:chat_open');
		openChat({ text: capability.prompt, source: 'ask-agent' });
	}

	// The intro gives way at once on Skip intro (with a short fade, as it is cut off mid-way);
	// at its natural end the swap is instant, since its last frame is the layout.
	let introSkipped = false;
	// Counts the intro's runs: a replay remounts VoiceShort, so it is back at rest (the first
	// capabilities, its motion at its first frame) for the hand-off at the replay's end.
	let introRun = 0;

	function skipIntro() {
		if (!items[playing]?.voice || !media(items[playing])) return;
		introSkipped = true;
		introDone = true;
		load(playing);
		voiceEvent('skip');
		setTimeout(() => (introSkipped = false), 300);
	}

	/** Plays the intro again from the start, from the tap on Replay intro (so it has sound). */
	function replayIntro() {
		if (!items[playing]?.voice || !items[playing].intro || !introDone) return;
		endVoice();
		introDone = false;
		introRun += 1;
		load(playing);
		voiceEvent('replay');
	}

	function endVoice() {
		if (!voiceOpened) return;
		voiceOpened = false;
		stopVoice();
		exitVoiceMode();
		closeChat();
	}

	/**
	 * Called from the tap or swipe that lands on the voice short: starts and at once pauses
	 * the shared element (on the next video, which load() put there), so iPhones count it as
	 * started by a tap and a later move plays with sound.
	 */
	function prime() {
		if (!video?.getAttribute('src') || (started && !coverOn && !video.paused)) return;
		video.muted = muted;
		video.play()?.catch(() => {});
		video.pause();
	}

	// The last frame of the cut moving away, drawn into its cell. Cross-origin video
	// draws fine; the canvas is only ever shown, never read.
	function snapshot() {
		const canvas = trackEl?.querySelector(`[data-k="${i}"] canvas`);
		if (!canvas || !video || video.readyState < 2) return;
		try {
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
			canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
		} catch {}
	}

	/** The link to video `it` in the feed that is open. */
	const linkFor = (it, root = base) =>
		`${root}${feed.project ? `?project=${feed.project.slug}` : ''}#${it.id}`;

	function syncHash() {
		const it = items[i];
		const url = it && linkFor(it);
		if (url && location.pathname + location.search + location.hash !== url)
			history.replaceState(history.state, '', url);
	}

	// Where the feed starts over: its first video (past the voice short).
	$: firstVideo = Math.max(
		0,
		items.findIndex((it) => !it.voice)
	);

	// ---- Feeds -------------------------------------------------------------------------

	// The cover's filters (Work, Developer, Products) cut the main feed down (the voice short
	// goes with Work and Developer); every way back to "all projects" goes to that cut
	// (mainFeed). With all three off, the feed is one card on seeking nothing (NOTHING).
	const groups = coverGroups();
	let shown = { work: true, developer: true, products: true };
	let mainFeed = shorts.all;

	function filterFeed(on) {
		if (groups.every((g) => on[g.key])) return shorts.all;
		if (!groups.some((g) => on[g.key])) return { project: null, items: [NOTHING] };
		const keep = (g) => (g === 'about' ? on.work || on.developer : on[g]);
		return { project: null, items: shorts.all.items.filter((it) => keep(groupOf(it))) };
	}

	function toggleGroup(key) {
		if (!coverOn || feed.project) return;
		shown = { ...shown, [key]: !shown[key] };
		const current = items[i]?.id;
		mainFeed = filterFeed(shown);
		feed = mainFeed;
		items = mainFeed.items;
		const at = items.findIndex((it) => it.id === current);
		i = playing = at < 0 ? 0 : at;
		load(i);
		video?.pause();
		emitVisitEvent('visit:short_setting', { groups: groups.filter((g) => shown[g.key]).map((g) => g.key) });
	}

	// Whether the project has a feed of its own worth opening (more than one video).
	$: hasOwnFeed = !feed.project && project?.count > 1;

	/**
	 * Opens another feed on the video that is playing, so nothing reloads, then moves to
	 * the video `pick` chooses there (given that video's index in the new feed).
	 */
	async function switchFeed(next, pick = (at) => at) {
		if (!next || next === feed) return;
		endVoice();
		cancelUpNext();
		if (animating) finishMove();
		closeSheet(false);
		const current = items[i];
		const at = next.items.findIndex((it) => it.id === current?.id);
		const wasReady = ready === i;
		feed = next;
		items = next.items;
		offset = 0;
		incoming = null;
		snapK = -1;
		if (at < 0) {
			i = playing = Math.max(0, Math.min(items.length - 1, pick(0)));
			load(i);
			syncHash();
			return;
		}
		i = playing = at;
		ready = wasReady ? at : -1;
		syncHash();
		const k = pick(at);
		if (k === at) return;
		await tick();
		go(k, 1);
	}

	/** This project's feed. From the end of a video, on to its next one there. */
	function openProjectFeed(fromEnd = false) {
		const next = shorts.feedFor(project.slug);
		if (fromEnd) return switchFeed(next, (at) => (at + 1) % next.items.length);
		// Paused on the card video (last in the project's feed): its press shorts from the start.
		if (items[i].promo) return switchFeed(next, () => 0);
		switchFeed(next);
		if (paused) resume();
	}

	/** Back to every project, on this project's first video there. */
	function openAllFeed() {
		const slug = project.slug;
		switchFeed(mainFeed, () =>
			Math.max(
				0,
				mainFeed.items.findIndex((it) => it.project.slug === slug)
			)
		);
	}

	// ---- End of a video -----------------------------------------------------------------
	// By default the feed moves straight on to the next video (advance). With Pause at end,
	// a countdown to it instead (tap it to go now), and under it the project's own feed (or,
	// in one, every project). A swipe, a scrub or a pause cancels it.
	//
	// At the end of a feed: a project's feed goes on in the main feed, on the next project's
	// first video; the main feed stops on a Start over screen (no countdown, so it never
	// loops by itself).

	const UP_NEXT_S = 5;
	let upNext = null; // { k, left, countdown, over }
	let upNextTimer;
	let pauseAtEnd = false;

	function readPauseAtEnd() {
		try {
			pauseAtEnd = localStorage.getItem(PAUSE_AT_END_KEY) === 'true';
		} catch {}
	}

	function togglePauseAtEnd() {
		pauseAtEnd = !pauseAtEnd;
		try {
			localStorage.setItem(PAUSE_AT_END_KEY, String(pauseAtEnd));
		} catch {}
		emitVisitEvent('visit:short_setting', { pauseAtEnd });
	}

	/** On from the video that ended, with no tap: play() keeps the visitor's sound setting. */
	function advance() {
		const it = items[playing];
		if (!it || it.voice) return;
		const k = playing + 1;
		if (k < items.length && !items[k].voice) return go(k, 1);
		if (feed.project) {
			const n = shorts.projects.indexOf(feed.project);
			const first = shorts.projects[(n + 1) % shorts.projects.length]?.videos[0]?.id;
			return switchFeed(mainFeed, () =>
				Math.max(
					firstVideo,
					mainFeed.items.findIndex((x) => x.id === first)
				)
			);
		}
		showUpNext(false);
	}

	function showUpNext(countdown = true) {
		const over = playing + 1 >= items.length;
		const k = over ? firstVideo : playing + 1;
		upNext = { k, left: UP_NEXT_S, countdown, over };
		clearInterval(upNextTimer);
		if (!countdown) return;
		upNextTimer = setInterval(() => {
			if (!upNext) return clearInterval(upNextTimer);
			upNext = { ...upNext, left: upNext.left - 1 };
			if (upNext.left <= 0) playUpNext();
		}, 1000);
	}

	function cancelUpNext() {
		clearInterval(upNextTimer);
		upNext = null;
	}

	function playUpNext() {
		if (!upNext) return;
		const { k } = upNext;
		cancelUpNext();
		if (k === i) {
			// A feed of one video starts over on itself.
			video.currentTime = 0;
			play();
		} else go(k, 1);
	}

	// Tapping the frame while the countdown runs stops it and shows the paused screen.
	function stopUpNext() {
		cancelUpNext();
		paused = true;
	}

	// ---- Playback --------------------------------------------------------------------

	let paused = false; // the visitor paused
	let muted = false; // the visitor muted
	let soundBlocked = false; // the browser refused sound; playing muted until a tap
	let soundOff = false; // what the element is actually doing

	function load(k) {
		const it = items[k];
		if (!video || !it) return;
		ready = -1;
		paused = false;
		watchedPct = 0;
		const m = media(it);
		if (!m) {
			// Nothing plays here; the next video waits in the element, ready to go.
			video.pause();
			const next = items[k + 1];
			if (next && !next.voice && video.getAttribute('src') !== next.src) {
				video.poster = next.poster || '';
				video.src = next.src;
			}
			return;
		}
		video.poster = m.poster || '';
		if (video.getAttribute('src') !== m.src) video.src = m.src;
		else {
			// Already waiting there (after the voice short): from the start.
			video.currentTime = 0;
			if (video.readyState >= 2) ready = k;
		}
		// Never under the cover (a filter changed there reloads the first item).
		if (started && !coverOn) play();
	}

	// Called straight from gesture handlers where possible: nothing async before play().
	function play() {
		if (!video || !media(items[playing])) return;
		video.muted = muted;
		const attempt = video.play();
		attempt?.catch((err) => {
			if (err?.name === 'AbortError') return;
			// No sound without a fresh tap: play muted and offer the sound.
			if (err?.name === 'NotAllowedError' && !video.muted) {
				video.muted = true;
				soundBlocked = true;
				video.play().catch(() => (paused = true));
			} else {
				paused = true;
			}
		});
		if (!muted) soundBlocked = soundBlocked && video.muted;
	}

	function pause() {
		cancelUpNext();
		paused = true;
		video?.pause();
		if (items[playing]?.voice) voiceEvent('pause');
	}

	function resume() {
		cancelUpNext();
		paused = false;
		if (items[playing]?.voice) voiceEvent('resume');
		// Space or Enter on a hidden Like button would otherwise toggle it.
		const focused = /** @type {HTMLElement} */ (document.activeElement);
		if (focused?.closest?.('.paused')) focused.blur();
		play();
	}

	function togglePause() {
		if (paused) resume();
		else pause();
	}

	function unblockSound() {
		soundBlocked = false;
		muted = false;
		video.muted = false;
		if (video.paused) resume();
	}

	function toggleMute() {
		if (soundOff) {
			muted = false;
			soundBlocked = false;
			video.muted = false;
		} else {
			muted = true;
			video.muted = true;
		}
	}

	function onVolume() {
		soundOff = video.muted;
	}

	function onLoaded() {
		ready = playing;
	}

	function onEnded() {
		if (items[playing]?.voice) {
			// The intro is over: VoiceShort takes its place, and the feed stays here.
			introDone = true;
			load(playing);
			voiceEvent('intro');
			return;
		}
		if (gesture || sheetProject || playlistOpen || scrub) return;
		if (pauseAtEnd) showUpNext();
		else advance();
	}

	// ---- Progress and watching -------------------------------------------------------

	let duration = 0;
	let watchedPct = 0;
	let progressRaf = 0;

	function tickProgress() {
		if (video && barEl) {
			const d = video.duration || 0;
			const t = scrub ? scrub.t : video.currentTime;
			barEl.style.transform = `scaleX(${d ? Math.min(1, t / d) : 0})`;
		}
		progressRaf = requestAnimationFrame(tickProgress);
	}

	// How much of the cut was actually played (not skipped by scrubbing), for the visit
	// report: reported each time it passes another tenth, and as 100 once it ends.
	function onTimeUpdate() {
		const d = video.duration;
		if (!d || !isFinite(d)) return;
		let played = 0;
		for (let n = 0; n < video.played.length; n++)
			played += video.played.end(n) - video.played.start(n);
		const pct = video.ended ? 100 : Math.min(100, Math.floor((played / d) * 10) * 10);
		if (pct > watchedPct) {
			watchedPct = pct;
			const it = items[playing];
			if (it && !it.voice)
				emitVisitEvent('visit:short_watch', {
					id: it.id,
					project: it.project.name,
					title: it.heading || it.title,
					pct,
					feed: feed.project ? 'project' : 'all'
				});
		}
	}

	const clock = (s) => {
		const n = Math.max(0, Math.floor(s || 0));
		return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
	};

	// ---- Likes and share -------------------------------------------------------------

	let liked = new Set();

	function readLikes() {
		try {
			liked = new Set(JSON.parse(localStorage.getItem(LIKES_KEY) || '[]'));
		} catch {}
	}

	function toggleLike() {
		const it = items[i];
		const on = !liked.has(it.id);
		if (on) liked.add(it.id);
		else liked.delete(it.id);
		liked = liked;
		try {
			localStorage.setItem(LIKES_KEY, JSON.stringify([...liked]));
		} catch {}
		emitVisitEvent('visit:short_like', {
			id: it.id,
			project: it.project.name,
			title: it.heading || it.title,
			liked: on,
			feed: feed.project ? 'project' : 'all'
		});
	}

	let toastText = '';
	let toastTimer;
	function toast(text) {
		toastText = text;
		clearTimeout(toastTimer);
		toastTimer = setTimeout(() => (toastText = ''), 2200);
	}

	// Phones get the share sheet, as in the project view; elsewhere the link is copied.
	async function share() {
		const it = items[i];
		// Always the plain /shorts link: a job link's code names the company.
		const url = `${location.origin}${linkFor(it, '/shorts')}`;
		if (navigator.share && matchMedia('(pointer: coarse)').matches) {
			try {
				await navigator.share({ title: `${it.project.name}: ${it.heading || it.title}`, url });
				return;
			} catch (e) {
				if (e?.name === 'AbortError') return;
			}
		}
		try {
			await navigator.clipboard.writeText(url);
			toast('Link copied');
		} catch {
			toast(url.replace(/^https?:\/\//, ''));
		}
	}

	// ---- Sheet -----------------------------------------------------------------------

	let sheetProject = null;
	let pausedBySheet = false;
	$: sheetClips = sheetProject
		? items
				.map((it, index) => ({ ...it, index }))
				.filter(
					(it, n, all) => it.project === sheetProject && all.findIndex((o) => o.id === it.id) === n
				)
		: [];

	function openSheet() {
		if (onVoice) return;
		cancelUpNext();
		sheetProject = project;
		pausedBySheet = !paused;
		if (!paused) pause();
	}

	function closeSheet(resumeAfter = true) {
		if (!sheetProject) return;
		sheetProject = null;
		if (resumeAfter && pausedBySheet && started) resume();
		pausedBySheet = false;
	}

	// ---- Playlist ----------------------------------------------------------------------
	// Opens over the feed, which pauses until it closes (as for the sheet). From the cover a
	// tap on an entry starts the feed there, inside that tap.

	let playlistOpen = false;
	let pausedByPlaylist = false;

	function openPlaylist(fromCover = false) {
		cancelUpNext();
		playlistOpen = true;
		pausedByPlaylist = !fromCover && started && !coverOn && !paused && !!media(items[playing]);
		if (pausedByPlaylist) pause();
		if (fromCover) emitVisitEvent('visit:short_cover', { action: 'playlist' });
	}

	function closePlaylist(resumeAfter = true) {
		if (!playlistOpen) return;
		playlistOpen = false;
		if (resumeAfter && pausedByPlaylist) resume();
		pausedByPlaylist = false;
	}

	function jumpFromPlaylist(k) {
		closePlaylist(false);
		if (coverOn) {
			if (k !== i) {
				i = playing = k;
				load(k);
			}
			return enterFeed('playlist');
		}
		if (k === i) {
			if (!media(items[i])) return;
			video.currentTime = 0;
			return resume();
		}
		go(k, k > i ? 1 : -1);
	}

	function allFromPlaylist() {
		closePlaylist(false);
		openAllFeed();
	}

	function jumpFromSheet(k) {
		pausedBySheet = false;
		if (k === i) {
			closeSheet(false);
			video.currentTime = 0;
			resume();
		} else go(k, k > i ? 1 : -1);
	}

	// ---- Gestures --------------------------------------------------------------------

	const AXIS_LOCK = 8;
	let gesture = null;
	let scrub = null; // { t, d } while scrubbing

	const resist = (d) => Math.sign(d) * Math.min(H * 0.25, Math.abs(d) * 0.3);

	function onPointerDown(e) {
		if (e.button > 0 || sheetProject || playlistOpen) return;
		if (e.target.closest('button, a')) return;
		if (animating) finishMove();
		cancelAnimationFrame(shiftRaf);
		gesture = {
			cover: coverOn,
			id: e.pointerId,
			type: e.pointerType,
			x: e.clientX,
			y: e.clientY,
			t: performance.now(),
			axis: null,
			onFrame: !!e.target.closest('.live'),
			samples: [{ y: e.clientY, t: performance.now() }]
		};
		e.currentTarget.setPointerCapture?.(e.pointerId);
	}

	function onPointerMove(e) {
		if (!gesture || e.pointerId !== gesture.id) return;
		const dx = e.clientX - gesture.x;
		const dy = e.clientY - gesture.y;
		if (!gesture.axis) {
			if (Math.hypot(dx, dy) < AXIS_LOCK) return;
			gesture.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
			if (gesture.axis === 'x') {
				if (!gesture.onFrame || onVoice || !video?.duration) {
					gesture.axis = 'none';
					return;
				}
				beginScrub();
			}
		}
		if (gesture.axis === 'y') {
			const now = performance.now();
			gesture.samples.push({ y: e.clientY, t: now });
			while (gesture.samples.length > 2 && now - gesture.samples[0].t > 120)
				gesture.samples.shift();
			if (gesture.cover) {
				// Up from the cover: it goes and the feed comes in under the finger.
				shift = Math.max(0, Math.min(1, -dy / Math.max(1, H)));
			} else if (i === 0 && (dy > 0 || shift < 1)) {
				// Down from the first video: the cover comes back in from above.
				offset = 0;
				shift = 1 - Math.max(0, Math.min(1, dy / Math.max(1, H)));
			} else {
				const blocked = dy < 0 && i === items.length - 1;
				offset = blocked ? resist(dy) : dy;
			}
		} else if (gesture.axis === 'x') {
			// The frame's width covers the whole cut, from where the drag began.
			const d = video.duration;
			seekTo(Math.max(0, Math.min(d - 0.05, scrub.from + (dx / Math.max(1, size.w)) * d)));
		}
	}

	// Touches finish in touchend, the event iPhones accept as the tap that may start sound.
	let pendingRelease = null;
	let releaseTimer;

	function onPointerUp(e) {
		if (!gesture || e.pointerId !== gesture.id) return;
		const g = gesture;
		gesture = null;
		const release = () => finishGesture(g, e.clientX, e.clientY);
		if (g.type === 'touch') {
			pendingRelease = release;
			clearTimeout(releaseTimer);
			releaseTimer = setTimeout(runPendingRelease, 80);
		} else release();
	}

	function runPendingRelease() {
		clearTimeout(releaseTimer);
		const release = pendingRelease;
		pendingRelease = null;
		release?.();
	}

	function onPointerCancel(e) {
		if (!gesture || e.pointerId !== gesture.id) return;
		const { axis, cover } = gesture;
		gesture = null;
		if (axis === 'x') endScrub();
		if (axis !== 'y') return;
		if (cover) animateShift(0);
		else if (shift < 1) animateShift(1);
		else snapBack();
	}

	function finishGesture(g, x, y) {
		if (!g.axis) {
			// A tap on the cut: pause or resume (or, muted by the browser, take the sound).
			if (!g.onFrame) return;
			if (upNext) stopUpNext();
			else if (soundBlocked && !paused) unblockSound();
			else togglePause();
			return;
		}
		if (g.axis === 'x') return endScrub();
		if (g.axis !== 'y') return;
		const dy = y - g.y;
		const first = g.samples[0];
		const v = first ? (y - first.y) / Math.max(1, performance.now() - first.t) : 0; // px/ms
		const far = Math.abs(dy) > H * 0.22;
		const flick = Math.abs(v) > 0.45 && Math.abs(dy) > 24;
		if (g.cover) {
			if ((far || flick) && dy < 0 && v <= 0.2) enterFeed('swipe');
			else animateShift(0);
			return;
		}
		if (shift < 1) {
			if ((far || flick) && dy > 0 && v >= -0.2) showCover();
			else animateShift(1);
			return;
		}
		if ((far || flick) && dy < 0 && v <= 0.2 && i < items.length - 1) go(i + 1, 1);
		else if ((far || flick) && dy > 0 && v >= -0.2 && i > 0) go(i - 1, -1);
		else snapBack();
	}

	function beginScrub() {
		// Scrubbing back into a video that ended plays on from where it lands.
		const ended = !!upNext;
		cancelUpNext();
		scrub = {
			from: video.currentTime,
			t: video.currentTime,
			d: video.duration,
			wasPlaying: ended || !video.paused
		};
		video.pause();
	}

	function seekTo(t) {
		scrub = { ...scrub, t };
		if (typeof video.fastSeek === 'function') video.fastSeek(t);
		else video.currentTime = t;
	}

	function endScrub() {
		if (!scrub) return;
		const { t, wasPlaying } = scrub;
		video.currentTime = t;
		scrub = null;
		if (wasPlaying && !paused) play();
	}

	// The progress bar: a tall, invisible hit area around the thin line.
	let barDrag = null;
	function barSeek(e) {
		const r = e.currentTarget.getBoundingClientRect();
		const d = video.duration;
		seekTo(Math.max(0, Math.min(d - 0.05, ((e.clientX - r.left) / Math.max(1, r.width)) * d)));
	}
	function onBarDown(e) {
		if (e.button > 0 || coverOn || onVoice || !video?.duration) return;
		e.currentTarget.setPointerCapture?.(e.pointerId);
		barDrag = e.pointerId;
		beginScrub();
		barSeek(e);
	}
	function onBarMove(e) {
		if (barDrag === e.pointerId) barSeek(e);
	}
	function onBarUp(e) {
		if (barDrag !== e.pointerId) return;
		barDrag = null;
		endScrub();
	}

	// Wheel and trackpad: one move per flick, however long its momentum keeps scrolling.
	let wheelSum = 0;
	let wheelLocked = false;
	let wheelTimer;
	function onWheel(e) {
		if (sheetProject || playlistOpen) return;
		e.preventDefault();
		wheelStep(e.deltaY);
	}

	function wheelStep(deltaY) {
		clearTimeout(wheelTimer);
		wheelTimer = setTimeout(() => {
			wheelLocked = false;
			wheelSum = 0;
		}, 220);
		if (wheelLocked) return;
		wheelSum += deltaY;
		if (Math.abs(wheelSum) < 50) return;
		wheelLocked = true;
		if (coverOn) {
			if (wheelSum > 0) enterFeed('swipe');
		} else if (wheelSum > 0 && i < items.length - 1) go(i + 1, 1);
		else if (wheelSum < 0 && i > 0) go(i - 1, -1);
		else if (wheelSum < 0) showCover();
		wheelSum = 0;
	}

	function onKeydown(e) {
		if (e.key === 'Escape' && sheetProject) return closeSheet();
		if (e.key === 'Escape' && playlistOpen) return closePlaylist();
		// The chat (opened from the voice short) has the keys while it covers the feed.
		if (sheetProject || playlistOpen || $isChatCovering || e.metaKey || e.ctrlKey || e.altKey)
			return;
		if (e.target?.closest?.('input, textarea, [contenteditable]')) return;
		const key = e.key;
		if (coverOn) {
			// On a focused button or link, Space and Enter are its own click.
			if (
				((key === ' ' || key === 'Enter') && !e.target?.closest?.('button, a')) ||
				['ArrowDown', 'PageDown', 'j'].includes(key)
			)
				enterFeed('swipe');
			else return;
			e.preventDefault();
			return;
		}
		if (['ArrowDown', 'PageDown', 'j'].includes(key)) go(i + 1, 1);
		else if (['ArrowUp', 'PageUp', 'k'].includes(key)) {
			if (i > 0) go(i - 1, -1);
			else showCover();
		} else if (onVoice) return;
		else if (key === ' ' && !e.target?.closest?.('button, a')) togglePause();
		else if ((key === 'ArrowRight' || key === 'ArrowLeft') && video?.duration) {
			const t = video.currentTime + (key === 'ArrowRight' ? 5 : -5);
			if (upNext && key === 'ArrowLeft') {
				cancelUpNext();
				video.currentTime = Math.max(0, t);
				play();
			} else if (!upNext) video.currentTime = Math.max(0, Math.min(video.duration - 0.05, t));
		} else if (key === 'm') toggleMute();
		else return;
		e.preventDefault();
	}

	// ---- Wiring ----------------------------------------------------------------------

	function wheelAction(node) {
		node.addEventListener('wheel', onWheel, { passive: false });
		return { destroy: () => node.removeEventListener('wheel', onWheel) };
	}

	onMount(async () => {
		readLikes();
		readPauseAtEnd();
		await tick();
		soundOff = video?.muted || false;
		load(i);
		// On the cover the address stays as it came (a deep link keeps its video's).
		if (!coverOn) syncHash();
		progressRaf = requestAnimationFrame(tickProgress);
	});

	onDestroy(() => {
		if (typeof window === 'undefined') return;
		cancelAnimationFrame(raf);
		cancelAnimationFrame(shiftRaf);
		cancelAnimationFrame(progressRaf);
		clearTimeout(toastTimer);
		clearTimeout(wheelTimer);
		clearTimeout(releaseTimer);
		clearInterval(upNextTimer);
		video?.pause();
		endVoice();
	});

	// A still for each neighbour: its poster, or its first frame. The playing cut's still
	// stays under it until the element has a frame of its own.
	const stillSrc = (it) => `${it.src}#t=0.1`;
</script>

<svelte:window
	on:keydown={onKeydown}
	on:touchend={runPendingRelease}
	on:touchcancel={runPendingRelease}
/>

<div class="feed" class:on-cover={shift < 0.5} class:on-voice={onVoice}>
	<div
		class="stage"
		bind:clientWidth={W}
		bind:clientHeight={H}
		use:wheelAction
		on:pointerdown={onPointerDown}
		on:pointermove={onPointerMove}
		on:pointerup={onPointerUp}
		on:pointercancel={onPointerCancel}
	>
		<div
			class="track"
			bind:this={trackEl}
			style="transform: translate3d(0, {offset + (1 - shift) * H}px, 0)"
		>
			{#if H}
				{#each cells as cell (cell.k)}
					{@const it = items[cell.k]}
					{@const current = cell.slot === 0 && !coverOn && !animating}
					<div
						class="cell"
						data-k={cell.k}
						style="top: {cell.slot * H}px; height: {H}px"
						aria-hidden={it.voice && current ? undefined : 'true'}
					>
						<div class="frame">
							{#if it.voice}
								{#key introRun}
									<VoiceShort
										active={current}
										waiting={!!it.intro && !introDone}
										on:talk={voiceTalk}
										on:ask={(e) => voiceAsk(e.detail)}
									/>
								{/key}
								{#if it.intro && introDone && current}
									<button type="button" class="skip-chip replay" on:click={replayIntro}>
										<svg viewBox="0 0 24 24" aria-hidden="true"
											><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" /><path d="M4.5 4.5v4h4" /></svg
										>
										Replay intro
									</button>
								{/if}
							{:else if it.quote}
								<figure class="quote">
									<blockquote>
										{#each it.quote.lines as line}<span>{line}</span>{/each}
									</blockquote>
									<figcaption>{it.quote.by}</figcaption>
									<p class="quote-hint">Every filter is off. Swipe down to choose again.</p>
								</figure>
							{:else}
								{#if it.poster}
									<img class="backdrop" src={it.poster} alt="" draggable="false" />
								{/if}
								<!-- svelte-ignore a11y-media-has-caption -- the promo and social cuts ship without caption tracks -->
								<video
									class="still"
									src={cell.k === playing && ready === cell.k ? null : stillSrc(it)}
									poster={it.poster}
									muted
									playsinline
									disablepictureinpicture
									preload={cell.slot === 1 ? 'auto' : 'metadata'}
									tabindex="-1"
								></video>
								<canvas class:shown={snapK === cell.k}></canvas>
							{/if}
						</div>
					</div>
				{/each}

				<!-- The playing video, in its cell's place and frame, over the still there. -->
				<div
					class="cell live-cell"
					class:off={!media(items[playing], introDone)}
					class:fading={introSkipped}
					style="top: {slotOf(playing) * H}px; height: {H}px"
				>
					<div class="frame live" class:is-paused={paused && started} class:is-ended={!!upNext}>
						<!-- svelte-ignore a11y-media-has-caption -- the promo and social cuts ship without caption tracks -->
						<video
							bind:this={video}
							playsinline
							preload="auto"
							disablepictureinpicture
							aria-label={items[playing]?.src
								? `${items[playing].project.name}: ${
										items[playing].heading || items[playing].title
								  }`
								: ''}
							on:loadeddata={onLoaded}
							on:ended={onEnded}
							on:timeupdate={onTimeUpdate}
							on:volumechange={onVolume}
							on:durationchange={() => (duration = video.duration || 0)}
						></video>
						{#if scrub}
							<span class="readout">{clock(scrub.t)} / {clock(scrub.d)}</span>
						{/if}
						{#if soundBlocked && soundOff && !paused && started}
							<button type="button" class="sound-chip" on:click={unblockSound}>
								<svg viewBox="0 0 24 24" aria-hidden="true"
									><path d="M4 9h4l5-4v14l-5-4H4z" /><path d="M17 9l5 6M22 9l-5 6" /></svg
								>
								Tap for sound
							</button>
						{/if}
						{#if items[playing]?.voice && started}
							<button type="button" class="skip-chip" class:calling={paused} on:click={skipIntro}>
								Skip intro
								<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l7 6-7 6M15 6v12" /></svg>
							</button>
						{/if}
						<div class="paused" aria-hidden={!(paused && started)}>
							<div class="acts">
								<button
									type="button"
									class="round"
									on:click={toggleMute}
									tabindex={paused ? 0 : -1}
								>
									<span class="ico">
										{#if soundOff}
											<svg viewBox="0 0 24 24" aria-hidden="true"
												><path d="M4 9h4l5-4v14l-5-4H4z" /><path d="M17 9l5 6M22 9l-5 6" /></svg
											>
										{:else}
											<svg viewBox="0 0 24 24" aria-hidden="true"
												><path d="M4 9h4l5-4v14l-5-4H4z" /><path
													d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"
												/></svg
											>
										{/if}
									</span>
									<span>{soundOff ? 'Unmute' : 'Mute'}</span>
								</button>
								{#if !item?.voice}
									<button
										type="button"
										class="round like"
										aria-pressed={liked.has(item?.id)}
										on:click={toggleLike}
										tabindex={paused ? 0 : -1}
									>
										<span class="ico"
											><svg viewBox="0 0 24 24" aria-hidden="true"
												><path
													d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"
												/></svg
											></span
										>
										<span>Like</span>
									</button>
									<button type="button" class="round" on:click={share} tabindex={paused ? 0 : -1}>
										<span class="ico"
											><svg viewBox="0 0 24 24" aria-hidden="true"
												><path d="M12 15V4M7 9l5-5 5 5M5 14v5h14v-5" /></svg
											></span
										>
										<span>Share</span>
									</button>
								{/if}
								{#if fullscreenable}
									<button
										type="button"
										class="round"
										on:click={() => setFullscreen(fullscreenTarget)}
										tabindex={paused ? 0 : -1}
									>
										<span class="ico"
											><svg viewBox="0 0 24 24" aria-hidden="true"
												>{#if $fullscreen}<path
														d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"
													/>{:else}<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />{/if}</svg
											></span
										>
										<span>{$fullscreen ? 'Exit full screen' : 'Full screen'}</span>
									</button>
								{/if}
							</div>
							{#if hasOwnFeed}
								<button
									type="button"
									class="pill"
									on:click={() => openProjectFeed()}
									tabindex={paused ? 0 : -1}
									aria-label="Watch only {project.name} shorts"
								>
									<svg viewBox="0 0 24 24" aria-hidden="true"
										><rect x="7" y="3" width="10" height="16" rx="2.5" /><path
											d="M4 6v12M20 6v12"
										/><path d="M11 9v4.5l3.5-2.25z" class="solid" /></svg
									>
									<span>{project.name} shorts</span>
								</button>
							{/if}
							{#if !item?.voice}
								<button
									type="button"
									class="switch"
									role="switch"
									aria-checked={pauseAtEnd}
									on:click={togglePauseAtEnd}
									tabindex={paused ? 0 : -1}
								>
									<span class="knob" aria-hidden="true"><i></i></span>
									<span>Pause at end</span>
								</button>
							{/if}
							<span class="resume">Tap to keep watching</span>
						</div>
						{#if upNext && items[upNext.k]}
							{@const next = items[upNext.k]}
							<div class="up-next" role="group" aria-label="Up next">
								<span class="up-label">{upNext.over ? 'Start over' : 'Up next'}</span>
								<button
									type="button"
									class="ring"
									on:click={playUpNext}
									aria-label="Play now: {next.project.name}, {next.title}"
								>
									<svg viewBox="0 0 48 48" aria-hidden="true">
										<circle cx="24" cy="24" r="21" class="track" />
										<circle
											cx="24"
											cy="24"
											r="21"
											class="fill"
											class:still={!upNext.countdown}
											pathLength="1"
											style="animation-duration: {UP_NEXT_S}s"
										/>
										<path d="M20 16l12 8-12 8z" class="play" />
									</svg>
								</button>
								<span class="up-title"
									>{#if next.heading || next.project !== project}<b
											>{next.heading || next.project.name}</b
										>{/if}<span>{next.title}</span></span
								>
								{#if upNext.countdown}
									<span class="up-count" aria-live="polite">Next in {upNext.left}</span>
								{:else}
									<span class="up-count">End of the videos</span>
								{/if}
								{#if feed.project}
									<button type="button" class="pill" on:click={openAllFeed}>
										<svg viewBox="0 0 24 24" aria-hidden="true"
											><rect x="4" y="4" width="6" height="6" rx="1.5" /><rect
												x="14"
												y="4"
												width="6"
												height="6"
												rx="1.5"
											/><rect x="4" y="14" width="6" height="6" rx="1.5" /><rect
												x="14"
												y="14"
												width="6"
												height="6"
												rx="1.5"
											/></svg
										>
										<span>All projects</span>
									</button>
								{:else if hasOwnFeed}
									<button type="button" class="pill" on:click={() => openProjectFeed(true)}>
										<span>More from {project.name}</span>
										<svg viewBox="0 0 24 24" aria-hidden="true"
											><path d="M5 12h14M13 6l6 6-6 6" /></svg
										>
									</button>
								{/if}
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<ShortsCover
			{company}
			startsOn={started ? null : startsOn}
			height={H}
			{shift}
			sound={!muted}
			fullscreen={$fullscreen}
			canFullscreen={fullscreenable}
			groups={feed.project ? [] : groups}
			{shown}
			on:filter={(e) => toggleGroup(e.detail)}
			on:sound={toggleCoverSound}
			on:fullscreen={toggleCoverFullscreen}
			on:start={() => enterFeed('cue')}
		/>
	</div>

	<div
		class="progress"
		class:active={!!scrub}
		style="width: {size.w}px"
		role="slider"
		tabindex="-1"
		aria-label="Seek"
		aria-valuemin="0"
		aria-valuemax={Math.round(duration)}
		aria-valuenow={Math.round(scrub?.t ?? 0)}
		on:pointerdown={onBarDown}
		on:pointermove={onBarMove}
		on:pointerup={onBarUp}
		on:pointercancel={onBarUp}
	>
		<span class="line"><i bind:this={barEl}></i></span>
	</div>

	<div class="row" style="width: {shift < 0.5 ? '100%' : `${rowWidth}px`}">
		{#if shift < 0.5}
			<!-- On the cover, the row offers the ways out and the playlist, apart from the
			     switches. -->
			<ShortsLeave
				{code}
				{region}
				on:leave={(e) => onCoverLeave(e)}
				on:playlist={() => openPlaylist(true)}
			/>
		{:else if item}
			<!-- Every item after the cover: its title, then this project's page, the playlist
			     and Exit. -->
			{#if item.voice || item.quote}
				<div class="about">
					<span class="proj"><b>{project.name}</b></span>
					<span class="clip plain">{item.title}</span>
				</div>
			{:else}
				<button
					type="button"
					class="about"
					on:click={openSheet}
					aria-label="More about {item.heading || project.name}"
				>
					<span class="proj"
						><b>{item.heading || project.name}</b><span class="n">{item.n}/{project.count}</span
						></span
					>
					<span class="clip">{item.title}</span>
				</button>
			{/if}
			<!-- This project: its project view (/#square-swaps), the site's Experience section for
			     Experience, the note a Methodologies video explains, the voice agent's engineering
			     note for the voice short. The quote card has none. -->
			{#if !item.quote}
			<a
				class="icon"
				href={item.voice
					? `/tree/${VOICE_NOTE}`
					: item.note
					  ? `/tree/${item.note}`
					  : project.site || `/#${project.slug}`}
				aria-label={item.voice
					? 'How the voice agent is built'
					: item.note
					  ? `Notes on ${item.heading}`
					  : project.status
					    ? `${project.name} project page`
					    : 'Work history'}
				title={item.voice
					? 'How the voice agent is built'
					: item.note
					  ? `Notes on ${item.heading}`
					  : project.status
					    ? `${project.name} project page`
					    : 'Work history'}
			>
				<svg viewBox="0 0 24 24" aria-hidden="true"
					><rect x="4" y="4" width="16" height="16" rx="3" /><path
						d="M10 14l5-5M10.5 9H15v4.5"
					/></svg
				>
			</a>
			{/if}
			<button
				type="button"
				class="icon"
				on:click={() => openPlaylist()}
				aria-label="Playlist"
				title="Playlist"
			>
				<svg viewBox="0 0 24 24" aria-hidden="true"
					><path d="M4 6h13M4 11h13M4 16h7" /><path class="fill" d="M15 14.5v6l5-3z" /></svg
				>
			</button>
			<button
				type="button"
				class="exit"
				on:click={() => {
					video?.pause();
					dispatch('exit');
				}}
				aria-label="Close shorts"
				title="Close shorts"
			>
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
			</button>
		{/if}
	</div>
</div>

<ShortsSheet
	project={sheetProject}
	clips={sheetClips}
	current={i}
	on:close={() => closeSheet()}
	on:jump={(e) => jumpFromSheet(e.detail)}
/>

<ShortsPlaylist
	open={playlistOpen}
	{items}
	current={i}
	feedProject={feed.project}
	on:close={() => closePlaylist()}
	on:jump={(e) => jumpFromPlaylist(e.detail)}
	on:all={allFromPlaylist}
/>

<div class="toast" class:on={!!toastText} role="status">{toastText}</div>

<style>
	.feed {
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.stage {
		position: relative;
		container-type: size;
		flex: 1;
		min-height: 0;
		width: 100%;
		overflow: hidden;
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
	}

	.track {
		position: absolute;
		inset: 0;
		will-change: transform;
	}

	.cell {
		position: absolute;
		left: 0;
		right: 0;
		display: grid;
		place-items: center;
	}

	/* One frame for every item, the cover's (ShortsCover's .box): a rounded container filling
	   the stage (the stage's width, its height less 20px), inside the page's gutters. The
	   stage is the size container. A video fits whole inside it, over a blurred copy of its
	   poster that fills the bands above and below. */
	.frame {
		position: relative;
		width: 100cqw;
		height: calc(100cqh - 20px);
		border-radius: 20px;
		overflow: hidden;
		background: #0c0d0f;
		/* Safari clips video to the radius only with its own layer. */
		transform: translateZ(0);
	}

	/* The easter egg (every cover filter off): a line on seeking nothing, alone in the frame. */
	.quote {
		position: absolute;
		inset: 0;
		margin: 0;
		padding: 0 28px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		background: radial-gradient(80% 50% at 50% 45%, rgba(124, 212, 196, 0.08), transparent 70%),
			#0c0d0f;
		color: var(--fg);
	}

	.quote blockquote {
		margin: 0;
		display: grid;
		gap: 0.15em;
		font: 600 clamp(20px, 6.4cqw, 30px) / 1.25 var(--display);
		letter-spacing: -0.01em;
	}

	.quote figcaption {
		margin-top: 18px;
		font: 500 13px/1 var(--mono);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--accent);
	}

	.quote figcaption::before {
		content: '— ';
	}

	.quote-hint {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 22px;
		margin: 0;
		text-align: center;
		font: 12px/1.4 var(--body);
		color: var(--muted);
	}

	/* A cut fits whole (never cropped) over a blurred copy of its poster. */
	.frame video,
	.frame canvas {
		position: relative;
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.backdrop {
		position: absolute;
		inset: -24px;
		width: calc(100% + 48px);
		height: calc(100% + 48px);
		object-fit: cover;
		filter: blur(22px) brightness(0.45) saturate(1.2);
		pointer-events: none;
	}

	.frame canvas {
		position: absolute;
		inset: 0;
		opacity: 0;
	}

	.frame canvas.shown {
		opacity: 1;
	}

	/* The playing video's cell lets gestures through to the stage, except on the frame. */
	.live-cell {
		pointer-events: none;
	}

	.live-cell.off {
		visibility: hidden;
	}

	/* A skipped intro fades into the live agent rather than cutting mid-frame. */
	.live-cell.off.fading {
		opacity: 0;
		transition:
			opacity 0.25s ease,
			visibility 0s 0.25s;
	}

	.live {
		pointer-events: auto;
		background: transparent;
	}

	.live video {
		transition: filter 0.25s ease;
	}

	.live.is-paused video,
	.live.is-ended video {
		filter: blur(16px) brightness(0.55);
	}

	.live.is-ended .paused {
		visibility: hidden;
	}

	.paused {
		position: absolute;
		inset: 0;
		display: grid;
		place-content: center;
		justify-items: center;
		gap: 18px;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.2s;
	}

	.live.is-paused .paused {
		opacity: 1;
		pointer-events: auto;
	}

	.acts {
		display: flex;
		gap: 18px;
	}

	.round {
		display: grid;
		justify-items: center;
		gap: 6px;
		background: none;
		border: 0;
		color: var(--fg);
		font: 500 12px/1 var(--body);
		cursor: pointer;
		padding: 0;
	}

	.round .ico {
		width: 54px;
		height: 54px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid var(--line);
	}

	.round svg,
	.sound-chip svg {
		width: 24px;
		height: 24px;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.8;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.like[aria-pressed='true'] svg {
		fill: #ff5a6e;
		stroke: #ff5a6e;
	}

	.resume {
		font: 500 13px/1 var(--body);
		color: var(--muted);
	}

	/* Pause at end: off by default, the feed moves on by itself. */
	.switch {
		display: inline-flex;
		align-items: center;
		gap: 9px;
		font: 500 13px/1 var(--body);
		color: var(--fg);
		background: none;
		border: 0;
		padding: 6px 4px;
		cursor: pointer;
	}

	.knob {
		position: relative;
		width: 34px;
		height: 20px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.18);
		border: 1px solid var(--line);
		box-sizing: border-box;
		transition: background-color 0.2s;
	}

	.knob i {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--fg);
		transition: transform 0.2s;
	}

	.switch[aria-checked='true'] .knob {
		background: var(--accent);
	}

	.switch[aria-checked='true'] .knob i {
		transform: translateX(14px);
		background: #000;
	}

	/* A project's own feed, or back to all of them: under the paused buttons and the countdown. */
	.pill {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		max-width: calc(100% - 32px);
		font: 600 13px/1 var(--body);
		color: var(--fg);
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid var(--line);
		border-radius: 999px;
		padding: 10px 14px;
		cursor: pointer;
	}

	/* The paused screen's grid is only as wide as its buttons; the pill may be wider. */
	.paused .pill {
		max-width: none;
	}

	.pill span {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.pill svg {
		width: 16px;
		height: 16px;
		flex: none;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.8;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.pill svg .solid {
		fill: currentColor;
		stroke: none;
	}

	/* Up next: over the last frame, blurred as when paused. */
	.up-next {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 16px;
		text-align: center;
		animation: rise 0.25s ease-out;
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
	}

	.up-label {
		font: 500 11px/1 var(--mono);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.ring {
		width: 76px;
		height: 76px;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: none;
		cursor: pointer;
	}

	.ring svg {
		display: block;
		width: 100%;
		height: 100%;
	}

	.ring .track {
		fill: rgba(255, 255, 255, 0.12);
		stroke: rgba(255, 255, 255, 0.22);
		stroke-width: 2.5;
	}

	/* Fills once over the countdown, then the next video plays. */
	.ring .fill {
		fill: none;
		stroke: var(--accent);
		stroke-width: 2.5;
		stroke-linecap: round;
		stroke-dasharray: 1;
		stroke-dashoffset: 1;
		transform: rotate(-90deg);
		transform-origin: center;
		animation: countdown linear forwards;
	}

	.ring .play {
		fill: var(--fg);
	}

	/* The end of the main feed: a plain Start over, no countdown. */
	.ring .fill.still {
		animation: none;
		stroke-dashoffset: 0;
		stroke: rgba(255, 255, 255, 0.22);
	}

	@keyframes countdown {
		to {
			stroke-dashoffset: 0;
		}
	}

	.up-title {
		display: grid;
		gap: 3px;
		max-width: 100%;
	}

	.up-title b {
		font: 700 18px/1.15 var(--display);
	}

	.up-title span {
		font: 14px/1.3 var(--body);
		color: #dcdad5;
	}

	.up-count {
		font: 500 12px/1 var(--mono);
		font-variant-numeric: tabular-nums;
		color: var(--muted);
		margin-bottom: 8px;
	}

	.readout {
		position: absolute;
		left: 50%;
		bottom: 16px;
		transform: translateX(-50%);
		font: 500 13px/1 var(--mono);
		font-variant-numeric: tabular-nums;
		color: var(--fg);
		background: rgba(0, 0, 0, 0.6);
		border-radius: 999px;
		padding: 7px 11px;
		pointer-events: none;
	}

	.sound-chip {
		position: absolute;
		left: 12px;
		top: 12px;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font: 600 12px/1 var(--body);
		color: var(--fg);
		background: rgba(0, 0, 0, 0.55);
		border: 1px solid var(--line);
		border-radius: 999px;
		padding: 7px 11px 7px 8px;
		cursor: pointer;
	}

	.sound-chip svg {
		width: 16px;
		height: 16px;
	}

	/* The voice short's intro: straight to the live agent (over the paused screen). */
	.skip-chip {
		position: absolute;
		z-index: 2;
		right: 12px;
		top: 12px;
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font: 600 12px/1 var(--body);
		color: var(--fg);
		background: rgba(0, 0, 0, 0.55);
		border: 1px solid var(--line);
		border-radius: 999px;
		padding: 7px 9px 7px 11px;
		cursor: pointer;
	}

	/* The intro paused: the way on to the live agent asks to be noticed. */
	.skip-chip.calling {
		border-color: var(--accent);
		animation: calling 1.4s ease-in-out infinite;
	}

	@keyframes calling {
		0%,
		100% {
			box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 55%, transparent);
			background: rgba(0, 0, 0, 0.55);
		}
		50% {
			box-shadow: 0 0 0 6px color-mix(in srgb, var(--accent) 0%, transparent);
			background: color-mix(in srgb, var(--accent) 28%, rgba(0, 0, 0, 0.55));
		}
	}

	/* After the intro: play it again, in the spot Skip intro had. */
	.skip-chip.replay {
		padding: 7px 11px 7px 9px;
	}

	.skip-chip svg {
		width: 14px;
		height: 14px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	/* Level 1: progress. The line is 3px; the hit area around it is 24px tall. */
	.progress {
		flex: none;
		height: 24px;
		margin: -10px 0 -11px;
		display: flex;
		align-items: center;
		cursor: pointer;
		touch-action: none;
		position: relative;
		z-index: 1;
	}

	.progress .line {
		display: block;
		width: 100%;
		height: 3px;
		border-radius: 2px;
		background: rgba(255, 255, 255, 0.16);
		overflow: hidden;
		transition: height 0.15s ease;
	}

	.progress.active .line,
	.progress:hover .line {
		height: 5px;
	}

	.progress i {
		display: block;
		height: 100%;
		background: var(--fg);
		transform-origin: left;
		transform: scaleX(0);
	}

	/* While the cover or the voice short shows, the progress line waits for a video. */
	.on-cover .progress,
	.on-voice .progress {
		opacity: 0;
		pointer-events: none;
	}

	/* Level 2: the control row */
	.row {
		flex: none;
		max-width: 100%;
		/* One height whatever it holds (the cover's buttons or a video's name and title), so
		   the stage, and the frames in it, never change size; ShortsPage's copy matches it. */
		box-sizing: content-box;
		height: 50px;
		display: flex;
		align-items: center;
		gap: 8px;
		padding-block: 12px 14px;
		padding-bottom: max(14px, env(safe-area-inset-bottom, 0px));
	}

	.about {
		flex: 1;
		min-width: 0;
		display: grid;
		gap: 2px;
		text-align: left;
		background: none;
		border: 0;
		padding: 4px 2px;
		color: var(--fg);
		cursor: pointer;
	}

	.proj {
		display: flex;
		align-items: baseline;
		gap: 8px;
		min-width: 0;
	}

	.proj b {
		font: 700 18px/1.15 var(--display);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.n {
		font: 500 12px/1 var(--mono);
		color: var(--muted);
		font-variant-numeric: tabular-nums;
		flex: none;
	}

	.clip {
		font: 13px/1.4 var(--body);
		color: var(--muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.clip::after {
		content: ' · more';
		color: var(--accent);
	}

	.clip.plain::after {
		content: none;
	}

	div.about {
		cursor: default;
	}

	.exit svg,
	.icon svg {
		width: 16px;
		height: 16px;
		flex: none;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.icon svg .fill {
		fill: currentColor;
		stroke: none;
	}

	/* The row's icons: this project and the playlist (then Exit). */
	.icon {
		flex: none;
		width: 34px;
		height: 34px;
		box-sizing: border-box;
		border-radius: 50%;
		display: grid;
		place-items: center;
		color: var(--fg);
		background: var(--raise);
		border: 1px solid var(--line);
		padding: 0;
		cursor: pointer;
	}

	.icon svg {
		width: 17px;
		height: 17px;
	}

	/* The row's round buttons draw at 34px but take taps over 42px. */
	.icon,
	.exit {
		position: relative;
	}

	.icon::after,
	.exit::after {
		content: '';
		position: absolute;
		inset: -4px;
		border-radius: 50%;
	}

	.exit {
		flex: none;
		width: 34px;
		height: 34px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		color: var(--muted);
		background: none;
		border: 1px solid var(--line);
		cursor: pointer;
		padding: 0;
	}

	button:focus-visible,
	a:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	.toast {
		position: fixed;
		z-index: 30;
		left: 50%;
		bottom: 90px;
		transform: translateX(-50%);
		font: 13px/1.2 var(--body);
		color: var(--fg);
		background: var(--raise);
		border: 1px solid var(--line);
		border-radius: 999px;
		padding: 9px 14px;
		opacity: 0;
		transition: opacity 0.2s;
		pointer-events: none;
	}

	.toast.on {
		opacity: 1;
	}

	@media (prefers-reduced-motion: reduce) {
		.skip-chip.calling {
			animation: none;
			background: color-mix(in srgb, var(--accent) 28%, rgba(0, 0, 0, 0.55));
		}
		.live video,
		.paused,
		.toast,
		.progress .line {
			transition: none;
		}
		.up-next {
			animation: none;
		}
	}
</style>
