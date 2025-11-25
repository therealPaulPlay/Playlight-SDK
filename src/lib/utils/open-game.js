import api from "../api";

export function openGame(domain, id, format) {
	if (!domain || id == null) return console.error("Domain or Game ID are missing!");
	if (!format) console.warn("Format is not specified for click event!");
	api.trackClick(id, format);
	window.open("https://" + domain + "?utm_source=playlight", "_blank", "noopener");
}
