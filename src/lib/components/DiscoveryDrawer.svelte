<script>
	import { fly } from "svelte/transition";
	import CurrentGameDisplay from "./CurrentGameDisplay.svelte";
	import { onMount } from "svelte";

	let { currentGame } = $props();

	let minimized = $state(false);
	let y = $state(0);
	let alpha = $state(1);
	let dragging = $state(false);
	let startY = 0;

	function startDrag(e) {
		dragging = true;
		startY = e.type.includes("touch") ? e.touches[0].clientY : e.clientY;
	}

	function drag(e) {
		if (!dragging) return;
		const currentY = e.type.includes("touch") ? e.touches[0].clientY : e.clientY;
		const delta = Math.max(0, currentY - startY);
		y = delta;
		alpha = Math.max(0, 1 - delta / 150);
		if (delta > 40) hide();
	}

	function endDrag() {
		if (!dragging) return;
		dragging = false;
		if (y < 40) animateBack();
	}

	function animate(from, to, duration, onFrame) {
		const startTime = Date.now();
		(function frame() {
			const p = Math.min((Date.now() - startTime) / duration, 1);
			onFrame(from, to, p);
			if (p < 1) requestAnimationFrame(frame);
		})();
	}

	function animateBack() {
		animate(y, 0, 250, (from, to, p) => {
			y = from * (1 - p);
			alpha = 1;
		});
	}

	function hide() {
		dragging = false;
		animate(y, 250, 250, (from, to, p) => {
			y = from + (to - from) * p;
			alpha = Math.max(0, 1 - p * 1.5);
			if (p === 1) minimized = true;
		});
	}

	function restore() {
		minimized = false;
		y = 250;
		alpha = 0;
		animate(250, 0, 250, (from, to, p) => {
			y = from * (1 - p);
			alpha = p;
		});
	}

	onMount(() => {
		animate(1, 0, 250, (from, to, p) => {
			alpha = p;
		});
	});
</script>

{#if currentGame && !minimized}
	<div
		class="bg-background/85 fixed bottom-4 left-4 z-2 touch-none border-1 p-4 shadow-lg backdrop-blur-xl max-sm:right-4 sm:w-72"
		style="transform: translateY({y}px); opacity: {alpha}; cursor: grab;"
		role="button"
		tabindex="0"
		onmousedown={startDrag}
		onmousemove={drag}
		onmouseup={endDrag}
		onmouseleave={endDrag}
		ontouchstart={startDrag}
		ontouchmove={drag}
		ontouchend={endDrag}
	>
		<CurrentGameDisplay {currentGame} />
	</div>
{/if}

{#if currentGame && minimized}
	<div class="fixed bottom-0 z-3 shadow-xl max-sm:right-4 max-sm:left-4 sm:left-4 sm:w-72">
		<button
			transition:fly={{ delay: 150, y: 30 }}
			class="bg-background/85 hover:bg-background/95 w-full rounded-t-md border px-4 py-1.5 backdrop-blur-sm transition"
			aria-label="Show game display"
			onmousedown={restore}
			ontouchstart={restore}
		>
			<div class="bg-muted-foreground mx-auto h-px w-16"></div>
		</button>
	</div>
{/if}
