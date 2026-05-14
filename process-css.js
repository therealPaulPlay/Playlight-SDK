import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import postcss from "postcss";

const cssPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "dist/playlight-sdk.css");

const prefixVars = (s) => s.replace(/--tw-/g, "--playlight-tw-");

function prefixSelector(selector) {
	const s = selector.trim();
	if (s === ":root" || s.startsWith(".playlight-sdk") || s.includes("#playlight-sdk")) return selector;
	if (s === "html") return ".playlight-sdk";
	return `.playlight-sdk ${selector}`;
}

function isKeyframeRule(rule) {
	for (let p = rule.parent; p; p = p.parent) if (p.type === "atrule" && /^(-webkit-)?keyframes$/i.test(p.name)) return true;
	return false;
}

const root = postcss.parse(fs.readFileSync(cssPath, "utf8"));

root.walkAtRules("property", (r) => (r.params = prefixVars(r.params)));

root.walkRules((rule) => {
	if (isKeyframeRule(rule)) return;
	const inThemeLayer = rule.parent?.type === "atrule" && rule.parent.name === "layer" && rule.parent.params === "theme";
	const mapped = rule.selectors.map((s) => {
		if (inThemeLayer && /^(:root|:host)$/.test(s.trim())) return ".playlight-sdk";
		return prefixSelector(s);
	});
	rule.selectors = [...new Set(mapped)];
});

root.walkDecls((decl) => {
	decl.prop = prefixVars(decl.prop);
	decl.value = prefixVars(decl.value);
});

fs.writeFileSync(cssPath, root.toString());
console.log("CSS successfully transformed with .playlight-sdk prefix and Tailwind variable prefixing");
