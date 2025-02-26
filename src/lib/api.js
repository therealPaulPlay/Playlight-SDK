import { toast } from 'svelte-sonner';

class PlayLightAPI {
    constructor() {
        this.baseUrl = 'https://api.playlight.dev/platform';
        this.cachedCategories = null;
        this.currentGame = null;
    }

    async request(endpoint, options = {}) {
        try {
            const url = `${this.baseUrl}${endpoint}`;
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    // Get all categories
    async getCategories() {
        if (this.cachedCategories) return this.cachedCategories; // Return cached categories if available
        const data = await this.request('/categories');
        this.cachedCategories = data;
        return data;
    }

    // Get game suggestions, optionally filtered by category
    async getSuggestions(category = null) {
        let endpoint = '/suggestions';
        if (category) endpoint += "/" + category;
        return await this.request(endpoint);
    }

    // Get game suggestions, optionally filtered by category
    async getCurrentGameInfo() {
        if (this.currentGame) return this.currentGame; // Cached
        let endpoint = '/game-by-domain/' + window.location.hostname;
        this.currentGame = await this.request(endpoint);
        return { ...this.currentGame };
    }

    // Track discovery overlay open
    async trackOpen() {
        try {
            const currentDomain = window.location.hostname;
            await this.request('/event/open', {
                method: 'POST',
                body: JSON.stringify({
                    domain: currentDomain
                })
            });
        } catch (error) {
            console.warn('Failed to track open event:', error);
        }
    }

    // Track game click (pass id of the game that was clicked on)
    async trackClick(gameId) {
        try {
            const currentDomain = window.location.hostname;
            await this.request('/event/click', {
                method: 'POST',
                body: JSON.stringify({
                    domain: currentDomain,
                    game_id: gameId
                })
            });
        } catch (error) {
            console.warn('Failed to track game click event:', error);
        }
    }
}

// Create and export a singleton instance
const api = new PlayLightAPI();
export default api;