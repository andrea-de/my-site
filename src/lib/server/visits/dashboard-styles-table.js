// The Visits tab (one-line session rows grouped by day) and the Stats tab (bar lists, admin).
export const dashboardTableStyles = `
	.visit-controls { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
	.seg { display: inline-flex; padding: 3px; border: 1px solid var(--border); border-radius: 10px; background: var(--panel); }
	.seg a { display: inline-flex; align-items: center; min-height: 34px; padding: 0 12px; border-radius: 7px; color: var(--muted); font-size: 13px; font-weight: 500; }
	.seg a.active { background: var(--raised); color: var(--text); }
	.filters > summary { list-style: none; }
	.filter-form { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 8px; margin-top: 8px; }
	.filters[open] { flex-basis: 100%; display: flex; flex-direction: column; align-items: flex-end; }
	.filter-form label { display: flex; flex-direction: column; gap: 3px; font-size: 12px; color: var(--faint); }
	.filter-form input {
		min-height: 40px;
		padding: 0 10px;
		border-radius: 9px;
		border: 1px solid var(--border);
		background: var(--panel);
		color: var(--text);
		font: inherit;
		font-size: 14px;
	}
	.filter-form input[type="number"] { width: 76px; }
	.list-note { margin: 8px 2px 0; }

	.visit-list { border: 1px solid var(--border-soft); border-radius: 10px; background: var(--panel); overflow: hidden; }
	.visit + .visit { border-top: 1px solid var(--border-soft); }
	.visit[open] { background: var(--panel-alt); }
	.visit-row { display: flex; align-items: center; gap: 9px; min-height: 50px; padding: 6px 12px; }
	.v-time { flex: none; width: 40px; font-size: 13px; color: var(--muted); font-variant-numeric: tabular-nums; }
	.v-device { flex: none; display: flex; color: var(--faint); }
	.v-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
	.v-place, .v-sub { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.v-place { font-size: 14px; }
	.v-count { color: var(--faint); font-size: 12px; }
	.v-sub { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--faint); }
	.v-path { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
	.v-dur { flex: none; font-variant-numeric: tabular-nums; }
	.v-cell { display: none; }
	.type-silent { background: var(--raised); color: var(--faint); }
	.type-agent { background: var(--accent-bg); color: var(--accent-soft); }
	.type-contact { background: rgba(52, 211, 153, 0.12); color: var(--success); }
	.type-other { background: var(--raised); color: var(--muted); }
	.visit-body { padding: 4px 12px 12px; }
	.visit-body form { margin: 12px 0 0; }
	.job-badge {
		display: inline-flex;
		max-width: 100%;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--accent-soft);
		font-size: 12.5px;
	}
	.job-badge:is(a):hover { text-decoration: underline; }
	.job-badge-gone { color: var(--faint); }
	.more { display: flex; width: 100%; margin-top: 10px; }

	/* Stats */
	.breakdown-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; }
	.bars { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
	.bars li { display: flex; flex-direction: column; gap: 3px; }
	.bar-line { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; font-size: 13px; min-width: 0; }
	.bar-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #d4d4d8; }
	.bar-line strong { flex: none; font-weight: 600; font-variant-numeric: tabular-nums; }
	.bar { display: block; height: 3px; border-radius: 2px; background: var(--accent); opacity: 0.75; }
	.api-card, .danger-zone { margin-top: 14px; }
	.api-card p { margin-bottom: 10px; }
	.danger-zone { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; border-color: rgba(248, 113, 113, 0.25); }
	.danger-zone h4 { color: #fca5a5; margin-bottom: 4px; }
	.danger-zone form { margin: 0; }

	@media (min-width: 600px) {
		.breakdown-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
	}
	@media (min-width: 900px) {
		.visit-head, .visit-row {
			display: grid;
			grid-template-columns: 44px 18px minmax(0, 1fr) 160px 50px 70px 14px;
			gap: 12px;
			align-items: center;
		}
		.visit-head { padding-top: 8px; }
		.v-cell { display: block; font-size: 13px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
		.v-score { text-align: right; font-variant-numeric: tabular-nums; }
		.visit-row .type { justify-self: start; }
		.facts { grid-template-columns: repeat(4, minmax(0, 1fr)); }
		.job-columns .facts { grid-template-columns: repeat(3, minmax(0, 1fr)); }
	}
	@media (min-width: 1100px) {
		.breakdown-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
	}
`;
