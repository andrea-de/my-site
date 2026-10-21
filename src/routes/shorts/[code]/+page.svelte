<script>
	// /shorts/<code>: the feed for a job link; the cover says hello to the company.
	import { browser } from '$app/environment';
	import { activeRef } from '$lib/stores/referral';
	import ShortsPage from '../../../components/shorts/ShortsPage.svelte';

	export let data;

	// As on /r/<code>: the agent is briefed on the job if the visitor goes on to the site.
	$: if (browser) activeRef.set(data.code);
</script>

<svelte:head>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<ShortsPage code={data.code} company={data.company} />
