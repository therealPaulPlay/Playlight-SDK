<script>
	let { enabled = true, onIntent } = $props();

	let didInteract = false;

	function trackMouse() {
		if (!didInteract) setTimeout(() => (didInteract = true), 250);
	}

	function handleBarTrigger() {
		if (!enabled || localStorage.getItem("playlight_exit_intent_disabled_by_user")) return;
		if (!didInteract) return;

		// Trigger exit intent
		onIntent?.();
	}
</script>

<svelte:window onmousemove={trackMouse} />

<!-- svelte-ignore a11y_mouse_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="fixed top-2 right-0 left-0 h-4" onmouseover={handleBarTrigger}></div>
