<script>
	import { onMount } from "svelte";
	import { on } from "svelte/events";
	import { discoveryOpen, projectUrl, sidebarCollapsed } from "../store";
	import { fetchRecommendedGames } from "../utils/fetch-recommended-games";
	import api from "../api.js";
	import { LoaderCircle, Gamepad2, Dices, ChevronsRight, GripVertical, X } from "lucide-svelte";
	import GameCard from "./GameCard.svelte";
	import CurrentGameDisplay from "./CurrentGameDisplay.svelte";
	import Button from "./ui/Button.svelte";
	import { openGame } from "../utils/open-game";
	import { blur } from "svelte/transition";

	// State
	let isLoading = $state(false);
	let currentGame = $state();

	// Scroll state for games container
	let scrollOffset = $state(0);
	let scrollColumn = $state(null);

	// Game arrays
	let games = $state([]);
	let leftGames = $derived(games?.filter((_, i) => i % 2 === 0) || []);
	let rightGames = $derived(games?.filter((_, i) => i % 2 === 1) || []);

	$effect.pre(() => {
		// Default to collapsed sidebar on mobile (before the component renders to avoid collapse animation)
		$sidebarCollapsed = window.matchMedia("(max-width: 768px)").matches;
	});

	onMount(async () => {
		isLoading = true;
		const categories = await api.getCategories();
		currentGame = await api.getCurrentGameInfo();
		const selectedCategory = currentGame?.category || categories?.[categories?.length - 1];
		games = await fetchRecommendedGames(selectedCategory);
		isLoading = false;
	});

	onMount(() => {
		return on(window, "touchmove", handleTouchMove, { passive: false }); // Add non-passive touch listener to prevent scrolling during button drag
	});

	// Draggable button ---------------------------------------------------
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

	// Handle scroll on the games container ----------------------------------
	function handleWheel(e) {
		e.preventDefault();
		scrollOffset -= e.deltaY;
		if (scrollColumn) {
			const loopHeight = scrollColumn.offsetHeight / 3;
			scrollOffset = ((scrollOffset % loopHeight) + loopHeight) % loopHeight;
		}
	}
</script>

<svelte:window
	onmousemove={handleMouseMove}
	onmouseup={() => (isDragging = false)}
	ontouchend={() => (isDragging = false)}
	onresize={() => {
		if (window.matchMedia("(max-width: 768px)").matches) $sidebarCollapsed = true;
	}}
/>

<div
	class="fixed relative z-1 flex h-dvh ml-auto overflow-y-auto {$sidebarCollapsed
		? 'w-0'
		: 'w-75 border-l'} bg-background flex-col items-center gap-12 text-white transition-[width] duration-150 ease-out"
>
	<!-- Logo -->
	<img
		alt="logo"
		src={$projectUrl + "/static/images/logo-white-small.png"}
		class="pointer-events-none mx-auto mt-5 w-50 select-none"
	/>

	<!-- Recommended games -->
	<div class="grow-1 overflow-hidden mask-y-from-90% mask-y-to-100% p-6 py-12 transition-opacity not-hover:opacity-75">
		{#if isLoading}
			<div class="flex h-full w-full items-center justify-center">
				<LoaderCircle class="animate-spin opacity-75" size={30} strokeWidth={2.5} />
			</div>
		{:else if games?.length}
			<div class="scroll-container grid grid-cols-2 gap-6" onwheel={handleWheel}>
				<div class="flex flex-col gap-6">
					<div
						bind:this={scrollColumn}
						class="animate-scroll-column flex flex-col gap-6"
						style:transform="translateY(calc(-33.333% + {scrollOffset}px))"
					>
						{#each [...leftGames, ...leftGames, ...leftGames] as game}
							<GameCard {game} small={true} />
						{/each}
					</div>
				</div>
				<div class="mt-15 flex flex-col gap-6">
					<div
						class="animate-scroll-column-offset flex flex-col gap-6"
						style:transform="translateY(calc(-33.333% + {scrollOffset}px))"
					>
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
		<Button class="w-full" onclick={() => ($discoveryOpen = true)} disabled={$discoveryOpen}>
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
				onclick={() => ($sidebarCollapsed = true)}
			>
				<ChevronsRight />
			</Button>
		</div>
	</div>
</div>

{#if $sidebarCollapsed && !$discoveryOpen}
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
		<Button
			variant="ghost"
			onclick={() => {
				if (!window.matchMedia("(max-width: 768px)").matches) $sidebarCollapsed = false;
				else $discoveryOpen = true;
			}}
		>
			<img
				alt="icon"
				src={$projectUrl + "/static/images/icon-white-small.png"}
				class="pointer-events-none aspect-square w-8"
			/>
		</Button>
	</div>
{/if}

<style>
	@keyframes scroll-column {
		0% {
			translate: 0 0;
		}
		100% {
			translate: 0 calc(-100% / 3);
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
