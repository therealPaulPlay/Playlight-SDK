<script>
	import { blur } from "svelte/transition";
	import { toast } from "svelte-sonner";
	import { X, ExternalLink, LoaderCircle } from "lucide-svelte";
	import GameCard from "./GameCard.svelte";
	import api from "../api.js";
	import Navigation from "./Navigation.svelte";
	import { onMount } from "svelte";
	import { discoveryOpen } from "../store.js";

	let selectedCategory = $state();
	let isLoading = $state(true);
	let isLoadingMore = $state(false);
	let currentGameCategory = $state();
	let games = $state([]);
	let categories = $state([]);
	let exitIntentEnabled = $state(true);
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
		const currentGame = await api.getCurrentGameInfo();
		currentGameCategory = currentGame?.category;
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
		try {
			categories = await api.getCategories();
			if (!selectedCategory && categories.length > 0) {
				selectedCategory =
					currentGameCategory && categories.includes(currentGameCategory) ? currentGameCategory : categories[0];
			}
		} catch (err) {
			console.error(err);
			toast.error(err);
		}
	}

	async function fetchGames() {
		if (isLoading && page > 1) return;
		if (isLoadingMore) return;

		try {
			page === 1 ? (isLoading = true) : (isLoadingMore = true);

			// Get games (null category = all games)
			const categoryToUse = fetchAllGames ? null : selectedCategory;
			const result = await api.getSuggestions(categoryToUse, page, window.location.hostname);
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
		}
	}
</script>

<svelte:document
	onkeydown={(e) => {
		if (e.key == "Escape") $discoveryOpen = false;
	}}
/>

<div
	class="bg-background/75 fixed inset-0 top-0 right-0 bottom-0 left-0 z-99999 flex flex-col justify-center text-white backdrop-blur-md"
	transition:blur={{ duration: 250 }}
>
	<!-- Header -->
	<div class="flex items-center justify-between p-4 ml-2">
		<a href="https://playlight.dev" target="_blank"
			><img alt="logo" src="/static/images/logo_white_small.png" class="w-50" /></a
		>
		<div class="mt-4 mr-2 flex items-center justify-evenly gap-8 overflow-hidden md:mr-4">
			<button
				class="cursor-pointer truncate text-sm text-nowrap text-white opacity-50 transition hover:opacity-25 max-md:hidden"
				onclick={() => {
					localStorage.getItem("playlight_exit_intent_disabled_by_user")
						? localStorage.removeItem("playlight_exit_intent_disabled_by_user")
						: localStorage.setItem("playlight_exit_intent_disabled_by_user", true);
					exitIntentEnabled = !exitIntentEnabled;
				}}
			>
				<p class="bg-background/50 p-1 px-2">{exitIntentEnabled ? "Ignore exit intent" : "Trigger on exit intent"}</p>
			</button>
			<button
				class="cursor-pointer text-white transition hover:opacity-50"
				onclick={() => ($discoveryOpen = false)}
				aria-label="Close"
			>
				<X size={24} />
			</button>
		</div>
	</div>

	<!-- Category selector -->
	<div class="mx-auto p-2 px-5">
		<Navigation {categories} bind:selectedCategory />
	</div>

	<!-- Game grid -->
	<div class="mask-fade relative h-full w-full overflow-y-auto p-4">
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
	<div class="fixed right-0 bottom-0 flex items-center justify-between p-4">
		<a
			href="https://playlight.dev"
			target="_blank"
			class="text-muted-foreground flex items-center gap-1 text-sm transition hover:text-white"
		>
			Game Developer? Join Playlight <ExternalLink size={14} style="margin-top: 1px;" />
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
</style>
