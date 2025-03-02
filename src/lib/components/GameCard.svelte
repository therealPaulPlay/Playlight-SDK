<script>
	import { slide } from "svelte/transition";
	import { playSound } from "../playSound.js";
	import { projectUrl } from "../store.js";

	let { game, onClick } = $props();
	let isHovered = $state(false);
	let videoElement = $state();
	let videoLoaded = $state(false);
	let coverImageLoaded = $state(false);
	let logoImageLoaded = $state(false);
	let isLoadingVideo = $state(false);

	function handleClick() {
		onClick?.(game.id);
		window.open("https://" + game.domain, "_blank", "noopener");
	}

	function handleMouseEnter() {
		// Play hover sound
		if (!isHovered) {
			playSound($projectUrl + "/static/sounds/hover-selection.ogg", 0.25);
		}

		// Original hover logic
		isHovered = true;
		if (videoElement && game.cover_video_url) {
			isLoadingVideo = true; // Flag that we're attempting to load the video
			videoElement.play().catch((err) => console.error("Video play error:", err));
		}
	}

	function handleMouseLeave() {
		isHovered = false;
		// Only pause if it's already loaded and playing
		if (videoElement && videoLoaded) videoElement.pause();
	}

	function isNewGame(createdAtString) {
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
		const createdAt = new Date(createdAtString);
		return createdAt > sevenDaysAgo;
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="bg-muted highlight-border bg-background relative mt-5 mb-[calc(3dvh+1.5vw)] flex aspect-[2/3] h-1/2 max-h-[75vh] min-h-92 cursor-pointer flex-col border-1 shadow-xl transition hover:brightness-105 lg:h-3/7"
	onmouseenter={handleMouseEnter}
	onfocus={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	onblur={handleMouseLeave}
	ontouchstart={handleMouseEnter}
	ontouchend={handleMouseLeave}
	ontouchcancel={handleMouseLeave}
	role="button"
	tabindex="0"
	onclick={handleClick}
>
	<!-- Cover Video -->
	{#if isNewGame(game?.created_at)}
		<div
			class="bg-foreground text-background absolute top-4 right-4 z-13 px-2 py-0.5 font-bold transition-opacity"
			class:opacity-0={isHovered}
		>
			<p class="uppercase">New</p>
		</div>
	{/if}

	{#if game.cover_video_url}
		<video
			bind:this={videoElement}
			src={game.cover_video_url}
			class="absolute top-0 left-0 z-5 h-full w-full object-cover opacity-0"
			class:opacity-100={isHovered && videoLoaded && game.cover_video_url}
			muted
			playsinline
			loop
			preload="auto"
			onloadeddata={() => {
				videoLoaded = true;
				isLoadingVideo = false;
			}}
		></video>
	{/if}
	<!-- Image loading skeleton -->
	{#if !coverImageLoaded}
		<div class="bg-muted absolute top-0 left-0 h-full w-full animate-pulse"></div>
	{/if}
	<!-- Cover Image - now using opacity transition instead of display:none -->
	<img
		src={game.cover_image_url}
		alt="cover"
		class="absolute top-0 left-0 z-10 h-full w-full object-cover opacity-0 transition"
		class:opacity-100={coverImageLoaded && (!isHovered || !videoLoaded || !game.cover_video_url)}
		loading="eager"
		onload={() => {
			coverImageLoaded = true;
		}}
	/>

	{#if isHovered}
		<div
			transition:slide
			id="overlay"
			class="bg-background/75 text-foreground absolute right-0 bottom-0 left-0 z-11 flex max-h-1/3 flex-col overflow-hidden backdrop-blur-xl"
		>
			<div class="hide-scrollbar h-full w-full overflow-y-auto p-3">
				<h3 class="mb-2 truncate text-center text-lg font-bold">{game.name}</h3>
				<p class="text-muted-foreground mb-4 text-center text-sm text-balance">
					{game.description || "No description."}
				</p>
			</div>
			<div class="fade-mask bg-background/75 pointer-events-none absolute right-0 bottom-0 left-0 h-8"></div>
		</div>
	{/if}

	<!-- Logo image with opacity transition -->
	<img
		src={game.logo_url}
		alt="game logo"
		class="absolute right-0 -bottom-[18%] left-0 z-12 mx-auto aspect-square w-1/5 rounded-full border-1 object-center opacity-0 transition"
		class:opacity-100={logoImageLoaded}
		loading="eager"
		onload={() => {
			logoImageLoaded = true;
		}}
	/>
</div>

<style>
	.highlight-border:hover,
	.highlight-border:hover img {
		border-color: rgba(255, 255, 255, 0.75);
	}

	.hide-scrollbar {
		scrollbar-width: none;
	}

	.fade-mask {
		mask-image: linear-gradient(to bottom, transparent 0%, black 100%);
	}
</style>
