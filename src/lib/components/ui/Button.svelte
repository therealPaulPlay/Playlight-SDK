<script>
	let { onclick, children, class: extraClasses, disabled = false, variant = "primary", size = "md", uppercase = true } = $props();
</script>

<button
	{disabled}
	class="{variant == 'primary'
		? 'outline-muted bg-foreground text-black hover:outline'
		: variant == 'secondary'
			? 'bg-background hover:bg-muted outline-muted outline'
			: variant == 'ghost'
				? 'hover:opacity-50'
				: ''} inline-flex cursor-pointer items-center justify-center {variant !== 'ghost'
		? 'hover:bg-background'
		: ''} {size == 'lg' ? 'gap-3 p-4 text-lg font-semibold' : 'gap-2 px-3 py-2 text-md font-bold'} text-nowrap {uppercase ? 'uppercase' : ''} transition hover:text-white {disabled
		? 'pointer-events-none opacity-50'
		: ''} {extraClasses}"
	{onclick}
>
	{@render children?.()}
</button>
