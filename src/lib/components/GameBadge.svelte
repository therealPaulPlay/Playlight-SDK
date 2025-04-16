<!-- Badge, e.g. "NEW" or "FEATURED", displayed on game cards -->
<script>
	let { text, isHovered = false } = $props();
</script>

<div
	class="bg-background absolute top-4 right-4 z-12 px-2 py-0.5 transition-opacity select-none"
	class:opacity-0={isHovered}
>
	<p class="font-bold text-white uppercase">{text}</p>
</div>
