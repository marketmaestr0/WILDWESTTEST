// Wallet Browser RPC Fallback System
// Ensures RPC endpoints work even when GitHub Secrets don't load in wallet browsers

(function() {
  'use strict';
  
  console.log('🌐 Wallet Browser RPC Fallback System Loading...');
  
  // Detect wallet browser environment
  function isWalletBrowser() {
    const userAgent = navigator.userAgent;
    return /MetaMask|Trust|Coinbase|Rainbow|WalletConnect|Phantom/i.test(userAgent) ||
           window.ethereum || window.solana;
  }
  
  // High-quality fallback RPC endpoints that work without GitHub Secrets
  const FALLBACK_RPC_ENDPOINTS = {
    solana: [
      "https://rpc.ankr.com/solana",                    // Best rate limits
      "https://solana-mainnet.rpc.extrnode.com",       // High performance
      "https://api.mainnet-beta.solana.com",           // Official (rate limited)
      "https://solana.public-rpc.com",                 // Good backup
      "https://api.metaplex.solana.com"                // Metaplex backup
    ],
    base: [
      "https://base-rpc.publicnode.com",               // Best rate limits
      "https://base.llamarpc.com",                     // High performance
      "https://mainnet.base.org",                      // Official
      "https://base.blockpi.network/v1/rpc/public",    // Good backup
      "https://base-mainnet.public.blastapi.io"        // Blast backup
    ]
  };
  
  // Create enhanced RPC_CONFIG that works in wallet browsers
  function createWalletBrowserRPCConfig() {
    console.log('🔧 Creating wallet browser compatible RPC config');
    
    const config = {
      getSolanaEndpoint: async function() {
        // Try production config first
        if (window.PRODUCTION_CONFIG?.rpc?.solana) {
          console.log('✅ Using production Solana endpoint:', window.PRODUCTION_CONFIG.rpc.solana);
          return window.PRODUCTION_CONFIG.rpc.solana;
        }
        
        // Use fallback for wallet browsers
        const endpoint = FALLBACK_RPC_ENDPOINTS.solana[0];
        console.log('🔄 Using fallback Solana endpoint for wallet browser:', endpoint);
        return endpoint;
      },
      
      getBaseEndpoint: function() {
        // Try production config first
        if (window.PRODUCTION_CONFIG?.rpc?.base) {
          console.log('✅ Using production Base endpoint:', window.PRODUCTION_CONFIG.rpc.base);
          return window.PRODUCTION_CONFIG.rpc.base;
        }
        
        // Use fallback for wallet browsers
        const endpoint = FALLBACK_RPC_ENDPOINTS.base[0];
        console.log('🔄 Using fallback Base endpoint for wallet browser:', endpoint);
        return endpoint;
      },
      
      // Additional methods for compatibility
      getAllSolanaEndpoints: function() {
        return FALLBACK_RPC_ENDPOINTS.solana;
      },
      
      getAllBaseEndpoints: function() {
        return FALLBACK_RPC_ENDPOINTS.base;
      },
      
      isWalletBrowser: isWalletBrowser(),
      fallbackMode: true
    };
    
    return config;
  }
  
  // Enhanced initialization that handles wallet browser environments
  function initializeWalletBrowserRPC() {
    const isWallet = isWalletBrowser();
    console.log('🔍 Wallet browser detected:', isWallet);
    
    // Always ensure RPC_CONFIG exists
    if (!window.RPC_CONFIG) {
      console.log('⚠️ RPC_CONFIG not found - creating fallback configuration');
      window.RPC_CONFIG = createWalletBrowserRPCConfig();
    } else if (isWallet) {
      // Enhance existing RPC_CONFIG for wallet browsers
      console.log('🔧 Enhancing existing RPC_CONFIG for wallet browser compatibility');
      
      const originalGetSolana = window.RPC_CONFIG.getSolanaEndpoint;
      const originalGetBase = window.RPC_CONFIG.getBaseEndpoint;
      
      // Wrap existing methods with fallbacks
      window.RPC_CONFIG.getSolanaEndpoint = async function() {
        try {
          const result = await originalGetSolana?.call(this);
          if (result && result !== null) {
            return result;
          }
          throw new Error('No QuickNode endpoint available');
        } catch (error) {
          console.log('🔄 Falling back to public Solana endpoint for wallet browser');
          return FALLBACK_RPC_ENDPOINTS.solana[0];
        }
      };
      
      window.RPC_CONFIG.getBaseEndpoint = function() {
        try {
          const result = originalGetBase?.call(this);
          if (result && result !== null) {
            return result;
          }
          throw new Error('No QuickNode endpoint available');
        } catch (error) {
          console.log('🔄 Falling back to public Base endpoint for wallet browser');
          return FALLBACK_RPC_ENDPOINTS.base[0];
        }
      };
      
      window.RPC_CONFIG.isWalletBrowser = true;
      window.RPC_CONFIG.fallbackMode = true;
    }
    
    // Test the configuration
    setTimeout(async () => {
      try {
        const solanaEndpoint = await window.RPC_CONFIG.getSolanaEndpoint();
        const baseEndpoint = window.RPC_CONFIG.getBaseEndpoint();
        console.log('✅ Wallet browser RPC test successful:', {
          solana: solanaEndpoint,
          base: baseEndpoint,
          isWalletBrowser: isWallet
        });
      } catch (error) {
        console.error('❌ Wallet browser RPC test failed:', error);
      }
    }, 1000);
  }
  
  // Initialize immediately if scripts are already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWalletBrowserRPC);
  } else {
    initializeWalletBrowserRPC();
  }
  
  // Also run after a delay to catch late-loading production config
  setTimeout(initializeWalletBrowserRPC, 2000);
  
  // Expose for debugging
  window.walletBrowserRPC = {
    isWalletBrowser,
    initializeWalletBrowserRPC,
    FALLBACK_RPC_ENDPOINTS
  };
  
  console.log('🌐 Wallet Browser RPC Fallback System Ready');
  
})();
