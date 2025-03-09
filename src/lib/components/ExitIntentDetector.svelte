<script>
	import { onMount } from "svelte";

	let { enabled = true, onIntent } = $props();
	let lastMouseY;
	let lastMoveTimestamp = 0;
	const moveThreshold = 100; // Time threshold in milliseconds

	onMount(() => {
		if (typeof window === "undefined") return;
		lastMouseY = window.innerHeight;
	});
</script>

<svelte:document
	onmousemove={(event) => {
		lastMouseY = event.clientY;
		lastMoveTimestamp = Date.now();
	}}
/>

<!-- svelte-ignore a11y_mouse_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed top-0 right-0 left-0 z-99990 h-2"
	onmouseover={(event) => {
		const currentMouseY = event.clientY;
		const currentTime = Date.now();

		// Check if the mouse on the page was moved shortly before (to prevent moving into the page from the browser chrome triggering it)
		// And ensure the mouse is moving upwards and was inside the page before
		if (currentMouseY < lastMouseY && currentTime - lastMoveTimestamp < moveThreshold) {
			if (enabled && !localStorage.getItem("playlight_exit_intent_disabled_by_user")) {
				onIntent?.();
			}
		}
	}}
></div>
