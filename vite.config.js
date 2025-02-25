import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { terser } from 'rollup-plugin-terser';

export default defineConfig({
	plugins: [sveltekit(), tailwindcss()],
	build: {
		lib: {
			entry: 'src/index.js',
			name: 'Playlight-SDK',
			fileName: (format) => `playlight-sdk.${format}.js`,
			formats: ['es', 'umd', 'iife']
		},
		rollupOptions: {
			plugins: [
				terser({
					compress: {
						drop_console: false
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
