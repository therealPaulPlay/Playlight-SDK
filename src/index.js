import { mount } from 'svelte';
import App from './App.svelte';
import { initializeConfig } from './lib/config.js';
import { discoveryOpen } from './lib/store.js';
import api from './lib/api.js';
import { get } from 'svelte/store';

/**
 * The PlaylightSDK class
 */
class PlaylightSDK {
    constructor() {
        this.container = null;
        this.app = null;
        this.isInitialized = false;
        this.config = null;
        this.api = api;
    }

    /**
     * Initialize Playlight
     * @param {Object} [userConfig] - The playlight configuration object
     */
    async init(userConfig = {}) {
        if (typeof window === 'undefined') {
            return console.error("Playlight cannot run on the server, as it depends on browser APIs.");
        }

        if (this.isInitialized) {
            console.warn("Playlight SDK already initialized!");
            if (!document.getElementById("playlight-sdk-container")) this.#mountPlaylight();
            return;
        }

        // Initialize configuration with defaults and user overrides
        this.config = initializeConfig(userConfig);
        this.#mountPlaylight(); // Create container and mount

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
            this.app = mount(App, {
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
     * @param {boolean} value - Whether to show the discovery
     */
    setDiscovery(value) {
        if (!this.isInitialized) return;
        discoveryOpen.set(value);
        if (get(discoveryOpen)) api.trackOpen();
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