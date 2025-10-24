import { mount, unmount } from 'svelte';
import App from '../../App.svelte';
import Sidebar from '../components/Sidebar.svelte';

// State management
let appContainer = null;
let sidebarContainer = null;
let sidebarComponent = null;
let contentWrapper = null;
let isLayoutSetup = false;
let originalBodyStyles = {};

// Mount the main Playlight app
export function mountPlaylight(config) {
	try {
		appContainer = document.createElement('div');
		appContainer.id = 'playlight-sdk-container';
		appContainer.className = 'playlight-sdk playlight-sdk-container';
		document.body.appendChild(appContainer);

		mount(App, {
			target: appContainer,
			props: { config }
		});
	} catch (error) {
		console.error("Playlight error occurred during mount:", error);
	}
}

// Setup DOM layout and mount sidebar
export function setupSidebarLayout() {
	if (isLayoutSetup) return;

	try {
		const body = document.body;
		const bodyChildren = Array.from(body.children).filter(
			(child) =>
				child.tagName !== 'SCRIPT' &&
				child.tagName !== 'STYLE' &&
				!child.id?.startsWith('playlight-')
		);

		// Store original body styles
		originalBodyStyles = {
			cssText: body.style.cssText
		};

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

		// Transfer body's inline styles to wrapper
		contentWrapper.style.cssText = originalBodyStyles.cssText;
		body.style.cssText = '';

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

		isLayoutSetup = true;
	} catch (error) {
		console.error("Playlight error occurred during sidebar setup:", error);
	}
}

// Remove sidebar layout and unmount sidebar
export function removeSidebarLayout() {
	if (!isLayoutSetup) return;

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

		// Restore body styles
		body.style.cssText = originalBodyStyles.cssText;

		// Remove body class
		body.classList.remove('playlight-sdk-flex-body');

		// Reset state
		sidebarContainer = null;
		contentWrapper = null;
		originalBodyStyles = {};
		isLayoutSetup = false;
	} catch (error) {
		console.error("Playlight error occurred during sidebar removal:", error);
	}
}
