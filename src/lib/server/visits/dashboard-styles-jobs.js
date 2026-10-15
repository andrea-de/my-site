// The Jobs tab: two-line rows that expand into actions, facts and a one-line-per-event timeline.
// From 900px the row spreads into columns (region, previews, engagement).
export const dashboardJobStyles = `
	.job-list { display: flex; flex-direction: column; gap: 6px; }
	.job { border: 1px solid var(--border-soft); border-radius: 10px; background: var(--panel); }
	.job[open] { border-color: var(--border); background: var(--panel-alt); }
	.job.is-recent { border-left: 2px solid var(--success); }
	.job.is-closed .j-title, .job.is-closed .j-role { opacity: 0.6; }
	.job-row { display: flex; align-items: center; gap: 10px; min-height: 56px; padding: 8px 12px; }
	.j-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
	.j-title, .j-role { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.j-title { font-size: 14px; }
	.j-title strong { font-weight: 600; }
	.j-code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--accent-soft); font-size: 13px; }
	.j-sep { color: var(--faint); margin: 0 5px; }
	.j-role { font-size: 13px; color: var(--muted); }
	.j-side { flex: none; display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }
	.j-last { font-size: 12px; color: var(--muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
	.j-cell { display: none; }

	.job-body { padding: 2px 12px 12px; border-top: 1px solid var(--border-soft); }
	.job-actions { display: flex; flex-wrap: wrap; gap: 6px; padding: 10px 0; }
	.job-actions form { margin: 0; }
	.job-columns { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; }
	.timeline-wrap h4 { margin: 4px 0 4px; }
	.job-info { border-top: 1px solid var(--border-soft); padding-top: 12px; }
	.timeline { list-style: none; margin: 0; padding: 0; }
	.tl { display: flex; align-items: center; gap: 8px; min-height: 32px; padding: 4px 0; border-bottom: 1px solid var(--border-soft); font-size: 13px; }
	.tl:last-child { border-bottom: 0; }
	.tl .ic { width: 15px; height: 15px; color: var(--faint); }
	.tl-visit .ic { color: var(--success); }
	.tl-preview .ic { color: var(--warn); }
	.tl-resume_open .ic, .tl-project_open .ic { color: var(--accent-soft); }
	.tl-chat_open .ic, .tl-chat_question .ic { color: #c4b5fd; }
	.tl-text { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #d4d4d8; }
	.tl-time { flex: none; font-size: 12px; color: var(--faint); font-variant-numeric: tabular-nums; }
	.timeline-wrap .fold { margin-top: 0; }

	.group-fold { margin-top: 4px; }
	.group-fold > summary.group-head { min-height: 40px; margin-bottom: 0; }
	.group-fold > summary .chev { margin-left: 4px; }

	@media (min-width: 900px) {
		.job-head, .job-row {
			display: grid;
			grid-template-columns: minmax(0, 1fr) 56px 90px minmax(0, 220px) 170px 14px;
			gap: 14px;
			align-items: center;
		}
		.j-cell { display: block; font-size: 13px; color: var(--muted); min-width: 0; }
		.j-side { flex-direction: row; align-items: center; justify-content: flex-end; gap: 8px; }
		.job-columns { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 24px; }
		.job-columns .timeline-wrap { order: 2; }
		.job-body { padding: 4px 16px 16px; }
		.job-info { border-top: 0; padding-top: 4px; }
	}
`;
