import { mount, unmount } from "svelte";
import App from "../../App.svelte";

let appRemountTimeout = null;

export function mountPlaylight() {
	try {
		const appContainer = document.createElement("div");
		appContainer.id = "playlight-sdk-container";
		appContainer.className = "playlight-sdk playlight-sdk-container";
		document.body.appendChild(appContainer);
		const appComponent = mount(App, { target: appContainer });

		// Watch for breaking changes to the document structure and remount if needed
		const appStructureObserver = new MutationObserver(() => {
			if (!document.body.contains(appContainer)) {
				clearTimeout(appRemountTimeout);
				appRemountTimeout = setTimeout(() => {
					if (!document.body.contains(appContainer)) {
						console.warn("Re-mounting Playlight's main container as it was removed!");
						appStructureObserver.disconnect();
						unmount(appComponent);
						mountPlaylight();
					}
				}, 0);
			}
		});
		appStructureObserver.observe(document.body, { childList: true });
	} catch (error) {
		console.error("Error during Playlight mount:", error);
	}
}
