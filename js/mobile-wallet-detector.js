// mobile-wallet-detector.js
// 📱 MOBILE WALLET DETECTION & CONNECTION SYSTEM
// Detects installed mobile wallets and provides connection options even from regular browsers

class MobileWalletDetector {
  constructor() {
    this.detectedWallets = [];
    this.isMobile = this.detectMobile();
    this.supportedWallets = this.getSupportedWallets();
    
    console.log('📱 Mobile Wallet Detector initialized');
    console.log('📱 Is Mobile Device:', this.isMobile);
    
    if (this.isMobile) {
      // Ensure DOM is ready before initializing UI elements
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.init(), { once: true });
      } else {
        this.init();
      }
    }
  }

  // Detect if user is on mobile device
  detectMobile() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    // Check for mobile user agents
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    const isMobileUA = mobileRegex.test(userAgent);
    
    // Check for touch capability
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Check viewport size
    const isSmallScreen = window.innerWidth <= 768;
    
    return isMobileUA || (isTouchDevice && isSmallScreen);
  }

  // Get list of supported mobile wallets with detection methods
  getSupportedWallets() {
    return {
      // Ethereum/Base Wallets
      metamask: {
        name: 'MetaMask',
        icon: '',
        chains: ['ethereum', 'base'],
        detection: {
          window: 'ethereum',
          provider: () => window.ethereum?.isMetaMask,
          userAgent: /MetaMask/i
        },
        deeplink: {
          connect: 'https://metamask.app.link/dapp/',
          fallback: 'https://metamask.io/download/'
        },
        mobileApp: {
          ios: 'https://apps.apple.com/app/metamask/id1438144202',
          android: 'https://play.google.com/store/apps/details?id=io.metamask'
        }
      },
      
      trustwallet: {
        name: 'Trust Wallet',
        icon: '',
        chains: ['ethereum', 'base', 'solana'],
        detection: {
          window: 'ethereum',
          provider: () => window.ethereum?.isTrust,
          userAgent: /Trust/i
        },
        deeplink: {
          connect: 'https://link.trustwallet.com/open_url?coin_id=60&url=',
          fallback: 'https://trustwallet.com/'
        },
        mobileApp: {
          ios: 'https://apps.apple.com/app/trust-crypto-bitcoin-wallet/id1288339409',
          android: 'https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp'
        }
      },
      
      coinbase: {
        name: 'Coinbase Wallet',
        icon: '',
        chains: ['ethereum', 'base'],
        detection: {
          window: 'ethereum',
          provider: () => window.ethereum?.isCoinbaseWallet,
          userAgent: /CoinbaseWallet/i
        },
        deeplink: {
          connect: 'https://go.cb-w.com/dapp?cb_url=',
          fallback: 'https://wallet.coinbase.com/'
        },
        mobileApp: {
          ios: 'https://apps.apple.com/app/coinbase-wallet/id1278383455',
          android: 'https://play.google.com/store/apps/details?id=org.toshi'
        }
      },
      
      rainbow: {
        name: 'Rainbow',
        icon: '',
        chains: ['ethereum', 'base'],
        detection: {
          window: 'ethereum',
          provider: () => window.ethereum?.isRainbow,
          userAgent: /Rainbow/i
        },
        deeplink: {
          connect: 'https://rnbwapp.com/app/',
          fallback: 'https://rainbow.me/'
        },
        mobileApp: {
          ios: 'https://apps.apple.com/app/rainbow-ethereum-wallet/id1457119021',
          android: 'https://play.google.com/store/apps/details?id=me.rainbow'
        }
      },

      // Solana Wallets
      phantom: {
        name: 'Phantom',
        icon: '',
        chains: ['solana'],
        detection: {
          window: 'solana',
          provider: () => window.solana?.isPhantom,
          userAgent: /Phantom/i
        },
        deeplink: {
          connect: 'https://phantom.app/ul/browse/',
          fallback: 'https://phantom.app/'
        },
        mobileApp: {
          ios: 'https://apps.apple.com/app/phantom-solana-wallet/id1598432977',
          android: 'https://play.google.com/store/apps/details?id=app.phantom'
        }
      },
      
      solflare: {
        name: 'Solflare',
        icon: '',
        chains: ['solana'],
        detection: {
          window: 'solflare',
          provider: () => window.solflare,
          userAgent: /Solflare/i
        },
        deeplink: {
          connect: 'solflare://v1/browse/',
          fallback: 'https://solflare.com/'
        },
        mobileApp: {
          ios: 'https://apps.apple.com/app/solflare/id1580902717',
          android: 'https://play.google.com/store/apps/details?id=com.solflare.mobile'
        }
      },

      backpack: {
        name: 'Backpack',
        icon: '',
        chains: ['solana'],
        detection: {
          window: 'backpack',
          provider: () => window.backpack,
          userAgent: /Backpack/i
        },
        deeplink: {
          connect: 'https://backpack.app/open/',
          fallback: 'https://backpack.app/'
        },
        mobileApp: {
          ios: 'https://apps.apple.com/app/backpack-crypto-wallet/id6446166309',
          android: 'https://play.google.com/store/apps/details?id=app.backpack.mobile'
        }
      }
    };
  }

  // Initialize mobile wallet detection
  async init() {
    console.log('🔍 Starting mobile wallet detection...');
    
    // Detect currently available wallets
    await this.detectAvailableWallets();
    
    // Detect potentially installed wallets (even if not injected)
    await this.detectInstalledWallets();
    
    // FORCE detection even if no providers found
    this.forceWalletDetection();
    
    // Create mobile wallet UI
    this.createMobileWalletUI();
    
    console.log('📱 Mobile wallet detection complete');
    console.log('✅ Total wallets:', this.detectedWallets.length);
  }

  // Force detection of wallets even without providers
  forceWalletDetection() {
    console.log('🚀 FORCE detecting wallets...');
    
    // If we have ethereum provider, assume MetaMask is available
    if (window.ethereum && !this.detectedWallets.find(w => w.id === 'metamask')) {
      this.detectedWallets.push({
        ...this.supportedWallets.metamask,
        id: 'metamask',
        status: 'available',
        canConnect: true
      });
      console.log('✅ FORCED MetaMask detection');
    }
    
    // If we have solana provider, assume Phantom is available  
    if (window.solana && !this.detectedWallets.find(w => w.id === 'phantom')) {
      this.detectedWallets.push({
        ...this.supportedWallets.phantom,
        id: 'phantom', 
        status: 'available',
        canConnect: true
      });
      console.log('✅ FORCED Phantom detection');
    }
    
    // If still no wallets detected, add popular ones as installable
    if (this.detectedWallets.length === 0) {
      console.log('🎯 No wallets detected, adding popular options...');
      
      // Add top mobile wallets as installable
      ['metamask', 'trustwallet', 'coinbase', 'phantom'].forEach(walletId => {
        if (!this.detectedWallets.find(w => w.id === walletId)) {
          this.detectedWallets.push({
            ...this.supportedWallets[walletId],
            id: walletId,
            status: 'installable',
            canConnect: false
          });
        }
      });
      
      console.log('✅ Added popular wallets as installable options');
    }
  }

  // Detect wallets that are currently available (injected providers)
  async detectAvailableWallets() {
    console.log('🔍 Detecting available wallet providers...');
    
    for (const [key, wallet] of Object.entries(this.supportedWallets)) {
      try {
        // Check if provider is available
        const isAvailable = await this.isWalletAvailable(wallet);
        
        if (isAvailable) {
          this.detectedWallets.push({
            ...wallet,
            id: key,
            status: 'available',
            canConnect: true
          });
          
          console.log(`✅ ${wallet.name} is available for connection`);
        }
      } catch (error) {
        console.log(`❌ Error detecting ${wallet.name}:`, error);
      }
    }
  }

  // Detect wallets that might be installed but not currently injected
  async detectInstalledWallets() {
    console.log('🔍 Detecting potentially installed wallets...');
    
    for (const [key, wallet] of Object.entries(this.supportedWallets)) {
      // Skip if already detected as available
      if (this.detectedWallets.find(w => w.id === key)) continue;
      
      try {
        // Check user agent for wallet signatures
        const isInUserAgent = wallet.detection.userAgent?.test(navigator.userAgent);
        
        if (isInUserAgent) {
          this.detectedWallets.push({
            ...wallet,
            id: key,
            status: 'detected',
            canConnect: true
          });
          
          console.log(`🔍 ${wallet.name} detected in user agent`);
        } else {
          // Add as installable option
          this.detectedWallets.push({
            ...wallet,
            id: key,
            status: 'installable',
            canConnect: false
          });
        }
      } catch (error) {
        console.log(`❌ Error checking ${wallet.name}:`, error);
      }
    }
  }

  // Check if a wallet is currently available
  async isWalletAvailable(wallet) {
    try {
      // Check if the main provider object exists
      const provider = window[wallet.detection.window];
      if (!provider) return false;
      
      // Check wallet-specific detection method
      if (wallet.detection.provider) {
        return wallet.detection.provider();
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  // Create mobile wallet connection UI
  createMobileWalletUI() {
    if (!this.isMobile || this.detectedWallets.length === 0) return;
    
    console.log('🎨 Creating mobile wallet UI...');
    
  // Do NOT inject a second connect button. We'll use the existing header/button wiring.
  // this.addMobileWalletButton();
    
    // Create mobile wallet modal
    this.createMobileWalletModal();
    
    console.log('✅ Mobile wallet UI created');
  }

  // Add mobile wallet button to navigation
  addMobileWalletButton() {
  // Intentionally disabled to avoid duplicate buttons across the site.
  console.debug('[MobileWalletDetector] addMobileWalletButton() skipped to prevent duplicates');
  }

  // Try aggressive connection to any available wallet
  async tryAggressiveConnection() {
    console.log('🚀 TRYING AGGRESSIVE CONNECTION...');
    
    // Try Ethereum wallets first
    if (window.ethereum) {
      try {
        console.log('🔗 Attempting Ethereum wallet connection...');
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        if (accounts && accounts.length > 0) {
          console.log('✅ ETHEREUM WALLET CONNECTED!', accounts[0]);
          
          // Update existing wallet system
          if (window.wildWestWallet) {
            window.wildWestWallet.account = accounts[0];
            window.wildWestWallet.isConnected = true;
            window.wildWestWallet.updateWalletUI();
          }
          
          alert(`✅ Wallet Connected!\n\nAddress: ${accounts[0].substring(0, 10)}...`);
          return true;
        }
      } catch (error) {
        console.log('❌ Ethereum connection failed:', error);
      }
    }
    
    // Try Solana wallets
    if (window.solana) {
      try {
        console.log('🔗 Attempting Solana wallet connection...');
        const response = await window.solana.connect();
        
        if (response.publicKey) {
          console.log('✅ SOLANA WALLET CONNECTED!', response.publicKey.toString());
          
          // Update existing wallet system
          if (window.wildWestWallet) {
            window.wildWestWallet.account = response.publicKey.toString();
            window.wildWestWallet.isConnected = true;
            window.wildWestWallet.updateWalletUI();
          }
          
          alert(`✅ Solana Wallet Connected!\n\nAddress: ${response.publicKey.toString().substring(0, 10)}...`);
          return true;
        }
      } catch (error) {
        console.log('❌ Solana connection failed:', error);
      }
    }
    
    console.log('❌ No immediate wallet connection available');
    return false;
  }

  // Create mobile wallet selection modal
  createMobileWalletModal() {
    // Remove existing modal if it exists
    const existingModal = document.getElementById('mobile-wallet-modal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'mobile-wallet-modal';
    modal.style.cssText = `
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.9);
      z-index: 999999999;
      backdrop-filter: blur(5px);
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      border: 3px solid #00eaff;
      border-radius: 20px;
      padding: 30px;
      max-width: 400px;
      width: 85%;
      max-height: 80vh;
      overflow-y: auto;
      font-family: 'Orbitron', Arial, sans-serif;
    `;
    
    modalContent.innerHTML = this.generateWalletModalHTML();
    modal.appendChild(modalContent);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hideMobileWalletModal();
      }
    });
    
    // Safely attach even if body isn't ready yet
    const attach = () => {
      const parent = document.body || document.getElementById('app') || document.documentElement;
      try { parent.appendChild(modal); } catch (e) { /* no-op */ }
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attach, { once: true });
    } else {
      attach();
    }
  }

  // Generate HTML for wallet modal
  generateWalletModalHTML() {
    const availableWallets = this.detectedWallets.filter(w => w.status === 'available');
    const detectedWallets = this.detectedWallets.filter(w => w.status === 'detected');
    const installableWallets = this.detectedWallets.filter(w => w.status === 'installable');
    
    let html = `
      <div style="text-align: center; margin-bottom: 25px;">
        <h2 style="color: #00eaff; margin: 0 0 10px 0; font-size: 24px;">Connect Wallet</h2>
        <p style="color: #ccc; margin: 0; font-size: 14px;">Choose your preferred wallet to connect</p>
      </div>
    `;
    
    // Available wallets (ready to connect)
    if (availableWallets.length > 0) {
      html += `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #00ff88; font-size: 16px; margin: 0 0 15px 0;"></h3>
      `;
      
      availableWallets.forEach(wallet => {
        html += this.generateWalletButton(wallet, 'connect');
      });
      
      html += `</div>`;
    }
    
    // Detected wallets (might need activation)
    if (detectedWallets.length > 0) {
      html += `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #ffaa00; font-size: 16px; margin: 0 0 15px 0;">🔍 Detected Wallets</h3>
      `;
      
      detectedWallets.forEach(wallet => {
        html += this.generateWalletButton(wallet, 'open');
      });
      
      html += `</div>`;
    }
    
    // Installable wallets
    if (installableWallets.length > 0) {
      html += `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #888; font-size: 16px; margin: 0 0 15px 0;"></h3>
      `;
      
      installableWallets.slice(0, 4).forEach(wallet => { // Show top 4
        html += this.generateWalletButton(wallet, 'install');
      });
      
      html += `</div>`;
    }
    
    // Close button
    html += `
      <button onclick="window.mobileWalletDetector.hideMobileWalletModal();" style="
        display: block;
        width: 100%;
        margin: 20px 0 0 0;
        padding: 15px;
        background: transparent;
        color: #00eaff;
        border: 2px solid #00eaff;
        border-radius: 10px;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      ">✕ Close</button>
    `;
    
    return html;
  }

  // Generate individual wallet button
  generateWalletButton(wallet, action) {
    const actionTexts = {
      connect: 'Connect',
      open: 'Connect',
      install: 'Connect'
    };
    
    const actionColors = {
      connect: '#00ff88',
      open: '#ffaa00', 
      install: '#888'
    };
    
    return `
      <button onclick="window.mobileWalletDetector.handleWalletAction('${wallet.id}', '${action}');" style="
        display: block;
        width: 100%;
        margin: 0 0 12px 0;
        padding: 15px;
        background: linear-gradient(135deg, ${actionColors[action]}, ${actionColors[action]}aa);
        color: white;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
        text-align: left;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
        transition: all 0.3s ease;
      ">
        <span>${wallet.name}</span>
        <span style="float: right; font-size: 14px; opacity: 0.8;">${actionTexts[action]}</span>
      </button>
    `;
  }

  // Handle wallet action (connect/open/install)
  async handleWalletAction(walletId, action) {
    const wallet = this.detectedWallets.find(w => w.id === walletId);
    if (!wallet) return;
    
    console.log(`📱 ${action.toUpperCase()} action for ${wallet.name}`);
    
    try {
      switch (action) {
        case 'connect':
          await this.connectWallet(wallet);
          break;
          
        case 'open':
          // For "open" action, actually try to connect first, then deeplink
          const connected = await this.tryDirectConnection(wallet);
          if (!connected) {
            this.openWalletApp(wallet);
          }
          break;
          
        case 'install':
          this.installWallet(wallet);
          break;
      }
    } catch (error) {
      console.error(`❌ Error with ${wallet.name} ${action}:`, error);
      
      // If connection fails, try to open the app instead
      if (action === 'connect') {
        console.log('🔄 Connection failed, trying to open wallet app...');
        this.openWalletApp(wallet);
      } else {
        alert(`Error ${action}ing ${wallet.name}: ${error.message}`);
      }
    }
  }

  // Try direct connection without popups
  async tryDirectConnection(wallet) {
    console.log(`🔗 Attempting direct connection to ${wallet.name}...`);
    
    try {
      if (wallet.chains.includes('ethereum') || wallet.chains.includes('base')) {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
          });
          
          if (accounts && accounts.length > 0) {
            console.log(`✅ ${wallet.name} connected directly!`);
            this.hideMobileWalletModal();
            
            // Trigger existing wallet system
            if (window.wildWestWallet) {
              window.wildWestWallet.account = accounts[0];
              window.wildWestWallet.isConnected = true;
              window.wildWestWallet.updateWalletUI();
            }
            
            return true;
          }
        }
      }
      
      if (wallet.chains.includes('solana')) {
        if (window.solana) {
          const response = await window.solana.connect();
          
          if (response.publicKey) {
            console.log(`✅ ${wallet.name} connected directly!`);
            this.hideMobileWalletModal();
            
            // Trigger existing wallet system
            if (window.wildWestWallet) {
              window.wildWestWallet.account = response.publicKey.toString();
              window.wildWestWallet.isConnected = true;
              window.wildWestWallet.updateWalletUI();
            }
            
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.log(`❌ Direct connection failed for ${wallet.name}:`, error);
      return false;
    }
  }

  // Connect to available wallet
  async connectWallet(wallet) {
    console.log(`🔗 Connecting to ${wallet.name}...`);
    
    // Hide modal first
    this.hideMobileWalletModal();
    
    // Try direct connection first
    const directSuccess = await this.tryDirectConnection(wallet);
    if (directSuccess) return true;
    
    // If direct connection failed, try existing wallet system
    if (window.wildWestWallet) {
      try {
        const result = await window.wildWestWallet.connectWallet();
        if (result) {
          console.log(`✅ ${wallet.name} connected via existing system`);
          return true;
        }
      } catch (error) {
        console.error(`❌ Existing system connection failed for ${wallet.name}:`, error);
      }
    }
    
    // If all else fails, try to open the wallet app
    console.log(`🔄 All connection methods failed, opening ${wallet.name} app...`);
    this.openWalletApp(wallet);
    
    return false;
  }

  // Open wallet app using deeplink
  openWalletApp(wallet) {
    console.log(`🔗 Opening ${wallet.name} app...`);
    
    const currentUrl = encodeURIComponent(window.location.href);
    const deeplinkUrl = wallet.deeplink.connect + currentUrl;
    
    // Try to open deeplink
    window.location.href = deeplinkUrl;
    
    // Fallback: show instructions after delay
    setTimeout(() => {
      alert(`Opening ${wallet.name}...\n\nIf the app doesn't open automatically, please open ${wallet.name} manually and navigate to:\n${window.location.href}`);
    }, 2000);
    
    this.hideMobileWalletModal();
  }

  // Install wallet app
  installWallet(wallet) {
    console.log(`📥 Installing ${wallet.name}...`);
    
    // Detect platform
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let storeUrl = wallet.deeplink.fallback;
    
    if (isIOS && wallet.mobileApp.ios) {
      storeUrl = wallet.mobileApp.ios;
    } else if (isAndroid && wallet.mobileApp.android) {
      storeUrl = wallet.mobileApp.android;
    }
    
    // Open app store
    window.open(storeUrl, '_blank');
    
    this.hideMobileWalletModal();
  }

  // Show mobile wallet modal
  showMobileWalletModal() {
    const modal = document.getElementById('mobile-wallet-modal');
    if (modal) {
      modal.style.display = 'block';
      
      // Refresh wallet detection
      this.detectedWallets = [];
      this.detectAvailableWallets().then(() => {
        // Update modal content with fresh detection
        const modalContent = modal.querySelector('div');
        if (modalContent) {
          modalContent.innerHTML = this.generateWalletModalHTML();
        }
      });
    }
  }

  // Hide mobile wallet modal
  hideMobileWalletModal() {
    const modal = document.getElementById('mobile-wallet-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  // Get detected wallets (for external access)
  getDetectedWallets() {
    return this.detectedWallets;
  }

  // Check if specific wallet is available
  isWalletDetected(walletName) {
    return this.detectedWallets.some(w => 
      w.name.toLowerCase().includes(walletName.toLowerCase()) && 
      w.status === 'available'
    );
  }
}

// Initialize mobile wallet detector
window.mobileWalletDetector = new MobileWalletDetector();

// Debug functions
window.debugMobileWallets = function() {
  console.log('📱 Mobile Wallet Debug Info:');
  console.log('  - Is Mobile:', window.mobileWalletDetector.isMobile);
  console.log('  - Detected Wallets:', window.mobileWalletDetector.detectedWallets);
  console.log('  - Available Wallets:', window.mobileWalletDetector.detectedWallets.filter(w => w.status === 'available'));
  
  return {
    isMobile: window.mobileWalletDetector.isMobile,
    detectedWallets: window.mobileWalletDetector.detectedWallets,
    availableCount: window.mobileWalletDetector.detectedWallets.filter(w => w.status === 'available').length
  };
};

console.log('📱 Mobile Wallet Detector loaded');
console.log('💡 Debug function: debugMobileWallets()');
