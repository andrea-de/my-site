<script>
	// Every item of the open feed (the cover aside, the voice short included), grouped by
	// project in the order each first appears, with its poster, title and the one playing
	// marked; a tap jumps to it. The same sheet as ShortsSheet. In a project's feed it also
	// offers the way back to every project. Each project's headline video, its card video (the
	// first in its own order: Intellisense for Experience), wears a star and a teal ring, in
	// any feed; the voice short has its own look and no star.
	import { createEventDispatcher, tick } from 'svelte';

	export let open = false;
	/** The feed's items, in its order. */
	export let items = [];
	/** The index playing (or, on the cover, the one it sits above). */
	export let current = -1;
	/** The open feed's project, or null in the main feed. */
	export let feedProject = null;

	const dispatch = createEventDispatcher();
	let list;

	/** A project's headline video: its card video, the first in the project's own order. */
	const headline = (it) => it.ci === 0 && !it.voice;

	$: groups = (() => {
		const byProject = new Map();
		items.forEach((it, index) => {
			if (!byProject.has(it.project)) byProject.set(it.project, []);
			byProject.get(it.project).push({ it, index });
		});
		// A video without a poster of its own shows its project's (its card video's), dimmed.
		return [...byProject].map(([project, entries]) => ({
			project,
			entries,
			poster: entries.find((e) => e.it.poster)?.it.poster || null
		}));
	})();

	// Opening scrolls the one playing into view.
	$: if (open)
		tick().then(() =>
			list?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'center' })
		);
</script>

<div class="scrim" class:open on:click={() => dispatch('close')} aria-hidden="true"></div>
<section
	class="sheet"
	class:open
	aria-hidden={!open}
	aria-label="Playlist"
	inert={open ? undefined : true}
>
	<div class="grab" aria-hidden="true"></div>
	<div class="head">
		<h2>{feedProject ? `${feedProject.name} shorts` : 'Playlist'}</h2>
		{#if feedProject}
			<button type="button" class="all" on:click={() => dispatch('all')}>All projects</button>
		{/if}
		<button type="button" class="close" on:click={() => dispatch('close')} aria-label="Close">
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
		</button>
	</div>
	<div class="groups" bind:this={list}>
		{#each groups as group}
			<h3>{group.project.name}</h3>
			<ol>
				{#each group.entries as { it, index } (it.id)}
					<li>
						<button
							type="button"
							class:headline={headline(it)}
							aria-current={index === current}
							on:click={() => dispatch('jump', index)}
						>
							<span class="thumb" class:voice={it.voice}>
								{#if it.voice}
									<svg viewBox="0 0 24 24" aria-hidden="true"
										><path d="M8 10v4M11 8v8M14 6v12M17 9v6" /></svg
									>
								{:else if it.poster}
									<img src={it.poster} alt="" loading="lazy" draggable="false" />
								{:else if group.poster}
									<img
										class="borrowed"
										src={group.poster}
										alt=""
										loading="lazy"
										draggable="false"
									/>
								{:else}
									<span class="initial">{group.project.name[0]}</span>
								{/if}
							</span>
							{#if headline(it)}
								<span class="star" title="Headline video" aria-label="Headline video">
									<svg viewBox="0 0 24 24" aria-hidden="true"
										><path
											d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"
										/></svg
									>
								</span>
							{/if}
							<span class="text">
								<b>{it.heading || it.title}</b>
								{#if it.heading}<small>{it.title}</small>{/if}
							</span>
							{#if index === current}
								<span class="now">Now</span>
							{/if}
						</button>
					</li>
				{/each}
			</ol>
		{/each}
	</div>
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
		max-height: 82%;
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
		background: var(--panel);
		border: 1px solid var(--line);
		border-bottom: 0;
		border-radius: 18px 18px 0 0;
		padding: 10px 0 0;
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
		margin: 0 auto 10px;
		flex: none;
	}

	.head {
		flex: none;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 0 14px 10px 20px;
		border-bottom: 1px solid var(--line);
	}

	h2 {
		flex: 1;
		min-width: 0;
		margin: 0;
		font: 700 22px/1.1 var(--display);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.all {
		flex: none;
		font: 600 13px/1 var(--body);
		color: var(--fg);
		background: var(--raise);
		border: 1px solid var(--line);
		border-radius: 999px;
		padding: 9px 12px;
		cursor: pointer;
	}

	.close {
		flex: none;
		width: 34px;
		height: 34px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		color: var(--muted);
		background: none;
		border: 1px solid var(--line);
		padding: 0;
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

	.groups {
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 4px 14px calc(18px + env(safe-area-inset-bottom, 0px));
	}

	h3 {
		font: 500 11px/1 var(--mono);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
		margin: 16px 6px 8px;
	}

	ol {
		display: grid;
		gap: 6px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li button {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 6px 10px 6px 6px;
		border-radius: 12px;
		color: var(--fg);
		background: var(--raise);
		border: 1px solid var(--line);
		text-align: left;
		cursor: pointer;
	}

	li button[aria-current='true'] {
		border-color: var(--accent);
	}

	/* A project's headline video: a teal ring round its row (and its thumbnail), and a star. */
	li button.headline {
		position: relative;
		border-color: color-mix(in srgb, var(--accent) 55%, transparent);
		background: color-mix(in srgb, var(--accent) 7%, var(--raise));
	}

	li button.headline .thumb {
		box-shadow: 0 0 0 2px var(--accent);
	}

	.star {
		position: absolute;
		left: 34px;
		top: 2px;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		background: var(--accent);
		box-shadow: 0 0 0 2px var(--panel);
	}

	.star svg {
		width: 11px;
		height: 11px;
		fill: #000;
	}

	.thumb {
		flex: none;
		width: 36px;
		aspect-ratio: 9 / 16;
		border-radius: 6px;
		overflow: hidden;
		display: grid;
		place-items: center;
		background: #0c0d0f;
	}

	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.thumb img.borrowed {
		opacity: 0.45;
	}

	.thumb.voice {
		background: #4f46e5;
	}

	.thumb svg {
		width: 18px;
		height: 18px;
		fill: none;
		stroke: #fff;
		stroke-width: 2;
		stroke-linecap: round;
	}

	.initial {
		font: 700 15px/1 var(--display);
		color: var(--muted);
	}

	.text {
		flex: 1;
		min-width: 0;
		display: grid;
		gap: 3px;
	}

	.text b {
		font: 600 14px/1.25 var(--body);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.text small {
		font: 12px/1.3 var(--body);
		color: var(--muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.now {
		flex: none;
		font: 500 10px/1 var(--mono);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #000;
		background: var(--accent);
		border-radius: 4px;
		padding: 4px 5px;
	}

	button:focus-visible {
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
