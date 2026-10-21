<script>
	// The ways out of the cover, shown in the control row under it (by ShortsFeed, and by
	// ShortsPage's copy while the videos load): the job link's own page (or the Welcome
	// screen), the résumé, and the site itself in the row's exit spot, the close button the
	// videos have there, widened with its label. Without a code the welcome page is the home
	// page's own Welcome screen: a full load shows it (on phones), so that link reloads.
	// ?nointro skips it (see src/app.html). Labels shorten as the row narrows.
	import { createEventDispatcher } from 'svelte';
	import { sendRefEvent } from '$lib/stores/referral';

	/** The job link's code (on /shorts/<code>), or null. */
	export let code = null;
	/** The job link's résumé region ('us' or 'eu'); without a code /resume picks by country. */
	export let region = null;

	const dispatch = createEventDispatcher();

	function openResume() {
		if (code) sendRefEvent('resume_open');
		dispatch('leave', { to: 'resume' });
	}
</script>

<div class="ways">
	<a
		class="leave welcome"
		href={code ? `/r/${code}` : '/'}
		data-sveltekit-reload={code ? undefined : ''}
		on:click={() => dispatch('leave', { to: 'welcome' })}
	>
		<svg viewBox="0 0 24 24" aria-hidden="true"
			><path
				d="M12 3.5l1.9 4.6 4.6 1.9-4.6 1.9L12 16.5l-1.9-4.6L5.5 10l4.6-1.9zM18.5 15.5l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8z"
			/></svg
		>
		<span class="wide">{code ? 'Your welcome page' : 'Welcome'}</span>
		<span class="narrow">Welcome</span>
	</a>
	<a
		class="leave resume"
		href={region ? `/resume?region=${region}` : '/resume'}
		on:click={openResume}
	>
		<svg viewBox="0 0 24 24" aria-hidden="true"
			><path d="M7 3.5h7l4 4v13H7z" /><path d="M14 3.5v4h4M10 12h5M10 15.5h5" /></svg
		>
		<span>Resume</span>
	</a>
	<a
		class="leave site"
		href="/?nointro"
		aria-label="Explore the site"
		on:click={() => dispatch('leave', { to: 'site' })}
	>
		<svg viewBox="0 0 24 24" aria-hidden="true"
			><path d="M13 4.5H6.5v15H13" /><path d="M10.5 12H20M16.5 8.5 20 12l-3.5 3.5" /></svg
		>
		<span class="roomy">Explore the site</span>
		<span class="small">Explore</span>
	</a>
</div>

<style>
	.ways {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 8px;
		container-type: inline-size;
	}

	.leave {
		min-width: 0;
		height: 36px;
		box-sizing: border-box;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 0 12px;
		border-radius: 999px;
		font: 600 13px/1 var(--body);
		white-space: nowrap;
		text-decoration: none;
		cursor: pointer;
	}

	.leave svg {
		flex: none;
		width: 17px;
		height: 17px;
	}

	.leave.welcome {
		flex: 1;
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 14%, transparent);
		border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
	}

	.leave.welcome svg {
		fill: currentColor;
	}

	.leave.resume {
		flex: none;
		color: var(--fg);
		background: var(--raise);
		border: 1px solid var(--line);
	}

	/* The videos' close button (ShortsFeed's .exit), widened with its label. */
	.leave.site {
		flex: none;
		margin-left: auto;
		color: var(--muted);
		background: none;
		border: 1px solid var(--line);
		padding: 0 12px 0 10px;
	}

	.leave.resume svg,
	.leave.site svg {
		fill: none;
		stroke: currentColor;
		stroke-width: 1.9;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.leave span {
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.narrow,
	.small {
		display: none;
	}

	@container (max-width: 419px) {
		.ways {
			gap: 6px;
		}
		.leave {
			gap: 5px;
			padding: 0 10px;
		}
		.leave.site {
			padding: 0 10px 0 8px;
		}
		.leave .wide {
			display: none;
		}
		.leave .narrow {
			display: inline;
		}
	}

	@container (max-width: 339px) {
		.leave {
			padding: 0 10px;
		}
		.leave .roomy {
			display: none;
		}
		.leave .small {
			display: inline;
		}
	}

	.leave:hover {
		filter: brightness(1.08);
	}

	.leave.site:hover {
		color: var(--fg);
	}

	a:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
</style>
