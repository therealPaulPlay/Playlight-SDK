<script>
	import { blur } from "svelte/transition";
	import { X, ExternalLink, LoaderCircle } from "lucide-svelte";
	import GameCard from "./GameCard.svelte";
	import api from "../api.js";
	import Navigation from "./Navigation.svelte";
	import { onMount } from "svelte";
	import { discoveryOpen, projectUrl, sidebarCollapsed, sidebarVisible } from "../store.js";
	import DiscoveryDrawer from "./DiscoveryDrawer.svelte";

	// States
	let isLoading = $state(true);
	let isLoadingMore = $state(false);
	let loadMoreMargin = $state(300);

	// Info
	let currentGame = $state();
	let categories = $state([]);
	let selectedCategory = $state();

	// Fetch games params
	let games = $state([]);
	let page = $state(1);
	let hasMoreGames = $state(true);
	let fetchAllGames = $state(false);

	// Elements
	let observer;
	let bottomDetector = $state();
	let scrollContainer = $state();

	// Initialization - set up scroll observer
	onMount(() => {
		observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMoreGames) {
					fetchGames();
				}
			},
			{ rootMargin: `${loadMoreMargin}px`, root: scrollContainer },
		);
		return () => observer?.disconnect();
	});

	// Observe bottom detector element when it becomes available
	$effect(() => {
		if (bottomDetector && observer) observer.observe(bottomDetector);
	});

	onMount(async () => {
		currentGame = await api.getCurrentGameInfo();
		categories = await api.getCategories();
		selectedCategory = currentGame?.category || categories?.[categories?.length - 1];
		isLoading = false; // Initial loading done, but loading will be set to true again by fetchGames
		await loadNewFeed();
	});

	async function loadNewFeed() {
		games = [];
		page = 1;
		hasMoreGames = true;
		fetchAllGames = false;
		if (currentGame?.featured_game && selectedCategory == currentGame?.category)
			games.push({ ...currentGame.featured_game, featured: true });
		await fetchGames();
	}

	async function fetchGames() {
		if (isLoading || isLoadingMore) return; // If already fetching, exit
		page === 1 ? (isLoading = true) : (isLoadingMore = true);

		// Get games (null category = all games)
		const categoryToUse = fetchAllGames ? null : selectedCategory;
		const result = await api.getSuggestions(categoryToUse, page);
		const returnedGames = result?.games || [];
		const pageSize = result?.pageSize || 15;

		// Filter out duplicates
		const uniqueGames = returnedGames.filter(
			(newGame) => !games.some((existingGame) => existingGame.id === newGame.id),
		);
		games = [...games, ...uniqueGames];

		if (returnedGames.length < pageSize) {
			if (!fetchAllGames && selectedCategory) {
				fetchAllGames = true;
				page = 1;
			} else hasMoreGames = false;
		} else {
			page += 1;
		}

		// Disable loading state
		isLoading = false;
		isLoadingMore = false;

		// Check if detector is still in view and should trigger another load
		if (hasMoreGames && bottomDetector) {
			const rect = bottomDetector.getBoundingClientRect();
			if (rect.bottom <= window.innerHeight + loadMoreMargin) fetchGames();
		}
	}

	function closeDiscoveryOnEmptyClick(e) {
		if (e.target === e.currentTarget && e.pointerType !== "touch") $discoveryOpen = false;
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key == "Escape") $discoveryOpen = false;
	}}
/>

