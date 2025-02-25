// Default configuration
const defaultConfig = {
    button: {
        position: 'bottom-right', // 'top-left', 'top-right', 'bottom-left', 'bottom-right'
        visible: true
    },
    exitIntent: {
        enabled: true
    }
};

// Store the active configuration
let activeConfig = { ...defaultConfig };

// Initialize configuration by merging defaults with user config
export function initializeConfig(userConfig = {}) {
    activeConfig = deepMerge(defaultConfig, userConfig); // Deep merge config objects
    return activeConfig;
}

// Get the current configuration
export function getConfig() {
    return activeConfig;
}

// Helper for deep merging objects
function deepMerge(target, source) {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
}

function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}