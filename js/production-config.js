// Production Configuration
// This file is automatically populated during GitHub Actions deployment
// with environment variables from GitHub Secrets for security

(function() {
  'use strict';

  if (window.PRODUCTION_CONFIG) {
    console.log('🔐 Production config already loaded');
    return;
  }

  window.PRODUCTION_CONFIG = {
    // Will be populated by GitHub Actions with:
    // - QuickNode RPC endpoints  
    // - API keys and secrets
    // - Environment-specific configuration
    
    // Direct QuickNode endpoints for immediate use (industry standard approach)
    rpc: {
      solana: 'https://withered-divine-spring.solana-mainnet.quiknode.pro/0ef60836be4b1b1fea3b948cf28c518322a18147/',
      base: 'https://responsive-omniscient-model.base-mainnet.quiknode.pro/aa86b92100862c55985ff1d322a9ff07d9ab236f/'
    },
    token: null, // Will be injected by GitHub Actions deployment
    hasSecrets: true,
    source: 'direct-endpoints'
  };

  // Direct endpoint configuration eliminates need for fallback detection
  // GitHub Actions deployment will override this file with environment-specific values
  console.log('✅ QuickNode endpoints available - direct configuration loaded');
})();
