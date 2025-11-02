import { mount, unmount } from 'svelte';
import App from '../../App.svelte';
import Sidebar from '../components/Sidebar.svelte';
import { activateCSSViewportOverride, deactivateCSSViewportOverride } from './override-css.js';
import { config, sidebarCollapsed } from '../store.js';
import { get } from 'svelte/store';

// State
let appContainer = null;
let sidebarContainer = null;
let sidebarComponent = null;
let isSidebarLayoutSetup = false;
let originalInnerWidthDescriptor = null;
let innerWrapper = null;
let createdInnerWrapper = false;
let originalBodyClasses = [];

// Polyfill window.innerWidth to return inner wrapper width when sidebar is active
function setupWindowDimensionPolyfill() {
	try {
		originalInnerWidthDescriptor = Object.getOwnPropertyDescriptor(window, 'innerWidth');
		Object.defineProperty(window, 'innerWidth', {
			get: () => innerWrapper?.clientWidth || document.documentElement.clientWidth,
			configurable: true
		});
	} catch (error) {
		console.warn('Could not polyfill window.innerWidth:', error);
	}
}

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
		console.error('Error during Playlight mount:', error);
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
			child => child.tagName === 'DIV' && !child.id?.includes('playlight') && child.children.length > 0
		);

		const createWrapper = () => {
			const wrapper = document.createElement('div');
			wrapper.id = 'playlight-sdk-inner-wrapper';
			Array.from(body.children)
				.filter(child => !['SCRIPT', 'STYLE'].includes(child.tagName) && !child.id?.includes('playlight'))
				.forEach(child => wrapper.appendChild(child));
			body.appendChild(wrapper);
			return wrapper;
		};

		// Detect framework root using depth heuristic
		if (get(config)?.sidebar?.hasFrameworkRoot !== false && bodyDivs.length > 0) {
			if (bodyDivs.length === 1) {
				innerWrapper = bodyDivs[0];
				createdInnerWrapper = false;
			} else {
				const depths = bodyDivs.map(div => div.querySelectorAll('*').length);
				const maxDepth = Math.max(...depths);
				const avgDepth = depths.reduce((a, b) => a + b) / depths.length;
				if (get(config)?.sidebar?.hasFrameworkRoot === true || maxDepth > avgDepth * 3) {
					innerWrapper = bodyDivs[depths.indexOf(maxDepth)];
					createdInnerWrapper = false;
				}
			}
		}

		if (!innerWrapper) {
			innerWrapper = createWrapper();
			createdInnerWrapper = true;
		}

		// Apply structure classes
		html.classList.add('playlight-sdk-flex-html');
		body.classList.add('playlight-sdk-outer-wrapper');
		innerWrapper.classList.add('playlight-sdk-inner-wrapper');

		// Activate CSS overrides (must happen before transferring styles)
		setupWindowDimensionPolyfill();
		activateCSSViewportOverride(body);

		// Transfer body classes to inner wrapper (except SDK classes)
		originalBodyClasses = Array.from(body.classList).filter(cls => !cls.startsWith('playlight'));
		originalBodyClasses.forEach(cls => {
			innerWrapper.classList.add(cls);
			body.classList.remove(cls);
		});

		// Apply conditional style overrides based on computed styles
		const computed = window.getComputedStyle(innerWrapper);
		if (computed.display === 'contents') innerWrapper.style.setProperty('display', 'block', 'important');
		if (computed.overflow === 'visible') innerWrapper.style.setProperty('overflow', 'auto', 'important');

		// Mount sidebar as child of <html>
		sidebarContainer = document.createElement('div');
		sidebarContainer.className = 'playlight-sdk playlight-sdk-container-sidebar';
		html.appendChild(sidebarContainer);
		sidebarComponent = mount(Sidebar, { target: sidebarContainer });
		isSidebarLayoutSetup = true;
	} catch (error) {
		console.error('Error during sidebar setup:', error);
	}
}

// Remove sidebar layout and unmount sidebar
export function removeSidebarLayout() {
	if (!isSidebarLayoutSetup) return;
	try {
		const body = document.body;
		const html = document.documentElement;

		// Unmount and remove sidebar
		if (sidebarComponent) unmount(sidebarComponent);
		if (sidebarContainer?.parentNode) html.removeChild(sidebarContainer);

		// Remove classes
		html.classList.remove('playlight-sdk-flex-html');
		body.classList.remove('playlight-sdk-outer-wrapper');

		// Restore body classes
		if (innerWrapper) {
			originalBodyClasses.forEach(cls => {
				body.classList.add(cls);
				innerWrapper.classList.remove(cls);
			});
		}

		// Unwrap or remove inner wrapper
		if (createdInnerWrapper && innerWrapper) {
			Array.from(innerWrapper.children).forEach(child => {
				if (child.parentNode === innerWrapper) body.insertBefore(child, innerWrapper);
			});
			innerWrapper.remove();
		} else if (innerWrapper) innerWrapper.classList.remove('playlight-sdk-inner-wrapper');

		// Restore polyfills and clean up
		restoreWindowDimensionPolyfill();
		deactivateCSSViewportOverride();

		// Reset state
		sidebarContainer = null;
		sidebarComponent = null;
		innerWrapper = null;
		originalBodyClasses = [];
		createdInnerWrapper = isSidebarLayoutSetup = false;
		sidebarCollapsed.set(false);
	} catch (error) {
		console.error('Error during sidebar removal:', error);
	}
}