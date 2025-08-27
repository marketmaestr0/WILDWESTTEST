// Temporary manual production configuration to fix RPC issues
(function() {
  'use strict';
  
  if (window.PRODUCTION_CONFIG && window.PRODUCTION_CONFIG.source === 'github-actions') {
    console.log('🔐 GitHub Actions config already loaded, keeping it');
    return;
  }
  
  window.PRODUCTION_CONFIG = {
    rpc: {
      solana: null, // Will be injected by GitHub Actions when working
      base: null    // Will be injected by GitHub Actions when working
    },
    injectedAt: new Date().toISOString(),
    source: 'manual-override-for-testing'
  };
  
  console.log('🔧 Manual production config loaded as fallback');
  console.log('📊 This will use working fallback RPC endpoints until GitHub Actions is fixed');
})();
