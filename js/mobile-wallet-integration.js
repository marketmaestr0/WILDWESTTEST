// mobile-wallet-integration.js
// 🔗 INTEGRATION BETWEEN MOBILE WALLET DETECTOR AND EXISTING WALLET SYSTEM
// CACHE BUST: 2025-07-26-15:30 - ALL DISCLAIMERS REMOVED

class MobileWalletIntegration {
  constructor() {
    this.initialized = false;
    this.isMobile = this.detectMobile();
    
    // Wait for dependencies to load
    this.waitForDependencies();
  }

  detectMobile() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 768;
    
    return mobileRegex.test(userAgent) || (isTouchDevice && isSmallScreen);
  }

  async waitForDependencies() {
    console.log('🔗 Waiting for wallet dependencies...');
    
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds
    
    const checkDependencies = () => {
      attempts++;
      
      if (window.wildWestWallet && window.mobileWalletDetector) {
        console.log('✅ Wallet dependencies loaded, initializing mobile integration...');
        this.init();
        return;
      }
      
      if (attempts < maxAttempts) {
        setTimeout(checkDependencies, 100);
      } else {
        console.log('⚠️ Wallet dependencies not found after 5 seconds');
      }
    };
    
    checkDependencies();
  }

  async init() {
    if (this.initialized) return;
    
    console.log('🔗 Initializing mobile wallet integration...');
    
    // IMMEDIATE TEST: Show modal if mobile
    if (this.isMobile) {
      console.log('🚨 MOBILE DETECTED - SHOWING MODAL IN 2 SECONDS');
      setTimeout(() => {
        this.showWalletBrowserGuidance();
      }, 2000);
    }
    
    // Override existing wallet connection to use mobile detection
    this.enhanceWalletConnection();
    
    // Add mobile-specific wallet guidance
    this.addMobileWalletGuidance();
    
    // Integrate with existing connect wallet button
    this.enhanceConnectButton();
    
    this.initialized = true;
    console.log('✅ Mobile wallet integration complete');
  }

  enhanceWalletConnection() {
    // DISABLED: Override wallet connection for pages with custom modal systems
    // The solana-locking, base-locking, and token-furnace pages have their own
    // showChainSelectionModal systems that work properly on mobile
    
    console.log('🔗 Mobile wallet connection override disabled - using page-specific modals');
    return;
    
    if (!window.wildWestWallet) return;
    
    // Store original connect method
    const originalConnect = window.wildWestWallet.connectWallet.bind(window.wildWestWallet);
    
    // Override with mobile-aware version
    window.wildWestWallet.connectWallet = async (walletType = null) => {
      console.log('🔗 Enhanced mobile wallet connection triggered');
      
      if (this.isMobile) {
        return this.handleMobileWalletConnection(walletType, originalConnect);
      } else {
        return originalConnect(walletType);
      }
    };
    
    console.log('🔗 Enhanced wallet connection method');
  }

  async handleMobileWalletConnection(walletType, originalConnect) {
    console.log('📱 Handling mobile wallet connection...');
    
    // DISABLED: Debug modal override - allow normal connection flow
    // console.log('🚨 FORCING MODAL TO SHOW FOR DEBUG');
    // this.showWalletBrowserGuidance();
    // return false;
    
    // First try standard connection (works in wallet browsers)
    try {
      console.log('🔗 Attempting standard wallet connection...');
      const result = await originalConnect(walletType);
      if (result) {
        console.log('✅ Standard connection successful!');
        return result;
      }
    } catch (error) {
      console.log('⚠️ Standard connection failed, trying mobile detection...');
    }
    
    // Check if any mobile wallets are detected
    const detectedWallets = window.mobileWalletDetector.getDetectedWallets();
    const availableWallets = detectedWallets.filter(w => w.status === 'available');
    
    if (availableWallets.length > 0) {
      console.log('✅ Mobile wallets available, proceeding with connection...');
      
      // If specific wallet type requested, try to connect to it
      if (walletType) {
        const targetWallet = availableWallets.find(w => 
          w.id.includes(walletType.toLowerCase()) || 
          w.name.toLowerCase().includes(walletType.toLowerCase())
        );
        
        if (targetWallet) {
          console.log(`🎯 Connecting to specific mobile wallet: ${targetWallet.name}`);
          return originalConnect(walletType);
        }
      }
      
      // Show mobile wallet selection if multiple available
      if (availableWallets.length > 1) {
        return this.showMobileWalletSelection(availableWallets, originalConnect);
      } else {
        // Single wallet available, connect directly
        console.log(`🔗 Connecting to ${availableWallets[0].name}...`);
        return originalConnect();
      }
    } else {
      // No wallets detected, show mobile guidance
      return this.showMobileWalletGuidance(detectedWallets);
    }
  }

  async showMobileWalletSelection(availableWallets, originalConnect) {
    return new Promise((resolve) => {
      console.log('📱 Showing mobile wallet selection...');
      
      // Create mobile wallet selection modal
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.9);
        z-index: 999999999;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(5px);
      `;
      
      const content = document.createElement('div');
      content.style.cssText = `
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        border: 3px solid #00eaff;
        border-radius: 20px;
        padding: 30px;
        max-width: 350px;
        width: 85%;
        text-align: center;
        font-family: 'Orbitron', Arial, sans-serif;
        box-shadow: 0 0 50px rgba(0, 234, 255, 0.5);
      `;
      
      let html = `
        <h3 style="color: #00eaff; margin: 0 0 20px 0; font-size: 20px;">
          🔗 Select Wallet to Connect
        </h3>
      `;
      
      availableWallets.forEach((wallet, index) => {
        html += `
          <button onclick="window.mobileWalletIntegration.selectWallet(${index})" style="
            display: block;
            width: 100%;
            margin: 0 0 15px 0;
            padding: 15px;
            background: linear-gradient(135deg, #007bff, #0056b3);
            color: white;
            border: none;
            border-radius: 12px;
            font-weight: bold;
            font-size: 16px;
            cursor: pointer;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          ">
            <span style="font-size: 18px; margin-right: 10px;">${wallet.icon}</span>
            ${wallet.name}
          </button>
        `;
      });
      
      html += `
        <button onclick="window.mobileWalletIntegration.cancelSelection()" style="
          display: block;
          width: 100%;
          padding: 12px;
          background: transparent;
          color: #00eaff;
          border: 2px solid #00eaff;
          border-radius: 10px;
          cursor: pointer;
          font-size: 14px;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        ">Cancel</button>
      `;
      
      content.innerHTML = html;
      modal.appendChild(content);
      document.body.appendChild(modal);
      
      // Store resolve function and wallets for selection
      this._selectionResolve = resolve;
      this._selectionWallets = availableWallets;
      this._selectionModal = modal;
      this._originalConnect = originalConnect;
    });
  }

  selectWallet(index) {
    const wallet = this._selectionWallets[index];
    console.log(`🔗 User selected: ${wallet.name}`);
    
    // Close modal
    this._selectionModal.remove();
    
    // Connect to selected wallet
    this._originalConnect().then(result => {
      this._selectionResolve(result);
    }).catch(error => {
      this._selectionResolve(false);
    });
  }

  cancelSelection() {
    console.log('❌ User cancelled wallet selection');
    this._selectionModal.remove();
    this._selectionResolve(false);
  }

  async showMobileWalletGuidance(detectedWallets) {
    // Only show clean modal if no wallet is detected
    this.showWalletBrowserGuidance();
    return false;
  }

  showWalletBrowserGuidance() {
    // Disabled - wallet guidance now only shown in legal disclaimer
    console.log('📱 Wallet browser guidance disabled - handled by legal disclaimer only');
    return;
  }

  enhanceConnectButton() {
    // Find existing connect wallet button
    const connectBtn = document.getElementById('connectWalletBtn');
    if (!connectBtn || !this.isMobile) return;
    
    console.log('🔗 Enhancing connect wallet button for mobile...');
    
    // Store original click handler
    const originalHandler = connectBtn.onclick;
    
    // Add mobile-specific styling
    connectBtn.style.cssText += `
      padding: 12px 20px !important;
      font-size: 16px !important;
      touch-action: manipulation !important;
      -webkit-tap-highlight-color: transparent !important;
    `;
    
    // Update button text for mobile
    if (connectBtn.textContent.includes('Connect')) {
      connectBtn.innerHTML = 'Connect Wallet';
    }
    
    console.log('✅ Connect button enhanced for mobile');
  }

  addMobileWalletGuidance() {
    // No mobile guidance or download prompts ever shown
    // This function intentionally left blank for clean UI
  }

  // Utility function to refresh mobile wallet status
  async refreshMobileWalletStatus() {
    if (!this.isMobile || !window.mobileWalletDetector) return;
    
    console.log('🔄 Refreshing mobile wallet status...');
    
    // Re-detect wallets
    await window.mobileWalletDetector.detectAvailableWallets();
    
    // Update guidance
    const infoDiv = document.getElementById('mobile-wallet-info');
    if (infoDiv) {
      infoDiv.remove();
      this.addMobileWalletGuidance();
    }
    
    console.log('✅ Mobile wallet status refreshed');
  }
}

// Initialize mobile wallet integration
document.addEventListener('DOMContentLoaded', function() {
  window.mobileWalletIntegration = new MobileWalletIntegration();
});

// Auto-refresh wallet status when page becomes visible (user switching apps)
document.addEventListener('visibilitychange', function() {
  if (!document.hidden && window.mobileWalletIntegration) {
    setTimeout(() => {
      window.mobileWalletIntegration.refreshMobileWalletStatus();
    }, 1000);
  }
});

console.log('🔗 Mobile Wallet Integration loaded');

// GLOBAL UNIFIED WALLET BROWSER GUIDANCE FUNCTION
// DISABLED: Wallet browser guidance is now only shown in legal disclaimer
window.showUnifiedWalletBrowserGuidance = function() {
  console.log('📱 Wallet browser guidance disabled - handled by legal disclaimer only');
  return;
};

// Override all existing wallet guidance functions to use the unified one (DISABLED)

// Override all existing wallet guidance functions to use the unified one (DISABLED)
setTimeout(() => {
  // All wallet guidance functions disabled - only shown in legal disclaimer
  if (window.walletManager && typeof window.walletManager.showWalletInstallationGuide === 'function') {
    window.walletManager.showWalletInstallationGuide = function() {
      console.log('🔄 Wallet guidance disabled - handled by legal disclaimer only');
    };
    console.log('🔄 Disabled walletManager.showWalletInstallationGuide');
  }
  
  // Override any global functions
  if (typeof window.showWalletInstallationGuide === 'function') {
    window.showWalletInstallationGuide = function() {
      console.log('🔄 Wallet guidance disabled - handled by legal disclaimer only');
    };
    console.log('🔄 Disabled global showWalletInstallationGuide');
  }
  
  // Also override the class method
  if (window.mobileWalletIntegration && typeof window.mobileWalletIntegration.showWalletBrowserGuidance === 'function') {
    window.mobileWalletIntegration.showWalletBrowserGuidance = function() {
      console.log('🔄 Wallet guidance disabled - handled by legal disclaimer only');
    };
    console.log('🔄 Disabled mobileWalletIntegration.showWalletBrowserGuidance');
  }
}, 1000);
