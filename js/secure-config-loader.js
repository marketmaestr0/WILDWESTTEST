// Secure Config Loader for GitHub Secrets
class SecureConfigLoader {
    constructor() {
        this.configCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.isInitialized = false;
    }

    // Initialize the config loader
    async initialize() {
        console.log('🔐 Secure config loader initialized - using GitHub Secrets');
        this.isInitialized = true;
        return this;
    }

    // GitHub Secrets are injected at build time, no need for API calls
    async fetchConfig(type = 'all', useCache = true) {
        console.log(`✅ Using GitHub Secrets for ${type} config`);
        
        // GitHub Secrets are already available via SECURE_CONFIG
        if (window.SECURE_CONFIG) {
            switch (type) {
                case 'github':
                    return window.SECURE_CONFIG.getGitHubConfig();
                case 'all':
                    return {
                        github: window.SECURE_CONFIG.getGitHubConfig()
                    };
                default:
                    return window.SECURE_CONFIG.getGitHubConfig();
            }
        }
        
        throw new Error('GitHub Secrets not available - check deployment configuration');
    }

    // Fallback to current local config
    getFallbackConfig(type) {
        if (!window.ENV_CONFIG) return null;

        switch (type) {
            case 'github':
                return window.ENV_CONFIG.getGitHubConfig();
            case 'all':
                return {
                    github: window.ENV_CONFIG.getGitHubConfig()
                };
            default:
                return null;
        }
    }

    // Clear cache
    clearCache() {
        this.configCache.clear();
        console.log('🗑️ Config cache cleared');
    }

    // Get current config status
    getStatus() {
        return {
            initialized: this.isInitialized,
            githubSecrets: !!window.SECURE_CONFIG,
            secretsAvailable: window.SECURE_CONFIG && !!window.SECURE_CONFIG.getGitHubToken()
        };
    }
}

// Create global instance
window.SECURE_CONFIG_LOADER = new SecureConfigLoader();

console.log('🔐 Secure Config Loader ready - GitHub Secrets integration');
