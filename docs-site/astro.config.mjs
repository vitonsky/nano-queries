// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://nano-queries.js.org',
	integrations: [
		starlight({
			title: 'NanoQueries',
			logo: {
				src: './logo.svg'
			},
			pagefind: false,
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/vitonsky/nano-queries' },
				{ icon: 'npm', label: 'NPM', href: 'https://www.npmjs.com/package/nano-queries' },
			],
			sidebar: [
			],
		}),
	],
});
