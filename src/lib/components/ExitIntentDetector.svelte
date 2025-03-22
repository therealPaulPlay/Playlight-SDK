<script>
	let { enabled = true, onIntent } = $props();

	let didInteract = false;
	let barElement;
	let lastMouseInteraction;

	function trackMouse(event) {
		if (!didInteract) setTimeout(() => (didInteract = true), 250);
		if (barElement.contains(event.target)) return;
		lastMouseInteraction = Date.now();
	}

	function handleBarTrigger() {
		if (!enabled || localStorage.getItem("playlight_exit_intent_disabled_by_user")) return;
		if (!didInteract) return;

		// Trigger exit intent
		setTimeout(() => {
			if (lastMouseInteraction < Date.now() - 50) onIntent?.();
		}, 150);
	}
</script>

<svelte:window onmousemove={trackMouse} />

<!-- svelte-ignore a11y_mouse_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="fixed top-0 right-0 left-0 h-4" bind:this={barElement} onmouseover={handleBarTrigger}></div>
