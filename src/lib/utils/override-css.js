
// Automatically adjusts viewport units (vw, svw, lvw, dvw) and media queries
// in stylesheets to account for sidebar width & replaces them

let resizeObserver = null;
let mutationObserver = null;
let updateScheduled = false;
let originalSheets = new Map(); // ownerNode -> { originalCSS: string, originalElement: link or null }

export function activateCSSViewportOverride(outerWrapper) {
	const scheduleUpdate = () => {
		if (updateScheduled) return;
		updateScheduled = true;
		requestAnimationFrame(() => {
			updateScheduled = false;
			update();
		});
	};

	const update = () => {
		const adjustedWidth = outerWrapper.clientWidth;
		const windowHeight = window.innerHeight;
		const sidebarWidth = document.documentElement.clientWidth - adjustedWidth;
		for (const sheet of Array.from(document.styleSheets)) replaceStylesheet(sheet, adjustedWidth, windowHeight, sidebarWidth);
	};

	resizeObserver = new ResizeObserver(scheduleUpdate);
	resizeObserver.observe(outerWrapper);

	mutationObserver = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			for (const node of mutation.addedNodes) {
				if (node.nodeName === 'STYLE') {
					scheduleUpdate();
					break;
				} else if (node.nodeName === 'LINK' && node.rel === 'stylesheet') {
					// Wait for stylesheet to load before processing
					if (node.sheet) scheduleUpdate();
					else node.addEventListener('load', scheduleUpdate, { once: true });
					break;
				}
			}
			// Watch for rel attribute changes (preload -> stylesheet)
			if (mutation.type === 'attributes' && mutation.target.nodeName === 'LINK') {
				const link = mutation.target;
				if (link.rel === 'stylesheet' && mutation.attributeName === 'rel') {
					if (link.sheet) scheduleUpdate();
					else link.addEventListener('load', scheduleUpdate, { once: true });
					break;
				}
			}
		}
	});

	mutationObserver.observe(document.head, {
		childList: true,
		subtree: false,
		attributes: true,
		attributeFilter: ['rel']
	});
	requestAnimationFrame(update); // Direclty run once
}

export function deactivateCSSViewportOverride() {
	resizeObserver?.disconnect();
	mutationObserver?.disconnect();
	resizeObserver = null;
	mutationObserver = null;
	restoreAllStylesheets();
	originalSheets.clear();
}

function replaceStylesheet(sheet, adjustedWidth, windowHeight, sidebarWidth) {
	const ownerNode = sheet.ownerNode;
	if (!ownerNode) return;
	if (sheet.href && /playlight/i.test(sheet.href)) return;

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
			const { originalCSS } = originalSheets.get(ownerNode);
			applyTransform(ownerNode, originalCSS, adjustedWidth, windowHeight, sidebarWidth);
		}
	} catch (e) {
		// CORS blocked (SecurityError)
		console.warn(`Playlight cannot process stylesheet with href ${sheet.href} due to CORS restrictions. If this is your own CSS file, please adjust the CORS policies.`);
	}
}

function applyTransform(styleElement, originalCSS, adjustedWidth, windowHeight, sidebarWidth) {
	const actualWidth = adjustedWidth + sidebarWidth;
	const vwRatio = adjustedWidth / actualWidth;
	const orientationBreakpoint = windowHeight + sidebarWidth;

	const transformed = originalCSS
		// Adjust viewport units
		.replace(/(\d+(?:\.\d+)?)(vw|svw|lvw|dvw)/gi, (_match, value, unit) => {
			return `${(parseFloat(value) * vwRatio).toFixed(2)}${unit}`;
		})
		// Adjust legacy width breakpoints
		.replace(
			/(\((?:min-|max-)?width:\s*)(\d+(?:\.\d+)?)(px\))/gi,
			(_m, prefix, value, suffix) => `${prefix}${parseFloat(value) + sidebarWidth}${suffix}`
		)
		// Adjust range syntax
		.replace(
			/(width\s*[<>=]+\s*)(\d+(?:\.\d+)?)(px)/gi,
			(_m, prefix, value, suffix) => `${prefix}${parseFloat(value) + sidebarWidth}${suffix}`
		)
		// Adjust double-sided ranges
		.replace(
			/(\d+(?:\.\d+)?)(px\s*[<>=]+\s*width\s*[<>=]+\s*)(\d+(?:\.\d+)?)(px)/gi,
			(_m, val1, middle, val2, suffix) => `${parseFloat(val1) + sidebarWidth}px${middle}${parseFloat(val2) + sidebarWidth}${suffix}`
		)
		// Convert orientation
		.replace(/\(\s*orientation:\s*portrait\s*\)/gi, `(max-width: ${orientationBreakpoint}px)`)
		.replace(/\(\s*orientation:\s*landscape\s*\)/gi, `(min-width: ${orientationBreakpoint + 1}px)`);

	styleElement.textContent = transformed;
	styleElement.setAttribute('data-playlight-modified', 'true');
}

function restoreAllStylesheets() {
	for (const [ownerNode, { originalCSS, originalElement }] of originalSheets.entries()) {
		if (originalElement) {
			// Was a link, restore it
			ownerNode.replaceWith(originalElement);
		} else {
			// Was inline style, restore content
			ownerNode.textContent = originalCSS;
			ownerNode.removeAttribute('data-playlight-modified');
		}
	}
	originalSheets.clear();
}
