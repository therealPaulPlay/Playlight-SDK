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

// Initialize configuration by merging defaults with user config
export function initializeConfig(userConfig = {}) {
    // Deep merge config objects
    return deepMerge(defaultConfig, userConfig);
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

// Helper to check if value is an object
function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}