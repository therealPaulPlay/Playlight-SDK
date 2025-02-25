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
    }

    async init(userConfig = {}) {
        if (this.isInitialized) return;

        // Initialize configuration with defaults and user overrides
        this.config = initializeConfig(userConfig);

        // Create container for Svelte app
        this.container = document.createElement('div');
        this.container.id = 'playlight-sdk-container';
        document.body.appendChild(this.container);

        // Render the main app
        this.app = new App({
            target: this.container,
            props: {
                config: this.config,
                api: this.api
            }
        });

        // Wait for the app to register its actions
        setTimeout(() => {
            this.appActions = window.__playlightActions;
        }, 100);

        // Set up exit intent detection if enabled
        if (this.config.exitIntent.enabled) {
            detectExitIntent(() => {
                this.openDiscovery();
            });
        }

        // Fetch categories and cache them
        await this.api.getCategories();

        this.isInitialized = true;
        return this;
    }

    // Public methods
    openDiscovery() {
        if (!this.isInitialized) return;
        if (this.appActions && this.appActions.setShowDiscovery) {
            this.appActions.setShowDiscovery(true);
            this.trackEvent('open');
        }
    }

    closeDiscovery() {
        if (!this.isInitialized) return;
        if (this.appActions && this.appActions.setShowDiscovery) {
            this.appActions.setShowDiscovery(false);
        }
    }

    setPosition(position) {
        if (!this.isInitialized) return;
        const validPositions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
        if (validPositions.includes(position) && this.appActions && this.appActions.setButtonPosition) {
            this.appActions.setButtonPosition(position);
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
if (window.PlaylightConfig) {
    playlightSDK.init(window.PlaylightConfig);
}

// Expose SDK globally
window.PlayLightSDK = playlightSDK;

// Export for module usage
export default playlightSDK;