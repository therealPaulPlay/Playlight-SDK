import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cssPath = path.resolve(__dirname, "dist/playlight-sdk.css");

function prefixSelector(selector) {
	if (selector === ":root") return selector;
	if (selector.startsWith(".playlight-sdk") || selector.includes("#playlight-sdk")) return selector;
	if (selector === "html") return ".playlight-sdk";
	return `.playlight-sdk ${selector}`;
}

function prefixTailwindVars(text) {
	return text.replace(/--tw-([a-zA-Z0-9-]+)/g, "--playlight-tw-$1");
}

function processCssRule(selector, declarations) {
	if (selector.trim().startsWith("@") || selector.trim().startsWith("__AT_RULE_"))
		return `${selector}{${declarations}}`;

	const selectors = selector
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
	const prefixedSelectors = selectors.map(prefixSelector);
	const prefixedDeclarations = prefixTailwindVars(declarations);

	return `${prefixedSelectors.join(", ")} {${prefixedDeclarations}}`;
}

function transformCss(css) {
	const atRules = [];
	let processedCss = css;

	// Extract at-rules (both block and simple)
	processedCss = processedCss.replace(/@[^{]*\{[^]*?\}/g, (match) => {
		const placeholder = `__AT_RULE_${atRules.length}__`;
		atRules.push({ placeholder, rule: match });
		return placeholder;
	});
	processedCss = processedCss.replace(/@[^{]*;/g, (match) => {
		const placeholder = `__AT_RULE_${atRules.length}__`;
		atRules.push({ placeholder, rule: match });
		return placeholder;
	});

	// Process regular CSS rules
	processedCss = processedCss.replace(/([^{}]+)\{([^{}]*)\}/g, (_, selector, declarations) =>
		processCssRule(selector, declarations),
	);

	// Process at-rules
	atRules.reverse().forEach(({ placeholder, rule }) => {
		let processedRule = rule;

		if (rule.startsWith("@keyframes") || rule.startsWith("@-webkit-keyframes")) {
			processedRule = rule.replace(
				/\{([^{}]*)\{([^{}]*)\}\}/g,
				(_, keyframeSelector, declarations) => `{${keyframeSelector}{${prefixTailwindVars(declarations)}}}`,
			);
		} else if (rule.startsWith("@media") || rule.startsWith("@supports") || rule.startsWith("@layer base")) {
			processedRule = rule.replace(/html\s*,/g, ".playlight-sdk ,");
			processedRule = processedRule.replace(/([^{}]+)\{([^{}]*)\}/g, (match, selector, declarations) =>
				processCssRule(selector, declarations),
			);
		} else if (rule.startsWith("@layer theme")) {
			processedRule = rule.replace(/(:root|:host)(\s*,\s*)*(:root|:host)?(\s*)\{/g, ".playlight-sdk {");
			processedRule = prefixTailwindVars(processedRule);
		} else if (rule.startsWith("@property")) {
			processedRule = rule.replace(/@property --tw-([a-zA-Z0-9-]+)/g, "@property --playlight-tw-$1");
		} else {
			processedRule = prefixTailwindVars(rule);
		}

		processedCss = processedCss.replace(placeholder, processedRule);
	});

	// Update var() references
	processedCss = processedCss.replace(/var\(--tw-([a-zA-Z0-9-]+)([^)]*)\)/g, "var(--playlight-tw-$1$2)");

	return processedCss;
}

const css = fs.readFileSync(cssPath, "utf8");
const transformedCss = transformCss(css);
fs.writeFileSync(cssPath, transformedCss);
console.log("CSS successfully transformed with .playlight-sdk prefix and Tailwind variable prefixing");
