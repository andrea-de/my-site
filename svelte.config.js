import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// explicitly specify the runtime to bypass the outdated Node version check in SK1 adapter
		adapter: adapter({
			runtime: 'nodejs22.x'
		})
	}
};

export default config;
