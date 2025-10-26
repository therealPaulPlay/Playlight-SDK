<script>
	import { onMount } from "svelte";
	import { discoveryOpen, projectUrl } from "../store";
	import { fetchRecommendedGames } from "../utils/fetch-recommended-games";
	import api from "../api.js";
	import { LoaderCircle, Gamepad2, Dices, ChevronsRight, GripVertical } from "lucide-svelte";
	import GameCard from "./GameCard.svelte";
	import CurrentGameDisplay from "./CurrentGameDisplay.svelte";
	import Button from "./Button.svelte";
	import { openGame } from "../utils/open-game";

	let isLoading = $state(false);
	let collapsed = $state(false);
	let currentGame = $state();
	let games = $state([]);

	let leftGames = $derived(games?.filter((_, i) => i % 2 === 0) || []);
	let rightGames = $derived(games?.filter((_, i) => i % 2 === 1) || []);

	onMount(async () => {
		isLoading = true;
		const categories = await api.getCategories();
		currentGame = await api.getCurrentGameInfo();
		const selectedCategory = currentGame?.category || categories?.[categories?.length - 1];
		games = await fetchRecommendedGames(selectedCategory);
		isLoading = false;
	});
</script>

<div
	class="flex h-dvh {collapsed
		? 'w-0 opacity-50 blur'
		: 'w-75'} flex-col items-center gap-12 overflow-hidden border-l bg-black text-white transition-[width_filter_opacity_display]"
>
	<img alt="logo" src={$projectUrl + "/static/images/logo-white-small.png"} class="pointer-events-none mt-5 w-50" />

	<!-- Recommended games -->
	<div class="grow-1 overflow-hidden mask-y-from-90% mask-y-to-100% p-6 py-12">
		{#if isLoading}
			<div class="flex h-full w-full items-center justify-center">
				<LoaderCircle class="animate-spin opacity-75" size={30} strokeWidth={2.5} />
			</div>
		{:else if games?.length}
			<div class="scroll-container grid grid-cols-2 gap-6">
				<div class="flex flex-col gap-6">
					<div class="animate-scroll-column flex flex-col gap-6">
						{#each [...leftGames, ...leftGames, ...leftGames] as game}
							<GameCard {game} small={true} />
						{/each}
					</div>
				</div>
				<div class="mt-15 flex flex-col gap-6">
					<div class="animate-scroll-column-offset flex flex-col gap-6">
						{#each [...rightGames, ...rightGames, ...rightGames] as game}
							<GameCard {game} small={true} />
						{/each}
					</div>
				</div>
			</div>
		{:else}
			<div class="flex h-full w-full items-center justify-center">
				<p class="text-muted-foreground">Error – See console</p>
			</div>
		{/if}
	</div>

	<!-- CTA buttons -->
	<div class="flex w-full flex-col items-center gap-3 px-4">
		<Button class="w-full" onclick={() => ($discoveryOpen = true)}>
			View all games <Gamepad2 style="margin-top: -1px;" />
		</Button>
		<div class="flex w-full items-center gap-4">
			<div class="bg-border h-px grow-1"></div>
			<p class="text-muted-foreground text-sm">Or</p>
			<div class="bg-border h-px grow-1"></div>
		</div>
		<Button
			class="w-full"
			variant="secondary"
			onclick={() => {
				const randomIndex = Math.floor(Math.random() * games?.length);
				const randomGame = games?.[randomIndex];
				openGame(randomGame?.domain, randomGame?.id);
			}}
		>
			Random game <Dices style="margin-top: -2px;" />
		</Button>
	</div>

	<!-- Currently playing -->
	<div class="w-full">
		<div class="mt-auto border-y p-6">
			<CurrentGameDisplay {currentGame} />
		</div>

		<!-- Collapse -->
		<div class="flex justify-end p-0">
			<Button
				variant="secondary"
				class="text-muted-foreground border-l outline-none!"
				onclick={() => (collapsed = true)}
			>
				<ChevronsRight />
			</Button>
		</div>
	</div>
</div>

{#if collapsed}
	<div class="bg-white shadow-xl text-black p-2 absolute right-0 top-0">
		<GripVertical />
	</div>
{/if}

<style>
	@keyframes scroll-column {
		0% {
			transform: translateY(calc(-100% / 3));
		}
		100% {
			transform: translateY(calc((-100% / 3) * 2));
		}
	}

	.animate-scroll-column,
	.animate-scroll-column-offset {
		animation: scroll-column 90s linear infinite;
		transition: opacity 200ms;
	}

	.scroll-container:hover .animate-scroll-column,
	.scroll-container:hover .animate-scroll-column-offset {
		animation-play-state: paused;
		opacity: 1;
	}
</style>
