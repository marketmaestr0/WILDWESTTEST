// Development Configuration
// Provides working endpoints for local testing when GitHub secrets aren't available

(function() {
  'use strict';
  
  // Function to load dev configuration
  function loadDevConfig() {
    // Only load in development (when PRODUCTION_CONFIG is using fallback)
    if (window.PRODUCTION_CONFIG?.source !== 'fallback-development') {
      console.log('🚀 Production mode detected, skipping dev config');
      return;
    }
    
    console.log('🔧 Loading development configuration for local testing');
  
  // External endpoint fetcher for QuickNode endpoints
  async function fetchQuickNodeEndpoints() {
    // Direct QuickNode endpoints as immediate fallback
    const directEndpoints = {
      solana: 'https://withered-divine-spring.solana-mainnet.quiknode.pro/0ef60836be4b1b1fea3b948cf28c518322a18147/',
      base: 'https://responsive-omniscient-model.base-mainnet.quiknode.pro/aa86b92100862c55985ff1d322a9ff07d9ab236f/'
    };
    
    const sources = [
      // Google Drive public file (your QuickNode endpoints)
      'https://drive.google.com/uc?export=download&id=1g1YwQrtbbzkuHD-NbFqxmWB8nz41EXcb',
      // GitHub Gist fallback
      'https://gist.githubusercontent.com/cowboytbc/YOUR_GIST_ID/raw/quicknode-endpoints.json',
      // Pastebin fallback
      'https://pastebin.com/raw/YOUR_PASTE_ID'
    ];
    
    // Try external sources first
    for (const source of sources) {
      if (source.includes('YOUR_')) continue; // Skip placeholder URLs
      
      try {
        console.log(`🔍 Trying to fetch QuickNode endpoints from: ${source.substring(0, 50)}...`);
        const response = await fetch(source, { 
          method: 'GET',
          cache: 'no-cache',
          headers: {
            'Accept': 'application/json,text/plain,*/*'
          }
        });
        
        if (response.ok) {
          const text = await response.text();
          const data = JSON.parse(text);
          
          if (data.solana && data.base) {
            console.log('✅ QuickNode endpoints loaded from external source');
            return data;
          }
        }
      } catch (error) {
        console.log(`⚠️ Failed to fetch from ${source.substring(0, 30)}...:`, error.message);
      }
    }
    
    // Use direct endpoints as immediate fallback
    console.log('� Using direct QuickNode endpoints');
    return directEndpoints;
  }
  
  // Helper function for endpoint decoding (simple base64 + reverse)
  function decodeEndpoint(encoded) {
    try {
      return atob(encoded.split('').reverse().join(''));
    } catch (e) {
      return null;
    }
  }
  
  // Enhanced development configuration with working endpoints
  window.DEV_CONFIG = {
    solana: {
      // Will be populated from external source
      rpc: 'https://api.mainnet-beta.solana.com',
      quicknode: null, // Will be loaded externally
      fallbacks: [
        'https://rpc.ankr.com/solana',
        'https://solana-api.projectserum.com',
        'https://api.devnet.solana.com' // Devnet for testing
      ],
      // Mock program ID for development (use actual when available)
      lockProgramId: 'LocktDzaV1W2Bm9DeZeiyz4J9zs4fRqNiYqQyracRXw',
      network: 'mainnet-beta' // Change to 'devnet' for testing
    },
    base: {
      rpc: 'https://mainnet.base.org',
      quicknode: null, // Will be loaded externally
      fallbacks: [
        'https://base-rpc.publicnode.com',
        'https://base.blockpi.network/v1/rpc/public'
      ]
    },
    features: {
      enableLogging: true,
      enableTestMode: true,
      skipSecurityChecks: false
    },
    
    // Load QuickNode endpoints dynamically
    loadQuickNodeEndpoints: async function() {
      const endpoints = await fetchQuickNodeEndpoints();
      if (endpoints) {
        this.solana.quicknode = endpoints.solana;
        this.solana.rpc = endpoints.solana; // Use QuickNode as primary
        this.base.quicknode = endpoints.base;
        this.base.rpc = endpoints.base; // Use QuickNode as primary
        
        console.log('✅ QuickNode endpoints integrated into DEV_CONFIG');
        return true;
      }
      return false;
    }
  };
  
  // Auto-load QuickNode endpoints
  window.DEV_CONFIG.loadQuickNodeEndpoints().then((loaded) => {
    if (loaded) {
      console.log('🚀 Using QuickNode endpoints from external source');
      
      // Update RPC_CONFIG after endpoints are loaded
      if (window.RPC_CONFIG) {
        window.RPC_CONFIG.SOLANA.PRIMARY = window.DEV_CONFIG.solana.rpc;
        window.RPC_CONFIG.BASE.PRIMARY = window.DEV_CONFIG.base.rpc;
        
        // Override the getSolanaEndpoint and getBaseEndpoint functions
        window.RPC_CONFIG.getSolanaEndpoint = async function() {
          return window.DEV_CONFIG.solana.rpc;
        };
        
        window.RPC_CONFIG.getBaseEndpoint = function() {
          return window.DEV_CONFIG.base.rpc;
        };
        
        console.log('✅ RPC_CONFIG updated with QuickNode endpoints');
        console.log('🔍 Solana endpoint:', window.RPC_CONFIG.SOLANA.PRIMARY);
        console.log('🔍 Base endpoint:', window.RPC_CONFIG.BASE.PRIMARY);
      }
    } else {
      console.log('🔄 Using public RPC endpoints as fallback');
    }
  });
  
  // Initial RPC_CONFIG setup for immediate use
  if (window.RPC_CONFIG) {
    console.log('🔄 Setting up initial RPC_CONFIG for development');
    
    // Set initial endpoints (will be updated after QuickNode endpoints load)
    window.RPC_CONFIG.SOLANA.PRIMARY = window.DEV_CONFIG.solana.rpc;
    window.RPC_CONFIG.SOLANA.FALLBACKS = window.DEV_CONFIG.solana.fallbacks;
    
    // Update Base endpoints  
    window.RPC_CONFIG.BASE.PRIMARY = window.DEV_CONFIG.base.rpc;
    
    // Add dev-specific helper
    window.RPC_CONFIG.getDevSolanaEndpoint = function() {
      return window.DEV_CONFIG.solana.rpc;
    };
  }
  
  // Add development helpers
  window.DEV_HELPERS = {
    testConnection: async function() {
      console.log('🧪 Testing RPC connections...');
      
      // Test Solana
      try {
        const solanaResponse = await fetch(window.DEV_CONFIG.solana.rpc, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getVersion'
          })
        });
        
        if (solanaResponse.ok) {
          const data = await solanaResponse.json();
          console.log('✅ Solana RPC working:', data.result);
        } else {
          console.error('❌ Solana RPC failed:', solanaResponse.status);
        }
      } catch (error) {
        console.error('❌ Solana RPC error:', error.message);
      }
      
      // Test Base
      try {
        const baseResponse = await fetch(window.DEV_CONFIG.base.rpc, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_chainId'
          })
        });
        
        if (baseResponse.ok) {
          const data = await baseResponse.json();
          console.log('✅ Base RPC working, Chain ID:', data.result);
        } else {
          console.error('❌ Base RPC failed:', baseResponse.status);
        }
      } catch (error) {
        console.error('❌ Base RPC error:', error.message);
      }
    },
    
    enableTestMode: function() {
      console.log('🧪 Enabling test mode for Solana locking');
      window.SOLANA_TEST_MODE = true;
      
      // Override wallet requirements for testing
      if (window.SolanaLockManager) {
        window.SolanaLockManager.prototype.originalCreateLock = window.SolanaLockManager.prototype.createLock;
        window.SolanaLockManager.prototype.createLock = async function(...args) {
          console.log('🧪 Test mode: Creating mock lock transaction');
          // Add test mode logic here if needed
          return this.originalCreateLock.apply(this, args);
        };
      }
    },
    
    showConfig: function() {
      console.log('🔍 Current configuration:');
      console.log('📍 Production Config:', window.PRODUCTION_CONFIG);
      console.log('📍 Dev Config:', window.DEV_CONFIG);
      console.log('📍 RPC Config Solana:', window.RPC_CONFIG?.SOLANA?.PRIMARY);
      console.log('📍 RPC Config Base:', window.RPC_CONFIG?.BASE?.PRIMARY);
    }
  };
  
  // Auto-test connections when loaded
  setTimeout(() => {
    if (window.DEV_CONFIG?.features?.enableLogging) {
      window.DEV_HELPERS.testConnection();
    }
  }, 2000);
  
  console.log('🔧 Development configuration loaded');
  console.log('💡 Use DEV_HELPERS.showConfig() to see current settings');
  console.log('💡 Use DEV_HELPERS.testConnection() to test RPC endpoints');
  console.log('💡 Use DEV_HELPERS.enableTestMode() for enhanced testing');
  
  } // End loadDevConfig function
  
  // Try loading immediately in case production config is already set
  loadDevConfig();
  
  // Also listen for the fallback event from production-config.js
  window.addEventListener('production-config-fallback', function() {
    console.log('🔄 Production config fallback detected, loading dev config...');
    loadDevConfig();
  });
  
  // Fallback: Try again after a delay in case event system fails
  setTimeout(() => {
    if (!window.DEV_CONFIG && window.PRODUCTION_CONFIG?.source === 'fallback-development') {
      console.log('🔄 Delayed dev config load triggered');
      loadDevConfig();
    }
  }, 200);
  
})();
