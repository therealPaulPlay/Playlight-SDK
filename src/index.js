import { mount } from 'svelte';
import App from './App.svelte';
import WidgetCarousel from './lib/components/WidgetCarousel.svelte';
import { initializeConfig } from './lib/config.js';
import { discoveryOpen } from './lib/store.js';
import api from './lib/api.js';
import { writable, get } from 'svelte/store';

/**
 * The PlaylightSDK class
 */
class PlaylightSDK {
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
        this.#initWidgets(); // Initialize any widget containers
        this.#setupWidgetObserver(); // Watch for new widget containers that might be added to the DOM later

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
     * Initialize any existing widget containers on the page
     * @private
     */
    #initWidgets() {
        const carouselContainers = document?.querySelectorAll('#playlight-widget-carousel'); // Look for any carousel widgets
        if (carouselContainers?.length > 0) {
            carouselContainers.forEach(container => {
                this.#mountCarouselWidget(container);
            });
        }
    }

    /**
     * Set up an observer to watch for new widget containers added to the DOM
     * @private
     */
    #setupWidgetObserver() {
        try {
            const observer = new MutationObserver(() => {
                this.#initWidgets();
            });

            // Start observing the entire document for changes with configured parameters
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        } catch (error) {
            console.error("Playlight error occurred setting up widget observer:", error);
        }
    }

    /**
     * Mount a carousel widget to a container
     * @param {HTMLElement} containerElement - The container element
     * @private
     */
    #mountCarouselWidget(containerElement) {
        try {
            if (containerElement.dataset.playlightInitialized) return; // Exit if already initialized
            containerElement.dataset.playlightInitialized = 'true';

            // Mount the carousel widget
            mount(WidgetCarousel, {
                target: containerElement,
            });
        } catch (error) {
            console.error("Playlight error occurred mounting carousel widget:", error);
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