import { get } from "svelte/store";
import api from "../api";
import { discoveryOpen } from "../store";

export function openDiscovery(format) {
	if (get(discoveryOpen)) return;
	if (!format) console.warn("Format is not specified for open event!");
	discoveryOpen.set(true);
	api.trackOpen(format);
}
