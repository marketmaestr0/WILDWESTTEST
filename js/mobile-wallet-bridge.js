// mobile-wallet-bridge.js
// Enhanced mobile wallet connection support for standard browsers

class MobileWalletBridge {
  constructor() {
    this.isInitialized = false;
    this.pendingConnection = null;
    this.connectionTimeout = 30000; // 30 seconds
    this.retryAttempts = 3;
    this.init();
  }

  init() {
    if (this.isInitialized) return;
    
    // Mobile detection
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    this.isAndroid = /Android/.test(navigator.userAgent);
    
    console.log('🔧 Mobile Wallet Bridge initialized:', {
      isMobile: this.isMobile,
      isIOS: this.isIOS,
      isAndroid: this.isAndroid
    });
    
    this.setupMessageListeners();
    this.isInitialized = true;
  }

  setupMessageListeners() {
    // Listen for wallet connection responses from deep links
    window.addEventListener('focus', this.handleWindowFocus.bind(this));
    window.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Listen for wallet injected providers (when user returns from wallet app)
    this.pollForWalletInjection();
  }

  handleWindowFocus() {
    if (this.pendingConnection) {
      console.log('🔄 Window focused - checking for wallet injection');
      this.checkWalletConnection();
    }
  }

  handleVisibilityChange() {
    if (!document.hidden && this.pendingConnection) {
      console.log('🔄 Page visible - checking for wallet connection');
      setTimeout(() => this.checkWalletConnection(), 1000);
    }
  }

  pollForWalletInjection() {
    // Poll for wallet providers that might be injected after deep link return
    if (!this.isMobile) return;
    
    setInterval(() => {
      if (this.pendingConnection) {
        this.checkForNewWalletProviders();
      }
    }, 2000);
  }

  checkForNewWalletProviders() {
    const { network } = this.pendingConnection;
    
    if (network === 'solana') {
      // Check for new Solana providers
      if (window.solana && !this.pendingConnection.initialProviders.solana) {
        console.log('✅ Solana provider detected after deep link');
        this.completePendingConnection('solana', window.solana);
      }
    } else if (network === 'ethereum' || network === 'base') {
      // Check for new Ethereum providers
      if (window.ethereum && !this.pendingConnection.initialProviders.ethereum) {
        console.log('✅ Ethereum provider detected after deep link');
        this.completePendingConnection('ethereum', window.ethereum);
      }
    }
  }

  async connectMobileWallet(network, walletName) {
    if (!this.isMobile) {
      throw new Error('Mobile wallet bridge is only for mobile devices');
    }

    console.log(`📱 Attempting mobile wallet connection: ${walletName} on ${network}`);

    // Store initial provider state
    const initialProviders = {
      solana: window.solana,
      ethereum: window.ethereum,
      phantom: window.phantom
    };

    this.pendingConnection = {
      network,
      walletName,
      timestamp: Date.now(),
      initialProviders,
      resolve: null,
      reject: null
    };

    return new Promise((resolve, reject) => {
      this.pendingConnection.resolve = resolve;
      this.pendingConnection.reject = reject;

      // Set timeout for connection attempt
      setTimeout(() => {
        if (this.pendingConnection) {
          this.handleConnectionTimeout();
        }
      }, this.connectionTimeout);

      // Try multiple connection strategies
      this.attemptConnection(network, walletName);
    });
  }

  async attemptConnection(network, walletName) {
    try {
      // Strategy 1: Try direct provider connection first
      const directResult = await this.tryDirectConnection(network, walletName);
      if (directResult) {
        this.completePendingConnection(network, directResult.provider);
        return;
      }

      // Strategy 2: Use deep link with WalletConnect fallback
      await this.tryDeepLinkConnection(network, walletName);

    } catch (error) {
      console.error('🔴 Mobile connection attempt failed:', error);
      this.handleConnectionError(error);
    }
  }

