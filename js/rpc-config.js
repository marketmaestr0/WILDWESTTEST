// RPC endpoint configuration for all networks
// Update these with your preferred RPC endpoints

const RPC_CONFIG = {
  // Solana RPC endpoints - QuickNode PRIORITY
  SOLANA: {
    get PRIMARY() { 
      // Use QuickNode from production config if available
      return window.PRODUCTION_CONFIG?.rpc?.solana || this.getQuickNodeEndpoint();
    },
    get QUICKNODE() { 
      return window.PRODUCTION_CONFIG?.rpc?.solana || this.getQuickNodeEndpoint();
    },
    // QuickNode endpoint only available through GitHub Secrets
    getQuickNodeEndpoint() {
      return null; // Security: No hardcoded endpoints
    },
    FALLBACKS: [
      "https://api.mainnet-beta.solana.com", // Official Solana RPC (rate limited)
      "https://solana-api.projectserum.com", // Serum project endpoint  
      "https://api.metaplex.solana.com",     // Metaplex endpoint
    ]
  },
  
  // Base/Ethereum RPC endpoints - QuickNode PRIORITY
  BASE: {
    get PRIMARY() { 
      // Use QuickNode from production config if available
      return window.PRODUCTION_CONFIG?.rpc?.base || this.getQuickNodeEndpoint();
    },
    get QUICKNODE() { 
      return window.PRODUCTION_CONFIG?.rpc?.base || this.getQuickNodeEndpoint();
    },
    // QuickNode endpoint only available through GitHub Secrets
    getQuickNodeEndpoint() {
      return null; // Security: No hardcoded endpoints
    },
    FALLBACKS: [
      "https://mainnet.base.org",
      "https://base.blockpi.network/v1/rpc/public",
      "https://base-mainnet.public.blastapi.io"
    ]
  },
  
  // Connection settings
  SETTINGS: {
    COMMITMENT: "confirmed", // Solana commitment level
    TIMEOUT: 30000, // Connection timeout in ms
  },

  // Price oracle contracts (for future on-chain price fetching)
  PRICE_ORACLES: {
    BASE_ETH_USD: {
      // Chainlink ETH/USD price feed on Base
      address: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70",
      decimals: 8
    },
    SOLANA_SOL_USD: {
      // Pyth SOL/USD price feed on Solana
      address: "H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG",
      decimals: 9
    }
  },

  // Helper functions to get endpoints
  getSolanaEndpoint: function() {
    // ONLY use QuickNode from GitHub Secrets
    if (window.PRODUCTION_CONFIG?.rpc?.solana) {
      console.log('🔐 Using QuickNode Solana endpoint from GitHub Secrets');
      return window.PRODUCTION_CONFIG.rpc.solana;
    }
    
    throw new Error('QuickNode Solana endpoint not available - GitHub Secrets required');
  },
  
  // Get Solana endpoint with automatic fallback (only used when QuickNode unavailable)
  getSolanaEndpointWithFallback: async function() {
    const endpoints = this.SOLANA.FALLBACKS;
    
    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i];
      try {
        console.log(`🔄 Testing fallback Solana RPC endpoint ${i + 1}/${endpoints.length}: ${endpoint.substring(0, 50)}...`);
        
        // Test the endpoint with a simple getVersion call
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getVersion'
          }),
          timeout: 5000
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.result) {
            console.log(`✅ Fallback Solana RPC endpoint working: ${endpoint.substring(0, 50)}...`);
            return endpoint;
          }
        }
      } catch (error) {
        console.log(`❌ Fallback Solana RPC endpoint failed: ${endpoint.substring(0, 50)}... - ${error.message}`);
        continue;
      }
    }
    
    console.error('❌ All fallback Solana RPC endpoints failed, using first anyway');
    return this.SOLANA.FALLBACKS[0];
  },
  
  getBaseEndpoint: function() {
    // ONLY use QuickNode from GitHub Secrets
    if (window.PRODUCTION_CONFIG?.rpc?.base) {
      console.log('🔐 Using QuickNode Base endpoint from GitHub Secrets');
      return window.PRODUCTION_CONFIG.rpc.base;
    }
    
    throw new Error('QuickNode Base endpoint not available - GitHub Secrets required');
  },
  
  // QuickNode API helpers
  callQuickNodeRPC: async function(endpoint, method, params = []) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: method,
          params: params
        })
      });
      
      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('QuickNode RPC call failed:', error);
      throw error;
    }
  },
  
  // Get ETH price from on-chain oracle (future implementation)
  getETHPriceFromOracle: async function() {
    try {
      // This would query Chainlink price feed on Base using our QuickNode endpoint
      console.log('🔮 Would query ETH price oracle via QuickNode Base endpoint');
      return null; // Placeholder for now
    } catch (error) {
      console.error('ETH price oracle query failed:', error);
      return null;
    }
  },
  
  // Get SOL price from on-chain oracle (future implementation)
  getSOLPriceFromOracle: async function() {
    try {
      // This would query Pyth price feed on Solana using our QuickNode endpoint
      console.log('🔮 Would query SOL price oracle via QuickNode Solana endpoint');
      return null; // Placeholder for now
    } catch (error) {
      console.error('SOL price oracle query failed:', error);
      return null;
    }
  },
  
  // Validate image for banner use
  validateBannerImage: function(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = function() {
        const aspectRatio = this.width / this.height;
        const isGoodSize = this.width >= 1200 && this.height >= 150;
        const isGoodRatio = aspectRatio >= 6 && aspectRatio <= 10; // 1500x200 = 7.5 ratio
        
        resolve({
          valid: isGoodSize && isGoodRatio,
          width: this.width,
          height: this.height,
          aspectRatio: aspectRatio,
          recommendations: isGoodSize ? [] : ['Image should be at least 1200x150px'],
          ratioCheck: isGoodRatio ? 'Good' : 'Consider 1500x200px for optimal display'
        });
      };
      img.onerror = () => reject(new Error('Could not load image'));
      img.src = url;
    });
  },
  
  // Get connection object for Solana
  getSolanaConnection: function() {
    if (typeof solanaWeb3 !== 'undefined') {
      return new solanaWeb3.Connection(this.getSolanaEndpoint(), this.SETTINGS.COMMITMENT);
    }
    return null;
  }
};

// Make config globally available
window.RPC_CONFIG = RPC_CONFIG;



console.log('🌐 RPC Configuration loaded:');

// Check if we have GitHub Secrets (production) or using direct endpoints (development)
const hasGitHubSecrets = window.PRODUCTION_CONFIG?.rpc?.solana && window.PRODUCTION_CONFIG?.rpc?.base;

if (hasGitHubSecrets) {
  console.log('  🔵 Base ETH: QuickNode endpoint from GitHub Secrets ✅');
  console.log('  🟣 Solana: QuickNode endpoint from GitHub Secrets ✅');
  console.log('  🔐 Production mode - QuickNode infrastructure fully active');
} else {
  console.log('  ❌ Base ETH: No endpoint configured - GitHub Secrets required');
  console.log('  ❌ Solana: No endpoint configured - GitHub Secrets required');
  console.log('  � Endpoints will not work without GitHub Secrets');
}

console.log('  ⚡ QuickNode infrastructure active for high-performance Web3 operations');
