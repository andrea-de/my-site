<script>
	export let role;
	$: x = role === undefined ? '' : role.split(' ')[0];
</script>

<div>
	{#if x === 'full'}
		<span class="word {role}">{role}</span>
	{:else if x === 'web'}
		<span class="word {role}">{role}</span>
	{:else if x === 'application'}
		<span class="word {role}">{role}</span>
	{:else if x === 'ai'}
		<span class="word {role}">{role}</span>
	{:else if x === 'game'}
		<span class="word {role}">{role}</span>
	{:else if x === 'aspiring'}
		<span class="word {role}">{role}</span>
	{/if}
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100dvw;
		top: 20%;
	}

	span {
		font-size: 2rem;
		padding: 5px;
		margin: 2px 0 2px 0;
		text-transform: uppercase;
	}

	.word {
		font-size: 1.5rem;
		display: inline-block;
		color: black;
		animation: Swipe 3.5s ease-in;
		animation-delay: 0.1s;
		opacity: 0;
	}

	@keyframes Swipe {
		0% {
			opacity: 0;
			transform: translate3d(-100px, -100px, -500px);
			border-radius: 50px;
		}
		3% {
			opacity: 0;
		}
		10% {
			opacity: 1;
			transform: translate3d(0, 0, 0);
			border-radius: 5px;
		}
		95% {
			transform: translate3d(0, 0, 0);
			opacity: 1;
			transform: translateY(0px);
			border-radius: 5px;
		}
		98% {
			opacity: 0;
		}
		100% {
			border-radius: 50px;
			opacity: 0;
			transform: translate3d(100px, 100px, 100px);
		}
	}

	.full {
		background-color: coral;
	}

	.web {
		background-color: goldenrod;
	}

	.application {
		background-color: aqua;
	}

	.ai {
		background-color: dodgerblue;
	}

	.game {
		background-color: forestgreen;
	}

	.aspiring {
		background-color: skyblue;
	}

	
</style>
