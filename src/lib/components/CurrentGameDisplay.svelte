<script>
	import { currentGameIsLiked, currentGameLikeCount } from "../store";
	import api from "../api";
	import { ThumbsUp } from "lucide-svelte";

	let { currentGame } = $props();

	let logoImageLoaded = $state(false);

	$effect(() => {
		if (currentGame?.id != null) {
			$currentGameIsLiked = localStorage.getItem(`playlight_${currentGame.id}_liked`) !== null;
			$currentGameLikeCount = currentGame?.likes || 0;
		}
	});

	async function toggleLike() {
		if (!currentGame?.id) return;

		// Optimistically update UI
		$currentGameIsLiked = !$currentGameIsLiked; // Toggle liked state
		$currentGameLikeCount += $currentGameIsLiked ? 1 : -1;

		// Save to localStorage
		$currentGameIsLiked
			? localStorage.setItem(`playlight_${currentGame.id}_liked`, "true")
			: localStorage.removeItem(`playlight_${currentGame.id}_liked`);

		const success = await api.toggleLike(currentGame.id, $currentGameIsLiked);

		// Revert like count on error (but not currentGameIsLiked since if it fails, that's likely because it was already liked)
		if (!success) $currentGameLikeCount += !$currentGameIsLiked ? 1 : -1;
	}
</script>

<div class="flex flex-wrap gap-1 text-start">
	<div class="w-full">
		<p class="text-muted-foreground text-sm text-nowrap select-none">Currently playing</p>
	</div>
	<div class="flex w-full items-center gap-2">
		{#if currentGame?.logo_url}
			<img
				src={currentGame?.logo_url}
				alt="logo"
				class="bg-muted-foreground/50 size-5 text-[0px]! select-none"
				class:animate-pulse={!logoImageLoaded}
				onload={() => {
					logoImageLoaded = true;
				}}
			/>
		{:else}
			<div class="bg-muted size-5"></div>
		{/if}
		<p class="max-w-35 truncate text-lg font-bold text-white" class:opacity-50={!currentGame?.name}>
			{currentGame?.name || "Unavailable"}
		</p>
		<div class="mt-0.5 ml-auto flex items-center gap-2">
			<p class="text-muted-foreground text-sm">{$currentGameLikeCount}</p>
			<button
				class="text-muted-foreground cursor-pointer transition hover:text-white"
				style="color: {$currentGameIsLiked ? 'white !important' : ''};"
				onclick={toggleLike}
				aria-label={$currentGameIsLiked ? "Unlike game" : "Like game"}
			>
				<ThumbsUp
					size={18}
					strokeWidth={2.5}
					fill={$currentGameIsLiked ? "currentColor" : "none"}
					style="margin-top: -5px;"
				/>
			</button>
		</div>
	</div>
</div>
