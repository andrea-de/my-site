<script context="module">
	const warmed = new Set();
	/**
	 * Fetches and decodes every icon ahead (ShortsFeed calls it once the feeds load), so the
	 * row never shows the previous project's icon while the next one arrives.
	 * @param {(string | null)[]} icons
	 */
	export function preloadIcons(icons) {
		for (const icon of icons) {
			if (!icon || icon === 'prism' || warmed.has(icon)) continue;
			warmed.add(icon);
			const img = new Image();
			img.src = icon;
			img.decode?.().catch(() => {});
		}
	}
</script>

<script>
	// A project's icon in the title row and the sheet: a product's app icon, or the site's chat
	// prism for the voice short. Nothing for a project without one. Keyed on the icon, so a new
	// project's never reuses the last one's element (which kept showing until the new loaded).
	/** The project's `icon`: an image path, 'prism', or null. */
	export let icon = null;
	export let size = 34;
</script>

{#if icon === 'prism'}
	<span class="tile prism" style="--s: {size}px" aria-hidden="true">
		<svg viewBox="0 0 24 24"
			><path
				d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linejoin="bevel"
			/><path
				d="M12 6L13.5 10.5L18 12L13.5 13.5L12 18L10.5 13.5L6 12L10.5 10.5L12 6Z"
				fill="currentColor"
			/></svg
		>
	</span>
{:else if icon}
	{#key icon}
	<!-- SVG marks have no tile of their own: they sit on a light one. -->
	<img
		class="tile"
		class:mark={icon.endsWith('.svg')}
		style="--s: {size}px"
		src={icon}
		alt=""
		width={size}
		height={size}
		decoding="sync"
	/>
	{/key}
{/if}

<style>
	.tile {
		flex: none;
		width: var(--s);
		height: var(--s);
		box-sizing: border-box;
		border-radius: 22%;
		display: block;
		object-fit: cover;
	}

	.mark {
		background: #f4f2ee;
		padding: calc(var(--s) * 0.12);
		object-fit: contain;
	}

	.prism {
		display: grid;
		place-items: center;
		background: #fff;
		color: #000;
	}

	.prism svg {
		width: 66%;
		height: 66%;
	}
</style>
