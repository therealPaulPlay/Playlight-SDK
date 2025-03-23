<script>
	import { onMount } from "svelte";
	import { discoveryOpen } from "../store.js";
	import { ChevronLeft, ChevronRight, LoaderCircle } from "lucide-svelte";
	import GameCard from "./GameCard.svelte";
	import api from "../api.js";
	import { blur } from "svelte/transition";

	// State
	let isLoading = $state(true);
	let games = $state([]);
	let categories = $state([]);
	let selectedCategory = $state();
	let containerRef = $state();
	let cardWidth = $state(0);

	// Computed values
	let hasLeftScroll = $state(false);
	let hasRightScroll = $state(true);

	onMount(async () => {
		// Fetch categories first
		categories = await api.getCategories();

		// Select a default category
		if (categories?.length > 0) {
			const currentGame = await api.getCurrentGameInfo();
			selectedCategory =
				currentGame?.category && categories?.includes(currentGame?.category)
					? currentGame?.category
					: categories?.[categories?.length - 1];
		}

		// Fetch games with selected category
		await fetchGames();
	});

	// Fetch games from API
	async function fetchGames() {
		try {
			isLoading = true;

			// First try with category
			let result = await api.getSuggestions(selectedCategory, 1);
			let fetchedGames = result?.games || [];

			// If not enough games, try without category
			if (fetchedGames.length < 10 && selectedCategory) {
				const moreResult = await api.getSuggestions(null, 1);
				const moreGames = moreResult?.games || [];

				// Filter out duplicates
				const uniqueGames = moreGames.filter((newGame) => !fetchedGames.some((existing) => existing.id === newGame.id));

				fetchedGames = [...fetchedGames, ...uniqueGames];
			}

			// Limit the number of games
			games = fetchedGames.slice(0, 10);
		} catch (err) {
			console.error("Failed to load games for widget:", err);
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="playlight-sdk-container relative h-full w-full">
	<!-- Carousel -->
	<div
		bind:this={containerRef}
		onscroll={(e) => {
			hasLeftScroll = e.target.scrollLeft > 20;
			hasRightScroll = e.target.scrollLeft < e.target.scrollWidth - e.target.clientWidth - 20;
		}}
		class="relative flex h-full w-full snap-x snap-proximity gap-2 overflow-x-auto"
	>
		{#if isLoading}
			<div class="flex h-48 w-full items-center justify-center">
				<LoaderCircle class="animate-spin opacity-75" size={30} strokeWidth={2.5} />
			</div>
		{:else}
			{#each games as game, i}
				<div class="snap-start px-2" bind:clientWidth={cardWidth}>
					<GameCard {game} compact={true} onClick={() => api.trackClick(game.id)} />
				</div>
			{/each}

			<!-- View more card -->
			<div
				class="bg-background/85 ml-2 my-auto flex min-w-40 flex-wrap items-center justify-center gap-4 p-4 pb-6 shadow-xl backdrop-blur-xl"
			>
				<p class="text-foreground w-full text-center text-lg font-semibold">Fancy more?</p>
				<button
					class="bg-foreground hover:bg-background hover:text-primary cursor-pointer px-3 py-2 transition"
					onclick={() => {
						$discoveryOpen = true;
						api.trackOpen();
					}}
				>
					See all
				</button>
			</div>
		{/if}
	</div>

	<!-- Navigation arrows (only show if needed) -->
	{#if games.length > 0}
		{#if hasLeftScroll}
			<button
				transition:blur
				class="bg-background/50 hover:bg-foreground hover:text-background text-foreground absolute top-1/2 left-0 z-20 ml-1 -translate-y-1/2 transform rounded-full p-1 shadow-xl backdrop-blur-xl transition"
				onclick={() => containerRef.scrollBy({ left: 2 * -cardWidth, behavior: "smooth" })}
			>
				<ChevronLeft size={24} />
			</button>
		{/if}

		{#if hasRightScroll}
			<button
				transition:blur
				class="bg-background/50 hover:bg-foreground hover:text-background text-foreground absolute top-1/2 right-0 z-20 mr-1 -translate-y-1/2 transform rounded-full p-1 shadow-xl backdrop-blur-xl transition"
				onclick={() => containerRef.scrollBy({ left: 2 * cardWidth, behavior: "smooth" })}
			>
				<ChevronRight size={24} />
			</button>
		{/if}
	{/if}
</div>
