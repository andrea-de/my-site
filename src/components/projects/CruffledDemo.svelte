<script>
	import { onMount, onDestroy } from 'svelte';
	import { fly, fade } from 'svelte/transition';

	let showGame = false;
	let interval;

	onMount(() => {
		interval = setInterval(() => {
			showGame = !showGame;
		}, 5000);
	});

	onDestroy(() => {
		clearInterval(interval);
	});
</script>

<div class="demo-container">
	<div class="screen-content">
		{#if !showGame}
			<div 
				class="image-wrapper" 
				in:fly={{ x: -300, duration: 800 }} 
				out:fly={{ x: -300, duration: 800 }}
			>
				<img src="/menu-modern.png" alt="Menu Preview" />
			</div>
		{:else}
			<div 
				class="image-wrapper" 
				in:fly={{ x: 300, duration: 800 }} 
				out:fly={{ x: 300, duration: 800 }}
			>
				<img src="/game-modern.png" alt="Game Preview" />
			</div>
		{/if}
	</div>
	
	<!-- Overlay Info -->
	<div class="overlay" transition:fade>
		<div class="label">{showGame ? 'Gameplay' : 'Main Menu'}</div>
	</div>
</div>

<style>
	.demo-container {
		width: 100%;
		height: 100%;
		background: #000;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		position: relative;
	}

	.screen-content {
		flex: 1;
		position: relative;
		width: 100%;
		height: 100%;
	}

	.image-wrapper {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: top;
	}

	.overlay {
		position: absolute;
		bottom: 1.5rem;
		left: 0;
		width: 100%;
		display: flex;
		justify-content: center;
		z-index: 20;
		pointer-events: none;
	}

	.label {
		background: rgba(79, 70, 229, 0.95);
		color: white;
		padding: 0.35rem 0.9rem;
		border-radius: 2rem;
		font-size: 0.65rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		box-shadow: 0 4px 12px rgba(0,0,0,0.3);
		font-family: sans-serif;
	}
</style>
