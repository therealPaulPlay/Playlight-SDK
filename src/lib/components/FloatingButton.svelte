<script>
	import { Gamepad } from "lucide-svelte";
	let { position, onClick } = $props();
</script>

<button
	class="fixed {position == 'bottom-left'
		? 'bottom-4 left-4'
		: position == 'bottom-right'
			? 'right-4 bottom-4'
			: ''} z-999 flex cursor-pointer gap-2 rounded-md bg-white p-3 font-bold text-black uppercase shadow-lg transition-all hover:scale-105"
	onclick={onClick}
	id="floating playlight button"
	aria-label="Open Playlight Discovery"
>
	<Gamepad size={24} strokeWidth={2.5} />
	<p class="pr-1">More Games</p>
</button>
