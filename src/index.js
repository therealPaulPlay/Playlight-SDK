import { initializeConfig } from './lib/config.js';
import { config, discoveryOpen, userIsFromPlaylight } from './lib/store.js';
import { eventCallbacks } from './lib/utils/trigger-event.js';
import api from './lib/api.js';
import { initWidgets, setupWidgetObserver } from './lib/utils/mount-widgets.js';
import { mountPlaylight } from './lib/utils/mount-components.js';

/**
 * The PlaylightSDK class
 */
class PlaylightSDK {
	/**
	 * Initialize Playlight
	 * @param {object} [userConfig] - The playlight configuration object
	 */
	async init(userConfig = {}) {
		if (typeof window === 'undefined') return console.error("Playlight cannot run on the server, as it depends on browser APIs.");
		if (window.playlightInitialized) return console.warn("Playlight SDK is already initialized!");

		// Initialize configuration with defaults and user overrides
		this.setConfig(userConfig);
		mountPlaylight(); // Create container and mount app

		// Widgets
		initWidgets();
		setupWidgetObserver();

		// Set user origin
		const isPlaylightSession = sessionStorage.getItem("fromPlaylight") === "true";
		const isFromPlaylight = new URLSearchParams(window.location.search).get('utm_source') === 'playlight';
		if (isFromPlaylight) sessionStorage.setItem("fromPlaylight", "true"); // Save in session storage to persist on MPAs
		userIsFromPlaylight.set(isPlaylightSession || isFromPlaylight);

		// Set initialized
		window.playlightInitialized = true;

		// Fetch current game info to cache it
		await api.getCurrentGameInfo();
	}

	/**
	 * Show or hide the discovery
	 * @param {boolean} [value=true] - Whether to show the discovery
	 */
	setDiscovery(value = true) {
		discoveryOpen.set(value);
	}

	/**
	 * Register an event callback
	 * @param {string} event - Event name
	 * @param {object} callback - Callback function
	 */
	onEvent(event, callback) {
		const validEvents = ["discoveryOpen", "discoveryClose", "exitIntent"];
		if (!validEvents.includes(event)) return console.warn(`Invalid event type "${event}!"`);
		if (!eventCallbacks.has(event)) eventCallbacks.set(event, []);
		eventCallbacks.get(event).push(callback);
	}

	/**
	 * Update the configuration
	 * @param {object} [configParam] - Playlight configuration object
	 */
	setConfig(configParam = {}) {
		config.set(initializeConfig(configParam));
	}
}

// Create instance
const playlightSDK = new PlaylightSDK();
if (typeof window !== 'undefined') window.playlightSDK = playlightSDK; // Expose SDK as global var for iife (legacy) usage

// Export for module usage
export default playlightSDK;