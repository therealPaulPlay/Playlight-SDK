<script>
	import { onMount } from "svelte";
	import { on } from "svelte/events";
	import { discoveryOpen, cdnURL, sidebarCollapsed } from "../store";
	import { fetchQuickSuggestions } from "../utils/quick-suggestions";
	import { openDiscovery } from "../utils/open-discovery";
	import api from "../api.js";
	import { LoaderCircle, Gamepad2, ChevronsRight, GripVertical } from "@lucide/svelte";
	import GameCard from "./GameCard.svelte";
	import CurrentGameDisplay from "./CurrentGameDisplay.svelte";
	import Button from "./ui/Button.svelte";
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

	// Persist sidebar state across page navigations on MPAs
	function saveSidebarState() {
		sessionStorage.setItem("playlightSidebarState", JSON.stringify({ collapsed: $sidebarCollapsed, buttonY }));
	}

	function getSidebarState() {
		try {
			return JSON.parse(sessionStorage.getItem("playlightSidebarState") || "{}");
		} catch {}
	}

	$effect.pre(() => {
		const isMobile = document.documentElement.clientWidth <= 768;
		$sidebarCollapsed = isMobile || Boolean(getSidebarState()?.collapsed);
	});

	onMount(async () => {
		buttonY = getSidebarState()?.buttonY ?? buttonY; // Restore button Y

		// Fetch data
		isLoading = true;
		games = await fetchQuickSuggestions(14, true);
		currentGame = await api.getCurrentGameInfo();
		isLoading = false;

		// Non-passive touch listener to prevent scrolling during button drag
		return on(window, "touchmove", handleTouchMove, { passive: false });
	});

	// Draggable button ---------------------------------------------------
	let buttonY = $state(100); // Start slightly below top
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

	let saveAfterDrag;

	function handleDragMove(clientY) {
		if (!isDragging) return;

		const deltaY = clientY - dragStartY;
		const newY = buttonStartY + deltaY;
		const buttonHeight = buttonElement?.offsetHeight; // Get actual button height
		buttonY = Math.max(0, Math.min(window.innerHeight - buttonHeight, newY)); // Constrain to screen bounds (0 to window height minus button height)
		cancelAnimationFrame(saveAfterDrag);
		saveAfterDrag = requestAnimationFrame(saveSidebarState);
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
		if (document.documentElement.clientWidth <= 768) $sidebarCollapsed = true;
	}}
/>

<!-- Sidebar (pos. relative to support z-index) -->
<div
	class="relative z-1 ml-auto flex h-dvh overflow-y-auto {$sidebarCollapsed
		? 'w-0'
		: 'w-75 border-l'} bg-background flex-col items-center gap-4 text-white transition-[width] duration-150 ease-out"
>
	<!-- Logo -->
	<img
		alt="logo"
		src={$cdnURL + "/assets/images/logo-white-small.png"}
		class="pointer-events-none mx-auto mt-4 w-50 select-none"
	/>

	<!-- Recommended games -->
	<div class="grow-1 overflow-hidden mask-y-from-90% mask-y-to-100% p-5 transition-opacity">
		{#if isLoading}
			<div class="flex h-full w-full items-center justify-center">
				<LoaderCircle class="animate-spin opacity-75" size={30} strokeWidth={2.5} />
			</div>
		{:else if games?.length}
			<div class="grid grid-cols-2 gap-5" onwheel={handleWheel}>
				{#each { length: 2 }, index}
					{@const gamesArray = index == 0 ? leftGames : rightGames}
					<div
						bind:this={scrollColumn}
						class="mt-8 flex flex-col gap-5"
						style:transform="translateY(calc(-33.333% + {scrollOffset}px))"
					>
						{#each [...gamesArray, ...gamesArray, ...gamesArray] as game}
							<GameCard {game} inSidebar={true} />
						{/each}
					</div>
				{/each}
			</div>
		{:else}
			<div class="flex h-full w-full items-center justify-center">
				<p class="text-muted-foreground">Error – See console</p>
			</div>
		{/if}
	</div>

	<!-- CTA buttons -->
	<div class="flex w-full items-center gap-4 px-4 pb-2">
		<Button class="w-full py-2.5" onclick={() => openDiscovery("sidebar")} disabled={$discoveryOpen}>
			All games <Gamepad2 style="margin-top: -1px;" />
		</Button>
	</div>

	<!-- Currently playing -->
	<div class="flex w-full border-t">
		<div class="mt-auto p-4">
			<CurrentGameDisplay {currentGame} />
		</div>
		<Button
			variant="secondary"
			class="text-muted-foreground border-l outline-none!"
			onclick={() => {
				$sidebarCollapsed = true;
				saveSidebarState();
			}}
		>
			<ChevronsRight />
		</Button>
	</div>
</div>

<!-- Draggable expand button -->
{#if $sidebarCollapsed && !$discoveryOpen}
	<div
		transition:blur
		bind:this={buttonElement}
		role="button"
		tabindex="0"
		class="bg-background/85 fixed right-0 flex items-center gap-2 border border-r-0 p-2 shadow-xl backdrop-blur-xl {isDragging
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
				if (document.documentElement.clientWidth > 768) {
					$sidebarCollapsed = false;
					saveSidebarState();
				} else openDiscovery("sidebar");
			}}
		>
			<img
				alt="icon"
				src={$cdnURL + "/assets/images/icon-white-small.png"}
				class="pointer-events-none aspect-square w-8"
			/>
		</Button>
	</div>
{/if}
