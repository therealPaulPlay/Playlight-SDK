<script>
	import api from "../api";
	import { ThumbsUp } from "lucide-svelte";
	import { fly } from "svelte/transition";

	let { currentGame } = $props();
	let logoImageLoaded = $state(false);
	let visible = $state(true);
	let showLatch = $state(false);
	let y = $state(0);
	let alpha = $state(1);
	let dragging = $state(false);
	let isLiked = $state(false);
	let likeCount = $state(currentGame?.likes || 0);
	let startY = 0;

	$effect(() => {
		if (currentGame?.id) {
			isLiked = localStorage.getItem(`playlight_${currentGame.id}_liked`) !== null;
			likeCount = currentGame?.likes || 0;
		}
	});

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
			if (p === 1) {
				visible = false;
				showLatch = true;
			}
		});
	}

	function restore() {
		showLatch = false;
		visible = true;
		y = 250;
		alpha = 0;
		animate(250, 0, 250, (from, to, p) => {
			y = from * (1 - p);
			alpha = p;
		});
	}

	async function toggleLike() {
		if (!currentGame?.id) return;

		// Optimistically update UI
		const newLikedState = !isLiked;
		isLiked = !isLiked;
		likeCount += newLikedState ? 1 : -1;

		// Save to localStorage
		newLikedState
			? localStorage.setItem(`playlight_${currentGame.id}_liked`, "true")
			: localStorage.removeItem(`playlight_${currentGame.id}_liked`);

		const success = await api.toggleLike(currentGame.id, newLikedState);

		// Revert like count on error
		if (!success) likeCount += !newLikedState ? 1 : -1;
	}
</script>

{#if currentGame && visible}
	<div
		class="bg-background/85 fixed bottom-4 left-4 z-2 flex touch-none flex-wrap items-center gap-1 border-1 p-4 text-start shadow-lg backdrop-blur-xl max-sm:right-4 sm:w-72"
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
		<div class="w-full">
			<p class="text-muted-foreground text-sm select-none">Currently playing</p>
		</div>
		<div class="flex w-full items-center gap-2">
			<img
				src={currentGame?.logo_url}
				alt="logo"
				class="bg-muted h-5 w-5 select-none"
				class:animate-pulse={!logoImageLoaded}
				onload={() => {
					logoImageLoaded = true;
				}}
			/>
			<p class="text-white max-w-2/3 truncate text-lg font-bold">{currentGame?.name || "Default name"}</p>
			<div class="mt-0.5 ml-auto flex items-center gap-2">
				<p class="text-muted-foreground text-sm">{likeCount}</p>
				<button
					class="text-muted-foreground cursor-pointer transition hover:text-white"
					style="color: {isLiked ? 'white !important' : ''};"
					onclick={toggleLike}
					aria-label={isLiked ? "Unlike game" : "Like game"}
				>
					<ThumbsUp size={18} strokeWidth={2.5} fill={isLiked ? "currentColor" : "none"} style="margin-top: -5px;" />
				</button>
			</div>
		</div>
	</div>
{/if}

{#if currentGame && showLatch}
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
