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

        // Add SDK prefix to each selector if not already present or if it is a global selector
        const prefixedSelectors = selectors.map(s => {
            // Do not prefix global selectors like :root
            if (s === ':root') {
                return s;
            }
            // Do not prefix selectors that already start with .playlight-sdk
            if (s.startsWith('.playlight-sdk') || s.includes('#playlight-sdk')) {
                return s;
            }
            // Handle html selector specifically
            if (s === 'html') {
                return '.playlight-sdk';
            }
            return `.playlight-sdk ${s}`;
        });

        // Prefix Tailwind utility variables in declarations
        const prefixedDeclarations = declarations.replace(
            /--tw-([a-zA-Z0-9-]+)/g,
            '--playlight-tw-$1'
        );

        // Return the rule with prefixed selectors and declarations
        return `${prefixedSelectors.join(', ')} {${prefixedDeclarations}}`;
    });

    // Process at-rules one by one
    for (let i = atRules.length - 1; i >= 0; i--) {
        const { placeholder, rule } = atRules[i];

        if (rule.startsWith('@keyframes') || rule.startsWith('@-webkit-keyframes')) {
            // Special handling for keyframes
            let processedRule = rule.replace(/\{([^{}]*)\{([^{}]*)\}\}/g, (match, keyframeSelector, declarations) => {
                // Don't prefix the keyframe selectors (from, to, percentages)
                // But do prefix any Tailwind utility variables in the declarations
                const prefixedDeclarations = declarations.replace(
                    /--tw-([a-zA-Z0-9-]+)/g,
                    '--playlight-tw-$1'
                );
                return `{${keyframeSelector}{${prefixedDeclarations}}}`;
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

                // Add SDK prefix to each selector
                const prefixedSelectors = selectors.map(s => {
                    // Do not prefix global selectors
                    if (s === ':root') {
                        return s;
                    }
                    // Do not prefix selectors that already start with .playlight-sdk
                    if (s.startsWith('.playlight-sdk') || s.includes('#playlight-sdk')) {
                        return s;
                    }
                    // Handle html selector specifically
                    if (s === 'html') {
                        return '.playlight-sdk';
                    }
                    return `.playlight-sdk ${s}`;
                });

                // Prefix Tailwind utility variables in declarations
                const prefixedDeclarations = declarations.replace(
                    /--tw-([a-zA-Z0-9-]+)/g,
                    '--playlight-tw-$1'
                );

                return `${prefixedSelectors.join(', ')} {${prefixedDeclarations}}`;
            });

            // Replace the placeholder with the processed rule
            processedCss = processedCss.replace(placeholder, processedRule);
        } else if (rule.startsWith('@layer theme')) {
            // Special handling for @layer theme to replace :root, :host with .playlight-sdk
            // and prefix Tailwind utility variables
            let processedRule = rule.replace(
                /(:root|:host)(\s*,\s*)*(:root|:host)?(\s*)\{/g,
                '.playlight-sdk {'
            );

            // Prefix Tailwind utility variables
            processedRule = processedRule.replace(
                /--tw-([a-zA-Z0-9-]+)/g,
                '--playlight-tw-$1'
            );

            // Replace the placeholder with the processed rule
            processedCss = processedCss.replace(placeholder, processedRule);
        } else if (rule.startsWith('@layer base')) {
            // Handle @layer base with special processing for html selectors
            let processedRule = rule;

            // First, directly replace 'html,' with '.playlight-sdk,'
            processedRule = processedRule.replace(/html\s*,/g, '.playlight-sdk ,');

            // Prefix Tailwind utility variables in the entire rule
            processedRule = processedRule.replace(
                /--tw-([a-zA-Z0-9-]+)/g,
                '--playlight-tw-$1'
            );

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
                            return '.playlight-sdk';
                        } else if (selector === ':root') {
                            return selector;
                        } else if (selector.startsWith('.playlight-sdk') || selector.includes('#playlight-sdk')) {
                            return selector;
                        } else {
                            return `.playlight-sdk ${selector}`;
                        }
                    });

                    return `${prefixedSelectors.join(', ')} {${declarations}}`;
                }
            );

            // Replace the placeholder with the processed rule
            processedCss = processedCss.replace(placeholder, processedRule);
        } else if (rule.startsWith('@property')) {
            // Special handling for @property rules
            // Prefix Tailwind utility variables in @property declarations
            let processedRule = rule.replace(
                /@property --tw-([a-zA-Z0-9-]+)/g,
                '@property --playlight-tw-$1'
            );

            // Replace the placeholder with the processed rule
            processedCss = processedCss.replace(placeholder, processedRule);
        } else {
            // Other at-rules can be restored as-is
            // But still prefix Tailwind utility variables
            let processedRule = rule.replace(
                /--tw-([a-zA-Z0-9-]+)/g,
                '--playlight-tw-$1'
            );
            processedCss = processedCss.replace(placeholder, processedRule);
        }
    }

    // Update variable references in the entire CSS (for var() usage)
    processedCss = processedCss.replace(
        /var\(--tw-([a-zA-Z0-9-]+)([^)]*)\)/g,
        'var(--playlight-tw-$1$2)'
    );

    return processedCss;
}

// Transform the CSS
const transformedCss = transformCss(css);

// Write the transformed CSS
fs.writeFileSync(cssPath, transformedCss);
console.log('CSS successfully transformed with .playlight-sdk prefix and Tailwind variable prefixing');