import api from "../api.js";

export async function fetchQuickSuggestions(truncate = 10) {
	if (truncate > 10) throw new Error("Can't truncate to more than 10");
	const result = await api.getSuggestions(1);
	return (result?.games || []).slice(0, truncate);
}
