import { mount, unmount } from 'svelte';
import App from '../../App.svelte';
import Sidebar from '../components/Sidebar.svelte';

// State management
let appContainer = null;
let sidebarContainer = null;
let sidebarComponent = null;
let outerWrapper = null; // Pseudo html element
let innerWrapper = null; // Pseudo body element
let isSidebarLayoutSetup = false;
let originalWindowInnerWidth = null;

// Polyfill window.innerWidth to return outer wrapper width when sidebar is active
function setupWindowDimensionPolyfill() {
	try {
		originalWindowInnerWidth = Object.getOwnPropertyDescriptor(Window.prototype, 'innerWidth');
		Object.defineProperty(window, 'innerWidth', {
			get: function () {
				return isSidebarLayoutSetup && outerWrapper ? outerWrapper.clientWidth : originalWindowInnerWidth.get.call(this);
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
		if (originalWindowInnerWidth) {
			Object.defineProperty(window, 'innerWidth', originalWindowInnerWidth);
			originalWindowInnerWidth = null;
		}
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
		const bodyChildren = Array.from(body.children).filter(
			(child) =>
				child.tagName !== 'SCRIPT' &&
				child.tagName !== 'STYLE' &&
				!child.id?.startsWith('playlight-sdk')
		);

		// Create inner wrapper (scrollable layer)
		innerWrapper = document.createElement('div');
		innerWrapper.id = 'playlight-sdk-inner-wrapper';
		innerWrapper.className = 'playlight-sdk-inner-wrapper';
		bodyChildren.forEach((child) => innerWrapper.appendChild(child));

		// Create outer wrapper (containing block for fixed elements)
		outerWrapper = document.createElement('div');
		outerWrapper.id = 'playlight-sdk-outer-wrapper';
		outerWrapper.className = 'playlight-sdk-outer-wrapper';
		outerWrapper.appendChild(innerWrapper);
		body.appendChild(outerWrapper);

		// Create and mount sidebar
		sidebarContainer = document.createElement('div');
		sidebarContainer.className = 'playlight-sdk playlight-sdk-container-sidebar';
		body.appendChild(sidebarContainer);
		sidebarComponent = mount(Sidebar, { target: sidebarContainer });

		body.classList.add('playlight-sdk-flex-body'); // Make the body flex
		setupWindowDimensionPolyfill(); // Polyfill window.innerWidth to account for sidebar width
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

		if (sidebarComponent) {
			unmount(sidebarComponent); // Unmount sidebar Svelte component
			sidebarComponent = null;
		}

		body.removeChild(sidebarContainer); // Remove sidebar container

		// Unwrap inner wrapper and delete outer wrapper that contains inner one (so both)
		if (outerWrapper && innerWrapper) {
			Array.from(innerWrapper.children).forEach((child) => body.insertBefore(child, outerWrapper));
			body.removeChild(outerWrapper);
		}

		body.classList.remove('playlight-sdk-flex-body'); // Remove body flex class
		restoreWindowDimensionPolyfill(); // Restore window dimension

		sidebarContainer = null;
		outerWrapper = null;
		innerWrapper = null;
		isSidebarLayoutSetup = false;

	} catch (error) {
		console.error("Error occurred during sidebar removal:", error);
	}
}