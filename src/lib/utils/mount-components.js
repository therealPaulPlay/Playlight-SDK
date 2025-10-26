import { mount, unmount } from 'svelte';
import App from '../../App.svelte';
import Sidebar from '../components/Sidebar.svelte';

// State management
let appContainer = null;
let sidebarContainer = null;
let sidebarComponent = null;
let contentWrapper = null;
let isSidebarLayoutSetup = false;
let originalWindowInnerWidth = null;

// Polyfill window.innerWidth to return content wrapper width when sidebar is active
function setupWindowDimensionPolyfill() {
	originalWindowInnerWidth = Object.getOwnPropertyDescriptor(Window.prototype, 'innerWidth');
	Object.defineProperty(window, 'innerWidth', {
		get: function () {
			return isSidebarLayoutSetup && contentWrapper ? contentWrapper.clientWidth : originalWindowInnerWidth.get.call(this);
		},
		configurable: true
	});
}

// Restore original window.innerWidth
function restoreWindowDimensionPolyfill() {
	if (originalWindowInnerWidth) {
		Object.defineProperty(window, 'innerWidth', originalWindowInnerWidth);
		originalWindowInnerWidth = null;
	}
}

// Mount the main Playlight app
export function mountPlaylight() {
	try {
		appContainer = document.createElement('div');
		appContainer.id = 'playlight-sdk-container';
		appContainer.className = 'playlight-sdk playlight-sdk-container';
		document.body.appendChild(appContainer);

		mount(App, {
			target: appContainer,
		});
	} catch (error) {
		console.error("Playlight error occurred during mount:", error);
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

		// Wrap content if needed
		if (bodyChildren.length !== 1) {
			contentWrapper = document.createElement('div');
			contentWrapper.id = 'playlight-sdk-content-wrapper';
			contentWrapper.className = 'playlight-sdk-content-wrapper';
			bodyChildren.forEach((child) => contentWrapper.appendChild(child));
			body.appendChild(contentWrapper);
		} else {
			contentWrapper = bodyChildren[0];
			contentWrapper.classList.add('playlight-sdk-content-wrapper');
		}

		// Create and mount sidebar
		sidebarContainer = document.createElement('div');
		sidebarContainer.id = 'playlight-sdk-container-sidebar';
		sidebarContainer.className = 'playlight-sdk playlight-sdk-container-sidebar';
		body.appendChild(sidebarContainer);

		sidebarComponent = mount(Sidebar, {
			target: sidebarContainer
		});

		// Apply layout class to body
		body.classList.add('playlight-sdk-flex-body');

		// Polyfill window.innerWidth to account for sidebar width
		setupWindowDimensionPolyfill();

		isSidebarLayoutSetup = true;
	} catch (error) {
		console.error("Playlight error occurred during sidebar setup:", error);
	}
}

// Remove sidebar layout and unmount sidebar
export function removeSidebarLayout() {
	if (!isSidebarLayoutSetup) return;

	try {
		const body = document.body;

		// Unmount sidebar component
		if (sidebarComponent) {
			unmount(sidebarComponent);
			sidebarComponent = null;
		}

		// Remove sidebar container
		if (sidebarContainer?.parentNode === body) {
			body.removeChild(sidebarContainer);
		}

		// Unwrap content if we created a wrapper
		if (contentWrapper?.id === 'playlight-sdk-content-wrapper') {
			Array.from(contentWrapper.children).forEach((child) => {
				body.insertBefore(child, contentWrapper);
			});
			body.removeChild(contentWrapper);
		} else if (contentWrapper) {
			contentWrapper.classList.remove('playlight-sdk-content-wrapper');
		}

		// Remove body class
		body.classList.remove('playlight-sdk-flex-body');

		// Restore window dimension polyfill
		restoreWindowDimensionPolyfill();

		// Reset state
		sidebarContainer = null;
		contentWrapper = null;
		isSidebarLayoutSetup = false;
	} catch (error) {
		console.error("Playlight error occurred during sidebar removal:", error);
	}
}
