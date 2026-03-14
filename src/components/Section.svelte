<script>
	export let title = '';
	export let id = '';
</script>

<section {id} class="section" class:snap={id === 'software'}>
	<div class="container">
		{#if title}
			<h2 class="section-title">{title}</h2>
		{/if}
		<slot />
	</div>
</section>

<style>
	.section {
		padding: 6rem 2rem;
		width: 100%;
		box-sizing: border-box;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		display: flex;
		justify-content: center;
		overflow: hidden;
	}

	.container {
		max-width: 1000px;
		width: 100%;
	}

	.section-title {
		font-size: 2.5rem;
		margin-bottom: 3rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #fff;
		border-left: 4px solid #fff;
		padding-left: 1rem;
	}

	@media (max-width: 768px) {
		.section {
			padding: 4rem 1.5rem;
		}
		
		.section-title {
			font-size: 1.8rem;
			margin-bottom: 2rem;
		}
	}

	.snap {
		scroll-snap-align: start !important;
	}
</style>
