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
	$: shortUrl = data.shortsUrl.replace(/^https:\/\/www\./, '');

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
	<header>
		<h1>{data.name}</h1>
		<p class="title">{data.title}</p>
		<span class="rule"></span>
	</header>

	<button class="qr" type="button" on:click={toggle} aria-label="Switch between contact and shorts QR">
		{@html svg}
	</button>

	<p class="hint">
		{#if mode === 'contact'}Scan to save my contact{:else}Scan to watch my work{/if}
		<small>tap the code for {mode === 'contact' ? 'the shorts' : 'my contact'}</small>
	</p>

	<address>
		{#if mode === 'shorts'}
			<span class="url">{shortUrl}</span>
		{/if}
		<span>{data.email}</span>
		<span>{data.phone}</span>
		{#if mode === 'contact'}
			<span>{data.site}</span>
		{/if}
	</address>

	<p class="foot">
		<a href="/dashboard">Dashboard</a> · link <code>{data.code}</code>
		<small>?code=… for another link, ?region=us for the US number</small>
	</p>
</main>

<style>
	main {
		min-height: 100vh;
		min-height: 100dvh;
		box-sizing: border-box;
		padding: max(24px, 5vh) 24px 16px;
		display: grid;
		grid-template-rows: auto auto auto 1fr auto;
		justify-items: center;
		align-content: start;
		gap: 0;
		background: #efebe3;
		color: #1d1a16;
		font-family: Inter, system-ui, -apple-system, sans-serif;
		text-align: center;
		--qr: min(86vw, 52vh, 520px);
	}

	/* The owner score badge is for browsing the site, not for a card held up to someone. */
	:global(.owner-score) {
		display: none;
	}

	header {
		display: grid;
		justify-items: center;
		margin-bottom: clamp(20px, 4vh, 40px);
	}

	h1 {
		margin: 0;
		font-family: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
		font-weight: 600;
		font-size: clamp(38px, 11vw, 60px);
		line-height: 1;
		letter-spacing: 0.01em;
		white-space: nowrap;
	}

	.title {
		margin: 12px 0 0;
		font-size: clamp(12px, 3.3vw, 16px);
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #6b645a;
	}

	.rule {
		width: 56px;
		height: 2px;
		margin-top: 22px;
		background: #b89b5e;
	}

	.qr {
		margin: 0;
		padding: calc(var(--qr) * 0.06);
		border: 0;
		border-radius: 24px;
		background: #fff;
		box-shadow: 0 24px 50px rgba(40, 30, 10, 0.16), 0 2px 6px rgba(40, 30, 10, 0.1);
		cursor: pointer;
		display: block;
		width: var(--qr);
		height: var(--qr);
		box-sizing: border-box;
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
		margin: clamp(18px, 3.5vh, 32px) 0 0;
		font-size: clamp(16px, 4.4vw, 20px);
		color: #3a352e;
		display: grid;
		gap: 4px;
	}

	.hint small {
		font-size: 0.7em;
		letter-spacing: 0.06em;
		color: #8a8275;
	}

	address {
		align-self: end;
		margin-top: clamp(20px, 4vh, 40px);
		font-style: normal;
		font-size: clamp(15px, 4.2vw, 19px);
		line-height: 1.75;
		color: #3a352e;
		display: grid;
	}

	.url {
		font-weight: 500;
		color: #1d1a16;
	}

	.foot {
		margin: 20px 0 0;
		font-size: 0.75rem;
		color: #a39b8d;
	}

	.foot a {
		color: inherit;
	}

	.foot small {
		display: block;
	}
</style>
