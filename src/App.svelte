<script>
	import "./app.css";
	import DiscoveryOverlay from "./lib/components/DiscoveryOverlay.svelte";
	import { Toaster } from "svelte-sonner";
	import ExitIntentDetector from "./lib/components/ExitIntentDetector.svelte";
	import { discoveryOpen, sidebarVisible } from "./lib/store.js";

	let { config } = $props();
</script>

<!-- Discovery overlay -->
{#if $discoveryOpen}
	<DiscoveryOverlay />
{/if}

<!-- Detect user leaving page -->
<ExitIntentDetector
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
