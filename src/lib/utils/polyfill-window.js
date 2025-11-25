import { applyCSSOverrides } from "./override-css.js";

// State
let originalInnerWidthDescriptor = null;
let originalMatchMedia = null;
let originalScrollYDescriptor = null;
let originalPageYOffsetDescriptor = null;
let originalScrollXDescriptor = null;
let originalPageXOffsetDescriptor = null;
let originalScrollTo = null;
let originalScroll = null;
let originalScrollBy = null;
let innerWrapperScrollListener = null;
let mediaQueryListeners = new Map(); // Track matchMedia listeners to trigger on sidebar resize
let windowResizeListener;

// Polyfill window.innerWidth, window.matchMedia, and scroll properties to account for sidebar
export function setupWindowPolyfills(outerWrapper, innerWrapper) {
	try {
		// Window.innerWidth
		originalInnerWidthDescriptor = Object.getOwnPropertyDescriptor(window, "innerWidth");
		Object.defineProperty(window, "innerWidth", {
			get: () => outerWrapper.clientWidth,
			configurable: true,
		});

		// Window.scrollY
		originalScrollYDescriptor =
			Object.getOwnPropertyDescriptor(window, "scrollY") ||
			Object.getOwnPropertyDescriptor(Window.prototype, "scrollY");
		Object.defineProperty(window, "scrollY", {
			get: () => innerWrapper.scrollTop,
			configurable: true,
		});

		// Window.pageYOffset (alias for scrollY)
		originalPageYOffsetDescriptor =
			Object.getOwnPropertyDescriptor(window, "pageYOffset") ||
			Object.getOwnPropertyDescriptor(Window.prototype, "pageYOffset");
		Object.defineProperty(window, "pageYOffset", {
			get: () => innerWrapper.scrollTop,
			configurable: true,
		});

		// Window.scrollX
		originalScrollXDescriptor =
			Object.getOwnPropertyDescriptor(window, "scrollX") ||
			Object.getOwnPropertyDescriptor(Window.prototype, "scrollX");
		Object.defineProperty(window, "scrollX", {
			get: () => innerWrapper.scrollLeft,
			configurable: true,
		});

		// Window.pageXOffset (alias for scrollX)
		originalPageXOffsetDescriptor =
			Object.getOwnPropertyDescriptor(window, "pageXOffset") ||
			Object.getOwnPropertyDescriptor(Window.prototype, "pageXOffset");
		Object.defineProperty(window, "pageXOffset", {
			get: () => innerWrapper.scrollLeft,
			configurable: true,
		});

		// Scroll methods
		originalScrollTo = window.scrollTo;
		originalScroll = window.scroll;
		originalScrollBy = window.scrollBy;
		window.scrollTo = (...args) => innerWrapper.scrollTo(...args);
		window.scroll = (...args) => innerWrapper.scrollTo(...args);
		window.scrollBy = (...args) => innerWrapper.scrollBy(...args);

		// Redirect scroll events from innerWrapper to window
		innerWrapperScrollListener = () => {
			window.dispatchEvent(new Event("scroll"));
		};
		innerWrapper.addEventListener("scroll", innerWrapperScrollListener);

		// Window.matchMedia & window.matchMedia.addEventListener/removeEventListener
		originalMatchMedia = window.matchMedia;
		window.matchMedia = function (query) {
			const getAdjustedMQL = () => {
				const mqlFn = originalMatchMedia || window.matchMedia;
				const adjustedWidth = outerWrapper.clientWidth;
				const sidebarWidth = document.documentElement.clientWidth - adjustedWidth;
				const adjustedQuery = applyCSSOverrides(query, adjustedWidth, window.innerHeight, sidebarWidth);
				return mqlFn.call(window, adjustedQuery);
			};

			const mql = getAdjustedMQL();

			// Create entry for this query if not present
			if (!mediaQueryListeners.has(query))
				mediaQueryListeners.set(query, { listeners: new Set(), lastMatches: mql.matches });
			const entry = mediaQueryListeners.get(query);

			// Return a Proxy that intercepts property access to keep matches up-to-date
			return new Proxy(mql, {
				get(target, prop) {
					// Intercept media to return the original query string
					if (prop === "media") return query;

					// Intercept matches to return current value
					if (prop === "matches") {
						const currentMQL = getAdjustedMQL();
						return currentMQL.matches;
					}

					// Intercept addEventListener to use custom listener system for "change" event
					if (prop === "addEventListener") {
						return (type, listener, ...args) => {
							if (type === "change") entry.listeners.add(listener);
							else target.addEventListener(type, listener, ...args);
						};
					}

					// Intercept removeEventListener to use custom listener system for "change" event
					if (prop === "removeEventListener") {
						return (type, listener, ...args) => {
							if (type === "change") entry.listeners.delete(listener);
							else target.removeEventListener(type, listener, ...args);
						};
					}

					// For all other properties, return the target's value
					const value = target[prop];
					return typeof value === "function" ? value.bind(target) : value;
				},
			});
		};

		// Trigger on resize (we dispatch resize events for sidebar resize in a different file)
		// Only maintain one listenter that persists when the sidebar gets unmounted to preserve functionality!
		if (!windowResizeListener) {
			windowResizeListener = window.addEventListener("resize", () => {
				for (const [query, { listeners, lastMatches }] of mediaQueryListeners.entries()) {
					const newMQL = window.matchMedia(query); // Polyfill recomputes adjustedQuery internally

					if (newMQL.matches !== lastMatches) {
						mediaQueryListeners.get(query).lastMatches = newMQL.matches;
						const event = new MediaQueryListEvent("change", { matches: newMQL.matches, media: newMQL.media });
						listeners.forEach((listener) => listener(event));
					}
				}
			});
		}
	} catch (error) {
		console.warn("Could not polyfill window properties:", error);
	}
}

export function restoreWindowPolyfills(innerWrapper) {
	try {
		Object.defineProperty(window, "innerWidth", originalInnerWidthDescriptor);
		Object.defineProperty(window, "scrollY", originalScrollYDescriptor);
		Object.defineProperty(window, "pageYOffset", originalPageYOffsetDescriptor);
		Object.defineProperty(window, "scrollX", originalScrollXDescriptor);
		Object.defineProperty(window, "pageXOffset", originalPageXOffsetDescriptor);
		window.scrollTo = originalScrollTo;
		window.scroll = originalScroll;
		window.scrollBy = originalScrollBy;
		innerWrapper.removeEventListener("scroll", innerWrapperScrollListener);
		window.matchMedia = originalMatchMedia;

		originalInnerWidthDescriptor = null;
		originalScrollYDescriptor = null;
		originalPageYOffsetDescriptor = null;
		originalScrollXDescriptor = null;
		originalPageXOffsetDescriptor = null;
		originalScrollTo = null;
		originalScroll = null;
		originalScrollBy = null;
		innerWrapperScrollListener = null;
		originalMatchMedia = null;
	} catch (error) {
		console.warn("Could not restore window polyfills:", error);
	}
}
