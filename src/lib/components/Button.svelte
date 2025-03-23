<script>
	let { onclick, children, class: extraClasses } = $props();
</script>

<button
	class="bg-foreground hover:bg-background hover:text-primary text-md cursor-pointer px-3 py-2 font-bold uppercase transition ${extraClasses}"
	{onclick}
>
	{@render children?.()}
</button>
