<script>
	import "./app.css";
	import { blur } from "svelte/transition";
	import FloatingButton from "./lib/components/FloatingButton.svelte";
	import DiscoveryOverlay from "./lib/components/DiscoveryOverlay.svelte";
	import { toast, Toaster } from "svelte-sonner";

	let { config, api } = $props();

	// State variables
	let showDiscovery = $state(false);
	let buttonPosition = $state(config?.button?.position || "bottom-right");
	let selectedCategory = $state();
	let currentGameCategory = $state();

	// Actions that can be called from outside the component
	function setShowDiscovery(value) {
		showDiscovery = value;
	}

	function setButtonPosition(position) {
		buttonPosition = position;
	}

	function setSelectedCategory(category) {
		selectedCategory = category;
	}

	// Register actions globally - now inside the component top level (not onMount)
	$effect(() => {
		if (typeof window !== "undefined") {
			window.playlightActions = {
				setShowDiscovery,
				setButtonPosition,
				setSelectedCategory,
			};
		}
	});

	// Lifecycle effect for getting initial category
	$effect(async () => {
		// Set initial category based on current game's category
		if (!currentGameCategory && !selectedCategory && api?.getCurrentGameInfo) {
			try {
				const currentGame = await api.getCurrentGameInfo();
				if (currentGame && currentGame.category) {
					currentGameCategory = currentGame.category;
					selectedCategory = currentGameCategory;
				}
			} catch (error) {
				console.error("Error getting current game info:", error);
			}
		}
	});

	// Methods
	function handleOpenDiscovery() {
		showDiscovery = true;
		api.trackOpen();
	}

	function handleCloseDiscovery() {
		showDiscovery = false;
	}

	function handleGameClick(gameId) {
		api.trackClick(gameId);
	}
</script>

<!-- Floating button -->
<FloatingButton position={buttonPosition} onClick={handleOpenDiscovery} />

<!-- Discovery overlay -->
{#if showDiscovery}
	<DiscoveryOverlay
		{currentGameCategory}
		{selectedCategory}
		onClose={handleCloseDiscovery}
		onGameClick={handleGameClick}
		onCategoryChange={(category) => (selectedCategory = category)}
	/>
{/if}

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
