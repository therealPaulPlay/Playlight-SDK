import { toast } from "svelte-sonner";
import { get } from "svelte/store";
import { apiURL } from "./store";

class PlayLightAPI {
	constructor() {
		this.cachedRequests = new Map();
		this.pendingCacheRequests = new Map();
	}

	async request(endpoint, options = {}) {
		const { deduplicate, ...fetchOptions } = options;

		// If deduplicating, check for pending request and return same promise
		if (deduplicate && this.pendingCacheRequests.has(endpoint)) return this.pendingCacheRequests.get(endpoint);

		const makeRequest = async () => {
			try {
				const url = `${get(apiURL)}${endpoint}`;
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
					} catch { /* Do nothing... */ }

					switch (response.status) {
						case 429:
							console.warn("Playlight request failed due to rate limiting.");
							return null;
						case 404:
							console.warn("Playlight game not found. This is normal in a test / local environment, but should not appear in production.");
							return null;
						default:
							throw new Error(data?.error || data?.message || response.status);
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
		const endpoint = "/categories";
		if (this.cachedRequests.has(endpoint)) return structuredClone(this.cachedRequests.get(endpoint)); // Cache
		const data = await this.request(endpoint, { deduplicate: true });
		if (data) this.cachedRequests.set(endpoint, data);
		return structuredClone(data);
	}

	// Get game suggestions, optionally filtered by category
	async getSuggestions(category, page = 1) {
		let endpoint = "/suggestions";
		if (category) endpoint += "/" + category;
		endpoint += "?without=" + this.#getHostnameWithoutWWW();
		if (page) endpoint += "&page=" + page;
		if (this.cachedRequests.has(endpoint)) return structuredClone(this.cachedRequests.get(endpoint)); // Cache
		const result = await this.request(endpoint, { deduplicate: true });
		if (result) this.cachedRequests.set(endpoint, result);
		return structuredClone(result);
	}

	// Get current game info
	async getCurrentGameInfo() {
		const endpoint = "/game-by-domain/" + this.#getHostnameWithoutWWW();
		if (this.cachedRequests.has(endpoint)) return structuredClone(this.cachedRequests.get(endpoint)); // Cache
		const data = await this.request(endpoint, { deduplicate: true });
		if (data) this.cachedRequests.set(endpoint, data);
		return structuredClone(data);
	}

	// Track discovery overlay open
	async trackOpen(format) {
		const currentDomain = this.#getHostnameWithoutWWW();
		await this.request("/event/open", {
			method: "POST",
			body: JSON.stringify({
				domain: currentDomain,
				format,
			}),
		});
	}

	// Track game click (pass id of the game that was clicked on)
	async trackClick(gameId, format) {
		const currentDomain = this.#getHostnameWithoutWWW();
		await this.request("/event/click", {
			method: "POST",
			body: JSON.stringify({
				sourceDomain: currentDomain,
				gameId,
				format,
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
