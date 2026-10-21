<script>
	// The two ways out of the cover, shown in the control row under it (by ShortsFeed, and by
	// ShortsPage's copy while the videos load): the job link's own page (or the Welcome
	// screen) and the site itself. Without a code the welcome page is the home page's own
	// Welcome screen: a full load shows it (on phones), so that link reloads. ?nointro skips
	// it (see src/app.html).
	import { createEventDispatcher } from 'svelte';

	/** The job link's code (on /shorts/<code>), or null. */
	export let code = null;

	const dispatch = createEventDispatcher();
</script>

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
	<span>{code ? 'Your welcome page' : 'Welcome'}</span>
</a>
<a class="leave site" href="/?nointro" on:click={() => dispatch('leave', { to: 'site' })}>
	<span>Explore the site</span>
	<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
</a>

<style>
	.leave {
		flex: 1;
		min-width: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 11px 8px;
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
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 14%, transparent);
		border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
	}

	.leave.welcome svg {
		fill: currentColor;
	}

	.leave.site {
		color: var(--fg);
		background: var(--raise);
		border: 1px solid var(--line);
	}

	.leave.site svg {
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.leave:hover {
		filter: brightness(1.08);
	}

	a:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
</style>
