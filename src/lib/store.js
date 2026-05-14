import { get, readable, writable } from "svelte/store";
import { triggerEvent } from "./utils/trigger-event";

// SDK configuration
export const config = writable(null);

// Discovery
export const discoveryOpen = writable(false);

// Current game display
export const currentGameIsLiked = writable(false);
export const currentGameLikeCount = writable(0);

// Hosting configuration
export const cdnURL = readable("https://sdk.playlight.dev");
export const apiURL = readable("https://api.playlight.dev/platform");

// Subscriptions
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
