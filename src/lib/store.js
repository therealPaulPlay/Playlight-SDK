import { get, readable, writable } from "svelte/store";
import { triggerEvent } from "./utils/trigger-event";
import { removeSidebarLayout, setupSidebarLayout } from "./utils/mount-components";

// SDK configuration
export const config = writable(null);
export const userIsFromPlaylight = writable(false);

// Discovery
export const discoveryOpen = writable(false);

// Current game display
export const currentGameIsLiked = writable(false);
export const currentGameLikeCount = writable(0);

// Sidebar
export const sidebarEnabled = writable(false);
export const sidebarCollapsed = writable(false);

// Hosting configuration
export const cdnURL = readable("https://sdk.playlight.dev");
export const apiURL = readable("https://api.playlight.dev/platform");

// Subscriptions --------------------------------------------------------------------------------------
let originalOverflow;

discoveryOpen.subscribe((value) => {
	try {
		if (value) {
			triggerEvent("discoveryOpen");
			originalOverflow = document.body.style.overflow;
			document.body.style.setProperty("overflow", "hidden", "important"); // Prevent scroll propagation
		} else {
			triggerEvent("discoveryClose");
			document.body.style.overflow = originalOverflow;
		}
	} catch (error) {
		console.error("Error in discoveryOpen store subscription:", error);
	}
});

config.subscribe((value) => {
	if (value?.sidebar?.forceVisible || get(userIsFromPlaylight)) sidebarEnabled.set(true);
	else sidebarEnabled.set(false);
});

userIsFromPlaylight.subscribe((value) => {
	if (value) sidebarEnabled.set(true);
});

sidebarEnabled.subscribe((enabled) => {
	if (enabled) {
		setupSidebarLayout();
		triggerEvent("sidebarEnable");
	} else {
		removeSidebarLayout();
		triggerEvent("sidebarDisable");
	}
});
