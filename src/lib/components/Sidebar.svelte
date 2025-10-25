<script>
	import { onMount } from "svelte";
	import { projectUrl } from "../store";
	import { fetchRecommendedGames } from "../utils/fetch-recommended-games";
	import api from "../api.js";
	import { LoaderCircle, Gamepad2, Dices } from "lucide-svelte";
	import GameCard from "./GameCard.svelte";
	import CurrentGameDisplay from "./CurrentGameDisplay.svelte";
	import Button from "./Button.svelte";

	let isLoading = $state(false);
	let currentGame = $state();
	let games = $state([]);

	let leftGames = $derived(games.filter((_, i) => i % 2 === 0));
	let rightGames = $derived(games.filter((_, i) => i % 2 === 1));

	onMount(async () => {
		isLoading = true;
		const categories = await api.getCategories();
		currentGame = await api.getCurrentGameInfo();
		const selectedCategory = currentGame?.category || categories?.[categories?.length - 1];
		games = await fetchRecommendedGames(selectedCategory);
		isLoading = false;
	});
</script>

<div class="flex h-screen w-75 flex-col items-center gap-12 border-l bg-black text-white">
	<img alt="logo" src={$projectUrl + "/static/images/logo-white-small.png"} class="pointer-events-none mt-5 w-50" />

	<!-- Recommended games -->
	<div class="max-h-2/3 grow-1 overflow-y-auto mask-y-from-90% mask-y-to-100% p-6 py-12">
		{#if isLoading}
			<div class="flex h-full w-full items-center justify-center">
				<LoaderCircle class="animate-spin opacity-75" size={30} strokeWidth={2.5} />
			</div>
		{:else}
			<div class="grid grid-cols-2 gap-6">
				<div class="flex flex-col gap-6">
					{#each leftGames as game, i}
						<GameCard {game} small={true} />
					{/each}
				</div>
				<div class="mt-15 flex flex-col gap-6">
					{#each rightGames as game, i}
						<GameCard {game} small={true} />
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- CTA buttons -->
	<div class="mt-2 flex w-full flex-col items-center gap-3 px-4">
		<Button class="w-full">
			View all games <Gamepad2 />
		</Button>
		<div class="flex w-full items-center gap-4">
			<div class="bg-border h-px grow-1"></div>
			<p class="text-muted-foreground text-sm">Or</p>
			<div class="bg-border h-px grow-1"></div>
		</div>
		<Button class="w-full" variant="secondary">
			Random game <Dices style="margin-top: -2px;" />
		</Button>
	</div>

	<!-- Currently playing -->
	<div class="mt-auto border-t p-6">
		<CurrentGameDisplay {currentGame} />
	</div>
</div>
