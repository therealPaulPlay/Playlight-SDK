<script>
	let { categories = [], selectedCategoryId = null, onChange, isLoading = false } = $props();

	function handleChange(categoryId) {
		if (onChange) onChange(categoryId);
	}
</script>

<div class="scrollbar-hide flex items-center gap-2 overflow-x-auto py-2">
	{#if isLoading}
		{#each Array(5) as _, i}
			<div class="bg-muted h-8 w-24 animate-pulse rounded-full"></div>
		{/each}
	{:else}
		{#each categories as category}
			<button
				class="rounded-full px-4 py-1 text-sm whitespace-nowrap transition-colors duration-200
                 {selectedCategoryId === category.id
					? 'bg-white text-white'
					: 'bg-muted text-gray-400 hover:brightness-110'}"
				onclick={() => handleChange(category.id)}
			>
				{category.name}
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
