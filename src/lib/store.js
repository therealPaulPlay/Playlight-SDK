import { writable } from "svelte/store";

// Discovery
export const discoveryOpen = writable(false);

// Current game display
export const likedInThisSession = writable(false);

// Project setup
export const projectUrl = writable("https://sdk.playlight.dev");