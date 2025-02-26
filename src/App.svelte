<script>
	import "./app.css";
	import FloatingButton from "./lib/components/FloatingButton.svelte";
	import DiscoveryOverlay from "./lib/components/DiscoveryOverlay.svelte";
	import { Toaster } from "svelte-sonner";
	import ExitIntentDetector from "./lib/components/ExitIntentDetector.svelte";

	let { config, api } = $props();

	// State variables
	let showDiscovery = $state(false);
	let buttonPosition = $state(config?.button?.position || "bottom-right");
	let selectedCategory = $state();
	let currentGameCategory = $state();

	// Actions that can be called from outside the component
	function setShowDiscovery(value) {
		showDiscovery = value;
		if (value) api.trackOpen();
	}

	function setButtonPosition(position) {
		buttonPosition = position;
	}

	// Register actions globally - now inside the component top level (not onMount)
	$effect(() => {
		if (typeof window !== "undefined") {
			window.playlightActions = {
				setShowDiscovery,
				setButtonPosition,
			};
		}
	});
</script>

<!-- Floating button -->
<FloatingButton position={buttonPosition} onClick={() => setShowDiscovery(true)} />

<!-- Discovery overlay -->
{#if showDiscovery}
	<DiscoveryOverlay
		{currentGameCategory}
		{api}
		bind:selectedCategory
		onClose={() => {
			showDiscovery = false;
		}}
	/>
{/if}

<!-- Detect user leaving page -->
<ExitIntentDetector
	enabled={config?.exitIntent?.enabled}
	onIntent={() => {
		if (!showDiscovery) setShowDiscovery(true);
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
