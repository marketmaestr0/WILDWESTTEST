// MOBILE CONFIG LOADER - Dynamic endpoint injection for mobile devices
(function() {
  'use strict';
  
  // Only run on mobile devices
  if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    return;
  }
  
  console.log('📱 Mobile Config Loader: Initializing...');
  
  // Mobile-specific endpoint loader with fallback chain
  window.MOBILE_CONFIG_LOADER = {
    loadQuickNodeEndpoints: async function() {
      console.log('📱 Loading QuickNode endpoints for mobile...');
      
      // If production config is already loaded and working, use it
      if (window.PRODUCTION_CONFIG && 
          window.PRODUCTION_CONFIG.source !== 'fallback-placeholder' &&
          window.PRODUCTION_CONFIG.rpc.solana && 
          window.PRODUCTION_CONFIG.rpc.base) {
        console.log('📱 Using existing production config');
        return window.PRODUCTION_CONFIG;
      }
      
      // Mobile fallback: Set QuickNode endpoints directly
      console.log('📱 Setting QuickNode endpoints directly for mobile');
      
      window.PRODUCTION_CONFIG = {
        rpc: {
          solana: 'https://withered-divine-spring.solana-mainnet.quiknode.pro/0ef60836be4b1b1fea3b948cf28c518322a18147/',
          base: 'https://responsive-omniscient-model.base-mainnet.quiknode.pro/aa86b92100862c55985ff1d322a9ff07d9ab236f/'
        },
        injectedAt: new Date().toISOString(),
        source: 'mobile-direct-injection',
        device: 'mobile'
      };
      
      // Setup RPC_CONFIG if not already available
      if (!window.RPC_CONFIG) {
        window.RPC_CONFIG = {
          getSolanaEndpoint: function() {
            return window.PRODUCTION_CONFIG.rpc.solana;
          },
          getBaseEndpoint: function() {
            return window.PRODUCTION_CONFIG.rpc.base;
          }
        };
      }
      
      console.log('📱 Mobile QuickNode endpoints configured:', window.PRODUCTION_CONFIG);
      return window.PRODUCTION_CONFIG;
    }
  };
  
  // Auto-load on script execution
  window.MOBILE_CONFIG_LOADER.loadQuickNodeEndpoints();
  
})();
