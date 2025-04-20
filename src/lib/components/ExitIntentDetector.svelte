<script>
	import api from "../api.js";
	import Button from "../components/Button.svelte";
	import { fly, slide } from "svelte/transition";
	import { backOut } from "svelte/easing";
	let { enabled = true, onIntent, immediate = false } = $props();

	// Elements
	let detectorElement = $state();
	let barElement = $state();

	// Interactions
	let lastMouseInteraction;
	let showIntentBar = $state(false);

	// Timeouts
	let hideIntentBarTimeout = $state();

	function trackMouse(event) {
		if (!enabled || detectorElement?.contains(event.target) || barElement?.contains(event.target)) return;
		if (!hideIntentBarTimeout && showIntentBar) hideIntentBarTimeout = setTimeout(() => (showIntentBar = false), 1500);
		lastMouseInteraction = Date.now();
	}

	function handleBarTrigger() {
		setTimeout(() => {
			if (lastMouseInteraction < Date.now() - 50) {
				clearTimeout(hideIntentBarTimeout);
				hideIntentBarTimeout = null;
				if (!immediate) {
					loadInitialSuggestions();
					showIntentBar = true;
				} else {
					onIntent?.();
				}
			}
		}, 150);
	}

	// Prompts ------------------------------------------------------------------------------------------------------
	let barPrompts = [
		"The cure for boredom.",
		"You know you want to.",
		"Why stop the fun now?",
		"Games don’t play themselves.",
		"A new adventure awaits.",
		"There’s always time for one more.",
	];

	// Load suggestion preview (3 small icons) ---------------------------------------------------------------------
	let selectedCategory = $state();
	let previewGames = $state([]);

	async function loadInitialSuggestions() {
		const categories = await api.getCategories();
		const currentGame = await api.getCurrentGameInfo();
		if (!selectedCategory) selectedCategory = currentGame?.category || categories?.[categories?.length - 1];
		let result = await api.getSuggestions(selectedCategory, 1);
		let fetchedGames = result?.games || [];
		previewGames = fetchedGames.slice(0, 3);
	}
</script>

<svelte:window onmousemove={trackMouse} />

{#if enabled}
	<!-- svelte-ignore a11y_mouse_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed top-0 right-0 left-0 h-4" bind:this={detectorElement} onmouseover={handleBarTrigger}></div>
{/if}

{#if showIntentBar}
	<div
		onmouseenter={() => {
			clearTimeout(hideIntentBarTimeout);
			hideIntentBarTimeout = null;
		}}
		bind:this={barElement}
		role="menu"
		tabindex="0"
		transition:fly={{ y: -100, easing: backOut, duration: 500 }}
		class="bg-background/85 fixed top-4 right-4 left-4 z-99998 mx-auto flex w-fit flex-wrap items-center gap-4 border-1 p-4 shadow-lg backdrop-blur-xl"
	>
		<p class="text-lg font-semibold text-nowrap text-white">
			{barPrompts[Math.floor(Math.random() * barPrompts.length)]}
		</p>
		<Button
			class="group"
			onclick={() => {
				onIntent?.();
				setTimeout(() => (showIntentBar = false), 150); // Don't clear the timeout, that is already done onmouseenter
			}}
		>
			More games
			{#if previewGames?.length >= 3}
				<div class="ml-3 flex items-center -space-x-2" transition:slide={{ axis: "x", duration: 150 }}>
					{#each previewGames as game, i}
						<div style:z-index={previewGames.length - i} class="relative">
							<img
								src={game.logo_url}
								alt=""
								class="group-hover:outline-background relative h-7 w-7 bg-stone-200 outline outline-4 outline-white transition-colors select-none"
							/>
						</div>
					{/each}
				</div>
			{/if}
		</Button>
	</div>
{/if}
