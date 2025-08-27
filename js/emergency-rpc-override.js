// Temporary QuickNode RPC override for immediate lock fix
// This bypasses the GitHub Secrets issue and uses your QuickNode endpoints directly

(function() {
  'use strict';
  
  console.log('🔧 Emergency RPC override loading...');
  
  // Override production config with working QuickNode endpoints
  // IMPORTANT: Replace these with your actual QuickNode URLs
  window.PRODUCTION_CONFIG = {
    token: 'temp-override', 
    rpc: {
      // Replace with your actual Solana QuickNode URL
      solana: 'https://api.mainnet-beta.solana.com', // Fallback - replace with QuickNode
      // Replace with your actual Base QuickNode URL  
      base: 'https://mainnet.base.org' // Fallback - replace with QuickNode
    },
    injectedAt: new Date().toISOString(),
    source: 'emergency-override'
  };
  
  console.log('🚨 Emergency RPC override active');
  console.log('📍 Solana RPC:', window.PRODUCTION_CONFIG.rpc.solana);
  console.log('📍 Base RPC:', window.PRODUCTION_CONFIG.rpc.base);
  console.log('⚠️ This is a temporary fix - GitHub Secrets deployment needs to be fixed');
  
})();
