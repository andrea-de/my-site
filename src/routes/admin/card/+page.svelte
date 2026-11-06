<script>
	import qrcode from '$lib/vendor/qrcode.js';

	export let data;

	// 'contact' saves a vCard; 'shorts' opens the tracked feed. A tap on the code switches.
	let mode = 'contact';

	$: vcard = [
		'BEGIN:VCARD',
		'VERSION:3.0',
		`N:${data.family};${data.given};;;`,
		`FN:${data.name}`,
		`TITLE:${data.title}`,
		data.phoneHref ? `TEL;TYPE=CELL:${data.phoneHref.replace(/^tel:/, '')}` : '',
		data.email ? `EMAIL:${data.email}` : '',
		`URL:${data.shortsUrl}`,
		'END:VCARD'
	]
		.filter(Boolean)
		.join('\n');

	$: payload = mode === 'contact' ? vcard : data.shortsUrl;
	$: svg = render(payload);
	// The footer shows the address people would type; the ref tag rides in the QR alone.
	$: shortUrl = data.shortsUrl.replace(/^https:\/\/www\./, '').replace(/\?.*$/, '');

	function render(text) {
		const q = qrcode(0, 'M');
		q.addData(text);
		q.make();
		return q
			.createSvgTag({ cellSize: 1, margin: 0, scalable: true })
			.replace('<svg', '<svg shape-rendering="crispEdges" preserveAspectRatio="xMidYMid meet"');
	}

	const toggle = () => (mode = mode === 'contact' ? 'shorts' : 'contact');
</script>

<svelte:head>
	<title>Business card</title>
	<meta name="robots" content="noindex" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Inter:wght@400;500&display=swap"
	/>
</svelte:head>

<main>
	<article class="pass">
		<header>
			<p class="kicker">{data.title}</p>
			<h1>{data.name}</h1>
		</header>

		<section class="body">
			<button class="qr" type="button" on:click={toggle} aria-label="Switch between contact and shorts QR">
				{@html svg}
			</button>
			<p class="hint">
				{#if mode === 'contact'}Scan to save my contact{:else}Scan to watch my work{/if}
				<small>tap the code for {mode === 'contact' ? 'the shorts' : 'my contact'}</small>
			</p>
		</section>

		<footer>
			<dl>
				{#if mode === 'shorts'}
					<div><dt>Shorts</dt><dd>{shortUrl}</dd></div>
				{/if}
				<div><dt>Email</dt><dd>{data.email}</dd></div>
				<div><dt>Mobile</dt><dd>{data.phone}</dd></div>
				{#if mode === 'contact'}
					<div><dt>Web</dt><dd>{data.site}</dd></div>
				{/if}
			</dl>
		</footer>
	</article>

	<p class="foot">
		<a href="/dashboard">Dashboard</a> · source <code>{data.ref}</code>
		<small>?ref=… for another tag, ?region=us for the US number</small>
	</p>
</main>

<style>
	main {
		min-height: 100vh;
		min-height: 100dvh;
		box-sizing: border-box;
		padding: 20px 16px 16px;
		display: grid;
		grid-template-rows: 1fr auto;
		justify-items: center;
		align-items: center;
		background: #e4e1da;
		color: #1d1a16;
		font-family: Inter, system-ui, -apple-system, sans-serif;
	}

	/* The owner score badge is for browsing the site, not for a card held up to someone. */
	:global(.owner-score) {
		display: none;
	}

	.pass {
		width: min(100%, 400px);
		border-radius: 22px;
		overflow: hidden;
		background: #fff;
		box-shadow: 0 24px 50px rgba(30, 25, 15, 0.22), 0 2px 6px rgba(30, 25, 15, 0.1);
	}

	header {
		padding: 26px 26px 24px;
		background: #1d1a16;
		color: #fff;
	}

	.kicker {
		margin: 0 0 10px;
		font-size: 11px;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #c9ad6a;
	}

	h1 {
		margin: 0;
		font-family: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
		font-weight: 600;
		font-size: clamp(34px, 10vw, 42px);
		line-height: 1;
		letter-spacing: 0.01em;
		white-space: nowrap;
	}

	.body {
		padding: 26px 26px 20px;
		display: grid;
		justify-items: center;
		gap: 16px;
	}

	.qr {
		all: unset;
		display: block;
		width: 100%;
		max-width: 300px;
		aspect-ratio: 1;
		box-sizing: border-box;
		padding: 8px;
		border-radius: 14px;
		background: #fff;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
	}

	.qr:active {
		transform: scale(0.985);
	}

	.qr :global(svg) {
		display: block;
		width: 100%;
		height: 100%;
	}

	.hint {
		margin: 0;
		font-size: 16px;
		color: #1d1a16;
		text-align: center;
		display: grid;
		gap: 3px;
	}

	.hint small {
		font-size: 12px;
		letter-spacing: 0.05em;
		color: #8a8275;
	}

	footer {
		padding: 18px 26px 22px;
		border-top: 1px dashed #d9d3c6;
		background: #faf8f3;
	}

	dl {
		margin: 0;
		display: grid;
		gap: 10px;
	}

	dl div {
		display: grid;
		grid-template-columns: 56px 1fr;
		align-items: baseline;
		gap: 10px;
	}

	dt {
		font-size: 10px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #8a8275;
	}

	dd {
		margin: 0;
		font-size: 15px;
		color: #1d1a16;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.foot {
		margin: 16px 0 0;
		font-size: 0.75rem;
		color: #8a8275;
		text-align: center;
	}

	.foot a {
		color: inherit;
	}

	.foot small {
		display: block;
	}
</style>
