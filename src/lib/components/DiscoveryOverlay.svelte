<script>
	import { blur } from "svelte/transition";
	import { toast } from "svelte-sonner";
	import { X, ExternalLink, LoaderCircle } from "lucide-svelte";
	import GameCard from "./GameCard.svelte";
	import api from "../api.js";
	import Navigation from "./Navigation.svelte";
	import { onMount } from "svelte";
	import { discoveryOpen } from "../store.js";

	let { currentGameCategory = null, selectedCategory = $bindable() } = $props();

	let isLoading = $state(true);
	let games = $state([]);
	let categories = $state([]);
	let exitIntentEnabled = $state(true);

	// Fetch data on mount and when category changes
	$effect(() => {
		fetchedCategories();
		if (selectedCategory !== null) fetchGameSuggestions();
	});

	async function fetchedCategories() {
		try {
			// Fetch categories
			const fetchedCategories = await api.getCategories();
			categories = fetchedCategories;

			// Set initial category if not already set
			if (!selectedCategory && categories.length > 0) {
				if (currentGameCategory) {
					const found = categories.find((c) => c === currentGameCategory);
					selectedCategory = found ? currentGameCategory : categories[0];
				} else {
					selectedCategory = categories[0];
				}
			}

			await fetchGameSuggestions();
		} catch (err) {
			console.error(err);
			toast.error(err);
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

	onMount(() => {
		exitIntentEnabled = !Boolean(localStorage.getItem("playlight_exit_intent_disabled_by_user"));
	});
</script>

<div
	class="bg-background/75 fixed inset-0 top-0 right-0 bottom-0 left-0 z-99999 flex items-center justify-center backdrop-blur-md"
	transition:blur={{ duration: 250 }}
>
	<div class="flex h-full w-full flex-col rounded-lg text-white">
		<!-- Header -->
		<div class="flex items-center justify-between p-4">
			<img alt="logo" src="/static/images/logo_white_small.png" class="w-50" />
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
					<p>{exitIntentEnabled ? "Ignore exit intent" : "Trigger on exit intent"}</p>
				</button>
				<button
					class="cursor-pointer text-white shadow-xl transition hover:opacity-50"
					onclick={() => {
						$discoveryOpen = false;
					}}
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
		<div class="relative mb-7 h-full w-full flex-1 items-center justify-center p-4">
			{#if isLoading}
				<div class="flex h-4/5 items-center justify-center gap-4">
					<LoaderCircle class="animate-spin opacity-75" size={50} strokeWidth={2.5} />
				</div>
			{:else if games.length === 0}
				<div class="text-muted-foreground flex h-4/5 items-center justify-center gap-4">
					<p>No games found that match the filter.</p>
				</div>
			{:else}
				<div class="flex h-full min-h-full w-full flex-wrap items-center justify-center gap-10 overflow-x-auto">
					{#each games as game}
						<GameCard
							{game}
							onClick={() => {
								api.trackClick(game.id);
							}}
						/>
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
				Game Developer? Join Playlight <ExternalLink size={14} style="margin-top: 1px;" />
			</a>
		</div>
	</div>
</div>

<style>
	:global([data-expanded]) {
		border-radius: 0 !important;
	}
</style>
