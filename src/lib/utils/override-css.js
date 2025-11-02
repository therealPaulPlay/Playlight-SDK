// Automatically adjusts viewport units (vw, svw, lvw, dvw) and media queries
// in stylesheets to account for sidebar width & replaces them

let resizeObserver = null;
let mutationObserver = null;
let updateScheduled = false;
let resizeTimeout = null;
let originalSheets = new Map(); // ownerNode -> { originalCSS: string, originalElement: link or null }
let lastSidebarWidth = null;

export function activateCSSViewportOverride(outerWrapper) {
	const update = () => {
		const adjustedWidth = outerWrapper.clientWidth;
		const sidebarWidth = document.documentElement.clientWidth - adjustedWidth;
		Array.from(document.styleSheets).forEach(sheet =>
			replaceStylesheet(sheet, adjustedWidth, window.innerHeight, sidebarWidth)
		);
		// Only dispatch resize event if sidebar width actually changed (not just window resize)
		if (lastSidebarWidth !== sidebarWidth) window.dispatchEvent(new Event('resize')); // For game engines
		lastSidebarWidth = sidebarWidth;
	};

	const scheduleUpdate = () => {
		if (updateScheduled) return;
		updateScheduled = true;
		requestAnimationFrame(() => {
			updateScheduled = false;
			update();
		});
	};

	resizeObserver = new ResizeObserver(() => {
		clearTimeout(resizeTimeout);
		resizeTimeout = setTimeout(scheduleUpdate, 50); // Debounce to prevent rapid updates
	});
	resizeObserver.observe(outerWrapper);

	mutationObserver = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			for (const node of mutation.addedNodes) {
				if (node.nodeName === 'STYLE') scheduleUpdate();
				else if (node.nodeName === 'LINK' && node.rel === 'stylesheet') {
					node.sheet ? scheduleUpdate() : node.addEventListener('load', scheduleUpdate, { once: true });
				}
			}
			if (mutation.type === 'attributes' && mutation.target.nodeName === 'LINK') {
				const link = mutation.target;
				if (link.rel === 'stylesheet' && mutation.attributeName === 'rel') {
					link.sheet ? scheduleUpdate() : link.addEventListener('load', scheduleUpdate, { once: true });
				}
			}
		}
	});

	mutationObserver.observe(document.head, { childList: true, attributes: true, attributeFilter: ['rel'] });
	update(); // Run initial update synchronously so styles are applied immediately
}

export function deactivateCSSViewportOverride() {
	resizeObserver?.disconnect();
	mutationObserver?.disconnect();
	clearTimeout(resizeTimeout);
	resizeObserver = mutationObserver = resizeTimeout = lastSidebarWidth = null;
	for (const [node, { originalCSS, originalElement }] of originalSheets.entries()) {
		if (originalElement) node.replaceWith(originalElement);
		else {
			node.textContent = originalCSS;
			node.removeAttribute('data-playlight-modified');
		}
	}
	originalSheets.clear();
}

function replaceStylesheet(sheet, adjustedWidth, windowHeight, sidebarWidth) {
	const ownerNode = sheet.ownerNode;
	if (!ownerNode || (sheet.href && /playlight/i.test(sheet.href))) return;

	try {
		// First time: store original and convert link to style
		if (!originalSheets.has(ownerNode)) {
			if (!sheet.cssRules?.length) return;

			const originalCSS = Array.from(sheet.cssRules).map(r => r.cssText).join('\n');

			if (ownerNode.tagName === 'LINK') {
				const styleElement = document.createElement('style');
				styleElement.setAttribute('data-playlight-original-href', ownerNode.href);
				originalSheets.set(styleElement, { originalCSS, originalElement: ownerNode });
				ownerNode.replaceWith(styleElement);
				applyTransform(styleElement, originalCSS, adjustedWidth, windowHeight, sidebarWidth);
			} else {
				originalSheets.set(ownerNode, { originalCSS, originalElement: null });
				applyTransform(ownerNode, originalCSS, adjustedWidth, windowHeight, sidebarWidth);
			}
		} else {
			// Re-transform from original
			applyTransform(ownerNode, originalSheets.get(ownerNode).originalCSS, adjustedWidth, windowHeight, sidebarWidth);
		}
	} catch (error) {
		console.warn(`Playlight cannot process stylesheet ${sheet.href || 'inline'} due to CORS restrictions.`);
	}
}

function applyTransform(styleElement, originalCSS, adjustedWidth, windowHeight, sidebarWidth) {
	const actualWidth = adjustedWidth + sidebarWidth;
	const vwRatio = adjustedWidth / actualWidth;
	const orientationBreakpoint = windowHeight + sidebarWidth;

	// Get base URL for resolving relative paths (for converted <link> elements)
	const baseHref = styleElement.getAttribute('data-playlight-original-href');
	let css = baseHref ? makeURLsAbsolute(originalCSS, baseHref) : originalCSS;

	// Adjust viewport units (skip html selectors to avoid breaking sites)
	css = css.replace(/(\d+(?:\.\d+)?)(vw|svw|lvw|dvw)/gi, (match, value, unit, offset) => {
		const beforeMatch = css.substring(0, offset);
		const lastOpen = beforeMatch.lastIndexOf('{');
		const lastClose = beforeMatch.lastIndexOf('}');
		if (lastOpen > lastClose) {
			const selector = beforeMatch.substring(lastClose + 1, lastOpen).trim();
			if (/^html[.\s,:[]/.test(selector)) return match;
		}
		return `${(parseFloat(value) * vwRatio).toFixed(2)}${unit}`;
	});

	// Adjust media query width breakpoints (px only)
	css = css.replace(/(\((?:min-|max-)?width:\s*)(\d+(?:\.\d+)?)(px\))/gi,
		(_, prefix, value, suffix) => `${prefix}${parseFloat(value) + sidebarWidth}${suffix}`);

	// Adjust range syntax
	css = css.replace(/(width\s*[<>=]+\s*)(\d+(?:\.\d+)?)(px)/gi,
		(_, prefix, value, unit) => `${prefix}${parseFloat(value) + sidebarWidth}${unit}`);

	// Adjust double-sided ranges
	css = css.replace(/(\d+(?:\.\d+)?)(px\s*[<>=]+\s*width\s*[<>=]+\s*)(\d+(?:\.\d+)?)(px)/gi,
		(_, val1, middle, val2, unit) => `${parseFloat(val1) + sidebarWidth}px${middle}${parseFloat(val2) + sidebarWidth}${unit}`);

	// Convert orientation queries
	css = css.replace(/\(\s*orientation:\s*portrait\s*\)/gi, `(max-width: ${orientationBreakpoint}px)`);
	css = css.replace(/\(\s*orientation:\s*landscape\s*\)/gi, `(min-width: ${orientationBreakpoint + 1}px)`);

	// Rewrite body selectors to inner wrapper (remove !important so SDK can override)
	css = css.replace(/\bbody\s*\{([^}]*)\}/gi, (_, content) =>
		`.playlight-sdk-inner-wrapper {${content.replace(/\s*!important\s*/gi, '')}}`);

	styleElement.textContent = css;
	styleElement.setAttribute('data-playlight-modified', 'true');
}

function makeURLsAbsolute(css, baseHref) {
	try {
		const base = new URL(baseHref, document.baseURI);
		return css.replace(/url\(\s*(['"]?)([^)'"]+)\1\s*\)/gi, (match, quote, url) => {
			url = url.trim();
			if (!url || /^(data:|https?:|\/\/|\/|#)/.test(url)) return match;
			return `url(${quote}${new URL(url, base).href}${quote})`;
		});
	} catch {
		return css;
	}
}