import tailwindcss from '@tailwindcss/vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
// import { terser } from 'rollup-plugin-terser';

export default defineConfig({
	plugins: [svelte(), tailwindcss()],
	build: {
		lib: {
			entry: 'src/index.js',
			name: 'PlaylightSDK',
			fileName: (format) => `playlight-sdk.${format}.js`,
			formats: ['es', 'umd', 'iife']
		},
		rollupOptions: {
			// plugins: [
			// 	terser({
			// 		compress: {
			// 			drop_console: false
			// 		}
			// 	})
			// ],
			output: {
				// Provide global variables for use in UMD/IIFE build
				globals: {
					svelte: 'Svelte'
				}
			}
		},
		minify: 'false', // can be terser
		sourcemap: true
	}
});