<script>
	export let role;
	$: x = role === undefined ? '' : role.split(' ')[0];
</script>

<svg class="arrows">
	<path class="a1 {x}" d="M0 0 L30 32 L60 0"></path>
	<path class="a2 {x}" d="M0 20 L30 52 L60 20"></path>
	<path class="a3 {x}" d="M0 40 L30 72 L60 40"></path>
</svg>

<style>
	.arrows {
		width: 60px;
		height: 72px;
		bottom: 0%;
		bottom: 100px;
	}

	.arrows path {
		stroke: #2994d1;
		fill: transparent;
		stroke-width: 5px;
		animation: arrow 1s infinite;
		-webkit-animation: arrow 2s infinite;
	}
    
    path.full:nth-of-type(1), path.full:nth-of-type(3) {
		stroke: coral;
	}
	
    path.full:nth-of-type(2) {
		stroke: teal;
    }

    path.web:nth-of-type(1), path.web:nth-of-type(3) {
		stroke: goldenrod;
	}
	
    path.web:nth-of-type(2) {
		stroke: navy;
    }

    path.application:nth-of-type(1), path.application:nth-of-type(3) {
		stroke: aqua;
	}
	
    path.application:nth-of-type(2) {
		stroke: orangered;
    }

    path.game:nth-of-type(1), path.game:nth-of-type(3) {
		stroke: forestgreen;
	}
	
    path.game:nth-of-type(2) {
		stroke: purple;
    }

    path.ai:nth-of-type(1), path.ai:nth-of-type(3) {
		stroke: dodgerblue;
	}
	
    path.ai:nth-of-type(2) {
		stroke: darkolivegreen;
    }

    path.aspiring:nth-of-type(1), path.aspiring:nth-of-type(3) {
		stroke: skyblue;
	}
	
    path.aspiring:nth-of-type(2) {
		stroke: magenta;
    }

	@keyframes arrow {
		0% {
			opacity: 0;
		}
		40% {
			opacity: 1;
		}
		80% {
			opacity: 0;
		}
		100% {
			opacity: 0;
		}
	}

	@-webkit-keyframes arrow {
		0% {
			opacity: 0;
		}
		40% {
			opacity: 1;
		}
		80% {
			opacity: 0;
		}
		100% {
			opacity: 0;
		}
	}

	.arrows path.a1 {
		animation-delay: -1s;
		-webkit-animation-delay: -1s;
	}

	.arrows path.a2 {
		animation-delay: -0.5s;
		-webkit-animation-delay: -0.5s;
	}

	.arrows path.a3 {
		animation-delay: 0s;
		-webkit-animation-delay: 0s;
	}
</style>
