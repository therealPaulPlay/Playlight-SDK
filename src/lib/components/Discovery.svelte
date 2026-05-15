<script>
	import { blur, fly } from "svelte/transition";
	import { X, LoaderCircle } from "@lucide/svelte";
	import GameCard from "./GameCard.svelte";
	import api from "../api.js";
	import { onMount } from "svelte";
	import { discoveryOpen, cdnURL } from "../store.js";
	import { backOut } from "svelte/easing";

	// States
	let isLoading = $state(true);
	let isLoadingMore = $state(false);
	let loadMoreMargin = $state(1000);
	let scrollTop = $state(0);
	let showScrollHint = $state(false);
	let isScrollable = $state(false);

	// Info
	let currentGame = $state();

	// Fetch games params
	let games = $state([]);
	let page = $state(1);
	let hasMoreGames = $state(true);

	// Elements
	let observer;
	let resizeObserver;
	let bottomDetector = $state();
	let scrollContainer = $state();

	// Timeout
	let showScrollHintTimeout;

	// Initialization - set up scroll observer
	onMount(() => {
		observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMoreGames) {
					fetchGames();
				}
			},
			{ rootMargin: `${loadMoreMargin}px`, root: scrollContainer },
		);
		return () => observer?.disconnect();
	});

	// Observe bottom detector element when it becomes available
	$effect(() => {
		if (bottomDetector && observer) observer.observe(bottomDetector);
	});

	onMount(async () => {
		currentGame = await api.getCurrentGameInfo();
		isLoading = false; // Initial loading done, but loading will be set to true again by fetchGames
		await loadNewFeed();
	});

	// Track whether the scroll container has overflowing content
	onMount(() => {
		resizeObserver = new ResizeObserver(() => {
			isScrollable = scrollContainer.scrollHeight > scrollContainer.clientHeight;
		});
		resizeObserver.observe(scrollContainer);
		for (const child of scrollContainer.children) resizeObserver.observe(child);
		return () => resizeObserver.disconnect();
	});

	// Show scroll hint on discovery open, disable on discovery close
	$effect(() => {
		if ($discoveryOpen) showScrollHintTimeout = setTimeout(() => (showScrollHint = true), 750);
	});

	// Disable scroll hint on scroll
	$effect(() => {
		if (scrollTop > 0 && showScrollHint == true) {
			clearTimeout(showScrollHintTimeout);
			showScrollHint = false;
		}
	});

	async function loadNewFeed() {
		games = [];
		page = 1;
		hasMoreGames = true;
		if (currentGame?.featured_game) games.push({ ...currentGame.featured_game, featured: true });
		await fetchGames();
	}

	async function fetchGames() {
		if (isLoading || isLoadingMore) return; // If already fetching, exit
		page === 1 ? (isLoading = true) : (isLoadingMore = true);

		// Get games
		const result = await api.getSuggestions(page);

		if (result) {
			const returnedGames = result.games || [];
			const pageSize = result.pageSize;

			// Filter out duplicates
			const uniqueGames = returnedGames.filter(
				(newGame) => !games.some((existingGame) => existingGame.id === newGame.id),
			);
			games = [...games, ...uniqueGames];

			if (returnedGames.length < pageSize) hasMoreGames = false;
			else page += 1;
		}

		// Disable loading state
		isLoading = false;
		isLoadingMore = false;

		// Check if detector is still in view and should trigger another load
		if (hasMoreGames && bottomDetector && scrollContainer) {
			const rect = bottomDetector.getBoundingClientRect();
			if (rect.bottom <= scrollContainer.getBoundingClientRect().bottom + loadMoreMargin) fetchGames();
		}
	}

	function closeDiscoveryOnEmptyClick(e) {
		if (e.target === e.currentTarget && e.pointerType !== "touch") $discoveryOpen = false;
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key == "Escape") $discoveryOpen = false;
	}}
/>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="bg-background/75 fixed inset-0 top-0 right-0 bottom-0 left-0 flex flex-col justify-center text-white backdrop-blur-md"
	id="playlight-discovery"
	transition:blur={{ duration: 250 }}
	onpointerup={closeDiscoveryOnEmptyClick}
