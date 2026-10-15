// Page frame, cards, buttons and panels. Dark like the site: black, zinc greys, indigo accent.
export const dashboardBaseStyles = `
	:root {
		color-scheme: dark;
		--bg: #000;
		--panel: #0c0c0e;
		--panel-alt: #121215;
		--raised: #18181b;
		--border: #27272a;
		--border-soft: rgba(255, 255, 255, 0.06);
		--text: #f4f4f5;
		--muted: #a1a1aa;
		--faint: #71717a;
		--accent: #6366f1;
		--accent-soft: #a5b4fc;
		--accent-bg: rgba(99, 102, 241, 0.12);
		--success: #34d399;
		--warn: #fbbf24;
		--danger: #f87171;
		--radius: 12px;
	}
	* {
		box-sizing: border-box;
	}
	html {
		-webkit-text-size-adjust: 100%;
	}
	body {
		margin: 0;
		font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
		font-size: 15px;
		line-height: 1.45;
		background: var(--bg);
		color: var(--text);
		overflow-x: hidden;
	}
	main {
		max-width: 1400px;
		margin: 0 auto;
		padding: 28px 24px 48px;
	}
	h1,
	h2,
	h3,
	h4 {
		margin: 0;
		font-weight: 600;
		letter-spacing: -0.01em;
	}
	h1 {
		font-size: 1.6rem;
	}
	h2 {
		font-size: 1.2rem;
	}
	h3 {
		font-size: 0.95rem;
	}
	h4 {
		font-size: 0.78rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--faint);
		margin-bottom: 10px;
	}
	p {
		margin: 0;
	}
	a {
		color: var(--text);
		text-decoration: none;
	}
	code {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 0.85em;
		color: var(--accent-soft);
	}
	.muted {
		color: var(--muted);
	}
	.small {
		font-size: 0.82rem;
	}
	.text-link {
		color: var(--accent-soft);
		text-decoration: underline;
		text-decoration-color: rgba(165, 180, 252, 0.4);
		text-underline-offset: 2px;
		overflow-wrap: anywhere;
	}
	.page-head {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 12px 16px;
		flex-wrap: wrap;
		margin-bottom: 24px;
		padding-bottom: 18px;
		border-bottom: 1px solid var(--border);
	}
	.page-head p {
		margin-top: 4px;
		font-size: 0.85rem;
	}
	.actions,
	.view-toggle,
	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;
	}
	.btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-height: 36px;
		padding: 7px 14px;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--raised);
		color: var(--text);
		font: inherit;
		font-size: 0.88rem;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
		transition: border-color 140ms ease, background 140ms ease;
	}
	.btn:hover {
		border-color: #3f3f46;
		background: #1f1f23;
	}
	.btn-primary {
		background: var(--accent);
		border-color: var(--accent);
		color: #fff;
	}
	.btn-primary:hover {
		background: #4f46e5;
		border-color: #4f46e5;
	}
	.btn-danger {
		color: var(--danger);
	}
	.btn-danger:hover {
		border-color: rgba(248, 113, 113, 0.45);
		background: rgba(248, 113, 113, 0.08);
	}
	.toggle-link {
		padding: 6px 12px;
		border: 1px solid var(--border);
		border-radius: 999px;
		color: var(--muted);
		font-size: 0.85rem;
	}
	.toggle-link.active {
		color: var(--text);
		border-color: var(--accent);
		background: var(--accent-bg);
	}
	form {
		margin: 0;
	}
	.filter-form {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;
	}
	.filter-form label {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.8rem;
		color: var(--faint);
	}
	.filter-form input {
		min-height: 36px;
		padding: 6px 8px;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--panel-alt);
		color: var(--text);
		font: inherit;
		font-size: 0.85rem;
	}
	.filter-form input[type="number"] {
		width: 4.2rem;
	}
	.notice {
		margin-bottom: 16px;
		padding: 12px 14px;
		border: 1px solid rgba(99, 102, 241, 0.4);
		border-radius: var(--radius);
		background: var(--accent-bg);
		color: var(--accent-soft);
	}
	.section {
		margin-bottom: 40px;
		scroll-margin-top: 16px;
	}
	.section-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 4px 16px;
		margin-bottom: 14px;
	}
	.section-head p {
		color: var(--faint);
		font-size: 0.82rem;
	}
	.panel,
	.stat {
		background: var(--panel);
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}
	.panel {
		padding: 16px;
		margin-bottom: 14px;
		min-width: 0;
	}
	.panel-head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		flex-wrap: wrap;
		gap: 12px;
		margin-bottom: 14px;
	}
	.panel-head p {
		margin-top: 2px;
	}
	.stat-grid,
	.breakdown-grid {
		display: grid;
		gap: 10px;
		margin-bottom: 14px;
	}
	.stat-grid {
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
	}
	.stat-grid-4 {
		grid-template-columns: repeat(4, minmax(0, 1fr));
	}
	.breakdown-grid {
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
	}
	.breakdown-grid .panel {
		margin-bottom: 0;
	}
	.stat {
		padding: 12px 14px;
		min-width: 0;
	}
	.stat span {
		display: block;
		color: var(--muted);
		font-size: 0.78rem;
	}
	.stat strong {
		display: block;
		margin-top: 4px;
		font-size: 1.5rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.02em;
	}
	.stat-accent {
		border-color: rgba(99, 102, 241, 0.45);
		background: linear-gradient(180deg, rgba(99, 102, 241, 0.12), rgba(99, 102, 241, 0.03));
	}
	.stat-accent strong {
		color: var(--accent-soft);
	}
	.breakdown-list {
		list-style: none;
		padding: 0;
		margin: 10px 0 0;
	}
	.breakdown-list li {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 7px 0;
		border-top: 1px solid var(--border-soft);
		font-size: 0.88rem;
		color: var(--muted);
	}
	.breakdown-list li:first-child {
		border-top: 0;
	}
	.breakdown-list li > span:not(.job-badge) {
		flex: 1 1 auto;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.breakdown-list li strong {
		flex: 0 0 auto;
		margin-left: auto;
		color: var(--text);
		font-variant-numeric: tabular-nums;
	}
	.breakdown-list .empty,
	.empty {
		color: var(--faint);
	}
	p.empty {
		padding: 20px 16px;
		border: 1px dashed var(--border);
		border-radius: var(--radius);
		text-align: center;
	}
	.page-foot {
		margin-top: 8px;
		padding-top: 18px;
		border-top: 1px solid var(--border);
	}
	.danger-zone {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 12px;
		border-color: rgba(248, 113, 113, 0.25);
	}
	.danger-zone p {
		margin-top: 2px;
	}
	.page-foot > p {
		line-height: 1.6;
	}
	@media (max-width: 720px) {
		main {
			padding: 18px 16px 40px;
		}
		h1 {
			font-size: 1.35rem;
		}
		.page-head {
			align-items: flex-start;
		}
		.stat-grid,
		.stat-grid-4 {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 8px;
		}
		/* The nine visit totals fit three across; the four job-link ones stay two. */
		.stat-grid:not(.stat-grid-4) {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
		.stat {
			padding: 10px 12px;
		}
		.stat strong {
			font-size: 1.3rem;
			overflow-wrap: anywhere;
		}
		.stat-grid:not(.stat-grid-4) .stat strong {
			font-size: 1.1rem;
		}
		.stat-grid:not(.stat-grid-4) .stat span {
			font-size: 0.72rem;
		}
		.panel {
			padding: 14px 12px;
		}
		.panel-head,
		.controls {
			width: 100%;
		}
		.filter-form input[type="date"] {
			flex: 1 1 auto;
			min-width: 0;
		}
		.filter-form label:first-of-type {
			flex: 1 1 10rem;
		}
	}
`;
