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
                    if (response.status !== 429 && response.status !== 404) {
                        throw new Error(`API request failed: ${data?.error || data?.message || response.status}`);
                    } else if (response.status === 429) {
                        return console.warn("Playlight request didn't go through due to rate limiting.");
                    } else {
                        return console.warn("Playlight game not found. This is normal in a test / local environment, but should not appear in production.");
                    }
                }
            }

            return await response.json();
        } catch (error) {
            toast.error("Error: " + error);
            console.error("Playlight API error:", error);
        }
    }

    #getHostnameWithoutWWW() {
    const hostname = window.location.hostname;
    return hostname.startsWith('www.') ? hostname.substring(4) : hostname;
}

    // Get all categories
    async getCategories() {
    if (this.cachedCategories) return this.cachedCategories; // Return cached categories if available
    const data = await this.request('/categories');
    this.cachedCategories = data;
    return data;
}

    // Get game suggestions, optionally filtered by category
    async getSuggestions(category = null, page = 1) {
    let endpoint = '/suggestions';
    if (category) endpoint += "/" + category;
    if (page) endpoint += "?page=" + page;
    endpoint += "&without=" + this.#getHostnameWithoutWWW();
    return await this.request(endpoint);
}

    // Get game suggestions, optionally filtered by category
    async getCurrentGameInfo() {
    if (this.currentGame) return this.currentGame; // Cached
    let endpoint = '/game-by-domain/' + this.#getHostnameWithoutWWW();
    this.currentGame = await this.request(endpoint);
    return { ...this.currentGame };
}

    // Track discovery overlay open
    async trackOpen() {
    const currentDomain = this.#getHostnameWithoutWWW();
    await this.request('/event/open', {
        method: 'POST',
        body: JSON.stringify({
            domain: currentDomain
        })
    });
}

    // Track game click (pass id of the game that was clicked on)
    async trackClick(gameId) {
    const currentDomain = this.#getHostnameWithoutWWW();
    await this.request('/event/click', {
        method: 'POST',
        body: JSON.stringify({
            sourceDomain: currentDomain,
            gameId
        })
    });
}
}

// Create and export a singleton instance
const api = new PlayLightAPI();
export default api;