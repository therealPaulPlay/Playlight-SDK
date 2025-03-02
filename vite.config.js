import tailwindcss from '@tailwindcss/vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { terser } from 'rollup-plugin-terser';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
	plugins: [
		svelte(),
		tailwindcss(),
		viteStaticCopy({
			targets: [
				{
					src: 'static/*',
					dest: 'static'
				}
			]
		})
	],
	build: {
		lib: {
			entry: 'src/index.js',
			name: 'PlaylightSDK',
			fileName: (format) => `playlight-sdk.${format}.js`,
			formats: ['es', 'umd', 'iife']
		},
		rollupOptions: {
			plugins: [
				terser({
					keep_fnames: true,
					keep_classnames: true,
					ecma: 2020,
					format: {
						beautify: true,
						comments: 'all'
					}
				})
			],
			output: {
				// Provide global variables for use in UMD/IIFE build
				globals: {
					svelte: 'Svelte'
				}
			}
		},
		minify: 'terser',
		sourcemap: true
	}
});
