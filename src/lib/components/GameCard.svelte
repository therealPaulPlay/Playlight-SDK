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
	let isTouchDevice = $state(false);
	let cardElement = $state();

	$effect(() => {
		isTouchDevice = "ontouchstart" in window;
	});

	function handleClick(e) {
		if (isTouchDevice) {
			e.preventDefault();
			return;
		}

		onClick?.(game.id);
		window.open("https://" + game.domain, "_blank", "noopener");
	}

	function playGame(e) {
		e.stopPropagation();
		e.preventDefault();
		onClick?.(game.id);
		window.open("https://" + game.domain, "_blank", "noopener");
	}

	function handleMouseEnter() {
		if (!isHovered && !isTouchDevice) {
			playSound($projectUrl + "/static/sounds/hover-selection.ogg", 0.25);
		}

		isHovered = true;
		if (videoElement && game.cover_video_url) {
			videoElement.play().catch((err) => console.error("Video play error:", err));
		}
	}

	function handleMouseLeave() {
		if (isTouchDevice) return;

		isHovered = false;
		if (videoElement && videoLoaded) {
			videoElement.pause();
		}
	}

	function handleDocumentTouch(e) {
		if (cardElement && !cardElement.contains(e.target)) {
			isHovered = false;
		}
	}

	function isNewGame(createdAtString) {
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
		const createdAt = new Date(createdAtString);
		return createdAt > sevenDaysAgo;
	}
</script>

<svelte:window ontouchstart={() => (isTouchDevice = true)} />
<svelte:document ontouchstart={handleDocumentTouch} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	bind:this={cardElement}
	class="bg-background highlight-border group relative mt-5 mb-[calc(3dvh+1.5vw)] flex aspect-[2/3] h-1/2 max-h-[75vh] min-h-92 cursor-pointer flex-col shadow-xl transition hover:outline-2 hover:brightness-105 lg:h-3/7 {coverImageLoaded
		? ''
		: 'animate-pulse'}"
	onmouseenter={handleMouseEnter}
	onfocus={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	onblur={handleMouseLeave}
	ontouchstart={handleMouseEnter}
	role="button"
	tabindex="0"
	onclick={handleClick}
>
	{#if isNewGame(game?.created_at)}
		<div class="bg-background absolute top-4 right-4 z-13 px-2 py-0.5 transition-opacity" class:opacity-0={isHovered}>
			<p class="text-primary font-bold uppercase">New</p>
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
			}}
		></video>
	{/if}

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

	{#if isTouchDevice}
		<button
			class="bg-foreground text-background hover:bg-foreground/90 absolute right-4 bottom-4 z-15 flex items-center justify-center rounded-sm px-3 py-1 font-bold uppercase transition-all"
			class:opacity-0={isHovered}
			onclick={playGame}
		>
			Play
		</button>
	{/if}

	{#if isHovered}
		<div
			transition:slide
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

	<img
		src={game.logo_url}
		alt="game logo"
		class="absolute right-0 -bottom-[18%] left-0 z-12 mx-auto aspect-square w-1/5 rounded-full object-center opacity-0 transition group-hover:outline-2"
		class:opacity-100={logoImageLoaded}
		loading="eager"
		onload={() => {
			logoImageLoaded = true;
		}}
	/>
</div>

<style>
	.highlight-border,
	.highlight-border img {
		outline-color: rgba(255, 255, 255, 0.75);
	}

	.hide-scrollbar {
		scrollbar-width: none;
	}

	.fade-mask {
		mask-image: linear-gradient(to bottom, transparent 0%, black 100%);
	}
</style>
