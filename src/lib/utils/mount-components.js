import { mount, unmount } from "svelte";
import App from "../../App.svelte";
import Sidebar from "../components/Sidebar.svelte";
import { activateCSSViewportOverride, deactivateCSSViewportOverride } from "./override-css.js";
import { setupWindowPolyfills, restoreWindowPolyfills } from "./polyfill-window.js";
import { config } from "../store.js";
import { get } from "svelte/store";

// Container
let sidebarContainer = null;
let innerWrapper = null;

// Mounted Svelte components
let sidebarComponent = null;

// State
let isSidebarLayoutSetup = false;
let createdInnerWrapper = false;
let originalBodyClasses = [];

// Observer
let sidebarStructureObserver = null;
let sidebarRemountTimeout = null;
let appRemountTimeout = null;

// Mount the main Playlight app
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

// Page content is normally wrapped in <body> ("inner wrapper") which is a child of <html> ("outer wrapper").
// With the sidebar active, we use CSS to create a new GPU compositing layer on the body and wrap it's children in a new ("inner") wrapper
// to emulate how <html> and <body> behave. This way, <html> can contain the sidebar & <body>.
// Frameworks like React break when elements under their control are moved, which is why we use this strategy in favor of creating two wrappers.
// For the inner wrapper we use the framework's root element (when available, e.g. React, Svelte, Vue).
export function setupSidebarLayout() {
	if (isSidebarLayoutSetup) return;
	try {
		const body = document.body;
		const html = document.documentElement;

		// Find all containing elements inside of body (direct children)
		const containerTags = ["DIV", "MAIN", "ARTICLE", "SECTION", "HEADER", "FOOTER", "NAV", "ASIDE", "FORM"];
		const containers = Array.from(body.children).filter(
			(child) => containerTags.includes(child.tagName) && !child.id?.includes("playlight") && child.children.length > 0,
		);

		const createWrapper = () => {
			const wrapper = document.createElement("div");
			wrapper.id = "playlight-sdk-inner-wrapper";
			Array.from(body.children)
				.filter((child) => !["SCRIPT", "STYLE"].includes(child.tagName) && !child.id?.includes("playlight"))
				.forEach((child) => wrapper.appendChild(child));
			body.appendChild(wrapper);
			createdInnerWrapper = true;
			return wrapper;
		};

		// Detect framework root
		if (get(config)?.sidebar?.hasFrameworkRoot !== false && containers.length > 0) {
			if (containers.length === 1) {
				// Single container - use it as framework root
				innerWrapper = containers[0];
				createdInnerWrapper = false;
			} else if (get(config)?.sidebar?.hasFrameworkRoot === true) {
				// Multiple containers but explicitly set to hasFrameworkRoot - pick the deepest one
				const depths = containers.map((container) => container.querySelectorAll("*").length);
				const maxDepth = Math.max(...depths);
				innerWrapper = containers[depths.indexOf(maxDepth)];
				createdInnerWrapper = false;
			}
		}

		// If no suitable root element was found, create one
		if (!innerWrapper) innerWrapper = createWrapper();

		// Apply structure classes
		html.classList.add("playlight-sdk-html");
		body.classList.add("playlight-sdk-body");
		innerWrapper.classList.add("playlight-sdk-inner-wrapper");

		// Activate CSS overrides (must happen before transferring styles)
		setupWindowPolyfills(body, innerWrapper);
		activateCSSViewportOverride(body);

		// Transfer body classes to inner wrapper (except SDK classes)
		originalBodyClasses = Array.from(body.classList).filter((cls) => !cls.startsWith("playlight"));
		originalBodyClasses.forEach((cls) => {
			innerWrapper.classList.add(cls);
			body.classList.remove(cls);
		});

		// Apply conditional style overrides based on computed styles
		const computed = window.getComputedStyle(innerWrapper);
		if (computed.display === "contents") innerWrapper.style.setProperty("display", "block", "important");
		if (computed.overflow === "visible") innerWrapper.style.setProperty("overflow", "auto", "important");

		// Mount sidebar as child of <html>
		sidebarContainer = document.createElement("div");
		sidebarContainer.className = "playlight-sdk playlight-sdk-container-sidebar";
		html.appendChild(sidebarContainer);
		sidebarComponent = mount(Sidebar, { target: sidebarContainer });

		watchSidebarStructure();
		isSidebarLayoutSetup = true;
	} catch (error) {
		console.error("Error during sidebar setup:", error);
	}
}


// Monitor the sidebar structure and remount when needed
function watchSidebarStructure() {
	sidebarStructureObserver = new MutationObserver(() => {
		const htmlClassMissing = !document.documentElement.classList.contains("playlight-sdk-html");
		const bodyClassMissing = !document.body.classList.contains("playlight-sdk-body");
		const wrapperMissing = innerWrapper && !document.body.contains(innerWrapper);
		const sidebarMissing = sidebarContainer && !document.documentElement.contains(sidebarContainer);

		if (htmlClassMissing || bodyClassMissing || wrapperMissing || sidebarMissing) {
			clearTimeout(sidebarRemountTimeout);
			sidebarRemountTimeout = setTimeout(() => {
				console.warn("Re-mounting Playlight's sidebar container as it was removed!");
				removeSidebarLayout();
				setupSidebarLayout();
			}, 0);
		}
	});
	sidebarStructureObserver.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["class"],
	});
	sidebarStructureObserver.observe(document.body, { childList: true });
}

// Remove sidebar layout and unmount sidebar
export function removeSidebarLayout() {
	if (!isSidebarLayoutSetup) return;
	try {
		const body = document.body;
		const html = document.documentElement;

		// Disconnect structure observer
		sidebarStructureObserver?.disconnect();
		clearTimeout(sidebarRemountTimeout);

		// Unmount sidebar
		if (sidebarComponent) unmount(sidebarComponent);
		if (sidebarContainer?.parentNode) html.removeChild(sidebarContainer);

		// Unwrap inner wrapper if created
		if (createdInnerWrapper) {
			if (innerWrapper.parentNode === body) {
				Array.from(innerWrapper.children).forEach((child) => {
					if (child.parentNode === innerWrapper) body.insertBefore(child, innerWrapper);
				});
			}
			innerWrapper.remove();
		} else innerWrapper.classList.remove("playlight-sdk-inner-wrapper");

		// Remove classes
		html.classList.remove("playlight-sdk-html");
		body.classList.remove("playlight-sdk-body");

		// Restore body classes
		originalBodyClasses.forEach((cls) => {
			body.classList.add(cls);
			innerWrapper.classList.remove(cls);
		});

		// Restore polyfills and clean up (has to happen after the unmount)
		restoreWindowPolyfills(innerWrapper);
		deactivateCSSViewportOverride();

		// Reset state
		sidebarStructureObserver = null;
		sidebarRemountTimeout = null;
		sidebarContainer = null;
		sidebarComponent = null;
		innerWrapper = null;
		originalBodyClasses = [];
		createdInnerWrapper = false;
		isSidebarLayoutSetup = false;
	} catch (error) {
		console.error("Error during sidebar removal:", error);
	}
}
