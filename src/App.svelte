<script>
	import "./app.css";
	import FloatingButton from "./lib/components/FloatingButton.svelte";
	import DiscoveryOverlay from "./lib/components/DiscoveryOverlay.svelte";
	import api from "./lib/api";
	import { Toaster } from "svelte-sonner";
	import ExitIntentDetector from "./lib/components/ExitIntentDetector.svelte";
	import { discoveryOpen } from "./lib/store.js";
	import { triggerEvent } from "./lib/utils/trigger-event";

	let { config } = $props();

	// Actions that can be called from outside the component
	function openDiscovery() {
		if ($discoveryOpen) return;
		$discoveryOpen = true;
		api.trackOpen();
	}

	// Prevent scroll propagation
	let originalOverflow;
	discoveryOpen.subscribe((value) => {
		try {
			if (value) {
				triggerEvent("discoveryOpen");
				originalOverflow = document.body.style.overflow;
				document.body.style.overflow = "hidden";
			} else {
				triggerEvent("discoveryClose");
				document.body.style.overflow = originalOverflow;
			}
		} catch (error) {
			console.error("Failed to toggle body overflow style:", error);
		}
	});
</script>

<!-- Floating button -->
<FloatingButton position={$config?.button?.position} visible={$config?.button?.visible} onClick={openDiscovery} />

<!-- Discovery overlay -->
{#if $discoveryOpen}
	<DiscoveryOverlay />
{/if}

<!-- Detect user leaving page -->
<ExitIntentDetector
	enabled={$config?.exitIntent?.enabled}
	immediate={$config?.exitIntent?.immediate}
	onIntent={openDiscovery}
/>

{#if $discoveryOpen}
	<!-- Toaster for notifications -->
	<Toaster />
{/if}

<style>
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
