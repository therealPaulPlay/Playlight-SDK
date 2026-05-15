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
discoveryOpen.subscribe((value) => triggerEvent(value ? "discoveryOpen" : "discoveryClose"));
