// GitHub Configuration - Loaded securely from API
const GITHUB_TOKEN = null; // Now loaded from secure API

// QuickNode RPC Endpoints - Loaded securely from API  
const QUICKNODE_SOLANA_RPC = null; // Now loaded from secure API
const QUICKNODE_BASE_RPC = null; // Now loaded from secure API

// Admin wallet addresses - Loaded securely from API
const ADMIN_WALLETS = []; // Now loaded from secure API

// Environment Configuration Management
class EnvConfig {
    constructor() {
        // Service credentials - will be loaded from secure API
        this.GITHUB_TOKEN = GITHUB_TOKEN;
        this.QUICKNODE_SOLANA_RPC = QUICKNODE_SOLANA_RPC;
        this.QUICKNODE_BASE_RPC = QUICKNODE_BASE_RPC;
        
        // Admin wallet configuration - will be loaded from secure API
        this.ADMIN_WALLETS = ADMIN_WALLETS;
        
        // Flag to track if secure configs have been loaded
        this.secureConfigsLoaded = false;
    }
    
    // Update configuration from secure API
    updateFromSecureAPI(secureConfigs) {
        if (secureConfigs.github) {
            this.GITHUB_TOKEN = secureConfigs.github.token;
        }
        if (secureConfigs.rpc) {
            this.QUICKNODE_SOLANA_RPC = secureConfigs.rpc.solana;
            this.QUICKNODE_BASE_RPC = secureConfigs.rpc.base;
        }
        if (secureConfigs.admin && secureConfigs.admin.wallets) {
            this.ADMIN_WALLETS = secureConfigs.admin.wallets;
        }
        this.secureConfigsLoaded = true;
        console.log('✅ ENV_CONFIG updated with secure configurations');
    }
    
    // Check if all required credentials are available
    isConfigured() {
        return !!(this.GITHUB_TOKEN && this.QUICKNODE_SOLANA_RPC && this.QUICKNODE_BASE_RPC);
    }
    
    // Get GitHub configuration for API calls
    getGitHubConfig() {
        if (!this.GITHUB_TOKEN) {
            throw new Error('GitHub token not configured. Secure API may not have loaded yet.');
        }
        
        return {
            token: this.GITHUB_TOKEN,
            headers: {
                'Authorization': `token ${this.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        };
    }
    
    // Get RPC endpoints
    getRPCConfig() {
        if (!this.secureConfigsLoaded) {
            console.warn('⚠️ RPC configs may not be fully loaded from secure API yet');
        }
        return {
            solana: this.QUICKNODE_SOLANA_RPC || 'https://api.mainnet-beta.solana.com',
            base: this.QUICKNODE_BASE_RPC || 'https://mainnet.base.org'
        };
    }
    
    // Check if wallet is admin
    isAdminWallet(address) {
        return this.ADMIN_WALLETS.includes(address);
    }
    
    // Get secure config status
    getSecurityStatus() {
        return {
            secureConfigsLoaded: this.secureConfigsLoaded,
            hasGitHubToken: !!this.GITHUB_TOKEN,
            hasSolanaRPC: !!this.QUICKNODE_SOLANA_RPC,
            hasBaseRPC: !!this.QUICKNODE_BASE_RPC,
            adminWalletsCount: this.ADMIN_WALLETS.length
        };
    }
}

// Create global instance
window.ENV_CONFIG = new EnvConfig();
