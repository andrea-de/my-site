<script>
	export let isActive = false;
</script>

<div class="top">
	<p class="name" style="color: {isActive ? 'black' : 'white'};">Andrea de Candia</p>
	<button class="hamburger {isActive ? 'active' : ''}" on:click={() => (isActive = !isActive)}>
		<div class="hamburger-line line-1" style="background-color: white"></div>
		<div class="hamburger-line line-2" style="background-color: black"></div>
		<div class="hamburger-line line-3" style="background-color: white"></div>
		<div class="hamburger-line line-4" style="background-color: black"></div>
		<div class="hamburger-line line-5" style="background-color: white"></div>
	</button>
</div>

<style>
	.top {
		position: fixed;
		margin-top: 10px;
		z-index: 99;
		display: flex;
		width: 100%;
		justify-content: space-between;
		align-items: center;
	}

	.name {
		margin-left: 1rem;
		float: left;
		font-size: 1.5rem;
		transition: color 0.2s linear;
		text-transform: uppercase;
	}

	.hamburger {
		margin-right: 1rem;
		width: 3rem;
		height: 3rem;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		cursor: pointer;
		border: none;
		background-color: transparent;
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
