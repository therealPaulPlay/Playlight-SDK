import { mount, unmount } from "svelte";
import App from "../../App.svelte";
import Sidebar from "../components/Sidebar.svelte";
import { activateCSSViewportOverride, deactivateCSSViewportOverride, applyCSSOverrides } from "./override-css.js";
import { config } from "../store.js";
import { get } from "svelte/store";

// Container
let sidebarContainer = null;
let innerWrapper = null;

// Mounted Svelte components
let sidebarComponent = null;

// State
let isSidebarLayoutSetup = false;
let originalInnerWidthDescriptor = null;
let originalMatchMedia = null;
let createdInnerWrapper = false;
let originalBodyClasses = [];
let mediaQueryListeners = new Map(); // Track matchMedia listeners to trigger on sidebar resize
let windowResizeListener;

// Observer
let sidebarStructureObserver = null;
let sidebarRemountTimeout = null;
let appRemountTimeout = null;

// Polyfill window.innerWidth and window.matchMedia to account for sidebar
function setupWindowDimensionPolyfill() {
	try {
		// Polyfill window.innerWidth
		originalInnerWidthDescriptor = Object.getOwnPropertyDescriptor(window, "innerWidth");
		Object.defineProperty(window, "innerWidth", {
			get: () => document.body.clientWidth,
			configurable: true,
		});

		// Polyfill window.matchMedia
		originalMatchMedia = window.matchMedia;
		window.matchMedia = function (query) {
			const getAdjustedMQL = () => {
				const mqlFn = originalMatchMedia || window.matchMedia;
				const adjustedWidth = document.body.clientWidth;
				const sidebarWidth = document.documentElement.clientWidth - adjustedWidth;
				const adjustedQuery = applyCSSOverrides(query, adjustedWidth, window.innerHeight, sidebarWidth);
				return mqlFn.call(window, adjustedQuery);
			};

			const mql = getAdjustedMQL();

			// Create entry for this query if not present
			if (!mediaQueryListeners.has(query)) mediaQueryListeners.set(query, { listeners: new Set(), lastMatches: mql.matches });
			const entry = mediaQueryListeners.get(query);

			// Override event methods directly on the native object
			const originalAdd = mql.addEventListener.bind(mql);
			const originalRemove = mql.removeEventListener.bind(mql);

			// Handle the "change" event with a custom listener system
			mql.addEventListener = (type, listener, ...args) => {
				if (type === "change") entry.listeners.add(listener);
				else originalAdd(type, listener, ...args);
			};
			mql.removeEventListener = (type, listener, ...args) => {
				if (type === "change") entry.listeners.delete(listener);
				else originalRemove(type, listener, ...args);
			};

			return mql;
		};

		// Trigger on resize (we dispatch resize events for sidebar resize in a different file)
		// Only maintain one listenter that persists when the sidebar gets unmounted to preserve functionality
		if (!windowResizeListener) {
			windowResizeListener = window.addEventListener("resize", () => {
				for (const [query, { listeners, lastMatches }] of mediaQueryListeners.entries()) {
					const newMQL = window.matchMedia(query); // Polyfill recomputes adjustedQuery internally

					if (newMQL.matches !== lastMatches) {
						mediaQueryListeners.get(query).lastMatches = newMQL.matches;
						const event = new MediaQueryListEvent("change", { matches: newMQL.matches, media: newMQL.media });
						listeners.forEach(listener => listener(event));
					}
				}
			});
		}
	} catch (error) {
		console.warn("Could not polyfill window dimensions:", error);
	}
}

function restoreWindowDimensionPolyfill() {
	try {
		if (originalInnerWidthDescriptor && originalMatchMedia) {
			Object.defineProperty(window, "innerWidth", originalInnerWidthDescriptor);
			window.matchMedia = originalMatchMedia;
			originalInnerWidthDescriptor = null;
			originalMatchMedia = null;
		}
	} catch (error) {
		console.warn("Could not restore window dimension polyfills:", error);
	}
}

// Monitor the sidebar document structure and remount when needed
function watchSidebarStructure() {
	sidebarStructureObserver = new MutationObserver(() => {
		const htmlClassMissing = !document.documentElement.classList.contains("playlight-sdk-flex-html");
		const bodyClassMissing = !document.body.classList.contains("playlight-sdk-outer-wrapper");
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

// Setup DOM layout and mount sidebar
export function setupSidebarLayout() {
	if (isSidebarLayoutSetup) return;
	try {
		const body = document.body;
		const html = document.documentElement;

		// Find potential framework root divs
		const bodyDivs = Array.from(body.children).filter(
			(child) => child.tagName === "DIV" && !child.id?.includes("playlight") && child.children.length > 0,
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

		// Detect framework root using depth heuristic
		if (get(config)?.sidebar?.hasFrameworkRoot !== false && bodyDivs.length > 0) {
			if (bodyDivs.length === 1) {
				innerWrapper = bodyDivs[0];
				createdInnerWrapper = false;
			} else {
				const depths = bodyDivs.map((div) => div.querySelectorAll("*").length);
				const maxDepth = Math.max(...depths);
				const avgDepth = depths.reduce((a, b) => a + b) / depths.length;
				if (get(config)?.sidebar?.hasFrameworkRoot === true || maxDepth > avgDepth * 3) {
					innerWrapper = bodyDivs[depths.indexOf(maxDepth)];
					createdInnerWrapper = false;
				}
			}
		}

		// If no suitable root element was found, create one
		if (!innerWrapper) innerWrapper = createWrapper();

		// Apply structure classes
		html.classList.add("playlight-sdk-flex-html");
		body.classList.add("playlight-sdk-outer-wrapper");
		innerWrapper.classList.add("playlight-sdk-inner-wrapper");

		// Activate CSS overrides (must happen before transferring styles)
		setupWindowDimensionPolyfill();
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

// Remove sidebar layout and unmount sidebar
export function removeSidebarLayout() {
	if (!isSidebarLayoutSetup) return;
	try {
		const body = document.body;
		const html = document.documentElement;

		// Disconnect observer and unmount sidebar
		sidebarStructureObserver?.disconnect();
		clearTimeout(sidebarRemountTimeout);
		if (sidebarComponent) unmount(sidebarComponent);
		if (sidebarContainer?.parentNode) html.removeChild(sidebarContainer);

		// Remove classes
		html.classList.remove("playlight-sdk-flex-html");
		body.classList.remove("playlight-sdk-outer-wrapper");

		// Restore body classes
		originalBodyClasses.forEach((cls) => {
			body.classList.add(cls);
			innerWrapper.classList.remove(cls);
		});

		// Unwrap or remove inner wrapper
		if (createdInnerWrapper) {
			if (innerWrapper.parentNode === body) {
				Array.from(innerWrapper.children).forEach((child) => {
					if (child.parentNode === innerWrapper) body.insertBefore(child, innerWrapper);
				});
			}
			innerWrapper.remove();
		} else innerWrapper.classList.remove("playlight-sdk-inner-wrapper");

		// Restore polyfills and clean up (has to happen after the unmount)
		restoreWindowDimensionPolyfill();
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
