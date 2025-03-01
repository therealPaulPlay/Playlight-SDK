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
                let data;
                try {
                    data = await response.json();
                } catch {
                    // Do nothing...
                } finally {
                    if (response.status !== 429) {
                        throw new Error(`API request failed: ${data?.error || data?.message || response.status}`);
                    } else {
                        return console.warn("Playlight request didn't go through due to rate limiting.");
                    }
                }
            }

            return await response.json();
        } catch (error) {
            toast.error("Error: " + error);
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
    async getSuggestions(category = null, page = 1, withoutFilter) {
        let endpoint = '/suggestions';
        if (category) endpoint += "/" + category;
        if (page) endpoint += "?page=" + page;
        if (withoutFilter) endpoint += "&without=" + withoutFilter;
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
                    sourceDomain: currentDomain,
                    gameId
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