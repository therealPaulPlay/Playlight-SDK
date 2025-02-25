import { getConfig } from './config';

let isEnabled = false;
let callback = null;
let lastY = 0;
let isMouseInPage = false;

export function detectExitIntent(onExitIntent) {
    callback = onExitIntent; // Store callback

    // Get configuration
    const config = getConfig().exitIntent;
    isEnabled = config.enabled;

    if (!isEnabled) return;
    lastY = window.innerHeight; // Set initial conditions

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Cleanup function for removing listeners
    return function cleanup() {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseleave', handleMouseLeave);
    };
}

function handleMouseMove(event) {
    const currentY = event.clientY;

    // Check if mouse is entering the page for the first time
    if (!isMouseInPage) {
        isMouseInPage = true;
        lastY = currentY;
        return;
    }

    // Only consider upward movement towards the top of the page
    // and only when close to the top edge
    const config = getConfig().exitIntent;
    if (currentY < lastY && currentY < 20) { // 20px sensitivity
        triggerExitIntent();
    }

    // Always update last position
    lastY = currentY;
}

function handleMouseLeave(event) {
    // Only trigger when cursor leaves through the top of the page
    if (event.clientY <= 0) triggerExitIntent();
    isMouseInPage = false; // Reset mouse-in-page flag
}

function triggerExitIntent() {
    if (!isEnabled || !callback) return;

    // Get delay configuration
    const config = getConfig().exitIntent;
    isEnabled = false; // Temporarily disable to prevent multiple triggers

    // Execute callback after delay of 500ms
    setTimeout(() => {
        callback();

        // Re-enable after a cooldown period (5 seconds)
        setTimeout(() => {
            isEnabled = true;
        }, 5000);
    }, 500);
}

export function setExitIntentEnabled(enabled) {
    isEnabled = enabled;
}