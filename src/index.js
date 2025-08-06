import { mount } from 'svelte';
import App from './App.svelte';
import { initializeConfig } from './lib/config.js';
import { discoveryOpen } from './lib/store.js';
import { eventCallbacks } from './lib/utils/trigger-event.js';
import api from './lib/api.js';
import { writable } from 'svelte/store';
import { initWidgets, setupWidgetObserver } from './lib/utils/load-widgets.js';

/**
 * The PlaylightSDK class
 */
class PlaylightSDK {
    /**
     * Create new Playlight instance
     */
    constructor() {
        this.container = null;
        this.isInitialized = false;
        this.config = writable(null);
        this.api = api;
    }

    /**
     * Initialize Playlight
     * @param {Object} [userConfig] - The playlight configuration object
     */
    async init(userConfig = {}) {
        if (typeof window === 'undefined') return console.error("Playlight cannot run on the server, as it depends on browser APIs.");
        if (this.isInitialized) {
            console.warn("Playlight SDK already initialized!");
            if (!document.getElementById("playlight-sdk-container")) this.#mountPlaylight();
            return;
        }

        // Initialize configuration with defaults and user overrides
        this.setConfig(userConfig);
        this.#mountPlaylight(); // Create container and mount app

        // Widgets
        initWidgets();
        setupWidgetObserver();

        // Fetch current game info to cache it
        await this.api.getCurrentGameInfo();

        this.isInitialized = true;
    }

    /**
     * Mount the Svelte app to the playlight container
     * @private
     */
    #mountPlaylight() {
        try {
            this.container = document.createElement('div');
            this.container.id = 'playlight-sdk-container';
            this.container.className = 'playlight-sdk-container';
            document.body.appendChild(this.container);

            // Mount (client-side alternative to render)
            mount(App, {
                target: this.container,
                props: {
                    config: this.config
                }
            });
        } catch (error) {
            console.error("Playlight error occured during mount:", error);
        }
    }

    /**
     * Show or hide the discovery
     * @param {boolean} [value=true] - Whether to show the discovery
     */
    setDiscovery(value = true) {
        if (!this.isInitialized) return;
        discoveryOpen.set(value);
        if (value) api.trackOpen();
    }

    /**
     * Register an event callback
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    onEvent(event, callback) {
        const validEvents = ["discoveryOpen", "discoveryClose", "exitIntent"];
        if (!validEvents.includes(event)) return console.warn(`Invalid event type "${event}!"`);
        if (!eventCallbacks.has(event)) eventCallbacks.set(event, []);
        eventCallbacks.get(event).push(callback);
    }

    /**
     * Update the configuration
     * @param {Object} [config] - Playlight configuration object
     */
    setConfig(config = {}) {
        this.config?.set(initializeConfig(config));
    }
}

// Create instance and expose it globally
const playlightSDK = new PlaylightSDK();

// Expose SDK as global var for iife (legacy) usage
if (typeof window !== 'undefined') {
    window.playlightSDK = playlightSDK;
}

// Export for module usage
export default playlightSDK;