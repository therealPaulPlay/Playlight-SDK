import { mount } from "svelte";
import WidgetCarousel from "../components/WidgetCarousel.svelte";

// Initialize any existing widget containers on the page
export function initWidgets() {
	try {
		const containers = document.querySelectorAll(".playlight-widget-carousel"); // Look for any carousel widgets
		if (containers.length > 0) {
			containers.forEach((containerElement) => {
				if (!containerElement.dataset.playlightInitialized) {
					containerElement.dataset.playlightInitialized = "true";

					// Mount the widget
					mount(WidgetCarousel, {
						target: containerElement,
					});
				}
			});
		}
	} catch (error) {
		console.error("Error occurred initializing and mounting carousel widget:", error);
	}
}

// Set up an observer to watch for new widget containers added to the DOM
export function setupWidgetObserver() {
	try {
		const observer = new MutationObserver(() => {
			initWidgets();
		});

		// Start observing the entire document
		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});
	} catch (error) {
		console.error("Error occurred setting up widget observer:", error);
	}
}
