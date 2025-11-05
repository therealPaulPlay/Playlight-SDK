import api from "../api.js";

export async function fetchQuickRecommendations(refetchThreshold = 10) {
	// Get categories and current game data
	const [categories, currentGame] = await Promise.all([api.getCategories(), api.getCurrentGameInfo()]);
	const selectedCategory = currentGame?.category || categories?.[categories?.length - 1];

	// First try with category
	const result = await api.getSuggestions(selectedCategory, 1);
	if (result?.pageSize < refetchThreshold) console.error("Threshold must be < than page size to avoid always triggering a re-fetch!");
	let fetchedGames = result?.games || [];

	// If not enough games, try without category
	if (fetchedGames.length < refetchThreshold && selectedCategory) {
		const moreResult = await api.getSuggestions(null, 1);
		const moreGames = moreResult?.games || [];

		// Filter out duplicates
		const uniqueGames = moreGames.filter((newGame) => !fetchedGames.some((existing) => existing.id === newGame.id));
		fetchedGames = [...fetchedGames, ...uniqueGames];
	}

	// Limit the number of games to threshold
	return fetchedGames.slice(0, refetchThreshold);
}
