import { mount, unmount } from 'svelte';
import App from '../../App.svelte';
import Sidebar from '../components/Sidebar.svelte';
import { activateCSSViewportOverride, deactivateCSSViewportOverride } from './override-css.js';

// State management
let appContainer = null;
let sidebarContainer = null;
let sidebarComponent = null;
let isSidebarLayoutSetup = false;
let originalInnerWidthDescriptor = null;
let sidebarResizeObserver = null;

// Polyfill window.innerWidth to return body width when sidebar is active
function setupWindowDimensionPolyfill() {
	try {
		originalInnerWidthDescriptor = Object.getOwnPropertyDescriptor(window, 'innerWidth');
		Object.defineProperty(window, 'innerWidth', {
			get: function () {
				return document.body?.clientWidth;
			},
			configurable: true
		});
	} catch (error) {
		console.warn('Could not polyfill window.innerWidth:', error);
	}
}

// Restore original window.innerWidth
function restoreWindowDimensionPolyfill() {
	try {
		Object.defineProperty(window, 'innerWidth', originalInnerWidthDescriptor);
		originalInnerWidthDescriptor = null;
	} catch (error) {
		console.warn('Could not restore original window.innerWidth:', error);
	}
}

// Mount the main Playlight app
export function mountPlaylight() {
	try {
		appContainer = document.createElement('div');
		appContainer.id = 'playlight-sdk-container';
		appContainer.className = 'playlight-sdk playlight-sdk-container';
		document.body.appendChild(appContainer);
		mount(App, { target: appContainer });
	} catch (error) {
		console.error("Error occurred during mount:", error);
	}
}

// Setup DOM layout and mount sidebar
export function setupSidebarLayout() {
	if (isSidebarLayoutSetup) return;
	try {
		const body = document.body;
		const html = document.documentElement;

		// Create and mount sidebar as child of <html>
		sidebarContainer = document.createElement('div');
		sidebarContainer.className = 'playlight-sdk playlight-sdk-container-sidebar';
		html.appendChild(sidebarContainer);
		sidebarComponent = mount(Sidebar, { target: sidebarContainer });

		// Update CSS variable for sidebar width
		const updateSidebarWidth = () => {
			const width = sidebarContainer.offsetWidth;
			body.style.setProperty('--playlight-sdk-sidebar-width', `${width}px`);
		};

		// Watch for sidebar width changes (e.g., collapse/expand animation)
		sidebarResizeObserver = new ResizeObserver(updateSidebarWidth);
		sidebarResizeObserver.observe(sidebarContainer);
		updateSidebarWidth();

		// Apply class to body for styling
		body.classList.add('playlight-sdk-body');

		setupWindowDimensionPolyfill();
		activateCSSViewportOverride(body);
		isSidebarLayoutSetup = true;

	} catch (error) {
		console.error("Error occurred during sidebar setup:", error);
	}
}

// Remove sidebar layout and unmount sidebar
export function removeSidebarLayout() {
	if (!isSidebarLayoutSetup) return;
	try {
		const body = document.body;
		const html = document.documentElement;

		if (sidebarResizeObserver) {
			sidebarResizeObserver.disconnect();
			sidebarResizeObserver = null;
		}

		if (sidebarComponent) {
			unmount(sidebarComponent);
			sidebarComponent = null;
		}

		html.removeChild(sidebarContainer);
		body.classList.remove('playlight-sdk-body');
		body.style.removeProperty('--playlight-sdk-sidebar-width');

		restoreWindowDimensionPolyfill();
		deactivateCSSViewportOverride();

		sidebarContainer = null;
		isSidebarLayoutSetup = false;

	} catch (error) {
		console.error("Error occurred during sidebar removal:", error);
	}
}