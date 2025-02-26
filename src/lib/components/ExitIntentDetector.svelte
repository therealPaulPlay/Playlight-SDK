<script>
	import { onMount } from "svelte";
	let { enabled = true, onIntent } = $props();
	let lastMouseY;
	let isMouseInPage = false; // Flag to check if the mouse was previously outside the window

	onMount(() => {
		if (typeof window === "undefined") return;
		lastMouseY = window.innerHeight; // Start as the bottom of the window
	});
</script>

<svelte:document
	onmouseleave={() => {
		isMouseInPage = false;
	}}
	onmousemove={(event) => {
		const currentMouseY = event.clientY;

		// Check if the mouse is entering the page for the first time
		if (!isMouseInPage) {
			isMouseInPage = true;
			lastMouseY = currentMouseY;
			return;
		}

		lastMouseY = currentMouseY;
	}}
/>

<!-- svelte-ignore a11y_mouse_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed top-0 left-0 right-0 h-2"
	onmouseover={(event) => {
		const currentMouseY = event.clientY;
		// Trigger popup only if mouse is moving upwards and was inside the page before
		if (currentMouseY < lastMouseY && isMouseInPage) {
			if (enabled) onIntent?.();
		}
		// Update lastMouseY after checking
		lastMouseY = currentMouseY;
	}}
></div>
