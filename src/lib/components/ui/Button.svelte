<script>
	let { onclick, children, class: extraClasses, disabled = false, variant = "primary" } = $props();
</script>

<button
	{disabled}
	class="{variant == 'primary'
		? 'outline-muted bg-white text-black hover:outline'
		: variant == 'secondary'
			? 'bg-background hover:bg-muted outline-muted outline'
			: variant == 'ghost'
				? 'hover:opacity-50'
				: ''} text-md inline-flex cursor-pointer items-center justify-center gap-2 {variant !== 'ghost'
		? 'hover:bg-background px-3 py-2'
		: ''} font-bold text-nowrap uppercase transition hover:text-white {disabled
		? 'pointer-events-none opacity-50'
		: ''} {extraClasses}"
	{onclick}
>
	{@render children?.()}
</button>
