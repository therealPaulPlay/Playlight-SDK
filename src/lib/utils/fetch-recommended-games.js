import api from "../api.js";

export async function fetchRecommendedGames(category) {
    // First try with category
    let result = await api.getSuggestions(category, 1);
    let fetchedGames = result?.games || [];

    // If not enough games, try without category
    if (fetchedGames.length < 10 && category) {
        const moreResult = await api.getSuggestions(null, 1);
        const moreGames = moreResult?.games || [];

        // Filter out duplicates
        const uniqueGames = moreGames.filter((newGame) => !fetchedGames.some((existing) => existing.id === newGame.id));
        fetchedGames = [...fetchedGames, ...uniqueGames];
    }

    // Limit the number of games to 10
    return fetchedGames.slice(0, 10);
}