const fs = require('fs');
const path = require('path');
const cssPath = path.resolve(__dirname, 'dist/playlight-sdk.css');

// Read the CSS file
let css = fs.readFileSync(cssPath, 'utf8');

function transformCss(css) {
    // Store at-rules to restore them later
    const atRules = [];
    let processedCss = css;

    // Extract all at-rules
    processedCss = processedCss.replace(/@[^{]*\{[^]*?\}/g, match => {
        const placeholder = `__AT_RULE_${atRules.length}__`;
        atRules.push({ placeholder, rule: match });
        return placeholder;
    });

    // Extract simple at-rules like @import
    processedCss = processedCss.replace(/@[^{]*;/g, match => {
        const placeholder = `__AT_RULE_${atRules.length}__`;
        atRules.push({ placeholder, rule: match });
        return placeholder;
    });

    // Process regular CSS rules
    processedCss = processedCss.replace(/([^{}]+)\{([^{}]*)\}/g, (match, selector, declarations) => {
        // If it's a placeholder, skip it
        if (selector.trim().startsWith('__AT_RULE_')) {
            return match;
        }

        // Process comma-separated selectors
        const selectors = selector.split(',').map(s => s.trim()).filter(Boolean);

        // Add container prefix to each selector if not already present or if it is a global selector
        const prefixedSelectors = selectors.map(s => {
            // Do not prefix global selectors like :root or html
            if (s === ':root' || s.includes('#playlight-sdk-container')) {
                return s;
            }
            // Handle html selector specifically
            if (s === 'html') {
                return '#playlight-sdk-container';
            }
            return `#playlight-sdk-container ${s}`;
        });

        // Return the rule with prefixed selectors
        return `${prefixedSelectors.join(', ')} {${declarations}}`;
    });

    // Process at-rules one by one
    for (let i = atRules.length - 1; i >= 0; i--) {
        const { placeholder, rule } = atRules[i];

        if (rule.startsWith('@keyframes') || rule.startsWith('@-webkit-keyframes')) {
            // Special handling for keyframes
            let processedRule = rule.replace(/\{([^{}]*)\{([^{}]*)\}\}/g, (match, keyframeSelector, declarations) => {
                // Don't prefix the keyframe selectors (from, to, percentages)
                return `{${keyframeSelector}{${declarations}}}`;
            });

            // Replace the placeholder with the processed rule
            processedCss = processedCss.replace(placeholder, processedRule);
        } else if (rule.startsWith('@media') || rule.startsWith('@supports')) {
            // Handle media and support queries
            let processedRule = rule.replace(/([^{}]+)\{([^{}]*)\}/g, (match, selector, declarations) => {
                // Skip the at-rule declaration itself
                if (selector.trim().startsWith('@')) {
                    return match;
                }

                // Process comma-separated selectors
                const selectors = selector.split(',').map(s => s.trim()).filter(Boolean);

                // Add container prefix to each selector
                const prefixedSelectors = selectors.map(s => {
                    // Do not prefix global selectors
                    if (s === ':root' || s.includes('#playlight-sdk-container')) {
                        return s;
                    }
                    // Handle html selector specifically
                    if (s === 'html') {
                        return '#playlight-sdk-container';
                    }
                    return `#playlight-sdk-container ${s}`;
                });

                return `${prefixedSelectors.join(', ')} {${declarations}}`;
            });

            // Replace the placeholder with the processed rule
            processedCss = processedCss.replace(placeholder, processedRule);
        } else if (rule.startsWith('@layer base')) {
            // Handle @layer base with special processing for html selectors
            let processedRule = rule;

            // First, directly replace 'html,' with '#playlight-sdk-container,'
            processedRule = processedRule.replace(/html\s*,/g, '#playlight-sdk-container ,');

            // Then process other selectors
            processedRule = processedRule.replace(
                /([^{}]+)\{([^{}]*)\}/g,
                (match, selectors, declarations) => {
                    // Skip if not a CSS rule
                    if (selectors.trim().startsWith('@')) {
                        return match;
                    }

                    // Split the selectors
                    const selectorList = selectors.split(',').map(s => s.trim());

                    // Prefix or replace each selector appropriately
                    const prefixedSelectors = selectorList.map(selector => {
                        if (selector === 'html') {
                            return '#playlight-sdk-container';
                        } else if (selector === ':root') {
                            return selector;
                        } else if (selector.includes('#playlight-sdk-container')) {
                            return selector;
                        } else {
                            return `#playlight-sdk-container ${selector}`;
                        }
                    });

                    return `${prefixedSelectors.join(', ')} {${declarations}}`;
                }
            );

            // Replace the placeholder with the processed rule
            processedCss = processedCss.replace(placeholder, processedRule);
        } else {
            // Other at-rules can be restored as-is
            processedCss = processedCss.replace(placeholder, rule);
        }
    }

    return processedCss;
}

// Transform the CSS
const transformedCss = transformCss(css);

// Write the transformed CSS
fs.writeFileSync(cssPath, transformedCss);
console.log('CSS successfully transformed with #playlight-sdk-container prefix');