import tailwindcss from "@tailwindcss/vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
	plugins: [
		svelte(),
		tailwindcss(),
		viteStaticCopy({
			targets: [
				{
					src: "assets/*",
					dest: "assets",
				},
			],
		}),
	],
	build: {
		target: "es2020",
		lib: {
			entry: "src/index.js",
			name: "PlaylightSDK",
			fileName: (format) => `playlight-sdk.${format}.js`,
			formats: ["es", "iife"],
		},
		rollupOptions: {
			output: {
				// Provide global variables for use in UMD/IIFE build
				globals: {
					svelte: "Svelte",
				},
			},
		},
		sourcemap: true,
	},
});
