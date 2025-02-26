<script>
	import { Gamepad } from "lucide-svelte";
	let { position, onClick } = $props();
</script>

<button
	class="fixed {position == 'bottom-left'
		? 'bottom-4 left-4'
		: position == 'bottom-right'
			? 'right-4 bottom-4'
			: ''} group children-text-white z-999 flex cursor-pointer gap-2 rounded-md bg-white p-3 pl-1 font-bold text-black uppercase shadow-lg transition-all hover:scale-105"
	onclick={onClick}
	id="floating playlight button"
	aria-label="Open Playlight Discovery"
>
	<!-- Gamepad icon with juicy animation -->
	<div class="relative -z-1">
		<div
			class="absolute inset-0 scale-0 rounded-full bg-black opacity-0 transition-all duration-500 group-hover:scale-150 group-hover:opacity-5"
		></div>
	</div>

	<!-- Text with letter staggering effect -->
	<p class="z-2 flex overflow-hidden items-center">
		<Gamepad
			size={26}
			strokeWidth={1.75}
			class="z-2 transform transition-all duration-300 group-hover:rotate-12 mr-2"
		/>
		<span class="inline-block">More Games</span>
	</p>

	<!-- Simple border bottom animation -->
	<div class="absolute bottom-0 left-0 h-full w-0 bg-black transition-all duration-300 group-hover:w-full"></div>
</button>

<style>
	.children-text-white:hover * {
		color: white !important;
	}
</style>
