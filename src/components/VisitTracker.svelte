<script>
	import { onMount } from 'svelte';

	const HEARTBEAT_MS = 30000;
	const FIRST_CHECKPOINT_MS = 10000;
	const VISITOR_STORAGE_KEY = 'my-site-visitor-id';

	let sessionId = '';
	let sessionStartedAt = 0;
	let visitorId = '';
	let heartbeatTimer;
	let firstCheckpointTimer;
	let sectionObserver;
	let dirty = true;
	let finalFlushed = false;

	const sectionsViewed = new Set();
	const outboundHosts = new Set();
	// /shorts: per video, how much was played and whether it was liked (or liked, then unliked).
	const shorts = new Map();

	const state = {
		landingPath: '',
		referrer: '',
		pageTitle: '',
		maxScrollPercent: 0,
		resumeClicks: 0,
		projectClicks: 0,
		outboundClicks: 0,
		outboundHosts: [],
		sectionsViewed: [],
		chatOpened: false,
		hasAgentInteraction: false,
		hasFormSubmission: false,
		shorts: [],
		// /shorts cover: how the visitor left it, in order ('sound', 'muted', 'swipe',
		// 'welcome', 'resume', 'site'), each once.
		shortsCover: [],
		// /shorts voice short: 'view', 'talk' (the orb), 'ask' (a capability), each once.
		shortsVoice: [],
		// A person was there: any scroll gesture, tap, click, key or mouse movement. A visit
		// is only counted once this is true (bots and instant bounces never set it).
		interacted: false,
		webdriver: false
	};

	const HUMAN_EVENTS = ['pointerdown', 'pointermove', 'touchstart', 'keydown', 'wheel'];

	function handleHumanSignal() {
		if (state.interacted) return;
		state.interacted = true;
		markDirty();
		for (const type of HUMAN_EVENTS) window.removeEventListener(type, handleHumanSignal, true);
	}

	import { getOrCreateSessionId } from '$lib/session';
	import { liveVisit } from '$lib/stores/visit';

	export let owner = false;
	let liveTimer;

	// The owner's badge shows this visit's score as it builds (owner visits are never stored).
	function publishLive() {
		if (owner && sessionStartedAt) liveVisit.set(buildPayload('live'));
	}

	function markDirty() {
		dirty = true;
		publishLive();
	}

	function generateId() {
		const cryptoApi = window.crypto;

		if (typeof cryptoApi?.randomUUID === 'function') {
			return cryptoApi.randomUUID();
		}

		if (typeof cryptoApi?.getRandomValues === 'function') {
			const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
			bytes[6] = (bytes[6] & 0x0f) | 0x40;
			bytes[8] = (bytes[8] & 0x3f) | 0x80;

			const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
			return [
				hex.slice(0, 8),
				hex.slice(8, 12),
				hex.slice(12, 16),
				hex.slice(16, 20),
				hex.slice(20)
			].join('-');
		}

		return `fallback-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	}

	function getOrCreateVisitorId() {
		try {
			const existing = window.localStorage.getItem(VISITOR_STORAGE_KEY);
			if (existing) return existing;

			const nextVisitorId = generateId();
			window.localStorage.setItem(VISITOR_STORAGE_KEY, nextVisitorId);
			return nextVisitorId;
		} catch {
			return generateId();
		}
	}

	function updatePageMetadata() {
		state.pageTitle = document.title;
		state.landingPath = `${window.location.pathname}${window.location.search}`;
		state.referrer = document.referrer || '';
	}

	function computeMaxScrollPercent() {
		const doc = document.documentElement;
		const scrollableHeight = doc.scrollHeight - window.innerHeight;
		if (scrollableHeight <= 0) return 100;

		return Math.max(0, Math.min(100, Math.round((window.scrollY / scrollableHeight) * 100)));
	}

	function updateScrollDepth() {
		const nextValue = computeMaxScrollPercent();
		if (nextValue > state.maxScrollPercent) {
			state.maxScrollPercent = nextValue;
			markDirty();
		}
	}

	function recordSectionView(sectionId) {
		if (!sectionId || sectionsViewed.has(sectionId)) return;
		sectionsViewed.add(sectionId);
		state.sectionsViewed = [...sectionsViewed];
		markDirty();
	}

	function detectSectionId(element) {
		if (element.id) return element.id;
		if (element.classList.contains('hero')) return 'hero';
		return element.getAttribute('data-visit-section') || '';
	}

	function handleSectionEntries(entries) {
		for (const entry of entries) {
			if (entry.isIntersecting) {
				recordSectionView(detectSectionId(entry.target));
			}
		}
	}

	function handleDocumentClick(event) {
		const target = event.target;
		if (!(target instanceof Element)) return;

		const resumeLink = target.closest(
			'a[href*="/resume"], a[href*="resume.pdf"], a[href*="cv.pdf"], a[href*="resume/raw/main/resume.pdf"], .resume-btn'
		);
		if (resumeLink) {
			state.resumeClicks += 1;
			markDirty();
		}

		const projectTrigger = target.closest('.project-card, .phone-mockup');
		if (projectTrigger) {
			state.projectClicks += 1;
			markDirty();
		}

		const anchor = target.closest('a[href]');
		if (anchor) {
			const href = anchor.getAttribute('href') || '';
			if (href.startsWith('mailto:')) {
				state.outboundClicks += 1;
				outboundHosts.add('mailto');
				state.outboundHosts = [...outboundHosts];
				markDirty();
				return;
			}

			if (href.startsWith('http')) {
				try {
					const url = new URL(href);
					if (url.host !== window.location.host) {
						state.outboundClicks += 1;
						outboundHosts.add(url.host);
						state.outboundHosts = [...outboundHosts];
						markDirty();
					}
				} catch {
					// Ignore malformed URLs.
				}
			}
		}
	}

	function handleVisitEvent(event) {
		switch (event.type) {
			case 'visit:chat_open':
				state.chatOpened = true;
				break;
			case 'visit:chat_message':
				state.chatOpened = true;
				state.hasAgentInteraction = true;
				break;
			case 'visit:contact_submit':
				state.hasFormSubmission = true;
				break;
			// Each step of the phone Welcome screen counts as a section seen: the screen
			// covers the page, so there is nothing to scroll while it is open.
			case 'visit:intro_page':
				recordSectionView(`welcome-${event.detail?.page}`);
				return;
			// Shown in the visit's report only; neither adds to the engagement score.
			case 'visit:short_watch':
			case 'visit:short_like':
				if (!recordShort(event.type, event.detail)) return;
				break;
			case 'visit:short_cover': {
				const action = event.detail?.action;
				if (!action || state.shortsCover.includes(action)) return;
				state.shortsCover = [...state.shortsCover, action].slice(0, 10);
				break;
			}
			case 'visit:short_voice': {
				const action = event.detail?.action;
				if (!action || state.shortsVoice.includes(action)) return;
				state.shortsVoice = [...state.shortsVoice, action].slice(0, 5);
				break;
			}
			default:
				return;
		}

		markDirty();
	}

	function recordShort(type, detail = {}) {
		const { id, project, title } = detail;
		if (!id) return false;
		const entry = shorts.get(id) || { id, project, title, pct: 0 };
		if (type === 'visit:short_watch') {
			if (!(detail.pct > entry.pct)) return false;
			entry.pct = detail.pct;
		} else {
			entry.liked = Boolean(detail.liked);
		}
		shorts.set(id, entry);
		state.shorts = [...shorts.values()].map((e) => ({ ...e }));
		return true;
	}

	function buildPayload(reason, isFinal = false) {
		return {
			sessionId,
			visitorId,
			startedAt: new Date(sessionStartedAt).toISOString(),
			endedAt: new Date().toISOString(),
			durationMs: Date.now() - sessionStartedAt,
			reason,
			isFinal,
			...state
		};
	}

	function sendVisitPayload(payload, isFinal = false) {
		const body = JSON.stringify(payload);

		if (isFinal && navigator.sendBeacon) {
			return navigator.sendBeacon('/api/visits', new Blob([body], { type: 'application/json' }));
		}

		fetch('/api/visits', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body,
			keepalive: isFinal
		}).catch(() => {});

		return true;
	}

	function flush(reason, options = {}) {
		const { isFinal = false, force = false } = options;

		if (isFinal && finalFlushed) return;
		if (!dirty && !force) return;

		updateScrollDepth();
		updatePageMetadata();

		sendVisitPayload(buildPayload(reason, isFinal), isFinal);
		dirty = false;

		if (isFinal) {
			finalFlushed = true;
		}
	}

	function handleVisibilityChange() {
		if (document.visibilityState === 'hidden') {
			flush('hidden', { force: true });
		}
	}

	function handlePageHide() {
		flush('pagehide', { isFinal: true, force: true });
	}

	function bindSectionObserver() {
		// A section counts once it crosses the middle of the screen. (A share of the section's
		// own height never fired for sections taller than the screen, as on phones.)
		sectionObserver = new IntersectionObserver(handleSectionEntries, {
			rootMargin: '-45% 0px -45% 0px',
			threshold: 0
		});

		const hero = document.querySelector('section.hero');
		if (hero) sectionObserver.observe(hero);

		document.querySelectorAll('main section[id]').forEach((section) => {
			sectionObserver.observe(section);
		});
	}

	onMount(() => {
		sessionId = getOrCreateSessionId();
		visitorId = getOrCreateVisitorId();
		sessionStartedAt = Date.now();
		updatePageMetadata();
		updateScrollDepth();
		recordSectionView('hero');
		bindSectionObserver();
		state.webdriver = Boolean(navigator.webdriver);
		for (const type of HUMAN_EVENTS) window.addEventListener(type, handleHumanSignal, { capture: true, passive: true });

		window.addEventListener('scroll', updateScrollDepth, { passive: true });
		document.addEventListener('click', handleDocumentClick, true);
		document.addEventListener('visibilitychange', handleVisibilityChange);
		window.addEventListener('pagehide', handlePageHide);
		window.addEventListener('visit:chat_open', handleVisitEvent);
		window.addEventListener('visit:chat_message', handleVisitEvent);
		window.addEventListener('visit:contact_submit', handleVisitEvent);
		window.addEventListener('visit:intro_page', handleVisitEvent);
		window.addEventListener('visit:short_watch', handleVisitEvent);
		window.addEventListener('visit:short_like', handleVisitEvent);
		window.addEventListener('visit:short_cover', handleVisitEvent);
		window.addEventListener('visit:short_voice', handleVisitEvent);

		firstCheckpointTimer = setTimeout(() => {
			flush('checkpoint', { force: true });
		}, FIRST_CHECKPOINT_MS);

		heartbeatTimer = setInterval(() => {
			flush('heartbeat');
		}, HEARTBEAT_MS);

		publishLive();
		liveTimer = setInterval(publishLive, 1000);

		return () => {
			clearTimeout(firstCheckpointTimer);
			clearInterval(heartbeatTimer);
			clearInterval(liveTimer);
			for (const type of HUMAN_EVENTS) window.removeEventListener(type, handleHumanSignal, true);
			sectionObserver?.disconnect();

			window.removeEventListener('scroll', updateScrollDepth);
			document.removeEventListener('click', handleDocumentClick, true);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			window.removeEventListener('pagehide', handlePageHide);
			window.removeEventListener('visit:chat_open', handleVisitEvent);
			window.removeEventListener('visit:chat_message', handleVisitEvent);
			window.removeEventListener('visit:contact_submit', handleVisitEvent);
			window.removeEventListener('visit:intro_page', handleVisitEvent);
		window.removeEventListener('visit:short_watch', handleVisitEvent);
		window.removeEventListener('visit:short_like', handleVisitEvent);
		window.removeEventListener('visit:short_cover', handleVisitEvent);
		window.removeEventListener('visit:short_voice', handleVisitEvent);
		};
	});
</script>
