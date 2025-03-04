import { mount } from 'svelte';
import App from './App.svelte';
import { initializeConfig } from './lib/config.js';
import { discoveryOpen } from './lib/store.js';
import api from './lib/api.js';
import { get } from 'svelte/store';

// Create the main SDK class
class PlaylightSDK {
    constructor() {
        this.container = null;
        this.app = null;
        this.isInitialized = false;
        this.config = null;
        this.api = api;
    }

    async init(userConfig = {}) {
        if (this.isInitialized) return;

        if (typeof window === 'undefined') {
            return console.error("Playlight cannot run on the server, as it depends browser APIs.");
        }

        // Initialize configuration with defaults and user overrides
        this.config = initializeConfig(userConfig);

        // Create container for Svelte app
        this.container = document.createElement('div');
        this.container.id = 'playlight-sdk-container';
        this.container.className = 'playlight-sdk-container';
        document.body.appendChild(this.container);

        // Use mount function (client-side equivalent of render)
        this.app = mount(App, {
            target: this.container,
            props: {
                config: this.config
            }
        });

        // Fetch current game info to cache it
        await this.api.getCurrentGameInfo();

        this.isInitialized = true;
        return this;
    }

    // Public methods
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