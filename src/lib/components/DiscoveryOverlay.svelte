<script>
	import { blur } from "svelte/transition";
	import { toast } from "svelte-sonner";
	import { X, ExternalLink, LoaderCircle } from "lucide-svelte";
	import GameCard from "./GameCard.svelte";
	import api from "../api.js";
	import Navigation from "./Navigation.svelte";
	import { onMount } from "svelte";
	import { discoveryOpen, projectUrl } from "../store.js";
	import GameCategorySeperator from "./GameCategorySeperator.svelte";
	import CurrentGameDisplay from "./CurrentGameDisplay.svelte";

	let { showIntentToggle = true } = $props();
	let exitIntentEnabled = $state(true);

	let selectedCategory = $state();
	let isLoading = $state(true);
	let isLoadingMore = $state(false);

	let currentGame = $state();
	let games = $state([]);
	let categories = $state([]);

	let page = $state(1);
	let hasMoreGames = $state(true);
	let loadingRef = $state();
	let fetchAllGames = $state(false);
	let observer;

	// Initialization
	onMount(() => {
		exitIntentEnabled = !Boolean(localStorage.getItem("playlight_exit_intent_disabled_by_user"));

		// Setup scroll observer
		observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMoreGames && !isLoading && !isLoadingMore) {
					fetchGames();
				}
			},
			{ rootMargin: "200px" },
		);
		return () => observer?.disconnect();
	});

	onMount(async () => {
		currentGame = await api.getCurrentGameInfo();
		await fetchCategories();
	});

	// Handle category change
	$effect(() => {
		if (!selectedCategory) return;

		games = [];
		page = 1;
		hasMoreGames = true;
		fetchAllGames = false;
		isLoading = true;

		// Delay fetch to prevent rapid requests
		setTimeout(async () => {
			await fetchGames();
			if (games.length < 10) await fetchGames();
		}, 100);
	});

	// Observe loading element when it becomes available
	$effect(() => {
		if (loadingRef && observer) {
			observer.observe(loadingRef);
		}
	});

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
		if (isLoading && page > 1) return;
		if (isLoadingMore) return;

		try {
			page === 1 ? (isLoading = true) : (isLoadingMore = true);

			// Get games (null category = all games)
			const categoryToUse = fetchAllGames ? null : selectedCategory;
			const result = await api.getSuggestions(categoryToUse, page);
			const newGames = result?.games || [];

			// Filter out duplicates
			const uniqueGames = newGames.filter((newGame) => !games.some((existingGame) => existingGame.id === newGame.id));
			games = [...games, ...uniqueGames];

			if (newGames.length < 10) {
				if (!fetchAllGames && selectedCategory) {
					// Try with all games
					fetchAllGames = true;
					page = 1;
					setTimeout(() => fetchGames(), 100);
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

			// For Chrome: manually check if element is still in view and should trigger another load
			if (hasMoreGames && loadingRef) {
				setTimeout(() => {
					const rect = loadingRef.getBoundingClientRect();
					const isVisible =
						rect.top >= -200 && // Include rootMargin
						rect.left >= 0 &&
						rect.bottom <= window.innerHeight + 200 && // Include rootMargin
						rect.right <= window.innerWidth;

					if (isVisible && !isLoading && !isLoadingMore) {
						fetchGames();
					}
				}, 150);
			}
		}
	}
</script>

<svelte:document
	onkeydown={(e) => {
		if (e.key == "Escape") $discoveryOpen = false;
	}}
/>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="bg-background/75 fixed inset-0 top-0 right-0 bottom-0 left-0 z-99999 flex flex-col justify-center text-white backdrop-blur-md"
	id="playlight-discovery"
	transition:blur={{ duration: 250 }}
	onclick={(e) => {
		if (e.target === e.currentTarget) $discoveryOpen = false;
	}}
	role="menu"
	tabindex="0"
>
	<!-- Header -->
	<div class="pointer-events-none ml-2 flex items-center justify-between p-4">
		<a href="https://playlight.dev" target="_blank"
			><img alt="logo" src={$projectUrl + "/static/images/logo-white-small.png"} class="w-50" /></a
		>
		<div class="mt-4 mr-2 flex items-center justify-evenly gap-8 overflow-hidden md:mr-4">
			{#if showIntentToggle}
				<button
					class="cursor-pointer truncate text-sm text-nowrap opacity-50 transition hover:opacity-25 max-md:hidden"
					onclick={() => {
						localStorage.getItem("playlight_exit_intent_disabled_by_user")
							? localStorage.removeItem("playlight_exit_intent_disabled_by_user")
							: localStorage.setItem("playlight_exit_intent_disabled_by_user", true);
						exitIntentEnabled = !exitIntentEnabled;
					}}
				>
					<p class="bg-background/50 text-primary p-1 px-2 text-sm">
						{exitIntentEnabled ? "Don't show on exit" : "Do show on exit"}
					</p>
				</button>
			{/if}
			<button
				class="cursor-pointer text-white transition hover:opacity-50"
				onclick={() => ($discoveryOpen = false)}
				aria-label="Close"
			>
				<X size={24} strokeWidth={2.5} />
			</button>
		</div>
	</div>

	<!-- Category selector -->
	<div class="mx-auto p-2 px-5">
		<Navigation {categories} bind:selectedCategory />
	</div>

	<!-- Current game display -->
	<CurrentGameDisplay {currentGame} />

	<!-- Game grid -->
	<div class="mask-fade no-scrollbar pointer-events-none relative h-full w-full overflow-y-auto p-4">
		{#if isLoading && games.length === 0}
			<div class="flex h-4/5 items-center justify-center gap-4">
				<LoaderCircle class="animate-spin opacity-75" size={50} strokeWidth={2.5} />
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
					<GameCard {game} onClick={() => api.trackClick(game.id)} />
				{/each}

				<!-- Loading indicator -->
				<div bind:this={loadingRef} class="flex h-10 w-full justify-center">
					{#if isLoadingMore}
						<LoaderCircle class="animate-spin opacity-75" size={30} strokeWidth={2.5} />
					{/if}
				</div>
			</div>
		{/if}
	</div>

	<!-- Footer -->
	<div class="fixed right-4 bottom-4 flex items-center justify-between">
		<a
			href="https://playlight.dev"
			target="_blank"
			class="text-muted-foreground flex items-center gap-1 text-sm transition hover:text-white"
		>
			Join Playlight <ExternalLink size={14} />
		</a>
	</div>
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

	.no-scrollbar {
		scrollbar-width: none;
	}
</style>
