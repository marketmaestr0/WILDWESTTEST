// Temporary bypass for unified wallet on lock pages
// This restores original wallet functionality for Base and Solana locking

(function() {
  'use strict';
  
  console.log('🔧 Lock page wallet bypass loading...');
  
  // Check if this is a locking page that needs the original wallet behavior
  const isBaseLocking = window.BASE_LOCKING_HANDLES_WALLET_BUTTON;
  const isSolanaLocking = window.SOLANA_LOCKING_HANDLES_WALLET_BUTTON;
  
  if (!isBaseLocking && !isSolanaLocking) {
    console.log('📍 Not a locking page, unified wallet remains active');
    return;
  }
  
  console.log('🔄 Locking page detected, restoring original wallet methods...');
  
  // Wait for wildWestWallet to be available
  const waitForWallet = () => {
    if (window.wildWestWallet && window.wildWestWallet.originalMethods) {
      console.log('✅ Restoring original wallet methods for lock pages');
      
      // Restore original methods
      window.wildWestWallet.connectWallet = window.wildWestWallet.originalMethods.connectWallet;
      window.wildWestWallet.connectBaseWallet = window.wildWestWallet.originalMethods.connectBaseWallet;
      window.wildWestWallet.connectSolanaWallet = window.wildWestWallet.originalMethods.connectSolanaWallet;
      window.wildWestWallet.connectToSpecificChain = window.wildWestWallet.originalMethods.connectToSpecificChain;
      window.wildWestWallet.connectWithChainSelection = window.wildWestWallet.originalMethods.connectWithChainSelection;
      
      console.log('🔙 Original wallet methods restored for locking page');
      
    } else {
      // Try again in 500ms
      setTimeout(waitForWallet, 500);
    }
  };
  
  // Start waiting for wallet
  waitForWallet();
  
})();
