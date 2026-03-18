export const dashboardBaseStyles = `
	:root {
		--bg: #0d1117;
		--panel: #161b22;
		--panel-alt: #0f141a;
		--border: #30363d;
		--text: #e6edf3;
		--muted: #9da7b3;
		--accent: #7ee787;
		--danger: #ff7b72;
	}
	* {
		box-sizing: border-box;
	}
	body {
		margin: 0;
		font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
		background: var(--bg);
		color: var(--text);
	}
	main {
		max-width: 1400px;
		margin: 0 auto;
		padding: 24px 16px 40px;
	}
	header {
		display: flex;
		justify-content: space-between;
		gap: 16px;
		align-items: flex-start;
		margin-bottom: 20px;
		flex-wrap: wrap;
	}
	h1,
	h2,
	h3 {
		margin: 0;
	}
	h1 {
		font-size: 1.8rem;
		margin-bottom: 4px;
	}
	h2 {
		font-size: 1rem;
		margin-bottom: 12px;
	}
	p {
		margin: 0;
		color: var(--muted);
	}
	a {
		color: var(--text);
		text-decoration: none;
	}
	.actions,
	.view-toggle {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}
	.view-toggle {
		gap: 8px;
		margin-bottom: 16px;
	}
	.action-link,
	.action-button {
		padding: 10px 14px;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--panel);
		color: var(--text);
		font: inherit;
		cursor: pointer;
	}
	.action-button {
		color: var(--danger);
	}
	.refresh-button {
		color: var(--accent);
	}
	.toggle-link {
		padding: 8px 12px;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--panel);
		color: var(--muted);
		font-size: 0.9rem;
	}
	.toggle-link.active {
		color: var(--text);
		border-color: var(--accent);
	}
	.action-form {
		margin: 0;
	}
	.notice,
	.panel,
	.summary-card {
		background: var(--panel);
		border: 1px solid var(--border);
		border-radius: 10px;
	}
	.notice {
		margin-bottom: 16px;
		padding: 12px 14px;
		color: var(--accent);
	}
	.summary-grid,
	.breakdown-grid {
		display: grid;
		gap: 12px;
		margin-bottom: 16px;
	}
	.summary-grid {
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
	}
	.breakdown-grid {
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	}
	.summary-card,
	.panel {
		padding: 14px;
	}
	.summary-card strong {
		display: block;
		font-size: 1.6rem;
		margin-top: 8px;
	}
	.breakdown-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.breakdown-list li {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px 0;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
	}
	.breakdown-list li > :first-child {
		flex: 1 1 auto;
		min-width: 0;
	}
	.breakdown-list li strong {
		flex: 0 0 auto;
		margin-left: auto;
	}
	.breakdown-list li:first-child {
		border-top: 0;
	}
	.panel-summary,
	.footer-note,
	.empty-cell {
		color: var(--muted);
	}
	.panel-summary,
	.footer-note {
		margin-bottom: 12px;
		font-size: 0.9rem;
	}
	.table-wrap {
		overflow-x: auto;
		overflow-y: visible;
		border: 1px solid var(--border);
		border-radius: 10px;
	}
	@media (max-width: 720px) {
		main {
			padding: 16px 12px 32px;
		}
	}
`;
