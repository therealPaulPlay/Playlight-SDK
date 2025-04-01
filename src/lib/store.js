import { writable } from "svelte/store";

// Discovery
export const discoveryOpen = writable(false);
export const exitIntentDisabledByUser = writable(false);

// Project setup
export const projectUrl = writable("https://sdk.playlight.dev");