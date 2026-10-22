<script>
	// The cover's control row (shown by ShortsFeed, and by ShortsPage's copy while the videos
	// load): four equal buttons, each an icon over its label. The job link's own page (or the
	// Welcome screen), the résumé, the playlist of the feed, and Close shorts, the site without
	// the Welcome screen (?nointro, see src/app.html). Without a code the welcome page is the
	// home page's own Welcome screen: a full load shows it (on phones), so that link reloads.
	import { createEventDispatcher } from 'svelte';
	import { sendRefEvent } from '$lib/stores/referral';

	/** The job link's code (on /shorts/<code>), or null. */
	export let code = null;
	/** The job link's résumé region ('us' or 'eu'); without a code /resume picks by country. */
	export let region = null;
	/** False while the feed is still loading: there is no playlist yet. */
	export let canPlaylist = true;

	const dispatch = createEventDispatcher();

	function openResume() {
		if (code) sendRefEvent('resume_open');
		dispatch('leave', { to: 'resume' });
	}
</script>

<div class="ways">
	<a
		class="way welcome"
		href={code ? `/r/${code}` : '/'}
		data-sveltekit-reload={code ? undefined : ''}
		on:click={() => dispatch('leave', { to: 'welcome' })}
	>
		<svg viewBox="0 0 24 24" aria-hidden="true" class="solid"
			><path
				d="M12 3.5l1.9 4.6 4.6 1.9-4.6 1.9L12 16.5l-1.9-4.6L5.5 10l4.6-1.9zM18.5 15.5l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8z"
			/></svg
		>
		<span>Welcome</span>
	</a>
	<a
		class="way resume"
		href={region ? `/resume?region=${region}` : '/resume'}
		on:click={openResume}
	>
		<svg viewBox="0 0 24 24" aria-hidden="true"
			><path d="M7 3.5h7l4 4v13H7z" /><path d="M14 3.5v4h4M10 12h5M10 15.5h5" /></svg
		>
		<span>Resume</span>
	</a>
	<button
		type="button"
		class="way playlist"
		disabled={!canPlaylist}
		on:click={() => dispatch('playlist')}
	>
		<svg viewBox="0 0 24 24" aria-hidden="true"
			><path d="M4 6h13M4 11h13M4 16h7" /><path class="fill" d="M15 14.5v6l5-3z" /></svg
		>
		<span>Playlist</span>
	</button>
	<a
		class="way close"
		href="/?nointro"
		aria-label="Close shorts"
		on:click={() => dispatch('leave', { to: 'site' })}
	>
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
		<span class="roomy">Close shorts</span>
		<span class="small">Close</span>
	</a>
</div>

<style>
	.ways {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 6px;
		container-type: inline-size;
	}

	/* Equal widths, whatever the label. */
	.way {
		flex: 1 1 0;
		min-width: 0;
		height: 46px;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		padding: 0 4px;
		border-radius: 14px;
		font: 600 11.5px/1 var(--body);
		white-space: nowrap;
		text-decoration: none;
		cursor: pointer;
	}

	.way svg {
		flex: none;
		width: 17px;
		height: 17px;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.9;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.way svg.solid,
	.way svg .fill {
		fill: currentColor;
		stroke: none;
	}

	.way span {
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Tonal: teal for the welcome page, blue for the résumé. */
	.way.welcome {
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 14%, transparent);
		border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
	}

	.way.resume {
		--blue: #8fb4ff;
		color: var(--blue);
		background: color-mix(in srgb, var(--blue) 14%, transparent);
		border: 1px solid color-mix(in srgb, var(--blue) 40%, transparent);
	}

	.way.playlist {
		color: var(--fg);
		background: var(--raise);
		border: 1px solid var(--line);
	}

	.way.playlist:disabled {
		opacity: 0.55;
		cursor: default;
	}

	/* The videos' close button (ShortsFeed's .exit), with its label. */
	.way.close {
		color: var(--muted);
		background: none;
		border: 1px solid var(--line);
	}

	.small {
		display: none;
	}

	@container (max-width: 339px) {
		.way .roomy {
			display: none;
		}
		.way .small {
			display: inline;
		}
	}

	.way:hover:not(:disabled) {
		filter: brightness(1.08);
	}

	.way.close:hover {
		color: var(--fg);
	}

	a:focus-visible,
	button:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
</style>
