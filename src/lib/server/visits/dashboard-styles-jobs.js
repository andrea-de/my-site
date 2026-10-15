// The Job links list: a grid of <details> rows on wide screens, stacked cards below 1000px.
export const dashboardJobStyles = `
	.job-list {
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--panel);
		overflow: hidden;
	}
	.job-head,
	.job-row {
		display: grid;
		grid-template-columns:
			3.2rem minmax(11rem, 1.6fr) 6rem 3.4rem 5.2rem 4.6rem 4.4rem 5.8rem minmax(9rem, 1.4fr)
			1rem;
		gap: 12px;
		align-items: center;
		padding: 10px 16px;
	}
	.job-head {
		padding-top: 9px;
		padding-bottom: 9px;
		background: var(--raised);
		font-size: 0.72rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--faint);
	}
	.job {
		border-top: 1px solid var(--border-soft);
		border-left: 3px solid transparent;
		scroll-margin-top: 16px;
	}
	.job.is-opened {
		border-left-color: rgba(165, 180, 252, 0.35);
	}
	.job.is-recent {
		border-left-color: var(--accent);
		background: linear-gradient(90deg, rgba(99, 102, 241, 0.09), transparent 45%);
	}
	.job.is-closed {
		border-left-color: transparent;
	}
	.job.is-closed .job-row {
		opacity: 0.55;
	}
	.job.is-unopened .c-job strong {
		color: var(--muted);
	}
	.job[open] {
		background: var(--panel-alt);
	}
	.job-row {
		cursor: pointer;
		list-style: none;
		padding-left: 13px;
	}
	.job-row::-webkit-details-marker {
		display: none;
	}
	.job-row:hover {
		background: rgba(255, 255, 255, 0.025);
	}
	.job-row:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: -2px;
	}
	.c-code a {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-weight: 600;
		color: var(--accent-soft);
		text-decoration: underline;
		text-decoration-color: rgba(165, 180, 252, 0.35);
		text-underline-offset: 3px;
	}
	.c-job {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.c-job strong,
	.c-job span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.c-job strong {
		font-weight: 600;
	}
	.c-job span {
		color: var(--muted);
		font-size: 0.84rem;
	}
	.c-cell {
		min-width: 0;
		font-size: 0.86rem;
		color: #d4d4d8;
		font-variant-numeric: tabular-nums;
	}
	.c-cell b {
		font-weight: 600;
		color: var(--text);
	}
	.job.is-unopened .c-visits b {
		color: var(--faint);
	}
	.c-cell small {
		display: block;
		color: var(--accent-soft);
		font-size: 0.72rem;
	}
	.m-label {
		display: none;
	}
	.c-chev::after {
		content: '';
		display: block;
		width: 7px;
		height: 7px;
		border-right: 1.5px solid var(--faint);
		border-bottom: 1.5px solid var(--faint);
		transform: rotate(45deg);
		transition: transform 140ms ease;
	}
	.job[open] .c-chev::after {
		transform: rotate(225deg);
	}
	.pill {
		display: inline-block;
		padding: 2px 9px;
		border-radius: 999px;
		font-size: 0.74rem;
		font-weight: 500;
		white-space: nowrap;
		border: 1px solid var(--border);
		color: var(--muted);
	}
	.pill-live {
		color: #fff;
		background: var(--accent);
		border-color: var(--accent);
	}
	.pill-active {
		color: var(--accent-soft);
		border-color: rgba(99, 102, 241, 0.5);
	}
	.pill-unopened {
		color: var(--faint);
		border-style: dashed;
	}
	.pill-closed {
		color: var(--faint);
		background: var(--raised);
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}
	.chip {
		padding: 1px 7px;
		border-radius: 6px;
		background: var(--raised);
		border: 1px solid var(--border);
		color: #d4d4d8;
		font-size: 0.74rem;
		white-space: nowrap;
	}
	.chip-chat_question,
	.chip-resume_open {
		color: var(--accent-soft);
		border-color: rgba(99, 102, 241, 0.4);
	}
	.job-body {
		padding: 4px 16px 18px 16px;
		border-top: 1px solid var(--border-soft);
	}
	.job-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		padding: 12px 0 14px;
	}
	.job-columns {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: 20px 28px;
	}
	.fields {
		margin: 0;
		display: grid;
		gap: 12px;
		align-content: start;
	}
	.field dt {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--faint);
		margin-bottom: 2px;
	}
	.field dd {
		margin: 0;
		font-size: 0.9rem;
		min-width: 0;
	}
	.prose {
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
	.project-list {
		margin: 0;
		padding-left: 1.2rem;
	}
	.description summary {
		cursor: pointer;
		color: var(--accent-soft);
		font-size: 0.88rem;
	}
	.description .prose {
		margin-top: 8px;
		max-height: 22rem;
		overflow-y: auto;
		padding: 10px 12px;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--bg);
		font-size: 0.84rem;
		color: #d4d4d8;
	}
	.timeline {
		list-style: none;
		margin: 0;
		padding: 0;
		max-height: 28rem;
		overflow-y: auto;
	}
	.tl-item {
		display: grid;
		grid-template-columns: 5.4rem minmax(0, 1fr) auto;
		gap: 10px;
		align-items: baseline;
		padding: 7px 0;
		border-top: 1px solid var(--border-soft);
		font-size: 0.86rem;
	}
	.tl-item:first-child {
		border-top: 0;
	}
	.tl-kind {
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--muted);
	}
	.tl-visit .tl-kind {
		color: var(--accent-soft);
	}
	.tl-preview .tl-kind,
	.tl-preview .tl-text {
		color: var(--faint);
	}
	.tl-text {
		overflow-wrap: anywhere;
	}
	.tl-time {
		color: var(--muted);
		font-size: 0.78rem;
		text-align: right;
		white-space: nowrap;
	}
	.tl-abs {
		display: block;
		color: var(--faint);
		font-size: 0.7rem;
		font-variant-numeric: tabular-nums;
	}

	@media (max-width: 999px) {
		.job-head {
			display: none;
		}
		.job-row {
			grid-template-columns: repeat(6, minmax(0, 1fr));
			gap: 10px 8px;
			padding: 12px 12px 12px 11px;
		}
		.c-code {
			grid-column: 1;
			grid-row: 1;
			align-self: start;
			padding-top: 1px;
		}
		.c-job {
			grid-column: 2 / 5;
			grid-row: 1;
		}
		.c-status {
			grid-column: 5 / 7;
			grid-row: 1;
			justify-self: end;
			align-self: start;
		}
		.c-visits { grid-column: 1 / 3; grid-row: 2; }
		.c-previews { grid-column: 3 / 5; grid-row: 2; }
		.c-last { grid-column: 5 / 7; grid-row: 2; }
		.c-region { grid-column: 1 / 3; grid-row: 3; }
		.c-created { grid-column: 3 / 5; grid-row: 3; }
		.c-eng { grid-column: 1 / -1; grid-row: 4; }
		.c-eng.is-empty {
			display: none;
		}
		.c-job strong,
		.c-job span {
			white-space: normal;
		}
		.c-chev {
			grid-column: 5 / 7;
			grid-row: 3;
			justify-self: end;
			align-self: center;
			display: inline-flex;
			align-items: center;
			gap: 6px;
			font-size: 0.76rem;
			color: var(--faint);
		}
		.c-chev::before {
			content: 'Details';
		}
		.job[open] .c-chev::before {
			content: 'Hide';
		}
		.m-label {
			display: block;
			font-size: 0.66rem;
			text-transform: uppercase;
			letter-spacing: 0.07em;
			color: var(--faint);
		}
		.c-cell small {
			display: inline;
			margin-left: 4px;
		}
		.job-body {
			padding: 2px 12px 16px;
		}
		.job-columns {
			grid-template-columns: minmax(0, 1fr);
		}
		.job-actions .btn {
			flex: 1 1 auto;
			justify-content: center;
		}
		.tl-item {
			grid-template-columns: minmax(0, 1fr) auto;
			gap: 2px 10px;
		}
		.tl-kind {
			grid-column: 1;
		}
		.tl-time {
			grid-column: 2;
			grid-row: 1 / 3;
		}
		.tl-text {
			grid-column: 1;
		}
		.timeline {
			max-height: none;
		}
	}
`;
