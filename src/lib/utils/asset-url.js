const CDN_BASE_DOMAIN = "sdk.playlight.dev";

export function getAssetBaseUrl() {
	const scriptUrl = import.meta.url;

	// CDN or local file: use CDN assets
	if (scriptUrl.includes(CDN_BASE_DOMAIN) || scriptUrl.startsWith("file://")) {
		return "https://" + CDN_BASE_DOMAIN;
	}

	// NPM package: return base path where the entry point is located
	const url = new URL(scriptUrl);
	return url.origin + url.pathname.substring(0, url.pathname.lastIndexOf("/"));
}
