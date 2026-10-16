// Page frame, header, headline numbers, latest feed, tabs, buttons and shared bits. Phone
// first (~390px), widening at 600px and 900px. Dark like the site: black, zinc, indigo.
export const dashboardBaseStyles = `
	:root {
		color-scheme: dark;
		--bg: #000;
		--panel: #0c0c0e;
		--panel-alt: #121215;
		--raised: #18181b;
		--border: #27272a;
		--border-soft: rgba(255, 255, 255, 0.07);
		--text: #f4f4f5;
		--muted: #a1a1aa;
		--faint: #71717a;
		--accent: #6366f1;
		--accent-soft: #a5b4fc;
		--accent-bg: rgba(99, 102, 241, 0.14);
		--success: #34d399;
		--warn: #fbbf24;
		--danger: #f87171;
		--radius: 12px;
	}
	* { box-sizing: border-box; }
	html { -webkit-text-size-adjust: 100%; }
	body {
		margin: 0;
		font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
		font-size: 14px;
		line-height: 1.4;
		background: var(--bg);
		color: var(--text);
		overflow-x: hidden;
		-webkit-tap-highlight-color: transparent;
	}
	main { max-width: 1200px; margin: 0 auto; padding: 10px 16px 40px; }
	h1, h2, h3, h4 { margin: 0; font-weight: 600; letter-spacing: -0.01em; }
	h1 { font-size: 1.15rem; }
	h4 {
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--faint);
		margin-bottom: 8px;
	}
	p { margin: 0; }
	a { color: var(--text); text-decoration: none; }
	code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.85em; color: var(--accent-soft); }
	summary { cursor: pointer; list-style: none; }
	summary::-webkit-details-marker { display: none; }
	.muted { color: var(--muted); }
	.faint { color: var(--faint); }
	.small { font-size: 13px; }
	.break { overflow-wrap: anywhere; }
	.ic { width: 16px; height: 16px; flex: none; }
	.text-link { color: var(--accent-soft); overflow-wrap: anywhere; }
	.text-link:hover { text-decoration: underline; }
	.empty { color: var(--faint); padding: 18px 4px; font-size: 13px; }
	.eyebrow {
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--faint);
		margin: 18px 2px 8px;
	}

	/* Header */
	.page-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 48px; }
	.notice {
		margin-top: 8px;
		padding: 9px 12px;
		border: 1px solid rgba(99, 102, 241, 0.35);
		background: var(--accent-bg);
		color: var(--accent-soft);
		border-radius: 10px;
		font-size: 13px;
	}

	/* Buttons */
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		min-height: 40px;
		padding: 0 14px;
		border-radius: 10px;
		border: 1px solid var(--border);
		background: var(--raised);
		color: var(--text);
		font: inherit;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
	}
	.btn:hover { border-color: #3f3f46; background: #1f1f23; }
	.btn .ic { width: 15px; height: 15px; }
	.btn-sm { min-height: 40px; padding: 0 12px; font-size: 13px; }
	.btn-primary { background: var(--accent); border-color: var(--accent); color: #fff; }
	.btn-primary:hover { background: #4f46e5; border-color: #4f46e5; }
	.btn-danger { background: rgba(248, 113, 113, 0.1); border-color: rgba(248, 113, 113, 0.4); color: #fecaca; }
	.btn-danger:hover { background: rgba(248, 113, 113, 0.2); border-color: var(--danger); }
	.btn-danger-ghost { background: transparent; border-color: rgba(248, 113, 113, 0.3); color: #fca5a5; }
	.btn-danger-ghost:hover { background: rgba(248, 113, 113, 0.12); }
	.btn-icon { padding: 0 12px; }

	/* Headline numbers */
	.stat-strip, .stat-grid { display: grid; gap: 6px; }
	.stat-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 6px; }
	.stat-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
	.stat-grid-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
	.stat {
		display: flex;
		flex-direction: column;
		min-width: 0;
		padding: 7px 10px 8px;
		border: 1px solid var(--border-soft);
		border-radius: 10px;
		background: var(--panel);
	}
	.stat-label { font-size: 12px; color: var(--faint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.stat strong { font-size: 20px; font-weight: 600; line-height: 1.2; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
	.stat strong small { font-size: 14px; color: var(--faint); font-weight: 500; }
	.stat-sub { font-size: 12px; color: var(--faint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.stat-grid .stat strong { font-size: 17px; }
	.stat-accent { border-color: rgba(99, 102, 241, 0.35); background: linear-gradient(180deg, rgba(99, 102, 241, 0.12), var(--panel)); }
	.stat-accent strong { color: var(--accent-soft); }

	/* Latest activity */
	.latest { margin-top: 10px; }
	.latest .eyebrow { margin: 0 2px 4px; }
	.latest ol { list-style: none; margin: 0; padding: 0; border: 1px solid var(--border-soft); border-radius: 10px; background: var(--panel); }
	.latest li + li { border-top: 1px solid var(--border-soft); }
	.latest a { display: flex; align-items: center; gap: 10px; min-height: 46px; padding: 5px 10px; }
	.latest .ic { color: var(--accent-soft); }
	.l-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
	.l-text b, .l-text span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.l-text b { color: var(--text); font-weight: 600; font-size: 13px; }
	.l-text span { color: var(--muted); font-size: 12.5px; }
	.l-time { flex: none; font-size: 12px; color: var(--faint); font-variant-numeric: tabular-nums; }

	/* Tabs: radio inputs, labels as the bar, panels shown by the checked radio. */
	.tab-radio { position: absolute; opacity: 0; pointer-events: none; width: 1px; height: 1px; }
	.tabbar {
		position: sticky;
		top: 0;
		z-index: 5;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 4px;
		margin: 12px -16px 0;
		padding: 6px 16px;
		background: rgba(0, 0, 0, 0.92);
		backdrop-filter: blur(8px);
		border-bottom: 1px solid var(--border-soft);
	}
	.tab {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		min-height: 40px;
		border-radius: 9px;
		color: var(--muted);
		font-weight: 500;
		cursor: pointer;
		user-select: none;
	}
	.badge {
		min-width: 20px;
		padding: 1px 6px;
		border-radius: 999px;
		background: var(--raised);
		color: var(--muted);
		font-size: 12px;
		text-align: center;
		font-variant-numeric: tabular-nums;
	}
	#tab-jobs:checked ~ .tabbar .tab-jobs,
	#tab-visits:checked ~ .tabbar .tab-visits,
	#tab-stats:checked ~ .tabbar .tab-stats { background: var(--accent-bg); color: var(--text); box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.4); }
	#tab-jobs:checked ~ .tabbar .tab-jobs .badge,
	#tab-visits:checked ~ .tabbar .tab-visits .badge,
	#tab-stats:checked ~ .tabbar .tab-stats .badge { background: var(--accent); color: #fff; }
	#tab-jobs:focus-visible ~ .tabbar .tab-jobs,
	#tab-visits:focus-visible ~ .tabbar .tab-visits,
	#tab-stats:focus-visible ~ .tabbar .tab-stats { outline: 2px solid var(--accent-soft); outline-offset: 1px; }
	.tab-panel { display: none; padding-top: 6px; }
	#tab-jobs:checked ~ .panel-jobs,
	#tab-visits:checked ~ .panel-visits,
	#tab-stats:checked ~ .panel-stats { display: block; }

	/* Lists: group headers, rows, chevrons */
	.group-head {
		display: flex;
		align-items: center;
		gap: 8px;
		margin: 14px 2px 6px;
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--faint);
	}
	.group-head span:not(.chev) { color: var(--muted); font-weight: 500; letter-spacing: 0; }
	.list-head { display: none; }
	.chev {
		width: 8px;
		height: 8px;
		flex: none;
		border-right: 1.6px solid var(--faint);
		border-bottom: 1.6px solid var(--faint);
		margin-top: -4px;
		transform: rotate(45deg);
		transition: transform 0.15s;
	}
	details[open] > summary > .chev { margin-top: 4px; transform: rotate(225deg); }
	.foot-note { margin-top: 14px; font-size: 12px; color: var(--faint); }

	/* Cards, definition grids, folds */
	.card { padding: 12px; border: 1px solid var(--border-soft); border-radius: var(--radius); background: var(--panel); }
	.facts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 12px; margin: 0; }
	.facts > div { min-width: 0; }
	.facts .wide { grid-column: 1 / -1; }
	.facts dt { font-size: 12px; color: var(--faint); }
	.facts dd { margin: 1px 0 0; font-size: 13px; overflow-wrap: anywhere; }
	.fold { margin-top: 10px; border-top: 1px solid var(--border-soft); }
	.fold > summary { display: flex; align-items: center; gap: 6px; min-height: 40px; font-size: 13px; color: var(--accent-soft); }
	.fold > summary::before { content: "+"; width: 14px; color: var(--faint); }
	.fold[open] > summary::before { content: "−"; }
	.prose { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 13px; color: #d4d4d8; }
	.fold > .prose { max-height: 50vh; overflow: auto; padding: 8px 10px; border-radius: 8px; background: var(--panel-alt); }

	/* Pills and chips */
	.pill, .type {
		display: inline-flex;
		align-items: center;
		padding: 1px 8px;
		border-radius: 999px;
		font-size: 12px;
		font-weight: 500;
		line-height: 18px;
		white-space: nowrap;
		border: 1px solid transparent;
	}
	.pill-live { background: rgba(52, 211, 153, 0.12); color: var(--success); border-color: rgba(52, 211, 153, 0.3); }
	.pill-active { background: var(--accent-bg); color: var(--accent-soft); }
	.pill-unopened { background: var(--raised); color: var(--muted); }
	.pill-applied { background: rgba(250, 204, 21, 0.12); color: #facc15; border-color: rgba(250, 204, 21, 0.3); margin-right: 4px; }
	.pill-closed { background: transparent; color: var(--faint); border-color: var(--border); }
	.chips { display: inline-flex; flex-wrap: wrap; gap: 4px; }
	.chip { padding: 0 7px; border-radius: 6px; background: var(--raised); color: var(--muted); font-size: 12px; line-height: 20px; white-space: nowrap; }
	.chip-resume_open { color: var(--success); }
	.chip-chat_question, .chip-chat_open { color: var(--accent-soft); }

	@media (min-width: 600px) {
		main { padding: 16px 24px 48px; }
		.stat-strip { grid-template-columns: repeat(4, minmax(0, 1fr)); }
		.stat-grid { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); }
		.stat-grid-4 { grid-template-columns: repeat(4, minmax(0, 180px)); }
		.tabbar { margin: 14px -24px 0; padding: 8px 24px; grid-template-columns: repeat(3, minmax(0, 160px)); }
		.facts { grid-template-columns: repeat(3, minmax(0, 1fr)); }
	}
	@media (min-width: 900px) {
		h1 { font-size: 1.35rem; }
		.stat strong { font-size: 24px; }
		.list-head {
			display: grid;
			padding: 0 12px 6px;
			font-size: 12px;
			text-transform: uppercase;
			letter-spacing: 0.06em;
			color: var(--faint);
		}
	}
`;
