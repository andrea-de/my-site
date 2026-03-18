export const dashboardTableStyles = `
	table {
		width: 100%;
		border-collapse: collapse;
		background: var(--panel-alt);
	}
	thead {
		background: #11161d;
	}
	th,
	td {
		padding: 10px 12px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		text-align: left;
		vertical-align: top;
		font-size: 0.9rem;
	}
	th {
		font-size: 0.78rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
		white-space: nowrap;
	}
	th:nth-child(2),
	td:nth-child(2) {
		min-width: 9.4rem;
		white-space: nowrap;
	}
	tbody tr:nth-child(even) {
		background: rgba(255, 255, 255, 0.02);
	}
	.detail-row {
		background: rgba(255, 255, 255, 0.015);
	}
	.detail-row td {
		padding: 5px 12px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		vertical-align: middle;
	}
	.detail-list {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.9rem 1.25rem;
		padding: 0.1rem 0 0.25rem;
		font-size: 0.84rem;
		color: var(--muted);
	}
	.detail-item strong {
		color: var(--text);
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}
	.detail-link {
		color: var(--accent);
		text-decoration: underline;
		text-underline-offset: 2px;
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
		padding: 0.65rem 0.8rem;
		border-radius: 10px;
		background: rgba(9, 13, 18, 0.96);
		border: 1px solid rgba(255, 255, 255, 0.12);
		box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
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
	td:nth-child(7),
	td:nth-child(12) {
		min-width: 150px;
		word-break: break-word;
	}
`;
