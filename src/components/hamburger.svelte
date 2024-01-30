<script>
	export let isActive = false;
	import { flip } from 'svelte/animate';

</script>

<button class="top" on:click={() => (isActive = !isActive)}>
	<p class="name" style="color: {isActive ? 'black' : 'white'};">
		{#if isActive}
			Great Software by Andrea
		{:else}
			Software by Andrea
		{/if}
	</p>
	<div class="hamburger {isActive ? 'active' : ''}">
		<div class="hamburger-line line-1" style="background-color: white"></div>
		<div class="hamburger-line line-2" style="background-color: black"></div>
		<div class="hamburger-line line-3" style="background-color: white"></div>
		<div class="hamburger-line line-4" style="background-color: black"></div>
		<div class="hamburger-line line-5" style="background-color: white"></div>
	</div>
</button>

<style>
	/* CSS Reset */
	button {
		cursor: pointer;
		border: none;
		padding: none;
		background-color: transparent;
		outline: none;
		touch-action: none;
	}

	/* CSS Reset */
	button:focus {
        outline: none;
    }

	/* CSS Reset */
	.top:focus {
		background-color: transparent;
	}

	.top {
		position: fixed;
		z-index: 99;
		display: flex;
		width: 100%;
		justify-content: space-between;
		align-items: center;
		margin-top: 10px;
	}

	.name {
		margin-left: 1rem;
		float: left;
		font-size: 1.5rem;
		text-transform: uppercase;
		transition: color 0.2s linear;
		transition: content .4 flip;
	}

	.hamburger {
		margin-right: 1rem;
		width: 3rem;
		height: 3rem;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.hamburger.active {
		justify-content: space-around;
	}

	.hamburger-line {
		width: 100%;
		height: 0.2rem;
		transition:
			transform 0.3s ease-in-out,
			margin 0.3s ease-in-out;
	}

	.hamburger:not(.active) .line-1 {
		margin-top: 0.5rem;
	}

	.hamburger:not(.active) .line-5 {
		margin-bottom: 0.5rem;
	}

	.hamburger.active .line-2 {
		transform: translateY(0.6rem) translateX(0rem) rotate(45deg);
	}

	.hamburger.active .line-4 {
		transform: translateY(-0.6rem) translateX(0rem) rotate(-45deg);
	}
</style>
