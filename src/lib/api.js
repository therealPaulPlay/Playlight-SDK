import { toast } from "svelte-sonner";

class PlayLightAPI {
	constructor() {
		this.baseUrl = "https://api.playlight.dev/platform";
		this.cachedCategories = null;
		this.currentGame = null;
		this.pendingCacheRequests = new Map();
	}

	async request(endpoint, options = {}) {
		const { deduplicate, ...fetchOptions } = options;

		// If deduplicating, check for pending request and return same promise
		if (deduplicate && this.pendingCacheRequests.has(endpoint)) return this.pendingCacheRequests.get(endpoint);

		const makeRequest = async () => {
			try {
				const url = `${this.baseUrl}${endpoint}`;
				const response = await fetch(url, {
					...fetchOptions,
					headers: {
						"Content-Type": "application/json",
						...fetchOptions.headers,
					},
				});

				if (!response.ok) {
					let data;
					try {
						data = await response.json();
					} catch {
						// Do nothing...
					} finally {
						if (response.status !== 429 && response.status !== 404) throw new Error(data?.error || data?.message || response.status);
						else if (response.status === 429) return console.warn("Playlight request failed due to rate limiting.");
						else if (response.status === 404) return console.warn(
							"Playlight game not found. This is normal in a test / local environment, but should not appear in production.",
						);
					}
				}

				return await response.json();
			} catch (error) {
				toast.error("Request failed: " + error.message);
				console.error("Playlight API request error:", error);
			}
		};

		if (deduplicate) {
			const promise = makeRequest().then((data) => {
				this.pendingCacheRequests.delete(endpoint);
				return data;
			});
			this.pendingCacheRequests.set(endpoint, promise);
			return promise;
		} else {
			return makeRequest();
		}
	}

	#getHostnameWithoutWWW() {
		const hostname = window.location.hostname;
		return hostname.startsWith("www.") ? hostname.substring(4) : hostname;
	}

	// Get all categories
	async getCategories() {
		if (this.cachedCategories) return this.cachedCategories; // Cached
		const data = await this.request("/categories", { deduplicate: true });
		this.cachedCategories = data;
		return data;
	}

	// Get game suggestions, optionally filtered by category
	async getSuggestions(category = null, page = 1) {
		let endpoint = "/suggestions";
		if (category) endpoint += "/" + category;
		if (page) endpoint += "?page=" + page;
		endpoint += "&without=" + this.#getHostnameWithoutWWW();
		return await this.request(endpoint);
	}

	// Get current game info
	async getCurrentGameInfo() {
		if (this.currentGame) return this.currentGame; // Cached
		const endpoint = "/game-by-domain/" + this.#getHostnameWithoutWWW();
		this.currentGame = await this.request(endpoint, { deduplicate: true });
		return this.currentGame ? { ...this.currentGame } : null;
	}

	// Track discovery overlay open
	async trackOpen() {
		const currentDomain = this.#getHostnameWithoutWWW();
		await this.request("/event/open", {
			method: "POST",
			body: JSON.stringify({
				domain: currentDomain,
			}),
		});
	}

	// Track game click (pass id of the game that was clicked on)
	async trackClick(gameId) {
		const currentDomain = this.#getHostnameWithoutWWW();
		await this.request("/event/click", {
			method: "POST",
			body: JSON.stringify({
				sourceDomain: currentDomain,
				gameId,
			}),
		});
	}

	// Like or unlike a game (pass gameId and true to like, false to unlike)
	async toggleLike(gameId, isLike = true) {
		const action = isLike ? "like" : "unlike";
		const result = await this.request(`/rating/${gameId}/${action}`, {
			method: "POST",
		});
		return result?.success || false;
	}
}

// Create and export a singleton instance
const api = new PlayLightAPI();
export default api;
