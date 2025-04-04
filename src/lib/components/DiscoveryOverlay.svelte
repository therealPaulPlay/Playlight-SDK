<script>
	import { blur } from "svelte/transition";
	import { toast } from "svelte-sonner";
	import { X, ExternalLink, LoaderCircle } from "lucide-svelte";
	import GameCard from "./GameCard.svelte";
	import api from "../api.js";
	import Navigation from "./Navigation.svelte";
	import { onMount } from "svelte";
	import { discoveryOpen, exitIntentDisabledByUser, projectUrl } from "../store.js";
	import GameCategorySeperator from "./GameCategorySeperator.svelte";
	import CurrentGameDisplay from "./CurrentGameDisplay.svelte";

	let { showIntentToggle = true } = $props();

	let selectedCategory = $state();
	let isLoading = $state(false);
	let isLoadingMore = $state(false);

	let currentGame = $state();
	let games = $state([]);
	let categories = $state([]);

	let page = $state(1);
	let hasMoreGames = $state(true);
	let bottomDetector = $state();
	let fetchAllGames = $state(false);
	let observer;

	// Initialization - set up scroll observer
	onMount(() => {
		observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMoreGames) {
					fetchGames();
				}
			},
			{ rootMargin: "200px" },
		);
		return () => observer?.disconnect();
	});

	// Observe loading element when it becomes available
	$effect(() => {
		if (bottomDetector && observer) observer.observe(bottomDetector);
	});

	onMount(async () => {
		currentGame = await api.getCurrentGameInfo();
		await fetchCategories();
		await loadNewFeed();
	});

	async function loadNewFeed() {
		games = [];
		page = 1;
		hasMoreGames = true;
		fetchAllGames = false;
		await fetchGames();
		if (games.length < 10) await fetchGames();
	}

	async function fetchCategories() {
		categories = await api.getCategories();
		if (!selectedCategory && categories?.length > 0) {
			selectedCategory =
				currentGame?.category && categories?.includes(currentGame?.category)
					? currentGame?.category
					: categories?.[categories?.length - 1];
		}
	}

	async function fetchGames() {
		if (isLoading || isLoadingMore) return; // If already fetching, exit
		try {
			page === 1 ? (isLoading = true) : (isLoadingMore = true);

			// Get games (null category = all games)
			const categoryToUse = fetchAllGames ? null : selectedCategory;
			const result = await api.getSuggestions(categoryToUse, page);
			const returnedGames = result?.games || [];

			// Filter out duplicates
			const uniqueGames = returnedGames.filter(
				(newGame) => !games.some((existingGame) => existingGame.id === newGame.id),
			);
			games = [...games, ...uniqueGames];

			if (returnedGames.length < 10) {
				if (!fetchAllGames && selectedCategory) {
					fetchAllGames = true;
					page = 1;
					fetchGames();
				} else {
					hasMoreGames = false;
				}
			} else {
				page += 1;
			}
		} catch (err) {
			console.error(err);
			toast.error("Failed to load games: " + err);
		} finally {
			isLoading = false;
			isLoadingMore = false;
		}
	}

	function closeDiscoveryOnEmptyClick(e) {
		if (e.target === e.currentTarget) $discoveryOpen = false;
	}
</script>

<svelte:document
	onkeydown={(e) => {
		if (e.key == "Escape") $discoveryOpen = false;
	}}
/>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="bg-background/75 fixed inset-0 top-0 right-0 bottom-0 left-0 z-99999 flex flex-col justify-center text-white backdrop-blur-md"
	id="playlight-discovery"
	transition:blur={{ duration: 250 }}
	onclick={closeDiscoveryOnEmptyClick}
>
	<!-- Header -->
	<div class="pointer-events-none ml-2 flex items-center justify-between p-4">
		<img
			alt="logo"
			src={$projectUrl + "/static/images/logo-white-small.png"}
			class="pointer-events-none w-50 max-sm:w-40"
		/>
		<div class="mt-4 mr-2 flex items-center justify-evenly gap-8 overflow-hidden max-sm:mt-3.5 sm:mr-4">
			{#if showIntentToggle && !$exitIntentDisabledByUser}
				<div transition:blur>
					<button
						class="bg-background/25 text-muted-foreground cursor-pointer truncate p-1 px-2 text-sm font-normal text-nowrap transition hover:opacity-50 max-sm:hidden"
						onclick={() => {
							$exitIntentDisabledByUser = true;
							$discoveryOpen = false;
						}}
					>
						Don't show on exit
					</button>
				</div>
			{/if}
			<button class="cursor-pointer text-white transition hover:opacity-50" onclick={() => ($discoveryOpen = false)}>
				<X size={24} strokeWidth={2.5} />
			</button>
		</div>
	</div>

	<!-- Category selector -->
	<div class="mx-auto px-5 py-6 max-sm:py-1">
		<Navigation {categories} onCategoryChange={loadNewFeed} bind:selectedCategory />
	</div>

	<!-- Current game display -->
	<CurrentGameDisplay {currentGame} />

	<!-- Game grid -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="mask-fade relative h-full w-full overflow-y-auto p-4" onclick={closeDiscoveryOnEmptyClick}>
		{#if isLoading && games.length === 0}
			<div class="flex h-4/5 items-center justify-center gap-4">
				<LoaderCircle class="animate-spin opacity-75" size={50} strokeWidth={2.25} />
			</div>
		{:else if games.length === 0 && !isLoading}
			<div class="text-muted-foreground flex h-4/5 items-center justify-center gap-4">
				<p>No games found that match the filter.</p>
			</div>
		{:else}
			<div class="mx-auto flex h-full flex-wrap content-start justify-center gap-10 lg:max-w-4/5">
				{#each games as game, i}
					{@const firstGameFromAnotherCategoryIndex = games.findIndex((e) => e.category !== selectedCategory)}
					{#if i == firstGameFromAnotherCategoryIndex}
						<GameCategorySeperator />
					{/if}
					<GameCard {game} />
				{/each}

				<!-- Bottom detector with loading icon -->
				<div bind:this={bottomDetector} class="flex min-h-10 w-full justify-center">
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
</style>
