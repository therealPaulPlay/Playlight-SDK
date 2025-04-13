<script>
	let { onclick, children, class: extraClasses } = $props();
</script>

<button
	class="hover:bg-background text-md inline-flex cursor-pointer items-center bg-white px-3 py-2 font-bold text-nowrap text-black uppercase transition hover:text-white {extraClasses}"
	{onclick}
>
	{@render children?.()}
</button>
