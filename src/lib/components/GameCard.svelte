<script>
	import { slide } from "svelte/transition";
	import { playSound } from "../utils/play-sound.js";
	import { projectUrl } from "../store.js";
	import { Info } from "lucide-svelte";
	import { openGame } from "../utils/open-game.js";

	let { game, compact = false, small = false } = $props();

	// State
	let isHovered = $state(false);
	let isFullyHovered = $state(false);
	let isTouchDevice = $state(false);
	let coverImageLoaded = $state(false);
	let logoImageLoaded = $state(false);

	// Timeout
	let hoverTimeout;

	// Elements
	let videoElement = $state();
	let videoLoaded = $state(false);
	let cardElement = $state();

	function handleHover() {
		if (!isHovered && !isTouchDevice) playSound($projectUrl + "/static/sounds/hover-selection.ogg", 0.25);
		isHovered = true;
		clearTimeout(hoverTimeout);
		hoverTimeout = setTimeout(() => (isFullyHovered = true), 300);
		if (videoElement && game.cover_video_url) videoElement.play().catch((err) => console.error("Video error:", err));
	}

	function handleUnhover() {
		if (videoElement && videoLoaded) videoElement.pause();
		isHovered = false;
		clearTimeout(hoverTimeout);
		isFullyHovered = false;
	}

	function isNewGame(createdAtString) {
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
		const createdAt = new Date(createdAtString);
		return createdAt > sevenDaysAgo;
	}
</script>

<svelte:window
	ontouchstart={(e) => {
		if (cardElement && !cardElement.contains(e.target)) handleUnhover();
	}}
	onpointerdown={(event) => (isTouchDevice = event.pointerType === "touch")}
	onpointermove={(event) => (isTouchDevice = event.pointerType === "touch")}
/>

<!-- Badge like NEW or FEATURED -->
{#snippet gameBadge(isHovered, text)}
	<div
		class="bg-background absolute top-4 right-4 z-12 px-2 py-0.5 transition-opacity select-none"
		class:opacity-0={isHovered}
	>
		<p class="font-bold text-white uppercase">{text}</p>
	</div>
{/snippet}

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	bind:this={cardElement}
	class="highlight-border group relative flex aspect-[2/3] cursor-pointer flex-col shadow-xl transition hover:outline-2 {coverImageLoaded
		? ''
		: 'animate-pulse'} {small ? 'h-42' : compact ? 'h-62' : 'h-92'} {small
		? 'bg-muted'
		: 'bg-background mt-5 mb-[calc(3dvh+1.5vw)]'}"
	onmouseenter={handleHover}
	onmouseleave={handleUnhover}
	role="button"
	tabindex="0"
	onclick={() => {
		if (isTouchDevice && !isFullyHovered && !small) {
			handleHover();
			return;
		}
		openGame(game.domain, game.id);
	}}
>
	{#if game?.featured}
		{@render gameBadge(isHovered, "Featured")}
	{:else if isNewGame(game?.created_at)}
		{@render gameBadge(isHovered, "New")}
	{/if}

	{#if game.cover_video_url}
		<video
			bind:this={videoElement}
			src={game.cover_video_url}
			class="absolute top-0 left-0 z-5 aspect-[2/3] w-full object-cover opacity-0"
			class:opacity-100={isHovered && videoLoaded && game.cover_video_url}
			muted
			playsinline
			loop
			fetchpriority="low"
			onloadeddata={() => {
				videoLoaded = true;
			}}
		></video>
	{/if}

	<img
		src={game.cover_image_url}
		alt="cover"
		class="prevent-image-select absolute top-0 left-0 z-10 aspect-[2/3] w-full object-cover opacity-0 transition"
		class:opacity-100={coverImageLoaded && (!isHovered || !videoLoaded || !game.cover_video_url)}
		fetchpriority="high"
		onload={() => {
			coverImageLoaded = true;
		}}
	/>

	{#if isHovered && !small}
		<div
			transition:slide
			class="bg-background/75 absolute right-0 bottom-0 left-0 z-11 flex max-h-1/3 flex-col overflow-hidden text-white backdrop-blur-xl"
		>
			<div class="h-full w-full overflow-y-auto p-3">
				<h3 class="mb-2 truncate text-center text-lg font-bold">{game.name}</h3>
				<p class="text-muted-foreground mb-4 text-center text-sm text-balance">
					{game.description || "No description."}
				</p>
			</div>
			{#if isTouchDevice}
				<div
					class="bg-background/25 text-muted-foreground z-12 flex items-center justify-center gap-1 border-t p-1 px-2 text-sm"
				>
					<Info size={15} />
					<p class="text-muted-foreground text-sm">Tap again to open</p>
				</div>
			{/if}
			<div
				class="bg-background/75 pointer-events-none absolute right-0 mask-t-from-0% mask-t-to-100% {isTouchDevice
					? 'bottom-7'
					: 'bottom-0'} left-0 h-8"
			></div>
		</div>
	{/if}

	{#if !small}
		<!-- Skeleton for circular image -->
		<div
			class="prevent-image-select bg-background absolute right-0 -bottom-[18%] left-0 z-9 mx-auto aspect-square w-1/5 animate-pulse rounded-full shadow-xl"
		></div>
		<img
			src={game.logo_url}
			alt="game logo"
			class="prevent-image-select absolute right-0 -bottom-[18%] left-0 z-10 mx-auto aspect-square w-1/5 overflow-hidden rounded-full object-center opacity-0 transition group-hover:outline-2"
			class:opacity-100={logoImageLoaded}
			fetchpriority="high"
			onload={() => {
				logoImageLoaded = true;
			}}
		/>
	{/if}
</div>

<style>
	.highlight-border,
	.highlight-border img {
		outline-color: rgba(255, 255, 255, 0.75);
	}

	/* this also prevents 3d-touch / haptic touch on ios */
	.prevent-image-select {
		user-select: none;
		-webkit-touch-callout: none;
	}
</style>