  async tryDirectConnection(network, walletName) {
    console.log(`🔗 Trying direct connection to ${walletName}`);
    
    try {
      if (network === 'solana') {
        const provider = this.getSolanaProvider(walletName);
        if (provider && provider.connect) {
          const response = await provider.connect();
          if (response && response.publicKey) {
            return { provider, response };
          }
        }
      } else if (network === 'ethereum' || network === 'base') {
        const provider = this.getEthereumProvider(walletName);
        if (provider && provider.request) {
          const accounts = await provider.request({ method: 'eth_requestAccounts' });
          if (accounts && accounts.length > 0) {
            return { provider, accounts };
          }
        }
      }
    } catch (error) {
      console.log(`⚠️ Direct connection failed for ${walletName}:`, error.message);
    }
    
    return null;
  }

  async tryDeepLinkConnection(network, walletName) {
    console.log(`🔗 Trying deep link connection to ${walletName}`);
    
    const deepLink = this.generateDeepLink(network, walletName);
    const universalLink = this.generateUniversalLink(network, walletName);
    
    if (deepLink || universalLink) {
      // Show user guidance
      this.showMobileConnectionModal(walletName, deepLink, universalLink);
      
      // Try deep link
      if (deepLink) {
        this.openDeepLink(deepLink);
      }
      
      // Fallback to universal link after short delay
      if (universalLink) {
        setTimeout(() => {
          if (this.pendingConnection) {
            this.openUniversalLink(universalLink);
          }
        }, 2000);
      }
    } else {
      throw new Error(`No deep link available for ${walletName}`);
    }
  }

  generateDeepLink(network, walletName) {
    const currentUrl = encodeURIComponent(window.location.href);
    const hostname = window.location.hostname;
    
    const deepLinks = {
      'Phantom': `phantom://browse/${currentUrl}`,
      'Solflare': `solflare://v1/browse/${currentUrl}`,
      'MetaMask': `metamask://dapp/${hostname}`,
      'Coinbase Wallet': `cbwallet://dapp?url=${currentUrl}`,
      'Trust Wallet': `trust://browser_tab_open?url=${currentUrl}`,
      'Rainbow Wallet': `rainbow://dapp/${hostname}`
    };
    
    return deepLinks[walletName] || null;
  }

  generateUniversalLink(network, walletName) {
    const currentUrl = encodeURIComponent(window.location.href);
    
    const universalLinks = {
      'Phantom': `https://phantom.app/ul/browse/${currentUrl}?ref=${window.location.hostname}`,
      'Solflare': `https://solflare.com/ul/v1/browse/${currentUrl}`,
      'MetaMask': `https://metamask.app.link/dapp/${window.location.hostname}`,
      'Coinbase Wallet': `https://go.cb-w.com/dapp?cb_url=${currentUrl}`,
      'Trust Wallet': `https://link.trustwallet.com/open_url?coin_id=60&url=${currentUrl}`
    };
    
    return universalLinks[walletName] || null;
  }

  openDeepLink(deepLink) {
    console.log('🔗 Opening deep link:', deepLink);
    
    // Create hidden iframe for iOS deep link
    if (this.isIOS) {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = deepLink;
      document.body.appendChild(iframe);
      setTimeout(() => document.body.removeChild(iframe), 2000);
    } else {
      // Android - direct window location
      window.location.href = deepLink;
    }
  }

  openUniversalLink(universalLink) {
    console.log('🔗 Opening universal link:', universalLink);
    window.open(universalLink, '_blank');
  }

  getSolanaProvider(walletName) {
    const providers = {
      'Phantom': window.solana?.isPhantom ? window.solana : window.phantom?.solana,
      'Solflare': window.solflare,
      'Backpack': window.backpack,
      'Slope': window.slope
    };
    
    return providers[walletName] || window.solana;
  }

  getEthereumProvider(walletName) {
    // Check for specific wallet providers
    if (window.ethereum?.providers) {
      // Multiple providers - find specific one
      for (const provider of window.ethereum.providers) {
        if (this.matchesWallet(provider, walletName)) {
          return provider;
        }
      }
    }
    
    // Single provider or specific wallet check
    if (this.matchesWallet(window.ethereum, walletName)) {
      return window.ethereum;
    }
    
    return window.ethereum; // Fallback
  }

