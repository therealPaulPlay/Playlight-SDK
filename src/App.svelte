<script>
	import "./app.css";
	import Discovery from "./lib/components/Discovery.svelte";
	import { Toaster } from "svelte-sonner";
	import ExitIntent from "./lib/components/ExitIntent.svelte";
	import { config, discoveryOpen, sidebarVisible } from "./lib/store.js";
</script>

<!-- Discovery overlay -->
{#if $discoveryOpen}
	<Discovery />
{/if}

<!-- Detect user leaving page -->
<ExitIntent
	enabled={$config?.exitIntent?.enabled}
	immediate={$config?.exitIntent?.immediate}
	onIntent={() => {
		if (!$discoveryOpen) $discoveryOpen = true;
	}}
/>

{#if $discoveryOpen || $sidebarVisible}
	<!-- Toaster for notifications -->
	<Toaster />
{/if}
