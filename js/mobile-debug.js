// Mobile Debug System for Token Furnace
// Comprehensive mobile debugging and RPC validation

(function() {
  'use strict';
  
  console.log('📱 Mobile Debug System Loading...');
  
  // Enhanced mobile detection
  function detectMobile() {
    const userAgent = navigator.userAgent;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isMobileWidth = window.innerWidth <= 768;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    const mobileInfo = {
      userAgent: userAgent,
      isMobileUA: isMobileUA,
      isMobileWidth: isMobileWidth,
      isTouchDevice: isTouchDevice,
      isMobile: isMobileUA || isMobileWidth,
      isInWalletBrowser: /MetaMask|Trust|Coinbase|Rainbow|WalletConnect|Phantom/i.test(userAgent),
      hasEthereum: !!window.ethereum,
      hasSolana: !!window.solana,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    };
    
    console.log('📱 Mobile Detection Results:', mobileInfo);
    return mobileInfo;
  }
  
  // Check script loading status
  function checkScriptLoading() {
    const scripts = [
      'production-config.js',
      'rpc-config.js',
      'wallet.js',
      'mobile-wallet-detector.js',
      'mobile-wallet-integration.js'
    ];
    
    const loadedScripts = Array.from(document.scripts).map(script => script.src);
    const scriptStatus = {};
    
    scripts.forEach(script => {
      const isLoaded = loadedScripts.some(src => src.includes(script));
      scriptStatus[script] = isLoaded;
    });
    
    console.log('📜 Script Loading Status:', scriptStatus);
    return scriptStatus;
  }
  
  // Check RPC configuration availability
  function checkRPCConfig() {
    const rpcStatus = {
      hasRPCConfig: !!window.RPC_CONFIG,
      hasProductionConfig: !!window.PRODUCTION_CONFIG,
      rpcConfigMethods: window.RPC_CONFIG ? Object.getOwnPropertyNames(window.RPC_CONFIG) : [],
      productionConfigKeys: window.PRODUCTION_CONFIG ? Object.keys(window.PRODUCTION_CONFIG) : []
    };
    
    console.log('🔧 RPC Configuration Status:', rpcStatus);
    
    if (window.RPC_CONFIG) {
      try {
        console.log('🔗 Testing RPC Config Methods:');
        if (typeof window.RPC_CONFIG.getSolanaEndpoint === 'function') {
          window.RPC_CONFIG.getSolanaEndpoint().then(endpoint => {
            console.log('🟣 Solana Endpoint:', endpoint);
          }).catch(err => {
            console.error('❌ Solana Endpoint Error:', err);
          });
        }
        
        if (typeof window.RPC_CONFIG.getBaseEndpoint === 'function') {
          const baseEndpoint = window.RPC_CONFIG.getBaseEndpoint();
          console.log('🔵 Base Endpoint:', baseEndpoint);
        }
      } catch (error) {
        console.error('❌ RPC Config Test Error:', error);
      }
    }
    
    return rpcStatus;
  }
  
  // Comprehensive mobile debug report
  function generateMobileDebugReport() {
    const report = {
      timestamp: new Date().toISOString(),
      mobile: detectMobile(),
      scripts: checkScriptLoading(),
      rpc: checkRPCConfig(),
      globalObjects: {
        hasWildWestWallet: !!window.wildWestWallet,
        hasAvailableWallets: !!window.availableWallets,
        hasConnectSpecificWallet: !!window.connectSpecificWallet,
        hasShowChainSelectionModal: !!window.showChainSelectionModal
      },
      pageInfo: {
        url: window.location.href,
        title: document.title,
        readyState: document.readyState
      }
    };
    
    console.log('📋 Complete Mobile Debug Report:', report);
    
    // Store report for manual access
    window.mobileDebugReport = report;
    
    return report;
  }
  
  // Wait for dependencies and run full check
  function runMobileDebugCheck() {
    console.log('🚀 Running Mobile Debug Check...');
    
    // Run initial check
    generateMobileDebugReport();
    
    // Run delayed check to catch any late-loading scripts
    setTimeout(() => {
      console.log('🕐 Running delayed Mobile Debug Check...');
      generateMobileDebugReport();
    }, 2000);
    
    // Run another check after 5 seconds
    setTimeout(() => {
      console.log('🕐 Running final Mobile Debug Check...');
      const finalReport = generateMobileDebugReport();
      
      // If mobile and missing RPC config, show helpful message
      if (finalReport.mobile.isMobile && !finalReport.rpc.hasRPCConfig) {
        console.warn('⚠️ Mobile device detected but RPC_CONFIG not available!');
        console.warn('💡 This may prevent proper QuickNode endpoint usage on mobile');
      }
    }, 5000);
  }
  
  // Expose debug functions globally
  window.mobileDebug = {
    detectMobile,
    checkScriptLoading,
    checkRPCConfig,
    generateMobileDebugReport,
    runMobileDebugCheck
  };
  
  // Auto-run if mobile detected
  if (detectMobile().isMobile) {
    console.log('📱 Mobile device detected - auto-running debug checks');
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', runMobileDebugCheck);
    } else {
      runMobileDebugCheck();
    }
  }
  
  console.log('📱 Mobile Debug System Ready');
  console.log('💡 Run window.mobileDebug.generateMobileDebugReport() for current status');
  
})();
