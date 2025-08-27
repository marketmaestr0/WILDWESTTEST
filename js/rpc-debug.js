// RPC Configuration Debug Tool
// Comprehensive debugging for QuickNode endpoint loading issues

(function() {
  'use strict';
  
  console.log('🔍 RPC Configuration Debug Tool Loading...');
  
  function debugRPCConfiguration() {
    console.log('\n🔍 === RPC CONFIGURATION DEBUG REPORT ===');
    
    // Check production config
    console.log('\n📋 Production Config Status:');
    console.log('- PRODUCTION_CONFIG exists:', !!window.PRODUCTION_CONFIG);
    console.log('- PRODUCTION_CONFIG content:', window.PRODUCTION_CONFIG);
    console.log('- Has RPC section:', !!window.PRODUCTION_CONFIG?.rpc);
    console.log('- Has Solana endpoint:', !!window.PRODUCTION_CONFIG?.rpc?.solana);
    console.log('- Has Base endpoint:', !!window.PRODUCTION_CONFIG?.rpc?.base);
    console.log('- Has secrets flag:', window.PRODUCTION_CONFIG?.hasSecrets);
    console.log('- Source:', window.PRODUCTION_CONFIG?.source);
    
    if (window.PRODUCTION_CONFIG?.rpc) {
      console.log('\n🎯 Production RPC Endpoints:');
      console.log('- Solana:', window.PRODUCTION_CONFIG.rpc.solana);
      console.log('- Base:', window.PRODUCTION_CONFIG.rpc.base);
      
      // Check if they look like QuickNode endpoints
      const solanaEndpoint = window.PRODUCTION_CONFIG.rpc.solana;
      const baseEndpoint = window.PRODUCTION_CONFIG.rpc.base;
      
      if (solanaEndpoint) {
        const isQuickNodeSolana = solanaEndpoint.includes('quicknode') || solanaEndpoint.includes('solana') && !solanaEndpoint.includes('mainnet-beta.solana.com');
        console.log('- Solana appears to be QuickNode:', isQuickNodeSolana);
      }
      
      if (baseEndpoint) {
        const isQuickNodeBase = baseEndpoint.includes('quicknode') || (baseEndpoint.includes('base') && !baseEndpoint.includes('mainnet.base.org'));
        console.log('- Base appears to be QuickNode:', isQuickNodeBase);
      }
    }
    
    // Check RPC_CONFIG
    console.log('\n📋 RPC_CONFIG Status:');
    console.log('- RPC_CONFIG exists:', !!window.RPC_CONFIG);
    console.log('- RPC_CONFIG methods:', window.RPC_CONFIG ? Object.getOwnPropertyNames(window.RPC_CONFIG) : 'N/A');
    console.log('- Is wallet browser mode:', window.RPC_CONFIG?.isWalletBrowser);
    console.log('- Is fallback mode:', window.RPC_CONFIG?.fallbackMode);
    
    // Test RPC_CONFIG methods
    if (window.RPC_CONFIG) {
      console.log('\n🧪 Testing RPC_CONFIG Methods:');
      
      if (typeof window.RPC_CONFIG.getSolanaEndpoint === 'function') {
        window.RPC_CONFIG.getSolanaEndpoint().then(endpoint => {
          console.log('- getSolanaEndpoint() result:', endpoint);
          const isQuickNode = endpoint && (endpoint.includes('quicknode') || (!endpoint.includes('mainnet-beta.solana.com') && endpoint.includes('solana')));
          console.log('- Solana endpoint appears to be QuickNode:', isQuickNode);
        }).catch(err => {
          console.error('- getSolanaEndpoint() error:', err);
        });
      }
      
      if (typeof window.RPC_CONFIG.getBaseEndpoint === 'function') {
        try {
          const baseEndpoint = window.RPC_CONFIG.getBaseEndpoint();
          console.log('- getBaseEndpoint() result:', baseEndpoint);
          const isQuickNode = baseEndpoint && (baseEndpoint.includes('quicknode') || (!baseEndpoint.includes('mainnet.base.org') && baseEndpoint.includes('base')));
          console.log('- Base endpoint appears to be QuickNode:', isQuickNode);
        } catch (err) {
          console.error('- getBaseEndpoint() error:', err);
        }
      }
    }
    
    // Check Enhanced RPC Manager
    console.log('\n📋 Enhanced RPC Manager Status:');
    console.log('- ENHANCED_RPC_MANAGER exists:', !!window.ENHANCED_RPC_MANAGER);
    
    if (window.ENHANCED_RPC_MANAGER) {
      console.log('\n🧪 Testing Enhanced RPC Manager:');
      
      window.ENHANCED_RPC_MANAGER.getSolanaEndpoint().then(endpoint => {
        console.log('- Enhanced getSolanaEndpoint() result:', endpoint);
        const isQuickNode = endpoint && (endpoint.includes('quicknode') || (!endpoint.includes('mainnet-beta.solana.com') && endpoint.includes('solana')));
        console.log('- Enhanced Solana endpoint appears to be QuickNode:', isQuickNode);
      }).catch(err => {
        console.error('- Enhanced getSolanaEndpoint() error:', err);
      });
      
      window.ENHANCED_RPC_MANAGER.getBaseEndpoint().then(endpoint => {
        console.log('- Enhanced getBaseEndpoint() result:', endpoint);
        const isQuickNode = endpoint && (endpoint.includes('quicknode') || (!endpoint.includes('mainnet.base.org') && endpoint.includes('base')));
        console.log('- Enhanced Base endpoint appears to be QuickNode:', isQuickNode);
      }).catch(err => {
        console.error('- Enhanced getBaseEndpoint() error:', err);
      });
    }
    
    // Check current global RPC variables
    console.log('\n📋 Current Global RPC Variables:');
    console.log('- SOLANA_RPC:', window.SOLANA_RPC || 'Not set');
    console.log('- BASE_RPC:', window.BASE_RPC || 'Not set');
    
    if (window.SOLANA_RPC) {
      const isQuickNodeSolana = window.SOLANA_RPC.includes('quicknode') || (!window.SOLANA_RPC.includes('mainnet-beta.solana.com') && window.SOLANA_RPC.includes('solana'));
      console.log('- Current Solana appears to be QuickNode:', isQuickNodeSolana);
    }
    
    if (window.BASE_RPC) {
      const isQuickNodeBase = window.BASE_RPC.includes('quicknode') || (!window.BASE_RPC.includes('mainnet.base.org') && window.BASE_RPC.includes('base'));
      console.log('- Current Base appears to be QuickNode:', isQuickNodeBase);
    }
    
    // Environment detection
    console.log('\n📋 Environment Detection:');
    console.log('- User Agent:', navigator.userAgent);
    console.log('- Is mobile detected:', /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    console.log('- Window width:', window.innerWidth);
    console.log('- Is wallet browser:', /MetaMask|Trust|Coinbase|Rainbow|WalletConnect|Phantom/i.test(navigator.userAgent));
    console.log('- Has window.ethereum:', !!window.ethereum);
    console.log('- Has window.solana:', !!window.solana);
    
    console.log('\n🔍 === END DEBUG REPORT ===\n');
  }
  
  // Expose debug function globally
  window.debugRPCConfiguration = debugRPCConfiguration;
  
  // Auto-run debug after a delay to let everything load
  setTimeout(() => {
    console.log('🔍 Auto-running RPC configuration debug...');
    debugRPCConfiguration();
  }, 3000);
  
  console.log('🔍 RPC Configuration Debug Tool Ready');
  console.log('💡 Run debugRPCConfiguration() to see detailed RPC status');
  
})();
