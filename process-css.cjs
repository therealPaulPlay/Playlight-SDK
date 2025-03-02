const fs = require('fs');
const path = require('path');
const cssPath = path.resolve(__dirname, 'dist/playlight-sdk.css');

// Read the CSS file
let css = fs.readFileSync(cssPath, 'utf8');

// Create a simple CSS parser to handle the transformation correctly
function transformCss(css) {
    // Extend the at-rule patterns to include @property rules so they’re not processed below.
    const atRulePatterns = [
        /@(?:media|keyframes|font-face|supports|layer|import|charset|property)[^{]*\{[^]*?\}/g,
        /@[^{]*;/g
    ];

    const atRules = [];
    let processedCss = css;

    // Extract all at-rules (including @property)
    atRulePatterns.forEach(pattern => {
        processedCss = processedCss.replace(pattern, match => {
            const placeholder = `__AT_RULE_${atRules.length}__`;
            atRules.push({ placeholder, rule: match });
            return placeholder;
        });
    });

    // Process regular rules
    processedCss = processedCss.replace(/([^{}]+)\{([^{}]*)\}/g, (match, selector, declarations) => {
        // If it's a placeholder, skip it
        if (selector.includes('__AT_RULE_')) {
            return match;
        }

        // Process comma-separated selectors
        const selectors = selector.split(',').map(s => s.trim()).filter(Boolean);

        // Add container prefix to each selector if not already present or if it is a global selector
        const prefixedSelectors = selectors.map(s => {
            // Do not prefix global selectors like :root or html
            if (s === ':root' || s === 'html' || s.includes('#playlight-sdk-container')) {
                return s;
            }
            return `#playlight-sdk-container ${s}`;
        });

        // Return the rule with original declarations (no !important added)
        return `${prefixedSelectors.join(', ')} {${declarations}}`;
    });

    // Restore at-rules
    atRules.forEach(({ placeholder, rule }) => {
        processedCss = processedCss.replace(placeholder, rule);
    });

    return processedCss;
}

// Transform the CSS
const transformedCss = transformCss(css);

// Write the transformed CSS
fs.writeFileSync(cssPath, transformedCss);
console.log('CSS successfully transformed with #playlight-sdk-container prefix');