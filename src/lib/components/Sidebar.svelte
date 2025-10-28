<script>
	import { onMount } from "svelte";
	import { on } from "svelte/events";
	import { discoveryOpen, projectUrl } from "../store";
	import { fetchRecommendedGames } from "../utils/fetch-recommended-games";
	import api from "../api.js";
	import { LoaderCircle, Gamepad2, Dices, ChevronsRight, GripVertical, X } from "lucide-svelte";
	import GameCard from "./GameCard.svelte";
	import CurrentGameDisplay from "./CurrentGameDisplay.svelte";
	import Button from "./Button.svelte";
	import { openGame } from "../utils/open-game";
	import { blur } from "svelte/transition";

	// State
	let isLoading = $state(false);
	let collapsed = $state(false);
	let currentGame = $state();
	
	// Game arrays
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

	onMount(() => {
		if (window.innerWidth <= 768) collapsed = true; // Default to collapsed sidebar on mobile
		return on(window, "touchmove", handleTouchMove, { passive: false }); // Add non-passive touch listener to prevent scrolling during drag
	});

	// Draggable button state
	let buttonY = $state(80); // Start slightly below top
	let isDragging = $state(false);
	let dragStartY = $state(0);
	let buttonStartY = $state(0);
	let buttonElement = $state(null);

	function handleDragStart(clientY) {
		isDragging = true;
		dragStartY = clientY;
		buttonStartY = buttonY;
	}

	function handleMouseMove(e) {
		if (!isDragging) return;
		handleDragMove(e.clientY);
	}

	function handleTouchMove(e) {
		if (!isDragging) return;
		e.preventDefault();
		handleDragMove(e.touches[0].clientY);
	}

	function handleDragMove(clientY) {
		if (!isDragging) return;

		const deltaY = clientY - dragStartY;
		const newY = buttonStartY + deltaY;
		const buttonHeight = buttonElement?.offsetHeight; // Get actual button height
		buttonY = Math.max(0, Math.min(window.innerHeight - buttonHeight, newY)); // Constrain to screen bounds (0 to window height minus button height)
	}
</script>

<svelte:window
	onmousemove={handleMouseMove}
	onmouseup={() => (isDragging = false)}
	ontouchend={() => (isDragging = false)}
/>

<div
	class="fixed z-1 flex h-dvh overflow-y-auto max-md:top-0 max-md:right-0 max-md:bottom-0 md:relative md:ml-auto {collapsed
		? 'w-0 opacity-50'
		: 'w-full md:w-75'} bg-background flex-col items-center gap-12 border-l text-white transition-[width,opacity] duration-150 ease-out"
>
	<div class="w-full">
		<!-- Mobile close-->
		<div class="mx-auto flex justify-end border-b p-0 md:hidden">
			<Button
				variant="secondary"
				class="text-muted-foreground border-l outline-none!"
				onclick={() => (collapsed = true)}
			>
				<X />
			</Button>
		</div>
		<!-- Logo -->
		<img
			alt="logo"
			src={$projectUrl + "/static/images/logo-white-small.png"}
			class="pointer-events-none mx-auto mt-5 w-50 select-none"
		/>
	</div>

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
		<div class="flex justify-end p-0 max-md:hidden">
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
	<div
		transition:blur
		bind:this={buttonElement}
		role="button"
		tabindex="0"
		class="bg-background fixed right-0 flex items-center gap-2 border p-2 shadow-xl {isDragging
			? 'cursor-grabbing'
			: 'cursor-grab'}"
		style:top={buttonY + "px"}
		onmousedown={(e) => handleDragStart(e.clientY)}
		ontouchstart={(e) => handleDragStart(e.touches[0].clientY)}
	>
		<GripVertical class="text-muted-foreground aspect-square" />
		<Button variant="ghost" onclick={() => (collapsed = false)}>
			<img alt="icon" src={$projectUrl + "/static/images/icon-white-small.png"} class="aspect-square w-8" />
		</Button>
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
