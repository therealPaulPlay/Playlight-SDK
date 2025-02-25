import { mount } from 'svelte';
import App from './App.svelte';
import { initializeConfig } from './lib/config.js';
import { detectExitIntent } from './lib/exitIntent.js';
import api from './lib/api.js';

// Create the main SDK class
class PlaylightSDK {
    constructor() {
        this.container = null;
        this.app = null;
        this.isInitialized = false;
        this.config = null;
        this.api = api;
        this.appActions = null;
    }

    async init(userConfig = {}) {
        if (this.isInitialized) return;

        // Initialize configuration with defaults and user overrides
        this.config = initializeConfig(userConfig);

        // Create container for Svelte app
        this.container = document.createElement('div');
        this.container.id = 'playlight-sdk-container';
        document.body.appendChild(this.container);

        // Use mount function (client-side equivalent of render)
        this.app = mount(App, {
            target: this.container,
            props: {
                config: this.config,
                api: this.api
            }
        });

        // Global variable to store actions (safer than window.__)
        if (typeof window !== 'undefined') {
            window.playlightActions = {};
        }

        // Set up exit intent detection if enabled
        if (this.config.exitIntent && this.config.exitIntent.enabled) {
            detectExitIntent(() => {
                this.openDiscovery();
            });
        }

        // Fetch categories and cache them
        await this.api.getCategories();

        this.isInitialized = true;
        return this;
    }

    // Access to app actions (with delay to ensure they're registered)
    get actions() {
        if (typeof window !== 'undefined') {
            return window.playlightActions || {};
        }
        return {};
    }

    // Public methods
    openDiscovery() {
        if (!this.isInitialized) return;
        if (this.actions.setShowDiscovery) {
            this.actions.setShowDiscovery(true);
            this.trackEvent('open');
        }
    }

    closeDiscovery() {
        if (!this.isInitialized) return;
        if (this.actions.setShowDiscovery) {
            this.actions.setShowDiscovery(false);
        }
    }

    setPosition(position) {
        if (!this.isInitialized) return;
        const validPositions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
        if (validPositions.includes(position) && this.actions.setButtonPosition) {
            this.actions.setButtonPosition(position);
        } else {
            console.error("Invalid position for floating discovery button or actions not available.");
        }
    }

    // Game recommendation methods
    async getRecommendedGames(category = null) {
        return await this.api.getSuggestions(category);
    }

    // Current game information
    async getCurrentGame() {
        return await this.api.getCurrentGameInfo();
    }

    // Analytics
    trackEvent(eventType, gameId = null) {
        if (eventType === 'open') {
            this.api.trackOpen();
        } else if (eventType === 'click' && gameId) {
            this.api.trackClick(gameId);
        }
    }
}

// Create instance and expose it globally
const playlightSDK = new PlaylightSDK();

// Auto-initialize if configured in the script tag
if (typeof window !== 'undefined' && window.PlaylightConfig) {
    playlightSDK.init(window.PlaylightConfig);
}

// Expose SDK globally
if (typeof window !== 'undefined') {
    window.PlayLightSDK = playlightSDK;
}

// Export for module usage
export default playlightSDK;