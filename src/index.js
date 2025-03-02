import { mount } from 'svelte';
import App from './App.svelte';
import { initializeConfig } from './lib/config.js';
import { discoveryOpen, projectUrl } from './lib/store.js';
import api from './lib/api.js';
import { get } from 'svelte/store';

class PlaylightSDK {
    constructor() {
        this.container = null;
        this.shadow = null;
        this.app = null;
        this.isInitialized = false;
        this.config = null;
        this.api = api;
    }

    async init(userConfig = {}) {
        if (this.isInitialized) return;

        // Initialize configuration with defaults and user overrides
        this.config = initializeConfig(userConfig);

        // Create container for Svelte app
        this.container = document.createElement('div');
        this.container.id = 'playlight-sdk-container';

        // Create shadow DOM
        this.shadow = this.container.attachShadow({ mode: 'open' });

        // Create a container for the app inside shadow DOM
        const appContainer = document.createElement('div');
        this.shadow.appendChild(appContainer);

        // Add the stylesheet to the shadow DOM
        const stylesheet = document.createElement('link');
        stylesheet.rel = 'stylesheet';
        stylesheet.href = get(projectUrl) + '/playlight-sdk.css';
        this.shadow.appendChild(stylesheet);

        // Mount the app inside shadow DOM
        this.app = mount(App, {
            target: appContainer,
            props: {
                config: this.config
            }
        });

        // Add container to document
        document.body.appendChild(this.container);

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