<script>
	let words = ['back end', 'front end', 'full stack'];
	let currentWordIndex = 0;

	export let role;
	
	function swapWords() {
		currentWordIndex = (currentWordIndex + 1) % words.length;
		// console.log(words[currentWordIndex]);
	}
</script>

<div class="container">
	<span>Andrea de Candia</span>
	<div on:animationiteration={swapWords}>
		<span class="word {(words[currentWordIndex]).replace(' ', '')}" style="width: 10rem; text-align:center">{words[currentWordIndex]}</span>
		<span>Developer</span>
	</div>
	<span>{role}</span>
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		color: white;
	}

	.word {
		color: black;
	}

	.backend {
		background-color: blue;
	}

	.frontend {
		background-color: green;
	}

	.fullstack {
		background-color: yellow;
	}


	
	span {
		font-size: 20px;
		padding: 8px;
		margin: 2px 0 2px 0;
		text-transform: uppercase;
	}

	.word {
		display: inline-block;
		/* transition: background-color 0.5s; */
		animation: highlight 4s infinite;
	}

	@keyframes highlight {
		0% {
			transform: translateY(-10px);
			opacity: 0;
		}
		10% {
			transform: translateY(0px);
			opacity: 1;
		}
		90% {
			transform: translateY(0px);
			opacity: 1;
		}
		100% {
			transform: translateY(10px);
			opacity: 0;
		}
	}
</style>
