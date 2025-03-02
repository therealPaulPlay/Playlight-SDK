<script>
	import "./app.css";
	import FloatingButton from "./lib/components/FloatingButton.svelte";
	import DiscoveryOverlay from "./lib/components/DiscoveryOverlay.svelte";
	import api from "./lib/api";
	import { Toaster } from "svelte-sonner";
	import ExitIntentDetector from "./lib/components/ExitIntentDetector.svelte";
	import { discoveryOpen } from "./lib/store.js";

	let { config } = $props();

	// State variables
	let buttonPosition = $state(config?.button?.position);
	let buttonVisible = $state(config?.button?.visible);

	// Actions that can be called from outside the component
	function openDiscovery() {
		$discoveryOpen = true;
		api.trackOpen();
	}
</script>

<!-- Floating button -->
<FloatingButton position={buttonPosition} visible={buttonVisible} onClick={openDiscovery} />

<!-- Discovery overlay -->
{#if $discoveryOpen}
	<DiscoveryOverlay />
{/if}

<!-- Detect user leaving page -->
<ExitIntentDetector
	enabled={config?.exitIntent?.enabled}
	onIntent={() => {
		if (!$discoveryOpen) openDiscovery();
	}}
/>

<!-- Toaster for notifications -->
<Toaster />

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}

	:global(#playlight-sdk-container) {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 99999;
		pointer-events: none;
	}

	:global(#playlight-sdk-container *) {
		pointer-events: auto;
	}
</style>
