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
	.toggle { display: inline-flex; align-items: center; gap: 6px; }
	.toggle .knob { position: relative; width: 26px; height: 14px; border-radius: 999px; background: var(--raised); border: 1px solid var(--border); transition: background 0.15s; }
	.toggle .knob::after { content: ''; position: absolute; top: 1px; left: 1px; width: 10px; height: 10px; border-radius: 50%; background: var(--muted); transition: transform 0.15s; }
	.toggle.is-on .knob { background: rgba(52, 211, 153, 0.35); border-color: rgba(52, 211, 153, 0.5); }
	.toggle.is-on .knob::after { transform: translateX(12px); background: var(--success); }
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

	/* Row extras: route tags, stage pill, what needs Andrea */
	.j-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
	.rtag { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; padding: 1px 6px; border-radius: 5px; white-space: nowrap; color: #d4d4d8; background: var(--raised); }
	.rtag-agent-apply { color: #6ee7b7; background: rgba(52, 211, 153, 0.12); }
	.rtag-manual-apply { color: #fcd34d; background: rgba(251, 191, 36, 0.12); }
	.rtag-email-apply { color: var(--accent-soft); background: var(--accent-bg); }
	.rtag-email-outreach { color: #d8b4fe; background: rgba(192, 132, 252, 0.13); }
	.j-needs { display: flex; gap: 6px; align-items: baseline; margin-top: 3px; font-size: 12px; color: var(--danger); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.j-needs::before { content: ''; flex: none; width: 6px; height: 6px; border-radius: 50%; background: var(--danger); transform: translateY(-1px); }
	.stage { border: 1px solid var(--border); background: transparent; color: var(--text); }
	.stage-sent, .stage-replied { color: var(--accent-soft); border-color: rgba(165, 180, 252, 0.4); }
	.stage-interviewing, .stage-offer { color: var(--success); border-color: rgba(52, 211, 153, 0.45); }
	.stage-rejected, .stage-no-reply { color: var(--faint); }

	/* Sheet body extras */
	.needs h4 { margin: 10px 0 6px; }
	.needs-box { display: flex; gap: 10px; align-items: flex-start; justify-content: space-between; padding: 10px 12px; border-radius: 10px; background: rgba(248, 113, 113, 0.1); border: 1px solid rgba(248, 113, 113, 0.35); color: #fecaca; }
	.needs-box p { margin: 0; }
	.needs-box form { margin: 0; flex: none; }
	.job-plan { display: grid; gap: 12px; padding-bottom: 12px; }
	.stage-form { margin: 0; display: flex; gap: 8px; align-items: flex-end; }
	.stage-form label { display: grid; gap: 6px; }
	.stage-form .h4 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); font-weight: 600; }
	.stage-form select, .job-filters select, .job-filters input { font: inherit; color: var(--text); background: var(--raised); border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; min-width: 0; }
	.routes-wrap h4 { margin: 0 0 6px; }
	.routes { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
	.route { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 8px; align-items: center; padding: 7px 9px; border: 1px solid var(--border); border-radius: 8px; font-size: 13px; }
	.route.is-used { border-color: var(--accent); }
	.route-where { min-width: 0; overflow-wrap: anywhere; color: var(--muted); }
	.route-used { font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--accent-soft); }
	.fit-points { margin: 8px 0 0; padding-left: 18px; display: grid; gap: 4px; color: #d4d4d8; }
	.j-source { margin: 12px 0 0; font-size: 0.8rem; color: #71717a; }

	/* The sheet: bottom sheet on phones, centred panel from 700px */
	html.sheet-open, html.sheet-open body { overflow: hidden; overscroll-behavior: none; }
	.job-sheet { padding: 0; border: 1px solid var(--border); background: var(--panel-alt); color: var(--text); width: 100%; max-width: 100%; max-height: 92dvh; margin: auto 0 0; border-radius: 16px 16px 0 0; overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; padding-bottom: env(safe-area-inset-bottom, 0px); }
	.job-sheet::backdrop { background: rgba(0, 0, 0, 0.6); }
	.sheet-head { position: sticky; top: 0; z-index: 1; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; align-items: start; padding: 14px 14px 10px; background: var(--panel-alt); border-bottom: 1px solid var(--border-soft); }
	.sheet-grab { grid-column: 1 / -1; justify-self: center; width: 36px; height: 4px; border-radius: 2px; background: var(--border); margin-top: -4px; }
	.sheet-title { display: grid; gap: 2px; min-width: 0; }
	.sheet-title .j-title, .sheet-title .j-role { white-space: normal; }
	.sheet-close { font: inherit; font-size: 20px; line-height: 1; width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--border); background: var(--raised); color: var(--text); cursor: pointer; }
	.job-sheet .job-body { border-top: 0; padding: 4px 14px 18px; }
	@media (min-width: 700px) {
		.job-sheet { width: min(760px, calc(100% - 48px)); margin: auto; border-radius: 14px; max-height: 88dvh; }
		.sheet-grab { display: none; }
	}

	/* Filters */
	.job-filters { display: grid; gap: 10px; margin: 4px 0 14px; padding: 12px; border: 1px solid var(--border-soft); border-radius: 12px; background: var(--panel); }
	.job-filters[hidden] { display: none; }
	.jf-chips { display: flex; flex-wrap: wrap; gap: 6px; }
	.jf-chip { font: inherit; font-size: 12.5px; display: inline-flex; gap: 6px; align-items: center; padding: 5px 11px; border-radius: 999px; border: 1px solid var(--border); background: var(--raised); color: var(--text); cursor: pointer; }
	.jf-chip .n { font-size: 11.5px; color: var(--faint); font-variant-numeric: tabular-nums; }
	.jf-chip[aria-pressed="true"] { background: var(--accent); border-color: var(--accent); color: #fff; }
	.jf-chip[aria-pressed="true"] .n { color: #e0e7ff; }
	.jf-tag { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px; }
	.jf-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
	.jf-count { display: flex; justify-content: space-between; align-items: baseline; font-size: 12.5px; color: var(--muted); }
	.jf-clear { font: inherit; font-size: 12.5px; background: none; border: 0; color: var(--accent-soft); cursor: pointer; padding: 0; }
	.jf-clear[hidden] { display: none; }
	details.job[hidden], .group-fold[hidden], .group-head[hidden], .job-none[hidden] { display: none; }
`;
