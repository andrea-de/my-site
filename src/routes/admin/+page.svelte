<script>
	export let data;
	export let form;

	$: expires = data.expiresAt
		? new Date(data.expiresAt).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
		: '';
</script>

<svelte:head>
	<title>Admin</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main>
	<section class="card">
		<h1>Admin</h1>

		{#if data.expiresAt}
			<p class="muted">Logged in until {expires}.</p>
			<a class="btn primary" href="/api/visits">Open the dashboard</a>
			<form method="POST" action="?/logout">
				<button class="btn" type="submit">Log out</button>
			</form>
		{:else}
			<form method="POST" action="?/login">
				<label for="password">Password</label>
				<!-- svelte-ignore a11y-autofocus -- the page's only field -->
				<input id="password" name="password" type="password" autocomplete="current-password" required autofocus />
				{#if form?.error}<p class="error" role="alert">{form.error}</p>{/if}
				<button class="btn primary" type="submit">Log in</button>
			</form>
		{/if}

		{#if data.ownerMarked}
			<form method="POST" action="?/unmark" class="foot">
				<p class="muted">This browser's visits aren't counted.</p>
				<button class="btn" type="submit">Count this browser again</button>
			</form>
		{/if}
	</section>
</main>

<style>
	main {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 16px;
		background: #0b0b0c;
		color: #e4e4e7;
		font-family: system-ui, -apple-system, sans-serif;
	}

	.card {
		width: 100%;
		max-width: 340px;
		display: grid;
		gap: 12px;
		padding: 24px;
		border: 1px solid #27272a;
		border-radius: 12px;
		background: #18181b;
	}

	h1 {
		margin: 0 0 4px;
		font-size: 1.25rem;
	}

	form {
		display: grid;
		gap: 10px;
	}

	label {
		font-size: 0.85rem;
		color: #a1a1aa;
	}

	input {
		padding: 10px 12px;
		border: 1px solid #3f3f46;
		border-radius: 8px;
		background: #0b0b0c;
		color: inherit;
		font: inherit;
	}

	.btn {
		display: block;
		padding: 10px 12px;
		border: 1px solid #3f3f46;
		border-radius: 8px;
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: center;
		text-decoration: none;
		cursor: pointer;
	}

	.btn.primary {
		border-color: #14b8a6;
		background: #14b8a6;
		color: #042f2e;
		font-weight: 600;
	}

	.muted {
		margin: 0;
		font-size: 0.85rem;
		color: #a1a1aa;
	}

	.error {
		margin: 0;
		font-size: 0.85rem;
		color: #f87171;
	}

	.foot {
		margin-top: 8px;
		padding-top: 12px;
		border-top: 1px solid #27272a;
	}
</style>
