<script>
	let { categories = [], selectedCategory = null, onChange, isLoading = false } = $props();

	function handleChange(categoryId) {
		if (onChange) onChange(categoryId);
	}
</script>

<div class="scrollbar-hide mx-auto flex items-center gap-2 overflow-x-auto">
	{#if isLoading}
		{#each Array(5) as _, i}
			<div class="bg-muted h-10 w-16 animate-pulse"></div>
		{/each}
	{:else}
		{#each categories as category}
			<button
				class="h-10 cursor-pointer px-4 py-1 text-sm whitespace-nowrap transition duration-200 hover:brightness-110
                 {selectedCategory === category ? 'bg-white text-black' : 'bg-muted text-muted-foreground'}"
				onclick={() => handleChange(category)}
			>
				{category}
			</button>
		{/each}
	{/if}
</div>

<style>
	/* Hide scrollbar but allow scrolling */
	.scrollbar-hide {
		scrollbar-width: none;
	}
</style>
