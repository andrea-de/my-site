<script>
	import { onMount, onDestroy } from 'svelte';
	import { fade, fly, scale } from 'svelte/transition';

	let activeView = 'feed'; // 'feed' or 'studio'
	let interval;

	// Feed Data
	const feedData = {
		title: 'Cyber Runner AI',
		creator: '@spark_creator',
		badge: 'ADDICTIVE',
		comments: [
			{ author: '@spark_fan', text: 'This AI is actually insane! 🔥' },
			{ author: 'System', text: 'Awesome gameplay #gamespark #ai' }
		],
		stats: {
			likes: '42.5K',
			dislikes: '120',
			favorites: '8.4K',
			comments: '1.2K'
		}
	};

	// Studio Data
	let studioPhase = 0;
	let studioInterval;
	const codeSnippet = `class Player extends Entity {
  constructor() {
    super();
    this.speed = 5;
    this.jumpForce = 12;
    this.jumpCount = 0;
  }
  update(input) {
    if (input.isPressed('SPACE') 
        && this.jumpCount < 2) {
      this.jump();
      this.jumpCount++;
    }
  }
}`;

	let displayedCode = '';
	let codeIndex = 0;

	function runStudioAnimation() {
		studioPhase = 0;
		displayedCode = '';
		codeIndex = 0;

		const timers = [
			setTimeout(() => (studioPhase = 1), 800),
			setTimeout(() => (studioPhase = 2), 1800),
			setTimeout(() => (studioPhase = 3), 4500)
		];

		studioInterval = setInterval(() => {
			if (studioPhase === 3 && codeIndex < codeSnippet.length) {
				displayedCode += codeSnippet.slice(codeIndex, codeIndex + 3);
				codeIndex += 3;
			}
		}, 30);

		return () => {
			timers.forEach(clearTimeout);
			clearInterval(studioInterval);
		};
	}

	onMount(() => {
		interval = setInterval(() => {
			activeView = activeView === 'feed' ? 'studio' : 'feed';
			if (activeView === 'studio') runStudioAnimation();
		}, 10000);

		if (activeView === 'studio') runStudioAnimation();
	});

	onDestroy(() => {
		clearInterval(interval);
		clearInterval(studioInterval);
	});
</script>

