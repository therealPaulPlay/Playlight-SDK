<script>
	let { game, onClick } = $props();

	function handleClick() {
		window.open(game.domain, "_blank", "noopener,noreferrer"); // Open game in a new tab
		if (onClick) onClick(game.id);
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="bg-background flex h-full cursor-pointer flex-col overflow-hidden transition duration-200 hover:brightness-110"
	role="button"
	tabindex="0"
	onclick={handleClick}
>
	<div class="relative pt-[56.25%]">
		<!-- 16:9 aspect ratio -->
		{#if game.cover_image_url}
			<img
				src={game.cover_image_url}
				alt={game.name}
				class="absolute top-0 left-0 h-full w-full object-cover"
				loading="lazy"
			/>
		{:else}
			<div class="bg-muted absolute top-0 left-0 flex h-full w-full items-center justify-center">
				{#if game.logo_url}
					<img src={game.logo_url} alt={game.name} class="max-h-[60%] max-w-[60%] object-contain" loading="lazy" />
				{:else}
					<div class="text-lg font-bold text-gray-500">{game.name}</div>
				{/if}
			</div>
		{/if}
	</div>

	<div class="flex flex-1 flex-col p-3">
		<h3 class="mb-1 line-clamp-1 text-lg font-bold">{game.name}</h3>
		{#if game.description}
			<p class="mb-2 line-clamp-2 text-sm text-gray-400">{game.description}</p>
		{/if}
		<div class="mt-auto">
			<span class="bg-muted text-muted-foreground inline-block rounded px-2 py-1 text-xs">
				{game.category}
			</span>
		</div>
	</div>
</div>
