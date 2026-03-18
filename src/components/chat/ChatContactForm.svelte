<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	function handleSubmit(event) {
		event.preventDefault();
		dispatch('submit', Object.fromEntries(new FormData(event.currentTarget)));
	}
</script>

<form class="ag-ui-form" on:submit={handleSubmit}>
	<input name="name" placeholder="Your Name" required />
	<input name="email" type="email" placeholder="Your Email" required />
	<textarea name="note" placeholder="Quick note..."></textarea>
	<button type="submit">Submit Info</button>
</form>

<style>
	.ag-ui-form {
		margin-top: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
	}

	.ag-ui-form input,
	.ag-ui-form textarea {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: #fff;
		padding: 0.6rem;
		border-radius: 8px;
		font-size: 0.85rem;
		font-family: inherit;
	}

	.ag-ui-form button {
		background: #fff;
		color: #000;
		border: none;
		padding: 0.6rem;
		border-radius: 8px;
		font-weight: 700;
		cursor: pointer;
		margin-top: 0.5rem;
	}
</style>
