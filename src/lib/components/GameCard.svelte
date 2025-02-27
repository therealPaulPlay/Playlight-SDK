<script>
	import { slide } from "svelte/transition";

	let { game, onClick } = $props();

	function handleClick() {
		if (onClick) onClick(game.id);
		window.open("https://" + game.domain, "_blank", "noopener,noreferrer"); // Open game in a new tab
	}

	let isHovered = $state(false);
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="bg-muted highlight-border relative flex h-2/3 h-full w-1/4 cursor-pointer flex-col border-1 shadow-xl transition hover:brightness-105"
	onmouseover={() => {
		isHovered = true;
	}}
	onfocus={() => {
		isHovered = true;
	}}
	onmouseout={() => {
		isHovered = false;
	}}
	onblur={() => {
		isHovered = false;
	}}
	ontouchstart={() => {
		isHovered = true;
	}}
	ontouchend={() => {
		isHovered = false;
	}}
	ontouchcancel={() => {
		isHovered = false;
	}}
	role="button"
	tabindex="0"
	onclick={handleClick}
>
	<div class="relative aspect-[2/3] h-full w-full w-full">
		<!-- Cover -->
		<img src={game.cover_image_url} alt="cover" class="object-cover" loading="lazy" />
		{#if isHovered}
			<div
				transition:slide
				id="overlay"
				class="bg-background/75 absolute right-0 bottom-0 left-0 flex max-h-1/3 flex-col overflow-hidden p-3 backdrop-blur-xl transition"
			>
				<div class="h-full w-full overflow-y-auto hide-scrollbar">
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
		class="absolute right-0 -bottom-30 left-0 mx-auto h-23 w-23 rounded-full border-1 object-center transition"
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
