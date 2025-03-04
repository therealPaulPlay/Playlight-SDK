<script>
	import { Gamepad } from "lucide-svelte";
	let { position = "bottom-right", visible = true, onClick } = $props();
</script>

{#if visible}
	<button
		class="fixed {position == 'bottom-left'
			? 'bottom-4 left-4'
			: position == 'bottom-right'
				? 'right-4 bottom-4'
				: ''} group children-text-white z-99990 flex cursor-pointer gap-2 rounded-md bg-white p-3 font-bold text-black uppercase shadow-lg transition-all hover:scale-105"
		onclick={() => {
			onClick?.();
		}}
		id="floating playlight button"
		aria-label="Open Playlight Discovery"
	>
		<p class="z-2 flex items-center overflow-hidden">
			<Gamepad
				size={26}
				strokeWidth={1.75}
				class="z-2 mr-2 transform transition-all duration-300 group-hover:rotate-12"
			/>
			<span class="mr-0.25 inline-block font-bold">More Games</span>
		</p>

		<!-- Simple border bottom animation -->
		<div class="absolute bottom-0 left-0 h-full w-0 bg-black transition-all duration-300 group-hover:w-full"></div>
	</button>
{/if}

<style>
	.children-text-white:hover * {
		color: white !important;
	}
</style>
