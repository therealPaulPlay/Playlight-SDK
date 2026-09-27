import api from "../api";

export function openGame(domain, id, format) {
	if (!domain) return console.error("Domain is missing!");
	if (id != null && !format) console.warn("Format is not specified for click event!");
	if (id != null) api.trackClick(id, format);
	window.open("https://" + domain + "?utm_source=playlight", "_blank", "noopener");
}
