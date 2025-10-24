<script>
	import { onMount } from "svelte";
	import { discoveryOpen } from "../store.js";
	import { ChevronLeft, ChevronRight, LoaderCircle } from "lucide-svelte";
	import GameCard from "./GameCard.svelte";
	import api from "../api.js";
	import { blur } from "svelte/transition";
	import Button from "./Button.svelte";

	// State
	let isLoading = $state(true);
	let games = $state([]);
	let selectedCategory = $state();
	let containerRef = $state();
	let cardWidth = $state(0);

	// Computed values
	let hasLeftScroll = $state(false);
	let hasRightScroll = $state(true);
	let maskStyle = $state("");

	onMount(async () => {
		const categories = await api.getCategories();
		const currentGame = await api.getCurrentGameInfo();
		selectedCategory = currentGame?.category || categories?.[categories?.length - 1];

		await fetchGames();

		if (containerRef) {
			const maxScroll = containerRef.scrollWidth - containerRef.clientWidth;
			updateMask(containerRef.scrollLeft, maxScroll - containerRef.scrollLeft);
		}
	});

	function updateMask(scrollLeft, remainingScroll) {
		const leftFactor = Math.min(scrollLeft / 50, 1);
		const rightFactor = Math.min(remainingScroll / 50, 1);

		maskStyle = `mask-image: linear-gradient(
			to right,
			rgba(0, 0, 0, ${1 - 0.95 * leftFactor}) 0%,
			rgba(0, 0, 0, ${1 - 0.674 * leftFactor}) 2%,
			rgba(0, 0, 0, ${1 - 0.446 * leftFactor}) 3.5%,
			rgba(0, 0, 0, ${1 - 0.26 * leftFactor}) 5%,
			rgba(0, 0, 0, ${1 - 0.14 * leftFactor}) 6.5%,
			rgba(0, 0, 0, ${1 - 0.046 * leftFactor}) 8%,
			black 9%,
			black 91%,
			rgba(0, 0, 0, ${0.954 * rightFactor + (1 - rightFactor)}) 92%,
			rgba(0, 0, 0, ${0.86 * rightFactor + (1 - rightFactor)}) 93.5%,
			rgba(0, 0, 0, ${0.74 * rightFactor + (1 - rightFactor)}) 95%,
			rgba(0, 0, 0, ${0.554 * rightFactor + (1 - rightFactor)}) 96.5%,
			rgba(0, 0, 0, ${0.326 * rightFactor + (1 - rightFactor)}) 98%,
			rgba(0, 0, 0, ${0.05 * rightFactor + (1 - rightFactor)})
		)`;
	}

	// Fetch games from API
	async function fetchGames() {
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

		// Limit the number of games to 10
		games = fetchedGames.slice(0, 10);
		isLoading = false;
	}
</script>

<div class="playlight-sdk playlight-sdk-widget">
	<!-- Carousel -->
	<div
		bind:this={containerRef}
		onscroll={(e) => {
			const el = e.target;
			hasLeftScroll = el.scrollLeft > 20;
			hasRightScroll = el.scrollLeft < el.scrollWidth - el.clientWidth - 20;
			updateMask(el.scrollLeft, el.scrollWidth - el.clientWidth - el.scrollLeft);
		}}
		class="relative flex h-full w-full snap-x gap-2 overflow-x-auto"
		style={maskStyle}
	>
		{#if isLoading}
			<div class="flex h-62 w-full items-center justify-center">
				<LoaderCircle class="animate-spin opacity-75" size={30} strokeWidth={2.5} />
			</div>
		{:else}
			{#each games as game, i}
				<div class="snap-center px-2" bind:clientWidth={cardWidth}>
					<GameCard {game} compact={true} />
				</div>
			{/each}

			<!-- View more card -->
			<div
				class="bg-background/85 my-auto mr-3 mb-30 ml-2 flex min-w-40 snap-center flex-wrap items-center justify-center gap-4 p-4 pb-6 shadow-lg backdrop-blur-xl"
			>
				<p class="w-full text-center text-lg font-semibold text-white">Fancy more?</p>
				<Button
					onclick={() => {
						$discoveryOpen = true;
						api.trackOpen();
					}}
				>
					See all
				</Button>
			</div>
		{/if}
	</div>

	<!-- Navigation arrows (only show if needed) -->
	{#if games.length > 0}
		{#if hasLeftScroll}
			<button
				transition:blur
				class="bg-background/85 absolute top-4/9 left-2 z-20 -translate-y-1/2 transform border p-1 py-4 text-white shadow-lg backdrop-blur-xl transition hover:bg-white hover:text-black max-sm:hidden"
				onclick={() => containerRef.scrollBy({ left: 2 * -cardWidth, behavior: "smooth" })}
			>
				<ChevronLeft size={22} strokeWidth={2.75} />
			</button>
		{/if}

		{#if hasRightScroll}
			<button
				transition:blur
				class="bg-background/85 absolute top-4/9 right-2 z-20 -translate-y-1/2 transform border p-1 py-4 text-white shadow-lg backdrop-blur-xl transition hover:bg-white hover:text-black max-sm:hidden"
				onclick={() => containerRef.scrollBy({ left: 2 * cardWidth, behavior: "smooth" })}
			>
				<ChevronRight size={22} strokeWidth={2.75} />
			</button>
		{/if}
	{/if}
</div>
