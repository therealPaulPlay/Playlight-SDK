import { initializeConfig } from './lib/config.js';
import { discoveryOpen, sidebarVisible } from './lib/store.js';
import { eventCallbacks } from './lib/utils/trigger-event.js';
import api from './lib/api.js';
import { get, writable } from 'svelte/store';
import { initWidgets, setupWidgetObserver } from './lib/utils/mount-widgets.js';
import { mountPlaylight } from './lib/utils/mount-components.js';

/**
 * The PlaylightSDK class
 */
class PlaylightSDK {
    /**
     * Create new Playlight instance
     */
    constructor() {
        this.isInitialized = false;
        this.config = writable(null);
    }

    /**
     * Initialize Playlight
     * @param {object} [userConfig] - The playlight configuration object
     */
    async init(userConfig = {}) {
        if (typeof window === 'undefined') return console.error("Playlight cannot run on the server, as it depends on browser APIs.");
        if (this.isInitialized) return console.warn("Playlight SDK already initialized!");

        // Initialize configuration with defaults and user overrides
        this.setConfig(userConfig);
        mountPlaylight(this.config); // Create container and mount app

        // Display sidebar if initially set to visible
        sidebarVisible.set(true);

        // Widgets
        initWidgets();
        setupWidgetObserver();

        // Set initialized
        this.isInitialized = true;

        // Fetch current game info to cache it
        await api.getCurrentGameInfo();
    }

    /**
     * Show or hide the discovery
     * @param {boolean} [value=true] - Whether to show the discovery
     */
    setDiscovery(value = true) {
        if (!this.isInitialized) return;
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
     * @param {object} [config] - Playlight configuration object
     */
    setConfig(config = {}) {
        this.config?.set(initializeConfig(config));
    }
}

// Create instance and expose it globally
const playlightSDK = new PlaylightSDK();

// Expose SDK as global var for iife (legacy) usage
if (typeof window !== 'undefined') window.playlightSDK = playlightSDK;

// Export for module usage
export default playlightSDK;