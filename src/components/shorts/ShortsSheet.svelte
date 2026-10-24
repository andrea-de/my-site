<script>
	// More about the project whose video is playing: its icon, status, the line, the stack, its
	// videos to jump to and every link it has (site, stores, notes, its place on this site).
	// Opens from the title row; the voice short's lists no videos. Experience and Methodologies
	// are not products: no status, their videos are named by heading (company, method) and
	// line, and Experience lists the current role first (its `lead`), which has no video yet
	// and plays another role's when chosen.
	import { createEventDispatcher } from 'svelte';
	import ShortsIcon from './ShortsIcon.svelte';

	/** The open project, or null when the sheet is closed. */
	export let project = null;
	/** The project's videos, in the open feed's order, with their index there. */
	export let clips = [];
	export let current = -1;

	const dispatch = createEventDispatcher();
	let shown = null;
	$: if (project) shown = project;
	$: open = !!project;

	// The lead, numbered with the videos, and the clip it plays (if that clip is in the feed).
	$: lead = shown?.lead || null;
	$: leadClip = lead ? clips.find((c) => c.key === lead.plays) : null;
	$: total = clips.length + (lead ? 1 : 0);

	const host = (url) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
</script>

<div class="scrim" class:open on:click={() => dispatch('close')} aria-hidden="true"></div>
<section
	class="sheet"
	class:open
	aria-hidden={!open}
	aria-label="About this project"
	inert={open ? undefined : true}
>
	<div class="grab" aria-hidden="true"></div>
	<button type="button" class="close" on:click={() => dispatch('close')} aria-label="Close">
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
	</button>
	{#if shown}
		<div class="head">
			<ShortsIcon icon={shown.icon} size={44} />
			<h2>{shown.fullName || shown.name}</h2>
		</div>
		{#if shown.status}
			<span class="status" class:test={!shown.status.live}>{shown.status.label}</span>
		{/if}
		<h3>About</h3>
		<p>{shown.line}</p>
		{#if shown.technologies.length}
			<h3>Stack</h3>
			<div class="tech">
				{#each shown.technologies as tech}<span>{tech}</span>{/each}
			</div>
		{/if}
		{#if !shown.voice}
		<h3>Videos</h3>
		<ol class="clips">
			{#if lead}
				<li>
					<button
						type="button"
						disabled={!leadClip}
						on:click={() => leadClip && dispatch('jump', leadClip.index)}
					>
						<span><b>{lead.heading}</b><span class="role">{lead.role}</span></span><small
							>1/{total}</small
						>
					</button>
				</li>
			{/if}
			{#each clips as clip}
				<li>
					<button
						type="button"
						aria-current={clip.index === current}
						on:click={() => dispatch('jump', clip.index)}
					>
						<span
							>{#if clip.heading}<b>{clip.heading}</b>{/if}<span class="role">{clip.title}</span
							></span
						><small>{clip.n + (lead ? 1 : 0)}/{total}</small>
					</button>
				</li>
			{/each}
		</ol>
		{/if}
		<h3>Links</h3>
		<div class="links">
			{#if shown.url?.startsWith('http')}
				<a href={shown.url} target="_blank" rel="noopener noreferrer">{host(shown.url)}</a>
			{/if}
			{#if shown.stores?.ios}
				<a href={shown.stores.ios} target="_blank" rel="noopener noreferrer">App Store</a>
			{/if}
			{#if shown.stores?.android}
				<a href={shown.stores.android} target="_blank" rel="noopener noreferrer">Google Play</a>
			{/if}
			{#if shown.treeSlug}
				<a href="/tree/{shown.treeSlug}"
					>{shown.voice ? 'How the voice agent is built' : 'Engineering notes'}</a
				>
			{/if}
			<!-- Methodologies: the note each video explains. -->
			{#each clips.filter((c) => c.note) as clip}
				<a href="/tree/{clip.note}">Notes: {clip.heading}</a>
			{/each}
			{#if shown.site}
				<a href={shown.site}>{shown.status ? 'Project page' : 'Work history on the site'}</a>
			{/if}
		</div>
	{/if}
</section>

<style>
	.scrim {
		position: fixed;
		inset: 0;
		z-index: 9;
		background: rgba(0, 0, 0, 0.5);
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.2s;
	}

	.scrim.open {
		opacity: 1;
		pointer-events: auto;
	}

	.sheet {
		position: fixed;
		z-index: 10;
		left: 50%;
		bottom: 0;
		width: min(480px, 100%);
		max-height: 78%;
		overflow-y: auto;
		overscroll-behavior: contain;
		box-sizing: border-box;
		background: var(--panel);
		border: 1px solid var(--line);
		border-bottom: 0;
		border-radius: 18px 18px 0 0;
		padding: 10px 20px calc(24px + env(safe-area-inset-bottom, 0px));
		transform: translate(-50%, 105%);
		visibility: hidden;
		transition:
			transform 0.28s ease,
			visibility 0s 0.28s;
	}

	.sheet.open {
		transform: translate(-50%, 0);
		visibility: visible;
		transition: transform 0.28s ease;
	}

	.grab {
		width: 36px;
		height: 4px;
		border-radius: 2px;
		background: var(--line);
		margin: 0 auto 14px;
	}

	.close {
		position: absolute;
		top: 10px;
		right: 12px;
		width: 34px;
		height: 34px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		color: var(--muted);
		background: none;
		border: 1px solid var(--line);
		cursor: pointer;
	}

	.close svg {
		width: 16px;
		height: 16px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
	}

	.head {
		display: flex;
		align-items: center;
		gap: 12px;
		margin: 0 0 8px;
		padding-right: 40px;
	}

	h2 {
		font: 700 24px/1.1 var(--display);
		margin: 0;
	}

	h3 {
		font: 500 11px/1 var(--mono);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
		margin: 20px 0 8px;
	}

	p {
		margin: 0;
		color: #dcdad5;
		font: 15px/1.4 var(--body);
	}

	.status {
		display: inline-block;
		font: 500 11px/1 var(--mono);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: #000;
		background: var(--live);
		border-radius: 4px;
		padding: 4px 6px;
	}

	.status.test {
		background: var(--test);
	}

	.tech {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.tech span {
		font: 500 11px/1 var(--mono);
		border: 1px solid var(--line);
		border-radius: 4px;
		padding: 5px 7px;
	}

	.clips {
		display: grid;
		gap: 6px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.clips button {
		width: 100%;
		display: flex;
		justify-content: space-between;
		gap: 10px;
		font: 500 14px/1.2 var(--body);
		color: var(--fg);
		background: var(--raise);
		border: 1px solid var(--line);
		border-radius: 10px;
		padding: 11px 12px;
		text-align: left;
		cursor: pointer;
	}

	.clips button[aria-current='true'] {
		border-color: var(--accent);
	}

	.clips b {
		display: block;
		font-weight: 600;
	}

	.clips b + .role {
		font-size: 12px;
		color: var(--muted);
	}

	.clips small {
		font: 500 11px/1.3 var(--mono);
		color: var(--muted);
	}

	.links {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.links a {
		font: 500 13px/1 var(--body);
		color: var(--fg);
		border: 1px solid var(--line);
		border-radius: 999px;
		padding: 10px 14px;
		text-decoration: none;
	}

	button:focus-visible,
	a:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	@media (prefers-reduced-motion: reduce) {
		.sheet,
		.sheet.open,
		.scrim {
			transition: none;
		}
	}
</style>
