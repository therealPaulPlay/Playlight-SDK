<script>
	import "./app.css";
	import Discovery from "./lib/components/Discovery.svelte";
	import { Toaster } from "svelte-sonner";
	import ExitIntent from "./lib/components/ExitIntent.svelte";
	import { discoveryOpen, sidebarEnabled } from "./lib/store.js";
</script>

<!-- Discovery overlay -->
{#if $discoveryOpen}
	<Discovery />
{/if}

<!-- Detect user leaving page -->
<ExitIntent />

<!-- Toaster for notifications -->
{#if $discoveryOpen || $sidebarEnabled}
	<Toaster />
{/if}