  matchesWallet(provider, walletName) {
    if (!provider) return false;
    
    const matches = {
      'MetaMask': provider.isMetaMask,
      'Coinbase Wallet': provider.isCoinbaseWallet,
      'Trust Wallet': provider.isTrust,
      'Rainbow Wallet': provider.isRainbow
    };
    
    return matches[walletName] || false;
  }

  showMobileConnectionModal(walletName, deepLink, universalLink) {
    // Remove existing modal
    const existingModal = document.getElementById('mobile-wallet-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'mobile-wallet-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: 'Orbitron', sans-serif;
    `;

    modal.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        border: 2px solid #00eaff;
        border-radius: 16px;
        padding: 2rem;
        max-width: 90%;
        text-align: center;
        color: white;
      ">
        <h3 style="color: #00eaff; margin-bottom: 1rem;">Connect ${walletName}</h3>
        <p style="margin-bottom: 1.5rem; line-height: 1.5;">
          Opening ${walletName} app...<br>
          <small style="color: #aaa;">If the app doesn't open automatically, use the buttons below</small>
        </p>
        
        <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;">
          ${deepLink ? `
            <button onclick="window.mobileWalletBridge.openDeepLink('${deepLink}')" style="
              background: linear-gradient(135deg, #00eaff, #0099cc);
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-family: inherit;
              font-weight: 600;
              cursor: pointer;
            ">
              Open ${walletName} App
            </button>
          ` : ''}
          
          ${universalLink ? `
            <button onclick="window.mobileWalletBridge.openUniversalLink('${universalLink}')" style="
              background: linear-gradient(135deg, #9945ff, #7c3aed);
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-family: inherit;
              font-weight: 600;
              cursor: pointer;
            ">
              Open in Browser
            </button>
          ` : ''}
        </div>
        
        <div style="display: flex; gap: 1rem;">
          <button onclick="window.mobileWalletBridge.cancelPendingConnection()" style="
            flex: 1;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
            padding: 12px;
            border-radius: 8px;
            font-family: inherit;
            cursor: pointer;
          ">
            Cancel
          </button>
          <button onclick="window.mobileWalletBridge.retryConnection()" style="
            flex: 1;
            background: linear-gradient(135deg, #ff6b6b, #ee5a52);
            color: white;
            border: none;
            padding: 12px;
            border-radius: 8px;
            font-family: inherit;
            font-weight: 600;
            cursor: pointer;
          ">
            Retry
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  hideMobileConnectionModal() {
    const modal = document.getElementById('mobile-wallet-modal');
    if (modal) {
      modal.remove();
    }
  }

  async checkWalletConnection() {
    if (!this.pendingConnection) return;
    
    const { network } = this.pendingConnection;
    
    try {
      if (network === 'solana') {
        if (window.solana && window.solana.isConnected) {
          this.completePendingConnection('solana', window.solana);
        }
      } else if (network === 'ethereum' || network === 'base') {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            this.completePendingConnection('ethereum', window.ethereum);
          }
        }
      }
    } catch (error) {
      console.log('⚠️ Connection check failed:', error.message);
    }
  }

  completePendingConnection(network, provider) {
    if (!this.pendingConnection) return;
    
    console.log('✅ Mobile wallet connection completed');
    this.hideMobileConnectionModal();
    
    const resolve = this.pendingConnection.resolve;
    this.pendingConnection = null;
    
    if (resolve) {
      resolve({ network, provider });
    }
  }

  handleConnectionTimeout() {
    console.log('⏰ Mobile wallet connection timeout');
    this.hideMobileConnectionModal();
    
    if (this.pendingConnection && this.pendingConnection.reject) {
      const reject = this.pendingConnection.reject;
      this.pendingConnection = null;
      reject(new Error('Connection timeout - wallet did not respond'));
    }
  }

  handleConnectionError(error) {
    console.error('🔴 Mobile wallet connection error:', error);
    this.hideMobileConnectionModal();
    
    if (this.pendingConnection && this.pendingConnection.reject) {
      const reject = this.pendingConnection.reject;
      this.pendingConnection = null;
      reject(error);
    }
  }

  cancelPendingConnection() {
    console.log('❌ Mobile wallet connection cancelled by user');
    this.hideMobileConnectionModal();
    
    if (this.pendingConnection && this.pendingConnection.reject) {
      const reject = this.pendingConnection.reject;
      this.pendingConnection = null;
      reject(new Error('Connection cancelled by user'));
    }
  }

  retryConnection() {
    if (!this.pendingConnection) return;
    
    const { network, walletName } = this.pendingConnection;
    console.log('🔄 Retrying mobile wallet connection');
    
    this.hideMobileConnectionModal();
    this.attemptConnection(network, walletName);
  }

  // Check if wallet app is installed (best effort)
  async isWalletInstalled(walletName) {
    if (!this.isMobile) return true; // Assume installed on desktop
    
    const deepLink = this.generateDeepLink('solana', walletName); // Use solana as default
    if (!deepLink) return false;
    
    try {
      // Try to open deep link and detect if it works
      return new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(false), 2000);
        
        const beforeTime = Date.now();
        window.location.href = deepLink;
        
        setTimeout(() => {
          const afterTime = Date.now();
          clearTimeout(timeout);
          
          // If we're still in the browser after 1.5s, app probably not installed
          resolve(afterTime - beforeTime < 1500);
        }, 1500);
      });
    } catch (error) {
      return false;
    }
  }

  // Show wallet installation guide if wallet not detected
  showWalletInstallationGuide(network, walletName) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: 'Orbitron', sans-serif;
    `;

    const storeLinks = this.getWalletStoreLinks(walletName);
    
    modal.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        border: 2px solid #00eaff;
        border-radius: 16px;
        padding: 2rem;
        max-width: 90%;
        text-align: center;
        color: white;
      ">
        <h3 style="color: #00eaff; margin-bottom: 1rem;">Install ${walletName}</h3>
        <p style="margin-bottom: 1.5rem; line-height: 1.5;">
          ${walletName} wallet is not installed on your device.<br>
          Download it from your app store to continue.
        </p>
        
        <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;">
          ${storeLinks.ios ? `
            <a href="${storeLinks.ios}" target="_blank" style="
              background: linear-gradient(135deg, #007AFF, #005ce6);
              color: white;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-family: inherit;
              font-weight: 600;
              display: block;
            ">
              📱 Download for iOS
            </a>
          ` : ''}
          
          ${storeLinks.android ? `
            <a href="${storeLinks.android}" target="_blank" style="
              background: linear-gradient(135deg, #34A853, #2e8b47);
              color: white;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-family: inherit;
              font-weight: 600;
              display: block;
            ">
              🤖 Download for Android
            </a>
          ` : ''}
        </div>
        
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 12px 24px;
          border-radius: 8px;
          font-family: inherit;
          cursor: pointer;
          width: 100%;
        ">
          Close
        </button>
      </div>
    `;

    document.body.appendChild(modal);
  }

  getWalletStoreLinks(walletName) {
    const links = {
      'Phantom': {
        ios: 'https://apps.apple.com/app/phantom-solana-wallet/id1598432977',
        android: 'https://play.google.com/store/apps/details?id=app.phantom'
      },
      'Solflare': {
        ios: 'https://apps.apple.com/app/solflare/id1580902717',
        android: 'https://play.google.com/store/apps/details?id=com.solflare.mobile'
      },
      'MetaMask': {
        ios: 'https://apps.apple.com/app/metamask/id1438144202',
        android: 'https://play.google.com/store/apps/details?id=io.metamask'
      },
      'Coinbase Wallet': {
        ios: 'https://apps.apple.com/app/coinbase-wallet/id1278383455',
        android: 'https://play.google.com/store/apps/details?id=org.toshi'
      },
      'Trust Wallet': {
        ios: 'https://apps.apple.com/app/trust-crypto-bitcoin-wallet/id1288339409',
        android: 'https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp'
      }
    };
    
    return links[walletName] || {};
  }
}

// Initialize mobile wallet bridge
window.mobileWalletBridge = new MobileWalletBridge();

console.log('📱 Mobile Wallet Bridge loaded');
