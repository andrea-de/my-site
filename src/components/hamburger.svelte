<script>
	import { onMount } from 'svelte';
	export let isActive = false;
	export let hideName = false;

	let y = 0;
	$: isScrolled = y > 100;
</script>

<svelte:window bind:scrollY={y} />

<div class="header-container" class:scrolled={isScrolled} class:menu-open={isActive}>
	<button 
		class="pill-button {isActive ? 'active' : ''}" 
		on:click={() => (isActive = !isActive)}
		aria-label="Toggle Menu"
	>
		<div class="branding" class:visible={(isScrolled || isActive) && !hideName}>
			<span class="name">Andrea de Candia</span>
		</div>
		<div class="hamburger">
			<div class="line line-1"></div>
			<div class="line line-2"></div>
		</div>
	</button>
</div>

<style>
	.header-container {
		position: fixed;
		top: 1.5rem;
		right: 1.5rem;
		z-index: 100;
		transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
	}

	.pill-button {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 0.8rem 1.1rem;
		background: rgba(255, 255, 255, 0.03);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 3.5rem;
		cursor: pointer;
		transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		overflow: hidden;
		width: auto;
		min-width: 3.6rem;
		max-width: 4rem;
	}

	.pill-button:hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.25);
		transform: translateY(-2px);
	}

	.hamburger {
		width: 1.4rem;
		height: 1.4rem;
		display: flex;
		justify-content: center;
		align-items: center;
		position: relative;
		flex-shrink: 0;
	}

	.line {
		width: 1.3rem;
		height: 2px;
		background-color: #fff;
		position: absolute;
		transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
	}

	.line-1 {
		transform: translateY(-4px);
	}

	.line-2 {
		transform: translateY(4px);
	}

	.pill-button.active .line-1 {
		transform: translateY(0) rotate(45deg);
	}

	.pill-button.active .line-2 {
		transform: translateY(0) rotate(-45deg);
	}

	.branding {
		width: 0;
		opacity: 0;
		transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
		white-space: nowrap;
		overflow: hidden;
		text-align: right;
	}

	.branding.visible {
		width: 175px;
		opacity: 1;
		margin-right: 0.8rem;
	}

	.name {
		color: #fff;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		font-size: 0.8rem;
	}

	/* Scrolled or Menu Open State */
	.header-container.scrolled .pill-button,
	.header-container.menu-open .pill-button {
		max-width: 350px;
		background: rgba(0, 0, 0, 0.75);
		border-color: rgba(255, 255, 255, 0.2);
	}

	@media (max-width: 768px) {
		.header-container {
			top: 1rem;
			right: 1rem;
		}
		
		.branding.visible {
			width: 155px;
		}

		.name {
			font-size: 0.75rem;
		}
	}
</style>
