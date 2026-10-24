<script>
	// Any address with no page (and any other error): a quiet black page in the shorts' look,
	// with a line from Tolkien for the lost, and the ways back. Still a 404 to search engines.
	import { page } from '$app/stores';

	$: missing = $page.status === 404;
	$: path = $page.url.pathname;
</script>

<svelte:head>
	<title>{missing ? 'Not found' : 'Something went wrong'} — Andrea de Candia</title>
	<meta name="robots" content="noindex" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap"
	/>
	<meta name="theme-color" content="#000000" />
</svelte:head>

<main class="lost">
	<div class="card">
		<p class="code">{$page.status}{#if missing}<span>{path}</span>{/if}</p>
		{#if missing}
			<blockquote>
				<p>Not all those who wander are lost.</p>
				<footer>J.R.R. Tolkien, <cite>The Fellowship of the Ring</cite></footer>
			</blockquote>
			<p class="line">This page is, though. There's nothing here.</p>
		{:else}
			<h1>Something went wrong.</h1>
			<p class="line">It's on my side. Try again in a moment.</p>
		{/if}
		<nav>
			<a class="primary" href="/">Home</a>
			<a href="/shorts">Watch shorts</a>
		</nav>
	</div>
</main>

<style>
	.lost {
		--fg: #f3f1ec;
		--muted: #9aa0a9;
		--line: rgba(255, 255, 255, 0.14);
		--accent: #7cd4c4;
		--display: 'Bricolage Grotesque', 'Avenir Next', 'Segoe UI', sans-serif;
		--body: 'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif;
		--mono: 'IBM Plex Mono', ui-monospace, Menlo, monospace;
		color-scheme: dark;
		position: fixed;
		inset: 0;
		overflow-y: auto;
		display: grid;
		place-items: center;
		padding: 24px 16px;
		box-sizing: border-box;
		background: #000;
		color: var(--fg);
		font: 15px/1.5 var(--body);
	}

	/* The site sets Verdana on every element; here everything takes the page's fonts. */
	.lost :global(*) {
		font-family: inherit;
	}

	/* The shorts cover's card: a dark frame with an indigo glow above and a teal one below. */
	.card {
		width: min(100%, 520px);
		box-sizing: border-box;
		display: grid;
		gap: 22px;
		padding: clamp(28px, 7vw, 48px) clamp(22px, 6vw, 44px);
		border-radius: 20px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		background:
			radial-gradient(120% 70% at 85% 0%, rgba(67, 56, 202, 0.38), transparent 60%),
			radial-gradient(90% 60% at 0% 100%, rgba(20, 184, 166, 0.16), transparent 70%),
			#0c0d0f;
	}

	.code {
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 10px;
		font: 500 12px/1.4 var(--mono);
		letter-spacing: 0.12em;
		color: var(--accent);
	}

	.code span {
		min-width: 0;
		overflow-wrap: anywhere;
		letter-spacing: 0.02em;
		color: var(--muted);
	}

	blockquote {
		margin: 0;
		display: grid;
		gap: 12px;
	}

	blockquote p,
	h1 {
		margin: 0;
		font: 700 clamp(28px, 8vw, 42px) / 1.08 var(--display);
		letter-spacing: -0.015em;
		text-wrap: balance;
	}

	footer {
		font-size: 14px;
		color: var(--muted);
	}

	footer::before {
		content: '— ';
	}

	cite {
		font-style: italic;
	}

	.line {
		margin: 0;
		color: #d6d4cf;
	}

	nav {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	nav a {
		display: inline-flex;
		align-items: center;
		min-height: 42px;
		padding: 0 18px;
		border-radius: 999px;
		border: 1px solid var(--line);
		color: var(--fg);
		font-weight: 600;
		font-size: 14px;
		text-decoration: none;
	}

	nav a.primary {
		background: var(--fg);
		border-color: var(--fg);
		color: #000;
	}

	nav a:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
</style>
