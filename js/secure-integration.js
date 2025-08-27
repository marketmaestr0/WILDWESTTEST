// Integration helper for Secure Config with GitHub Secrets
// This file bridges the gap between your existing ENV_CONFIG and GitHub Secrets

class SecureConfigIntegration {
    constructor() {
        this.isInitialized = false;
        this.useGitHubSecrets = true;
    }

    // Initialize and load secure configs from GitHub Secrets
    async initialize() {
        if (this.isInitialized) return;

        try {
            console.log('🔐 Initializing secure configuration with GitHub Secrets...');
            
            // GitHub Secrets are injected at build time via GitHub Actions
            // Check if SECURE_CONFIG is available
            if (window.SECURE_CONFIG && window.SECURE_CONFIG.getGitHubToken()) {
                console.log('✅ GitHub Secrets loaded successfully');
                
                // Update ENV_CONFIG with secure values if it exists
                if (window.ENV_CONFIG && typeof window.ENV_CONFIG.updateFromSecureAPI === 'function') {
                    const secureConfigs = {
                        github: window.SECURE_CONFIG.getGitHubConfig()
                    };
                    window.ENV_CONFIG.updateFromSecureAPI(secureConfigs);
                }
                
                console.log('✅ All secure configurations loaded from GitHub Secrets');
            } else {
                throw new Error('GitHub Secrets not available - check deployment configuration');
            }

            this.isInitialized = true;
            console.log('🎯 GitHub Secrets integration complete!');
            
            return true;

        } catch (error) {
            console.warn('⚠️ GitHub Secrets failed, using fallback:', error.message);
            this.useGitHubSecrets = false;
            return false;
        }
    }

    // Check if GitHub Secrets are available and working
    isSecureConfigAvailable() {
        return this.isInitialized && this.useGitHubSecrets;
    }

    // Get current config status
    getStatus() {
        return {
            initialized: this.isInitialized,
            githubSecrets: this.useGitHubSecrets,
            fallback: !this.useGitHubSecrets
        };
    }
}

// Create global instance
window.SECURE_INTEGRATION = new SecureConfigIntegration();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        await window.SECURE_INTEGRATION.initialize();
    });
} else {
    // DOM already loaded
    setTimeout(async () => {
        await window.SECURE_INTEGRATION.initialize();
    }, 100);
}