<!-- Separator to signal that games are from different category -->
{#snippet categorySeperator()}
	<div class="-mx-10 mt-5 flex h-92 w-10 flex-col">
		<div class="flex h-full items-center justify-center">
			<div class="flex h-full w-full flex-col items-center justify-between">
				<div class="bg-muted-foreground h-1/5 w-px opacity-60 min-[1920px]:h-1/4"></div>
				<div class="text-muted-foreground origin-center -rotate-90 transform text-sm whitespace-nowrap select-none">
					From other categories
				</div>
				<div class="bg-muted-foreground h-1/5 w-px opacity-60 min-[1920px]:h-1/4"></div>
			</div>
		</div>
	</div>
{/snippet}

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="bg-background/75 fixed inset-0 top-0 right-0 bottom-0 left-0 flex flex-col justify-center text-white backdrop-blur-md"
	id="playlight-discovery"
	transition:blur={{ duration: 250 }}
	onpointerup={closeDiscoveryOnEmptyClick}
>
	<!-- Header -->
	<div class="pointer-events-none flex items-center justify-between p-4">
		<img
			alt="logo"
			src={$projectUrl + "/static/images/logo-white-small.png"}
			class="pointer-events-none ml-3 w-50 select-none max-sm:w-40"
		/>
		<div class="mt-3.5 mr-4 flex items-center justify-evenly gap-8 overflow-hidden max-sm:mt-3">
			<button class="cursor-pointer text-white transition hover:opacity-50" onclick={() => ($discoveryOpen = false)}>
				<X size={24} strokeWidth={2.5} />
			</button>
		</div>
	</div>

	<!-- Category selector -->
	<div class="mx-auto px-6 max-sm:py-1 sm:pt-2 sm:pb-6">
		<Navigation {categories} onCategoryChange={loadNewFeed} bind:selectedCategory />
	</div>

	<!-- Current game display -->
	{#if !$sidebarVisible || $sidebarCollapsed}
		<DiscoveryDrawer {currentGame} />
	{/if}

	<!-- Game grid -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="mask-fade show-scrollbar relative h-full w-full overflow-y-auto p-4"
		bind:this={scrollContainer}
		onpointerup={closeDiscoveryOnEmptyClick}
	>
		{#if isLoading && games.length === 0}
			<div class="flex h-4/5 items-center justify-center gap-4">
				<LoaderCircle class="animate-spin opacity-75" size={50} strokeWidth={2.25} />
			</div>
		{:else if games.length === 0 && !isLoading}
			<div class="pointer-events-none flex h-4/5 items-center justify-center gap-4">
				<p class="text-white">No games found that match the filter.</p>
			</div>
		{:else}
			<div class="pointer-events-none mx-auto flex h-fit flex-wrap content-start justify-center gap-10 lg:max-w-4/5">
				{#each games as game, i}
					{@const firstGameFromDiffCategory = games.findIndex((e) => e.category !== selectedCategory && !e.featured)}
					{#if i == firstGameFromDiffCategory}
						{@render categorySeperator()}
					{/if}
					<GameCard {game} />
				{/each}

				<!-- Bottom detector with loading icon -->
				<div bind:this={bottomDetector} class="pointer-events-none flex min-h-10 w-full justify-center">
					{#if isLoadingMore}
						<div class="flex h-30 items-center">
							<LoaderCircle class="animate-spin opacity-75" size={40} strokeWidth={2.5} />
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>

	<!-- Footer -->
	<a
		href="https://playlight.dev"
		target="_blank"
		class="text-muted-foreground fixed right-4 bottom-4 flex items-center gap-1 text-sm transition hover:text-white"
	>
		Game dev? Join Playlight <ExternalLink size={14} />
	</a>
</div>

<style>
	:global([data-expanded]) {
		border-radius: 0 !important;
	}

	.mask-fade {
		mask-image: linear-gradient(
			to bottom,
			transparent 0%,
			rgba(0, 0, 0, 0.326) 1%,
			rgba(0, 0, 0, 0.554) 2%,
			rgba(0, 0, 0, 0.74) 3%,
			rgba(0, 0, 0, 0.86) 4%,
			rgba(0, 0, 0, 0.954) 5%,
			rgba(0, 0, 0, 0.982) 6%,
			black 7%,
			black 93%,
			rgba(0, 0, 0, 0.982) 94%,
			rgba(0, 0, 0, 0.954) 95%,
			rgba(0, 0, 0, 0.86) 96%,
			rgba(0, 0, 0, 0.74) 97%,
			rgba(0, 0, 0, 0.554) 98%,
			rgba(0, 0, 0, 0.326) 99%,
			transparent 100%
		);
	}

	.show-scrollbar {
		scrollbar-width: auto !important;
	}
</style>
