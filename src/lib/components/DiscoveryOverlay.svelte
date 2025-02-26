<script>
	import { blur } from "svelte/transition";
	import { toast } from "svelte-sonner";
	import { X, ExternalLink } from "lucide-svelte";
	import GameCard from "./GameCard.svelte";
	import CategorySelector from "./CategorySelector.svelte";
	import api from "../api.js";

	// Props with Svelte 5 syntax
	let { currentGameCategory = null, selectedCategory = null, onClose, onGameClick, onCategoryChange } = $props();

	// State with Svelte 5 runes
	let isLoading = $state(true);
	let games = $state([]);
	let categories = $state([]);
	let error = $state(null);

	// Fetch data on mount and when category changes
	$effect(() => {
		fetchData();
	});

	$effect(() => {
		if (selectedCategory !== null) fetchGameSuggestions();
	});

	async function fetchData() {
		try {
			isLoading = true;
			// Fetch categories
			const fetchedCategories = await api.getCategories();
			categories = fetchedCategories;

			// Set initial category if not already set
			if (!selectedCategory && categories.length > 0) {
				if (currentGameCategory) {
					const found = categories.find((c) => c.id === currentGameCategory);
					if (found) {
						selectedCategory = currentGameCategory;
					} else {
						selectedCategory = categories[0].id;
					}
				} else {
					selectedCategory = categories[0].id;
				}
			}

			await fetchGameSuggestions();
		} catch (err) {
			error = "Failed to load discovery data.";
			toast.error(error);
			console.error(err);
		} finally {
			isLoading = false;
		}
	}

	async function fetchGameSuggestions() {
		try {
			isLoading = true;
			const suggestions = await api.getSuggestions(selectedCategory);
			games = suggestions?.games;
			const paginationInfo = suggestions?.pagination;
		} catch (err) {
			toast.error("Failed to load games: " + err);
			console.error(err);
		} finally {
			isLoading = false;
		}
	}

	function handleCategoryChange(category) {
		selectedCategory = category;
		if (onCategoryChange) onCategoryChange(category);
	}

	function handleGameClick(gameId) {
		if (onGameClick) onGameClick(gameId);
	}
</script>

<div
	class="bg-background/50 fixed inset-0 top-0 right-0 bottom-0 left-0 z-[99999] flex items-center justify-center backdrop-blur-md"
	transition:blur={{ duration: 250 }}
>
	<div class="flex h-full w-full flex-col rounded-lg text-white">
		<!-- Header -->
		<div class="flex items-center justify-between p-4">
			<img alt="logo" src="/static/images/logo_white_small.png" class="w-50" />
			<button class="text-muted-foreground mr-2 cursor-pointer hover:text-white" onclick={onClose} aria-label="Close">
				<X size={24} />
			</button>
		</div>

		<!-- Category selector -->
		<div class="bg-muted/50 mx-auto max-w-4/5 p-2 backdrop-blur">
			<CategorySelector {categories} {selectedCategory} onChange={handleCategoryChange} {isLoading} />
		</div>

		<!-- Game grid -->
		<div class="h-full w-full flex-1 items-center justify-center overflow-y-auto p-4 mt-5">
			{#if isLoading}
				<div class="flex flex-wrap items-center justify-center gap-4">
					{#each Array(6) as _, i}
						<div class="animate-pulse overflow-hidden rounded-lg bg-gray-800">
							<div class="h-40 bg-gray-700"></div>
							<div class="p-3">
								<div class="mb-2 h-6 w-3/4 rounded bg-gray-700"></div>
								<div class="h-4 w-1/2 rounded bg-gray-700"></div>
							</div>
						</div>
					{/each}
				</div>
			{:else if error}
				<div class="text-muted-foreground py-3 text-center">
					<p>An error occured: {error}</p>
				</div>
			{:else if games.length === 0}
				<div class="text-muted-foreground py-3 text-center">
					<p>No games found in this category.</p>
				</div>
			{:else}
				<div class="flex flex-wrap items-center justify-center gap-4">
					{#each games as game}
						<GameCard {game} onClick={() => handleGameClick(game.id)} />
					{/each}
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
				Game Dev? Join Playlight today <ExternalLink size={14} style="margin-top: 2px;" />
			</a>
		</div>
	</div>
</div>
