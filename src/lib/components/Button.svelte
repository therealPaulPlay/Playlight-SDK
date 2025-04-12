<script>
	let { onclick, children, class: extraClasses } = $props();
</script>

<button
	class="bg-white hover:bg-background hover:text-white text-md cursor-pointer px-3 py-2 font-bold uppercase transition text-nowrap inline-flex items-center {extraClasses}"
	{onclick}
>
	{@render children?.()}
</button>
