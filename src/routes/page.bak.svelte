<script>
	import { onMount } from 'svelte';

	onMount(() => {});
</script>

<main on:scroll={(e) => console.log(e)}>
	<div>BIG DIV</div>
</main>

<style>
	:global(html, body) {
		overflow: hidden;
		width: 100%;
		height: 100%;
	}

	main {
		width: 100px;
		height: 100px;
		overflow: scroll;
	}

	div {
		width: 1000px;
		height: 3000px;
		background: radial-gradient(#e66465, #9198e5);
		overflow: scroll !important;
	}
</style>


