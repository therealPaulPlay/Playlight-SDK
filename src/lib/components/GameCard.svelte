<script>
	import { slide } from "svelte/transition";

	let { game, onClick } = $props();

	function handleClick() {
		if (onClick) onClick(game.id);
		window.open("https://" + game.domain, "_blank", "noopener,noreferrer"); // Open game in a new tab
	}

	let isHovered = $state(false);
	let videoElement = $state();
	let videoLoaded = $state(false);

	function handleMouseEnter() {
		isHovered = true;
		if (videoElement && game.cover_video_url) {
			videoElement.currentTime = 0;
			videoElement.play().catch((err) => console.error("Video play error:", err));
		}
	}

	// Function to handle mouse leave
	function handleMouseLeave() {
		isHovered = false;
		if (videoElement) {
			videoElement.pause();
		}
	}

	// Function to handle video loaded
	function handleVideoLoaded() {
		videoLoaded = true;
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="bg-muted highlight-border relative mb-[8%] flex aspect-[2/3] h-2/3 h-3/4 max-h-[80vw] w-1/4 cursor-pointer flex-col border-1 shadow-xl transition hover:brightness-105"
	onmouseover={handleMouseEnter}
	onfocus={handleMouseEnter}
	onmouseout={handleMouseLeave}
	onblur={handleMouseLeave}
	ontouchstart={handleMouseEnter}
	ontouchend={handleMouseLeave}
	ontouchcancel={handleMouseLeave}
	role="button"
	tabindex="0"
	onclick={handleClick}
>
	<div class="bg-background relative h-full w-full w-full overflow-hidden">
		<!-- Cover Image -->
		<img
			src={game.cover_image_url}
			alt="cover"
			class="absolute top-0 left-0 z-10 h-full w-full object-cover transition-opacity duration-300"
			style={isHovered && videoLoaded && game.cover_video_url ? "opacity: 0" : "opacity: 1"}
			loading="lazy"
		/>
		<!-- Cover Video (preloaded but initially hidden) -->
		{#if game.cover_video_url}
			<video
				bind:this={videoElement}
				src={game.cover_video_url}
				class="absolute top-0 left-0 h-full w-full object-cover"
				muted
				playsinline
				loop
				preload="auto"
				onloadeddata={handleVideoLoaded}
			></video>
		{/if}

		{#if isHovered}
			<div
				transition:slide
				id="overlay"
				class="bg-background/75 absolute right-0 bottom-0 left-0 z-20 flex max-h-1/3 flex-col overflow-hidden p-3 backdrop-blur-xl transition"
			>
				<div class="hide-scrollbar h-full w-full overflow-y-auto">
					<h3 class="mb-2 truncate text-lg font-bold">{game.name}</h3>
					<p class="text-muted-foreground mb-4 text-sm text-balance">{game.description || "No description."}</p>
				</div>
				<div class="fade-mask bg-background/75 pointer-events-none absolute right-0 bottom-0 left-0 h-8"></div>
			</div>
		{/if}
	</div>
	<img
		src={game.logo_url}
		alt="game logo"
		class="absolute right-0 -bottom-30 left-0 z-30 mx-auto h-23 w-23 rounded-full border-1 object-center transition"
		loading="lazy"
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
