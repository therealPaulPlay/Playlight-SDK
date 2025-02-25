<script>
	import "./app.css";
	import { blur } from "svelte/transition";
	import FloatingButton from "./lib/components/FloatingButton.svelte";
	import DiscoveryOverlay from "./lib/components/DiscoveryOverlay.svelte";
	import { toast } from "svelte-sonner";
	import { onMount } from "svelte";

	// Props
	let { config = {}, api = {} } = $props();

	let showDiscovery = $state(false);
	let buttonPosition = $state(config?.button?.position);
	let selectedCategory = $state(null);
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

	// Register actions in the global object so they can be accessed by the SDK
	onMount(() => {
		window.__playlightActions = {
			setShowDiscovery,
			setButtonPosition,
			setSelectedCategory,
		};

		// Cleanup
		return () => {
			window.__playlightActions = null;
		};
	});

	$effect(async () => {
		// Set initial category based on current game's category
		if (!currentGameCategory && !selectedCategory && api) {
			const currentGame = await api?.getCurrentGameInfo();
			currentGameCategory = currentGame.category;
			selectedCategory = currentGameCategory;
		}
	});
</script>

<!-- Floating button -->
<FloatingButton
	position={buttonPosition}
	onClick={() => {
		// Open Discovery
		showDiscovery = true;
		api?.trackOpen();
	}}
/>

<!-- Discovery overlay -->
{#if showDiscovery}
	<div transition:blur={{ duration: 200 }}>
		<DiscoveryOverlay
			{currentGameCategory}
			{selectedCategory}
			onClose={() => {
				showDiscovery = false;
			}}
			onGameClick={() => {
				api?.trackClick(gameId);
			}}
			onCategoryChange={(category) => (selectedCategory = category)}
		/>
	</div>
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
