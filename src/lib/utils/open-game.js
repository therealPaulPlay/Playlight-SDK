import api from "../api";

export function openGame(domain, id) {
	if (!domain || id == null) return console.error("Domain or Game ID are not provided!");
	api.trackClick(id);
	window.open("https://" + domain + "?utm_source=playlight", "_blank", "noopener");
}
