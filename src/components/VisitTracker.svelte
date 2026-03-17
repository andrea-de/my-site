<script>
	import { onMount } from 'svelte';

	const HEARTBEAT_MS = 30000;
	const FIRST_CHECKPOINT_MS = 10000;

	let sessionId = '';
	let sessionStartedAt = 0;
	let heartbeatTimer;
	let firstCheckpointTimer;
	let sectionObserver;
	let dirty = true;
	let finalFlushed = false;

	const sectionsViewed = new Set();
	const outboundHosts = new Set();

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
		hasFormSubmission: false
	};

	function markDirty() {
		dirty = true;
	}

	function getOrCreateSessionId() {
		const storageKey = 'visit-session-id';
		let id = sessionStorage.getItem(storageKey);

		if (!id) {
			id = crypto.randomUUID();
			sessionStorage.setItem(storageKey, id);
		}

		return id;
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

		const resumeLink = target.closest('a[href="resume.pdf"]');
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
			default:
				return;
		}

		markDirty();
	}

	function buildPayload(reason, isFinal = false) {
		return {
			sessionId,
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
		sectionObserver = new IntersectionObserver(handleSectionEntries, {
			rootMargin: '0px 0px -35% 0px',
			threshold: 0.35
		});

		const hero = document.querySelector('section.hero');
		if (hero) sectionObserver.observe(hero);

		document.querySelectorAll('main section[id]').forEach((section) => {
			sectionObserver.observe(section);
		});
	}

	onMount(() => {
		sessionId = getOrCreateSessionId();
		sessionStartedAt = Date.now();
		updatePageMetadata();
		updateScrollDepth();
		recordSectionView('hero');
		bindSectionObserver();

		const eventOptions = { passive: true };

		window.addEventListener('scroll', updateScrollDepth, eventOptions);
		document.addEventListener('click', handleDocumentClick, true);
		document.addEventListener('visibilitychange', handleVisibilityChange);
		window.addEventListener('pagehide', handlePageHide);
		window.addEventListener('visit:chat_open', handleVisitEvent);
		window.addEventListener('visit:chat_message', handleVisitEvent);
		window.addEventListener('visit:contact_submit', handleVisitEvent);

		firstCheckpointTimer = setTimeout(() => {
			flush('checkpoint', { force: true });
		}, FIRST_CHECKPOINT_MS);

		heartbeatTimer = setInterval(() => {
			flush('heartbeat');
		}, HEARTBEAT_MS);

		return () => {
			clearTimeout(firstCheckpointTimer);
			clearInterval(heartbeatTimer);
			sectionObserver?.disconnect();

			window.removeEventListener('scroll', updateScrollDepth, eventOptions);
			document.removeEventListener('click', handleDocumentClick, true);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			window.removeEventListener('pagehide', handlePageHide);
			window.removeEventListener('visit:chat_open', handleVisitEvent);
			window.removeEventListener('visit:chat_message', handleVisitEvent);
			window.removeEventListener('visit:contact_submit', handleVisitEvent);
		};
	});
</script>
