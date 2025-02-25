<script>
	import { Gamepad } from "lucide-svelte";

	// Props
	let { position, onClick } = $props();

	// Compute position classes
	let positionClasses = $derived(getPositionClasses(position));

	function getPositionClasses(pos) {
		switch (pos) {
			case "top-left":
				return "top-4 left-4";
			case "top-right":
				return "top-4 right-4";
			case "bottom-left":
				return "bottom-4 left-4";
			case "bottom-right":
			default:
				return "bottom-4 right-4";
		}
	}
</script>

<button
	class="fixed {positionClasses} focus:ring-opacity-75 z-50 rounded-full bg-violet-600 p-3 text-white shadow-lg transition-all duration-200 hover:scale-110 hover:bg-violet-700 focus:ring-2 focus:ring-violet-400 focus:outline-none"
	onclick={onClick}
	aria-label="Open Playlight Discovery"
>
	<Gamepad size={24} />
</button>
