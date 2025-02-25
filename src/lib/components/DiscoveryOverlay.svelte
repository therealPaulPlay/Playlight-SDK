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
				// Try to use current game category if available
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
			error = "Failed to load discovery data";
			toast.error(error);
			console.error(err);
		} finally {
			isLoading = false;
		}
	}

	async function fetchGameSuggestions() {
		try {
			isLoading = true;
			games = await api.getSuggestions(selectedCategory);
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

<div class="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75" transition:blur={{ duration: 200 }}>
	<div class="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-gray-900 text-white shadow-xl">
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-gray-800 p-4">
			<h2 class="text-xl font-bold">Discover Games</h2>
			<button class="text-gray-400 hover:text-white" onclick={onClose} aria-label="Close">
				<X size={24} />
			</button>
		</div>

		<!-- Category selector -->
		<div class="border-b border-gray-800 px-4 py-2">
			<CategorySelector
				{categories}
				selectedCategoryId={selectedCategory}
				onChange={handleCategoryChange}
				{isLoading}
			/>
		</div>

		<!-- Game grid -->
		<div class="flex-1 overflow-y-auto p-4">
			{#if isLoading}
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
				<div class="py-8 text-center text-red-400">
					<p>{error}</p>
					<button class="mt-4 rounded bg-violet-600 px-4 py-2 hover:bg-violet-700" onclick={fetchData}>
						Try Again
					</button>
				</div>
			{:else if games.length === 0}
				<div class="py-8 text-center text-gray-400">
					<p>No games found in this category</p>
				</div>
			{:else}
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each games as game}
						<GameCard {game} onClick={() => handleGameClick(game.id)} />
					{/each}
				</div>
			{/if}
		</div>

		<!-- Footer -->
		<div class="flex items-center justify-between border-t border-gray-800 p-4">
			<a
				href="https://playlight.dev"
				target="_blank"
				rel="noopener noreferrer"
				class="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
			>
				Developer? Join Playlight today <ExternalLink size={14} />
			</a>
			<div class="text-sm text-gray-500">Powered by Playlight</div>
		</div>
	</div>
</div>