<div class="demo-container">
	{#if activeView === 'feed'}
		<div class="view-wrapper" in:fade={{ duration: 800 }}>
			<video
				autoplay
				muted
				loop
				playsinline
				src="/landing/hero-gameplay.mp4"
				class="bg-video"
			/>
			
			<div class="overlay">
				<div class="left-content">
					<div class="comments">
						{#each feedData.comments as comment}
							<p class="comment">
								<span class="author">{comment.author}:</span> {comment.text}
							</p>
						{/each}
					</div>
					<div class="game-info">
						<h3>{feedData.title} <span class="badge">{feedData.badge}</span></h3>
						<div class="creator">
							<div class="avatar">GS</div>
							<span>{feedData.creator}</span>
						</div>
					</div>
				</div>

				<div class="right-sidebar">
					<div class="actions">
						<div class="actions-group">
							<div class="action"><span class="icon">❤️</span> {feedData.stats.likes}</div>
							<div class="action"><span class="icon">💬</span> {feedData.stats.comments}</div>
							<div class="action"><span class="icon">⭐</span> {feedData.stats.favorites}</div>
						</div>
						<div class="play-btn">
							<span class="icon" style="color: white; filter: brightness(0) invert(1);">🎮</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="view-wrapper studio-bg" in:fade={{ duration: 800 }}>
			<div class="studio-ui">
				<div class="studio-content">
					<div class="chat-area">
						{#if studioPhase >= 1}
							<div class="msg user" in:fly={{ y: 10, duration: 400 }}>
								Add a double jump feature to the player.
							</div>
						{/if}

						{#if studioPhase >= 2}
							<div class="msg ai" in:fly={{ y: 10, duration: 400 }}>
								<div class="steps">
									<div class="step">🔍 Listing 8 game files</div>
									<div class="step">📖 Reading Player.js</div>
									<div class="step">✍️ Writing Player.js</div>
								</div>
								{#if studioPhase >= 3}
									<p in:fade>I've analyzed the project and I'm adding double jump by tracking <code>jumpCount</code>.</p>
								{/if}
							</div>
						{/if}
					</div>

					{#if studioPhase >= 3}
						<div class="editor-area" in:fade>
							<pre><code>{displayedCode}<span class="cursor">|</span></code></pre>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.demo-container {
		width: 100%;
		height: 100%;
		background: #000;
		position: relative;
		overflow: hidden;
	}

	.view-wrapper {
		width: 100%;
		height: 100%;
		position: absolute;
		inset: 0;
	}

	/* Feed Styles */
	.bg-video {
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0.8;
		position: absolute;
		top: 0;
		left: 0;
	}

	.overlay {
		position: absolute;
		inset: 0;
		padding: 1rem;
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 40%);
		color: white;
		font-family: sans-serif;
		z-index: 10;
	}

	.left-content {
		flex: 1;
		padding-bottom: 0.5rem;
	}

	.author { font-weight: bold; }
	.comment { font-size: 0.65rem; margin: 0.15rem 0; opacity: 0.9; }
	.game-info h3 { font-size: 1rem; margin: 0.4rem 0; display: flex; align-items: center; gap: 0.4rem; }
	.badge { 
		font-size: 0.45rem; 
		background: linear-gradient(90deg, #fbbf24, #ec4899);
		padding: 0.1rem 0.35rem;
		border-radius: 1rem;
		color: black;
	}
	.creator { display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; font-weight: bold; }
	.avatar { 
		width: 1.25rem; height: 1.25rem; 
		background: linear-gradient(135deg, #6366f1, #a855f7);
		border-radius: 50%;
		display: flex; align-items: center; justify-content: center;
		font-size: 0.45rem;
	}

	.right-sidebar { 
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		padding-bottom: 0.5rem;
	}
	.actions { display: flex; flex-direction: column; gap: 0.8rem; align-items: center; }
	.actions-group { display: flex; flex-direction: column; gap: 0.8rem; }
	.action { display: flex; flex-direction: column; align-items: center; font-size: 0.55rem; font-weight: bold; }
	.icon { font-size: 1.1rem; margin-bottom: 0.15rem; }
	.play-btn {
		width: 2.2rem; height: 2rem;
		background: linear-gradient(90deg, #6366f1, #a855f7);
		border-radius: 0.7rem;
		display: flex; align-items: center; justify-content: center;
		margin-top: 0.4rem;
		box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
	}

	/* Studio Styles */
	.studio-bg { background: #09090b; display: flex; align-items: center; justify-content: center; padding: 0.75rem; }
	.studio-ui {
		width: 100%;
		height: 100%;
		background: #18181b;
		border-radius: 0.75rem;
		border: 1px solid rgba(255,255,255,0.1);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
	
	.studio-content { flex: 1; display: flex; flex-direction: column; padding: 0.75rem; gap: 0.75rem; overflow: hidden; }
	.msg { 
		padding: 0.5rem 0.7rem; 
		border-radius: 0.75rem; 
		font-size: 0.7rem; 
		max-width: 85%;
		line-height: 1.3;
	}
	.user { background: rgba(255,255,255,0.05); align-self: flex-start; border-bottom-left-radius: 0; }
	.ai { background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); align-self: flex-end; border-bottom-right-radius: 0; color: #e0e7ff; }
	
	.steps { margin-bottom: 0.4rem; opacity: 0.6; font-family: monospace; font-size: 0.6rem; }
	.step { margin-bottom: 0.15rem; }
	
	.editor-area {
		flex: 1;
		background: #09090b;
		border-radius: 0.5rem;
		padding: 0.6rem;
		font-family: monospace;
		font-size: 0.6rem;
		color: #94a3b8;
		overflow: hidden;
	}
	pre { margin: 0; white-space: pre-wrap; }
	code { color: #e2e8f0; }
	.cursor { color: #6366f1; animation: blink 1s infinite; }
	@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
</style>
