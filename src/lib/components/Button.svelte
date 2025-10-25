<script>
	let { onclick, children, class: extraClasses, variant = "primary" } = $props();
</script>

<button
	class="{variant == 'primary'
		? 'bg-white text-black hover:outline outline-muted'
		: variant == 'secondary'
			? 'bg-background hover:bg-muted outline outline-muted'
			: ''} hover:bg-background text-md inline-flex cursor-pointer items-center justify-center gap-2 px-3 py-2 font-bold text-nowrap uppercase transition hover:text-white {extraClasses}"
	{onclick}
>
	{@render children?.()}
</button>
