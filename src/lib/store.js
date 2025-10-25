import { writable } from "svelte/store";
import api from "./api";
import { triggerEvent } from "./utils/trigger-event";
import { removeSidebarLayout, setupSidebarLayout } from "./utils/mount-components";

// Discovery
export const discoveryOpen = writable(false);

let originalOverflow;

discoveryOpen.subscribe((v) => {
    try {
        if (v) {
            api.trackOpen();
            triggerEvent("discoveryOpen");
            originalOverflow = document.body.style.overflow;
            document.body.style.overflow = "hidden"; // Prevent scroll propagation
        } else {
            triggerEvent("discoveryClose");
            document.body.style.overflow = originalOverflow;
        }
    } catch (error) {
        console.error("Error in discoveryOpen store subscription:", error);
    }
});

// Current game display
export const likedInThisSession = writable(false);

// Sidebar
export const sidebarVisible = writable(false);

sidebarVisible.subscribe((visible) => {
    if (visible) setupSidebarLayout();
    else removeSidebarLayout();
});

// Project setup
export const projectUrl = writable("https://sdk.playlight.dev");