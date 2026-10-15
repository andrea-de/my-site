// The recent-visits table: a scrolling table on wide screens, one card per session on phones.
export const dashboardTableStyles = `
	.table-wrap {
		overflow-x: auto;
		border: 1px solid var(--border);
		border-radius: 10px;
		-webkit-overflow-scrolling: touch;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		background: var(--panel-alt);
	}
	thead {
		background: var(--raised);
	}
	th,
	td {
		padding: 9px 10px;
		border-bottom: 1px solid var(--border-soft);
		text-align: left;
		vertical-align: top;
		font-size: 0.86rem;
	}
	td {
		color: #d4d4d8;
	}
	th {
		font-size: 0.72rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--faint);
		white-space: nowrap;
	}
	.c-ended {
		min-width: 9.4rem;
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}
	.c-index {
		color: var(--faint);
	}
	.visit-row:hover {
		background: rgba(255, 255, 255, 0.02);
	}
	.empty-cell {
		color: var(--faint);
		text-align: center;
		padding: 24px;
	}
	.cost {
		color: var(--accent-soft);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	.type {
		display: inline-block;
		padding: 1px 8px;
		border-radius: 999px;
		font-size: 0.76rem;
		border: 1px solid var(--border);
		color: var(--muted);
	}
	.type-agent {
		color: var(--accent-soft);
		border-color: rgba(99, 102, 241, 0.45);
		background: var(--accent-bg);
	}
	.type-contact {
		color: var(--success);
		border-color: rgba(52, 211, 153, 0.4);
	}
	.job-badge {
		display: inline-block;
		max-width: 100%;
		margin: 0 0 4px;
		padding: 1px 8px;
		border-radius: 999px;
		border: 1px solid rgba(99, 102, 241, 0.5);
		background: var(--accent-bg);
		color: var(--accent-soft);
		font-size: 0.75rem;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		vertical-align: middle;
	}
	.breakdown-list .job-badge {
		flex: 0 1 auto;
		margin: 0;
		max-width: calc(100% - 3rem);
	}
	.job-badge:hover {
		border-color: var(--accent-soft);
	}
	.job-badge-gone {
		border-color: var(--border);
		background: transparent;
		color: var(--faint);
	}
	.detail-row td {
		padding: 5px 12px 8px;
		vertical-align: middle;
	}
	.detail-list {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem 1.25rem;
		font-size: 0.82rem;
		color: var(--muted);
	}
	.detail-item strong {
		color: var(--faint);
		font-size: 0.7rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}
	.detail-link {
		color: var(--accent-soft);
		text-decoration: underline;
		text-underline-offset: 2px;
		overflow-wrap: anywhere;
	}
	.landing-cell,
	.signals-cell,
	.breakdown-label {
		position: relative;
		outline: none;
	}
	.landing-cell,
	.signals-cell {
		display: block;
	}
	.landing-cell {
		max-width: 12rem;
	}
	.signals-cell {
		max-width: 8.5rem;
	}
	.breakdown-label {
		display: block;
		width: 100%;
	}
	.landing-cell-value,
	.signals-cell-value,
	.breakdown-label-value {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.landing-cell-tooltip,
	.signals-cell-tooltip,
	.breakdown-label-tooltip {
		position: absolute;
		left: 0;
		top: calc(100% + 0.45rem);
		z-index: 5;
		max-width: min(32rem, 70vw);
		padding: 0.6rem 0.8rem;
		border-radius: 10px;
		background: rgba(9, 9, 11, 0.97);
		border: 1px solid #3f3f46;
		box-shadow: 0 12px 28px rgba(0, 0, 0, 0.5);
		color: var(--text);
		font-size: 0.82rem;
		line-height: 1.45;
		word-break: break-word;
		opacity: 0;
		pointer-events: none;
		transform: translateY(-4px);
		transition: opacity 140ms ease, transform 140ms ease;
	}
	.landing-cell:hover .landing-cell-tooltip,
	.landing-cell:focus .landing-cell-tooltip,
	.landing-cell:focus-within .landing-cell-tooltip,
	.signals-cell:hover .signals-cell-tooltip,
	.signals-cell:focus .signals-cell-tooltip,
	.signals-cell:focus-within .signals-cell-tooltip,
	.breakdown-label:hover .breakdown-label-tooltip,
	.breakdown-label:focus .breakdown-label-tooltip,
	.breakdown-label:focus-within .breakdown-label-tooltip {
		opacity: 1;
		transform: translateY(0);
	}
	.c-landing {
		min-width: 150px;
		max-width: 13rem;
	}
	.row-action-cell {
		width: 1%;
		white-space: nowrap;
		text-align: center;
	}
	.row-action-form {
		margin: 0;
	}
	.row-delete-button {
		width: 2rem;
		height: 2rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
		border: 1px solid var(--border-soft);
		background: rgba(255, 255, 255, 0.03);
		color: rgba(248, 113, 113, 0.8);
		cursor: pointer;
		transition: background 140ms ease, border-color 140ms ease, color 140ms ease;
	}
	.row-delete-button:hover {
		background: rgba(248, 113, 113, 0.12);
		border-color: rgba(248, 113, 113, 0.3);
		color: var(--danger);
	}
	.row-delete-button svg {
		width: 0.95rem;
		height: 0.95rem;
	}

	/* Phones: each session becomes a two-column card, labels from data-label. */
	@media (max-width: 720px) {
		.table-wrap {
			overflow: visible;
			border: 0;
		}
		.visits-table,
		.visits-table tbody,
		.visits-table tr,
		.visits-table td {
			display: block;
			background: none;
		}
		.visits-table thead {
			display: none;
		}
		.visits-table .visit-row {
			position: relative;
			display: grid;
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 8px 10px;
			margin-top: 10px;
			padding: 12px;
			border: 1px solid var(--border);
			border-radius: 10px;
			background: var(--panel-alt);
		}
		.visits-table td {
			padding: 0;
			border: 0;
			min-width: 0;
			overflow-wrap: anywhere;
		}
		.visits-table td[data-label]::before {
			content: attr(data-label);
			display: block;
			margin-bottom: 1px;
			font-size: 0.68rem;
			text-transform: uppercase;
			letter-spacing: 0.07em;
			color: var(--faint);
		}
		.visits-table .c-index {
			display: none;
		}
		.visits-table .c-ended {
			grid-column: 1 / -1;
			min-width: 0;
			padding-right: 2.6rem;
			white-space: normal;
			font-weight: 600;
			color: var(--text);
		}
		.visits-table td.c-ended::before {
			display: none;
		}
		.visits-table .c-landing,
		.visits-table .c-signals {
			grid-column: 1 / -1;
			min-width: 0;
		}
		.landing-cell,
		.signals-cell {
			max-width: none;
		}
		.landing-cell-value,
		.signals-cell-value {
			white-space: normal;
			overflow-wrap: anywhere;
		}
		.landing-cell-tooltip,
		.signals-cell-tooltip {
			display: none;
		}
		.visits-table .row-action-cell {
			position: absolute;
			top: 8px;
			right: 8px;
			width: auto;
		}
		/* Campaign details continue the card above them. */
		.visits-table .visit-row:has(+ .detail-row) {
			border-bottom: 0;
			border-radius: 10px 10px 0 0;
		}
		.visits-table .detail-row td {
			padding: 0 12px 12px;
			border: 1px solid var(--border);
			border-top: 0;
			border-radius: 0 0 10px 10px;
			background: var(--panel-alt);
		}
		.visits-table .empty-cell {
			padding: 20px 0;
		}
	}
`;
