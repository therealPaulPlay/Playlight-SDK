<script>
	import { likedInThisSession } from "../store";
	import api from "../api";
	import { ThumbsUp } from "lucide-svelte";

	let { currentGame } = $props();

	let logoImageLoaded = $state(false);
	let isLiked = $state(false);
	let likeCount = $state(currentGame?.likes || 0);

	$effect(() => {
		if (currentGame?.id != null) {
			isLiked = localStorage.getItem(`playlight_${currentGame.id}_liked`) !== null;
			likeCount = currentGame?.likes || 0;
		}
	});

	async function toggleLike() {
		if (!currentGame?.id) return;

		// Optimistically update UI
		const newLikedState = !isLiked;
		$likedInThisSession = newLikedState;
		isLiked = !isLiked; // Toggle liked state

		// Save to localStorage
		newLikedState
			? localStorage.setItem(`playlight_${currentGame.id}_liked`, "true")
			: localStorage.removeItem(`playlight_${currentGame.id}_liked`);

		const success = await api.toggleLike(currentGame.id, newLikedState);

		// Revert like count on error
		if (!success) $likedInThisSession = !newLikedState;
	}
</script>

<div class="flex flex-wrap gap-1 text-start">
	<div class="w-full">
		<p class="text-muted-foreground text-sm select-none">Currently playing</p>
	</div>
	<div class="flex w-full items-center gap-2">
		<img
			src={currentGame?.logo_url}
			alt="logo"
			class="bg-muted h-5 w-5 select-none text-[0px]!"
			class:animate-pulse={!logoImageLoaded}
			onload={() => {
				logoImageLoaded = true;
			}}
		/>
		<p class="max-w-2/3 truncate text-lg font-bold text-white" class:opacity-50={!currentGame?.name}>{currentGame?.name || "Loading..."}</p>
		<div class="mt-0.5 ml-auto flex items-center gap-2">
			<p class="text-muted-foreground text-sm">{$likedInThisSession ? likeCount + 1 : likeCount}</p>
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