>
	<!-- Header -->
	<div class="pointer-events-none absolute top-0 right-0 left-0 z-1 flex items-center justify-between p-4">
		<img
			alt="logo"
			src={$cdnURL + "/assets/images/logo-white-small.png"}
			class="pointer-events-none ml-3 w-50 transition-[filter] select-none max-sm:w-40"
			style:filter="drop-shadow(0 0 25px rgba(0,0,0,{Math.min(0.6, scrollTop / 200)}))"
		/>
		<div
			class="mt-3.5 mr-4 flex items-center justify-evenly gap-8 overflow-hidden transition-[filter] max-sm:mt-3"
			style:filter="drop-shadow(0 0 25px rgba(0,0,0,{Math.min(0.6, scrollTop / 200)}))"
		>
			<button class="cursor-pointer text-white transition hover:opacity-50" onclick={() => ($discoveryOpen = false)}>
				<X size={24} strokeWidth={2.5} />
			</button>
		</div>
	</div>

	<!-- Scroll hint -->
	{#if showScrollHint && isScrollable}
		<div
			role="menu"
			tabindex="0"
			transition:fly={{ y: 100, easing: backOut, duration: 500 }}
			class="bg-foreground fixed right-6 bottom-6 left-6 z-2 mx-auto flex w-fit max-w-[calc(100%-2rem)] flex-wrap items-center gap-4 overflow-hidden p-4 shadow-lg backdrop-blur-xl max-lg:hidden"
		>
			<svg
				width="18px"
				height="28px"
				viewBox="-10 -10 267 410"
				version="1.1"
				xmlns="http://www.w3.org/2000/svg"
				xmlns:xlink="http://www.w3.org/1999/xlink"
				style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:1.5;"
			>
				<circle id="wheel" cx="123.359" cy="125" r="44" style="fill:hsl(var(--playlight-background));" />
				<path
					id="mouse"
					d="M236.717,123.359c0,-62.565 -50.794,-113.359 -113.358,-113.359c-62.565,0 -113.359,50.794 -113.359,113.359l0,143.237c0,62.565 50.794,113.359 113.359,113.359c62.564,0 113.358,-50.794 113.358,-113.359l0,-143.237Z"
					style="fill:none;stroke:hsl(var(--playlight-background));stroke-width:32px;"
				/>
			</svg>
			<p class="text-background truncate text-lg font-semibold text-nowrap">Scroll to view more</p>
		</div>
	{/if}

	<!-- Game grid -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="mask-fade relative h-full w-full overflow-y-auto overscroll-contain p-4 pt-18 sm:pt-22"
		bind:this={scrollContainer}
		onpointerup={closeDiscoveryOnEmptyClick}
		onscroll={(e) => (scrollTop = e.currentTarget.scrollTop)}
	>
		{#if isLoading && games.length === 0}
			<div class="flex h-4/5 items-center justify-center gap-4">
				<LoaderCircle class="animate-spin opacity-75" size={50} strokeWidth={2.25} />
			</div>
		{:else if games.length === 0 && !isLoading}
			<div class="pointer-events-none flex h-4/5 items-center justify-center gap-4">
				<p class="text-white">No games found that match the filter.</p>
			</div>
		{:else}
			<div
				class="pointer-events-none container mx-auto flex h-fit flex-wrap content-start justify-center gap-14 sm:!px-14 2xl:!max-w-[1420px]"
			>
				{#each games as game, i}
					<GameCard {game} />
				{/each}

				<!-- Bottom detector with loading icon -->
				<div bind:this={bottomDetector} class="pointer-events-none flex h-8 w-full justify-center">
					{#if isLoadingMore}
						<div class="flex h-30 items-center">
							<LoaderCircle class="animate-spin opacity-75" size={40} strokeWidth={2.5} />
						</div>
					{/if}
				</div>
			</div>
		{/if}
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

	@keyframes scroll {
		0% {
			transform: translateY(0);
			opacity: 0;
		}
		20%,
		80% {
			opacity: 1;
		}
		100% {
			transform: translateY(70px);
			opacity: 0;
		}
	}

	svg #wheel {
		animation: scroll ease-in-out 1.5s infinite;
	}
</style>
