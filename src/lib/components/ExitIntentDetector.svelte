<script>
	let { enabled = true, onIntent } = $props();

	let lastTriggeredBar = null; // Track which bar was triggered most recently
	let triggerTimestamp = 0;
	const triggerThreshold = 500; // Time threshold in milliseconds between bar triggers

	function handleTopBarTrigger() {
		const currentTime = Date.now();

		// If bottom bar was triggered recently before top bar, it's an exit
		if (lastTriggeredBar === "bottom" && currentTime - triggerTimestamp < triggerThreshold) {
			if (enabled && !localStorage.getItem("playlight_exit_intent_disabled_by_user")) {
				onIntent?.();
			}
		}

		lastTriggeredBar = "top";
		triggerTimestamp = currentTime;
	}

	function handleBottomBarTrigger() {
		lastTriggeredBar = "bottom";
		triggerTimestamp = Date.now();
	}
</script>

<!-- svelte-ignore a11y_mouse_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="fixed top-0 right-0 left-0 h-2" onmouseover={handleTopBarTrigger}></div>

<!-- svelte-ignore a11y_mouse_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="fixed top-2 right-0 left-0 h-2" onmouseover={handleBottomBarTrigger}></div>
