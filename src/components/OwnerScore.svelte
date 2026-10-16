<script>
	// Owner mode only: this visit's engagement score, live, as the dashboard would record it.
	// Tap it for the breakdown. Visitors never see it; owner visits aren't stored.
	import { liveVisit } from '$lib/stores/visit';
	import { engagementParts, ENGAGEMENT_MAX } from '$lib/visit-score';

	let open = false;

	$: parts = $liveVisit ? engagementParts($liveVisit) : [];
	$: score = parts.reduce((sum, p) => sum + p.points, 0);
	$: seconds = $liveVisit ? Math.floor($liveVisit.durationMs / 1000) : 0;
	$: level = score >= 4 ? 'high' : score >= 1 ? 'some' : 'none';
</script>

<div
	class="owner-score {level}"
	class:open
	title="Owner mode: your visits aren't counted (undo at /admin)"
>
	<button
		type="button"
		on:click={() => (open = !open)}
		aria-expanded={open}
		aria-label={`Visit score ${score} of ${ENGAGEMENT_MAX}`}
	>
		<span class="num">{score}</span><span class="of">/{ENGAGEMENT_MAX}</span>
	</button>
	{#if open}
		<div class="panel">
			<div class="meta">
				{seconds}s · scroll {$liveVisit?.maxScrollPercent ?? 0}% · {$liveVisit?.sectionsViewed
					?.length ?? 0} sections
			</div>
			<ul>
				{#each parts as p}
					<li class:got={p.points > 0}><span>{p.label}</span><b>{p.points}/{p.max}</b></li>
				{/each}
			</ul>
			<div class="note">4+ counts as high intent. Not recorded: owner mode.</div>
		</div>
	{/if}
</div>

<style>
	.owner-score {
		position: fixed;
		top: 10px;
		left: 12px;
		z-index: 2147483000;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		color: #fff;
	}

	button {
		all: unset;
		cursor: pointer;
		display: inline-flex;
		align-items: baseline;
		gap: 2px;
		padding: 4px 10px;
		border-radius: 12px;
		background: rgba(10, 10, 20, 0.55);
		border: 1px solid rgba(255, 255, 255, 0.12);
		backdrop-filter: blur(6px);
		opacity: 0.75;
		transition: opacity 0.2s;
	}

	button:hover,
	.open button {
		opacity: 1;
	}

	.num {
		font-size: 44px;
		font-weight: 800;
		line-height: 1;
		transition: color 0.3s;
	}

	.of {
		font-size: 14px;
		opacity: 0.55;
	}

	.none .num {
		color: #94a3b8;
	}

	.some .num {
		color: #facc15;
	}

	.high .num {
		color: #34d399;
	}

	.panel {
		margin-top: 6px;
		width: 240px;
		padding: 10px 12px;
		border-radius: 12px;
		background: rgba(10, 10, 20, 0.92);
		border: 1px solid rgba(255, 255, 255, 0.12);
		font-size: 12px;
		text-align: left;
	}

	.meta,
	.note {
		color: rgba(255, 255, 255, 0.55);
	}

	ul {
		list-style: none;
		margin: 8px 0;
		padding: 0;
	}

	li {
		display: flex;
		justify-content: space-between;
		padding: 2px 0;
		color: rgba(255, 255, 255, 0.45);
	}

	li.got {
		color: #fff;
	}

	/* Phones: under the floating header rather than beside it. */
	@media (max-width: 600px) {
		.owner-score {
			top: 74px;
			left: 8px;
		}

		.num {
			font-size: 34px;
		}
	}
</style>
