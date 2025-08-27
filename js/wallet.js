// wallet.js
// SIMPLE, CLEAN wallet integration - NO BULLSHIT

class WildWestWallet {
  constructor() {
    this.account = null;
    this.isConnected = false;
    this.currentChain = null;
    this.provider = null;
    this.signer = null;
    this.isConnecting = false; // Add connection state flag
    this.listenersSetup = false; // Prevent duplicate event listeners
    
    this.init();
  }

  async init() {
    // Setup UI handlers only - NO automatic wallet detection/connection
    this.setupEventHandlers();
    console.log('� Wallet system initialized - no auto-connection');
    // Don't call checkConnection() on initialization - wait for user interaction
  }

  async checkConnection() {
    try {
      // PASSIVE connection check - do NOT trigger wallet popups
      // Only check if wallet was previously connected in this session
      if (this.account && this.isConnected && this.provider) {
        // Try to verify existing connection without triggering popup
        try {
          const network = await this.provider.getNetwork();
          this.currentChain = network.chainId;
          this.updateWalletUI();
          console.log('📋 Wallet connection verified (passive check):', this.account);
          return true;
        } catch (error) {
          // Previous connection is no longer valid
          console.log('⚠️ Previous wallet connection expired');
          this.resetWalletState();
        }
      }
      
      // Don't automatically request accounts - this triggers popups!
      // Instead, just update UI to show disconnected state
      this.updateWalletUI();
      return false;
    } catch (error) {
      console.error('Error in passive connection check:', error);
      this.resetWalletState();
      this.updateWalletUI();
      return false;
    }
  }

  resetWalletState() {
    this.account = null;
    this.isConnected = false;
    this.currentChain = null;
    this.provider = null;
    this.signer = null;
  }

  // Detect available Solana wallets (including mobile support)
  detectSolanaWallets() {
    // SECURITY: Respect auto-connection blocking flag
    if (window.WALLET_AUTO_CONNECTION_BLOCKED) {
      console.log('🚫 Wallet detection blocked - auto-connection prevention active');
      return [];
    }
    
    const wallets = [];
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // DEBUG: Log Solana providers (only when auto-connection is not blocked)
    console.log('🔍 DEBUG: window.solana exists:', !!window.solana);
    console.log('🔍 DEBUG: window.solana.isPhantom:', window.solana?.isPhantom);
    console.log('🔍 DEBUG: window.phantom exists:', !!window.phantom);
    console.log('🔍 DEBUG: window.phantom.solana:', !!window.phantom?.solana);
    
    // Priority 1: Phantom (excellent mobile support) - check both normal and hidden
    if (window.solana?.isPhantom || window.__hidden_phantom?.isPhantom) {
      const phantomProvider = window.solana?.isPhantom ? window.solana : window.__hidden_phantom;
      console.log('👻 Phantom detected via window.solana:', !!window.solana?.isPhantom ? 'normal' : 'hidden');
      wallets.push({
        name: 'Phantom',
        provider: phantomProvider,
        icon: '👻',
        mobile: true,
        deeplink: 'phantom://browse/' + encodeURIComponent(window.location.href)
      });
    }
    // Also check window.phantom.solana for Phantom
    else if (window.phantom?.solana?.isPhantom || window.__hidden_phantom?.solana?.isPhantom) {
      const phantomProvider = window.phantom?.solana?.isPhantom ? window.phantom.solana : window.__hidden_phantom?.solana;
      console.log('👻 Phantom detected via window.phantom.solana:', !!window.phantom?.solana?.isPhantom ? 'normal' : 'hidden');
      wallets.push({
        name: 'Phantom',
        provider: phantomProvider,
        icon: '👻',
        mobile: true,
        deeplink: 'phantom://browse/' + encodeURIComponent(window.location.href)
      });
    }
    
    // Priority 2: Solflare (mobile support) - check both normal and hidden
    if ((window.solflare || window.__hidden_solflare) && !wallets.find(w => w.name === 'Solflare')) {
      const solflareProvider = window.solflare || window.__hidden_solflare;
      console.log('🌟 Solflare detected:', !!window.solflare ? 'normal' : 'hidden');
      wallets.push({
        name: 'Solflare',
        provider: solflareProvider,
        icon: '🌟',
        mobile: true,
        deeplink: 'solflare://v1/browse/' + encodeURIComponent(window.location.href)
      });
    }
    
    // Priority 3: Glow (mobile wallet)
    if (window.glow && !wallets.find(w => w.name === 'Glow')) {
      wallets.push({
        name: 'Glow',
        provider: window.glow,
        icon: '✨',
        mobile: true
      });
    }
    
    // Priority 4: Slope (mobile support) - check both normal and hidden
    if ((window.solana?.isSlope || window.slope || window.__hidden_slope || window.__hidden_solana?.isSlope) && !wallets.find(w => w.name === 'Slope')) {
      const slopeProvider = window.slope || window.__hidden_slope || (window.solana?.isSlope ? window.solana : window.__hidden_solana);
      console.log('📈 Slope detected:', !!(window.slope || window.solana?.isSlope) ? 'normal' : 'hidden');
      wallets.push({
        name: 'Slope',
        provider: slopeProvider,
        icon: '📈',
        mobile: true
      });
    }
    
    // Priority 5: Backpack (mobile support) - check both normal and hidden
    if ((window.backpack || window.__hidden_backpack) && !wallets.find(w => w.name === 'Backpack')) {
      const backpackProvider = window.backpack || window.__hidden_backpack;
      console.log('🎒 Backpack detected:', !!window.backpack ? 'normal' : 'hidden');
      wallets.push({
        name: 'Backpack',
        provider: backpackProvider,
        icon: '🎒',
        mobile: true
      });
    }
    
    // Priority 6: Generic Solana wallet - check both normal and hidden
    if ((window.solana || window.__hidden_solana) && !wallets.find(w => w.provider === (window.solana || window.__hidden_solana))) {
      const solanaProvider = window.solana || window.__hidden_solana;
      console.log('🟣 Generic Solana wallet detected:', !!window.solana ? 'normal' : 'hidden');
      wallets.push({
        name: 'Solana Wallet',
        provider: solanaProvider,
        icon: '🟣',
        mobile: true
      });
    }
    
    // Mobile-specific: If no wallet detected but on mobile, note for mobile guidance
    if (wallets.length === 0 && isMobile) {
      console.log('📱 Mobile device detected with no Solana wallet providers. User may need to open in wallet browser.');
    }
    
    console.log('🟣 Detected Solana wallets:', wallets.map(w => `${w.icon} ${w.name} (Mobile: ${w.mobile})`));
    return wallets;
  }

  // Detect if we're inside a wallet's mobile browser
  detectWalletBrowser() {
    const userAgent = navigator.userAgent;
    
    // Check for wallet browser signatures
    if (/MetaMask/i.test(userAgent)) {
      return { name: 'MetaMask', type: 'evm' };
    }
    if (/Phantom/i.test(userAgent)) {
      return { name: 'Phantom', type: 'multi' };
    }
    if (/Coinbase/i.test(userAgent)) {
      return { name: 'Coinbase Wallet', type: 'evm' };
    }
    if (/Trust/i.test(userAgent)) {
      return { name: 'Trust Wallet', type: 'evm' };
    }
    if (/Rainbow/i.test(userAgent)) {
      return { name: 'Rainbow Wallet', type: 'evm' };
    }
    
    return null;
  }

  // Show wallet selection modal for desktop users
  async showWalletSelectionModal(wallets, networkType) {
    return new Promise((resolve) => {
      // Create modal overlay
      const overlay = document.createElement('div');
      overlay.className = 'wallet-modal-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
      `;
      
      // Create modal content
      const modal = document.createElement('div');
      modal.className = 'wallet-selection-modal';
      modal.style.cssText = `
        background: #1a1a1a;
        border-radius: 12px;
        padding: 24px;
        max-width: 400px;
        width: 90%;
        color: white;
        animation: slideIn 0.3s ease;
        border: 1px solid #333;
      `;
      
      // Modal header
      const header = document.createElement('h3');
      header.textContent = `Select ${networkType.toUpperCase()} Wallet`;
      header.style.cssText = `
        margin: 0 0 20px 0;
        text-align: center;
        color: #fff;
        font-size: 20px;
      `;
      modal.appendChild(header);
      
      // Wallet buttons container
      const buttonsContainer = document.createElement('div');
      buttonsContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 12px;
      `;
      
      // Create button for each wallet
      wallets.forEach(wallet => {
        const button = document.createElement('button');
        button.textContent = `${wallet.icon} ${wallet.name}`;
        button.style.cssText = `
          padding: 16px;
          background: #2a2a2a;
          border: 1px solid #444;
          border-radius: 8px;
          color: white;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 12px;
        `;
        
        button.addEventListener('mouseenter', () => {
          button.style.background = '#3a3a3a';
          button.style.borderColor = '#555';
        });
        
        button.addEventListener('mouseleave', () => {
          button.style.background = '#2a2a2a';
          button.style.borderColor = '#444';
        });
        
        button.addEventListener('click', () => {
          document.body.removeChild(overlay);
          resolve(wallet);
        });
        
        buttonsContainer.appendChild(button);
      });
      
      // Cancel button
      const cancelButton = document.createElement('button');
      cancelButton.textContent = 'Cancel';
      cancelButton.style.cssText = `
        padding: 12px;
        background: transparent;
        border: 1px solid #666;
        border-radius: 8px;
        color: #999;
        cursor: pointer;
        font-size: 14px;
        margin-top: 8px;
      `;
      
      cancelButton.addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve(null);
      });
      
      buttonsContainer.appendChild(cancelButton);
      modal.appendChild(buttonsContainer);
      overlay.appendChild(modal);
      
      // Add CSS animations
      const style = document.createElement('style');
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
      
      // Add to page
      document.body.appendChild(overlay);
      
      // Close on overlay click
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          document.body.removeChild(overlay);
          resolve(null);
        }
      });
    });
  }

  async connectSolanaWallet() {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      console.log('Solana wallet connection already in progress...');
      return false;
    }

    try {
      this.isConnecting = true;
      
      // Use multi-wallet manager for graceful wallet selection
      if (window.multiWalletManager) {
        return await window.multiWalletManager.showWalletSelection('solana', async (selectedWallet) => {
          console.log(`🟣 Connecting to selected Solana wallet: ${selectedWallet.name}`);
          return await this.connectToSolanaProvider(selectedWallet.provider, selectedWallet.name);
        });
      }
      
      // Fallback to original detection if multi-wallet manager not available
      const availableWallets = this.detectSolanaWallets();
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (availableWallets.length === 0) {
        if (isMobile) {
          console.log(' Mobile user with no Solana wallet detected');
          return false;
        } else {
          throw new Error('No Solana wallet found. Please install Phantom, Solflare, or another Solana wallet.');
        }
      }
      
      // Use the first available wallet (priority order)
      const selectedWallet = availableWallets[0];
      console.log(`Using Solana wallet: ${selectedWallet.name}`);
      return await this.connectToSolanaProvider(selectedWallet.provider, selectedWallet.name);
      
    } catch (error) {
      console.error('Solana wallet connection failed:', error);
      this.showErrorMessage(`Failed to connect Solana wallet: ${error.message}`);
      return false;
    } finally {
      this.isConnecting = false;
    }
  }

  // Helper method to connect to a specific Solana provider
  async connectToSolanaProvider(wallet, walletName) {
    // Ensure wallet has connect method
    if (!wallet.connect || typeof wallet.connect !== 'function') {
      throw new Error('Wallet does not support connection');
    }
    
    const response = await wallet.connect();
    console.log('Solana wallet response:', response);
    
    let publicKey = null;
    
    // Handle different response formats
    if (response && typeof response === 'object' && response.publicKey) {
      // Standard format: response contains publicKey
      publicKey = response.publicKey;
    } else if (response === true || response === undefined) {
      // Some wallets return true or undefined on successful connection
      // Public key should be available directly on the wallet
      if (wallet.publicKey) {
        publicKey = wallet.publicKey;
      } else {
        throw new Error('Wallet connected but public key not accessible');
      }
    } else {
      throw new Error('Unexpected wallet response format');
    }
    
    if (!publicKey) {
      throw new Error('No public key found after wallet connection');
    }
    
    // Ensure publicKey has toString method
    if (!publicKey.toString || typeof publicKey.toString !== 'function') {
      throw new Error('Invalid public key format - missing toString method');
    }
    
    this.account = publicKey.toString();
    this.isConnected = true;
    this.currentChain = 'solana';
    this.provider = wallet;
    
    this.updateWalletUI();
    this.showStatus(`Solana wallet connected via ${walletName}`, 'success');
    localStorage.setItem('wildwest_wallet_connected', 'solana');
    return true;
  }

  // Direct Solana wallet connection without isConnecting check - used by connectToSpecificChain
  async connectSolanaWalletDirect() {
    console.log('🟣 connectSolanaWalletDirect called - bypassing isConnecting check');
    
    try {
      // Detect available Solana wallets
      const availableWallets = this.detectSolanaWallets();
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (availableWallets.length === 0) {
        if (isMobile) {
          // Show wallet installation guide
          console.log(' Mobile user with no Solana wallet detected');
          return false;
        } else {
          throw new Error('No Solana wallet found. Please install Phantom, Solflare, or another Solana wallet.');
        }
      }
      
      let selectedWallet;
      
      // Mobile: Auto-detect wallet browser and connect directly
      if (isMobile) {
        // Check if we're inside a wallet's browser
        const walletBrowser = this.detectWalletBrowser();
        if (walletBrowser) {
          console.log(`🟣 Mobile: Auto-connecting to ${walletBrowser.name} wallet browser`);
          selectedWallet = availableWallets.find(w => w.name === walletBrowser.name) || availableWallets[0];
        } else {
          // Mobile but not in wallet browser - use first available
          selectedWallet = availableWallets[0];
        }
      }
      // Desktop: Show selection modal if multiple wallets available
      else if (availableWallets.length > 1) {
        console.log('🟣 Desktop: Multiple Solana wallets found, showing selection modal');
        selectedWallet = await this.showWalletSelectionModal(availableWallets, 'solana');
        if (!selectedWallet) {
          console.log('🟣 User cancelled wallet selection');
          return false;
        }
      } else {
        // Desktop with only one wallet - use it directly
        selectedWallet = availableWallets[0];
      }

      const wallet = selectedWallet.provider;
      console.log(`🟣 Using Solana wallet: ${selectedWallet.name}`);

      // FORCE FRESH APPROVAL: Disconnect any existing connection first
      console.log('🔄 Forcing wallet disconnection to ensure fresh user approval...');
      try {
        if (wallet.disconnect && typeof wallet.disconnect === 'function') {
          console.log('🔄 Step 1: Standard wallet disconnect...');
          await wallet.disconnect();
          console.log('✅ Standard disconnect completed');
        }
        
        // PHANTOM SPECIFIC: Try to revoke site permissions
        if (selectedWallet.name === 'Phantom' && wallet.request) {
          try {
            console.log('👻 Step 2: Phantom-specific permission revocation...');
            await wallet.request({
              method: 'disconnect'
            });
            console.log('✅ Phantom permission revocation completed');
          } catch (phantomErr) {
            console.log('⚠️ Phantom permission revocation failed (continuing):', phantomErr.message);
          }
        }
        
        // Wait for disconnection to process
        console.log('⏳ Step 3: Waiting for disconnection to take effect...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (disconnectError) {
        console.log('⚠️ Error disconnecting wallet (continuing anyway):', disconnectError.message);
      }

      // Ensure wallet has connect method
      if (!wallet.connect || typeof wallet.connect !== 'function') {
        throw new Error('Wallet does not support connection');
      }
      
      // This should NOW force the wallet to show approval popup
      console.log('🔐 Requesting fresh wallet approval (should show popup)...');
      
      // FORCE PHANTOM TO SHOW APPROVAL: Use onlyIfTrusted: false
      let response;
      try {
        if (selectedWallet.name === 'Phantom' && wallet.connect) {
          // For Phantom specifically, force it to show approval even if site is trusted
          console.log('👻 Using Phantom-specific connection with onlyIfTrusted: false');
          response = await wallet.connect({ onlyIfTrusted: false });
        } else {
          // For other wallets, use standard connection
          response = await wallet.connect();
        }
      } catch (connectionError) {
        // If the specific approach fails, try standard connection
        console.log('⚠️ Specific connection failed, trying standard connect:', connectionError.message);
        response = await wallet.connect();
      }
      
      console.log('🟣 Solana wallet response:', response);
      
      let publicKey = null;
      
      // Handle different response formats
      if (response && typeof response === 'object' && response.publicKey) {
        // Standard format: response contains publicKey
        publicKey = response.publicKey;
      } else if (wallet.publicKey) {
        // Alternative format: publicKey is directly on wallet
        publicKey = wallet.publicKey;
      } else {
        throw new Error('No public key returned from wallet connection');
      }

      // Ensure publicKey has toString method
      if (!publicKey || typeof publicKey.toString !== 'function') {
        throw new Error('Invalid public key format - missing toString method');
      }
      
      this.account = publicKey.toString();
      this.isConnected = true;
      this.currentChain = 'solana';
      this.provider = wallet;
      
      this.updateWalletUI();
      this.showStatus(`Solana wallet connected via ${selectedWallet.name}`, 'success');
      localStorage.setItem('wildwest_wallet_connected', 'solana');
      return true;
    } catch (error) {
      console.error('🟣 Direct Solana wallet connection error:', error);
      this.showStatus('Failed to connect Solana wallet: ' + error.message, 'error');
      return false;
    }
  }

  async connectBaseWallet() {
    console.log('🔵 connectBaseWallet called, isConnecting flag:', this.isConnecting);
    
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      console.log('Base wallet connection already in progress...');
      return false;
    }

    try {
      this.isConnecting = true;
      console.log('🔵 Set isConnecting to true, starting Base wallet connection with multi-wallet support...');
      
      // Use multi-wallet manager for graceful wallet selection
      if (window.multiWalletManager) {
        return await window.multiWalletManager.showWalletSelection('ethereum', async (selectedWallet) => {
          console.log(`🔵 Connecting to selected Base wallet: ${selectedWallet.name}`);
          return await this.connectToBaseProvider(selectedWallet.provider, selectedWallet.name);
        });
      }
      
      // Fallback to original detection if multi-wallet manager not available
      const availableWallets = this.detectEVMWallets();
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (availableWallets.length === 0) {
        if (isMobile) {
          console.log(' Mobile user with no EVM wallet detected');
          return false;
        } else {
          throw new Error('No EVM wallet detected. Please install MetaMask, Coinbase Wallet, or another Web3 wallet.');
        }
      }
      
      // Use the first available wallet (priority order: MetaMask, Coinbase, others)
      const selectedWallet = availableWallets[0];
      console.log(`Using EVM wallet: ${selectedWallet.name}`);
      return await this.connectToBaseProvider(selectedWallet.provider, selectedWallet.name);
      
    } catch (error) {
      console.error('🔵 Base wallet connection failed:', error);
      this.showErrorMessage(`Failed to connect wallet: ${error.message}`);
      return false;
    } finally {
      this.isConnecting = false;
    }
  }

  // Helper method to connect to a specific Base provider
  async connectToBaseProvider(provider, walletName) {
    // Always request user approval for connection
    console.log('🔵 Requesting wallet connection (eth_requestAccounts)...');
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    console.log('🔵 Wallet connection response:', accounts);
    
    if (accounts && accounts.length > 0) {
      console.log('🔵 Setting up wallet connection...');
      this.account = accounts[0];
      this.isConnected = true;
      this.provider = new ethers.providers.Web3Provider(provider);
      this.signer = this.provider.getSigner();
      
      // Switch to Base network
      console.log('🔵 About to switch to Base network...');
      await this.switchToBase(provider);
      console.log('🔵 Network switch completed, getting network info...');
      
      const network = await this.provider.getNetwork();
      this.currentChain = network.chainId;
      console.log('🔵 Connected to network:', network.chainId, network.name);
      
      this.updateWalletUI();
      this.showStatus(`Base wallet connected via ${walletName}`, 'success');
      localStorage.setItem('wildwest_wallet_connected', 'base');
      return true;
    } else {
      throw new Error('No accounts returned from wallet connection');
    }
  }

  // Direct Base wallet connection with enhanced mobile support  
  async connectBaseWalletDirect() {
    console.log('🔵 connectBaseWalletDirect called - bypassing isConnecting check');
    
    try {
      // Detect available EVM wallets
      const availableWallets = this.detectEVMWallets();
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (availableWallets.length === 0) {
        if (isMobile) {
          // Try mobile wallet bridge if available
          if (window.mobileWalletBridge) {
            try {
              console.log('📱 Using mobile wallet bridge for Base connection');
              const result = await window.mobileWalletBridge.connectMobileWallet('ethereum', 'MetaMask');
              if (result && result.provider) {
                return await this.completeBaseConnection(result.provider, 'MetaMask');
              }
            } catch (bridgeError) {
              console.log('📱 Mobile wallet bridge failed, falling back to installation guide:', bridgeError.message);
            }
          }
          
          // On mobile, show wallet installation guide
          console.log(' Mobile user with no MetaMask wallet detected');
          return false;
        } else {
          throw new Error('No EVM wallet detected. Please install MetaMask, Coinbase Wallet, or another Web3 wallet.');
        }
      }
      
      let selectedWallet;
      
      // Mobile: Auto-detect wallet browser and connect directly
      if (isMobile) {
        // Check if we're inside a wallet's browser
        const walletBrowser = this.detectWalletBrowser();
        if (walletBrowser) {
          console.log(`🔵 Mobile: Auto-connecting to ${walletBrowser.name} wallet browser`);
          selectedWallet = availableWallets.find(w => w.name === walletBrowser.name) || availableWallets[0];
        } else {
          // Mobile but not in wallet browser - try mobile wallet bridge first
          if (window.mobileWalletBridge && availableWallets.length > 0) {
            try {
              console.log('📱 Mobile standard browser: Using mobile wallet bridge');
              const walletName = availableWallets[0].name;
              const result = await window.mobileWalletBridge.connectMobileWallet('ethereum', walletName);
              if (result && result.provider) {
                return await this.completeBaseConnection(result.provider, walletName);
              }
            } catch (bridgeError) {
              console.log('📱 Mobile wallet bridge failed:', bridgeError.message);
            }
          }
          
          // Fallback to first available wallet
          selectedWallet = availableWallets[0];
        }
      }
      // Desktop: Show selection modal if multiple wallets available
      else if (availableWallets.length > 1) {
        console.log('🔵 Desktop: Multiple EVM wallets found, showing selection modal');
        selectedWallet = await this.showWalletSelectionModal(availableWallets, 'base');
        if (!selectedWallet) {
          console.log('🔵 User cancelled wallet selection');
          return false;
        }
      } else {
        // Desktop with only one wallet - use it directly
        selectedWallet = availableWallets[0];
      }
      
      return await this.completeBaseConnection(selectedWallet.provider, selectedWallet.name);

    } catch (error) {
      console.error('🔵 Direct Base wallet connection error:', error);
      this.showStatus('Failed to connect Base wallet: ' + error.message, 'error');
      return false;
    }
  }

  // Helper method to complete Base wallet connection
  async completeBaseConnection(provider, walletName) {
    console.log(`🔵 Using EVM wallet: ${walletName}`);
    
    // Always request user approval for connection
    console.log('🔵 Requesting wallet connection (eth_requestAccounts)...');
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    console.log('🔵 Wallet connection response:', accounts);
    console.log('🔍 DEBUG: All accounts returned by wallet:', accounts);
    console.log('🔍 DEBUG: Selected account (accounts[0]):', accounts[0]);
    console.log('🔍 DEBUG: Using wallet provider:', walletName, provider);
    
    if (accounts && accounts.length > 0) {
      console.log('🔵 Setting up wallet connection...');
      this.account = accounts[0];
      console.log('🔍 DEBUG: this.account set to:', this.account);
      this.isConnected = true;
      this.provider = new ethers.providers.Web3Provider(provider);
      this.signer = this.provider.getSigner();
      
      // Switch to Base network
      console.log('🔵 About to switch to Base network...');
      await this.switchToBase(provider);
      console.log('🔵 Network switch completed, getting network info...');
      
      const network = await this.provider.getNetwork();
      this.currentChain = network.chainId === 8453 ? 'base' : network.chainId; // Map Base chainId to 'base'
      console.log('🔵 Connected to network:', network.chainId, this.getChainName(network.chainId), 'currentChain set to:', this.currentChain);
      
      this.updateWalletUI();
      this.showStatus(`Base wallet connected via ${walletName}`, 'success');
      localStorage.setItem('wildwest_wallet_connected', 'base');
      return true;
    } else {
      throw new Error('No accounts returned from wallet connection');
    }
  }

  // Detect available EVM wallets in priority order (including mobile support)
  detectEVMWallets() {
    // SECURITY: Respect auto-connection blocking flag
    if (window.WALLET_AUTO_CONNECTION_BLOCKED) {
      console.log('🚫 Wallet detection blocked - auto-connection prevention active');
      return [];
    }
    
    const wallets = [];
    
    // DEBUG: Log all ethereum providers (only when auto-connection is not blocked)
    console.log('🔍 DEBUG: window.ethereum exists:', !!window.ethereum);
    console.log('🔍 DEBUG: window.ethereum.isMetaMask:', window.ethereum?.isMetaMask);
    console.log('🔍 DEBUG: window.ethereum.isPhantom:', window.ethereum?.isPhantom);
    console.log('🔍 DEBUG: window.ethereum.providers:', window.ethereum?.providers);
    
    // Check if we're on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Priority 1: MetaMask (works on mobile via in-app browser)
    if (window.ethereum?.isMetaMask && !window.ethereum?.isPhantom) {
      wallets.push({
        name: 'MetaMask',
        provider: window.ethereum,
        icon: '🦊',
        mobile: true,
        deeplink: 'metamask://dapp/' + window.location.hostname
      });
    }
    
    // Priority 2: Coinbase Wallet (excellent mobile support)
    else if (window.ethereum?.isCoinbaseWallet || window.ethereum?.selectedProvider?.isCoinbaseWallet) {
      wallets.push({
        name: 'Coinbase Wallet',
        provider: window.ethereum,
        icon: '🔵',
        mobile: true,
        deeplink: 'cbwallet://dapp?url=' + encodeURIComponent(window.location.href)
      });
    }
    
    // Priority 3: Rainbow Wallet (mobile support)
    else if (window.ethereum?.isRainbow) {
      wallets.push({
        name: 'Rainbow Wallet',
        provider: window.ethereum,
        icon: '🌈',
        mobile: true,
        deeplink: 'rainbow://dapp/' + window.location.hostname
      });
    }
    
    // Priority 4: Trust Wallet (strong mobile presence)
    else if (window.ethereum?.isTrust) {
      wallets.push({
        name: 'Trust Wallet',
        provider: window.ethereum,
        icon: '🛡️',
        mobile: true,
        deeplink: 'trust://browser_tab_open?url=' + encodeURIComponent(window.location.href)
      });
    }
    
    // Priority 5: Brave Wallet (desktop primarily)
    else if (window.ethereum?.isBraveWallet) {
      wallets.push({
        name: 'Brave Wallet',
        provider: window.ethereum,
        icon: '🦁',
        mobile: false
      });
    }
    
    // Priority 6: Phantom (if available for EVM)
    else if (window.ethereum?.isPhantom) {
      wallets.push({
        name: 'Phantom',
        provider: window.ethereum,
        icon: '👻',
        mobile: true
      });
    }
    
    // Priority 7: Any other EVM wallet
    else if (window.ethereum) {
      wallets.push({
        name: 'Web3 Wallet',
        provider: window.ethereum,
        icon: '🔗',
        mobile: true
      });
    }
    
    // Check for multiple providers (some wallets inject multiple providers)
    if (window.ethereum?.providers) {
      console.log('🔍 DEBUG: Multiple providers detected:', window.ethereum.providers.length);
      window.ethereum.providers.forEach((provider, index) => {
        console.log(`🔍 DEBUG: Provider ${index}:`, {
          isMetaMask: provider.isMetaMask,
          isPhantom: provider.isPhantom,
          isCoinbaseWallet: provider.isCoinbaseWallet
        });
        
        if (provider.isMetaMask && !provider.isPhantom && !wallets.find(w => w.name === 'MetaMask')) {
          wallets.unshift({
            name: 'MetaMask',
            provider: provider,
            icon: '🦊',
            mobile: true,
            deeplink: 'metamask://dapp/' + window.location.hostname
          });
        } else if (provider.isCoinbaseWallet && !wallets.find(w => w.name === 'Coinbase Wallet')) {
          wallets.unshift({
            name: 'Coinbase Wallet',
            provider: provider,
            icon: '🔵',
            mobile: true,
            deeplink: 'cbwallet://dapp?url=' + encodeURIComponent(window.location.href)
          });
        } else if (provider.isPhantom && !wallets.find(w => w.name === 'Phantom')) {
          wallets.push({
            name: 'Phantom',
            provider: provider,
            icon: '👻',
            mobile: true
          });
        }
      });
    }
    
    // Mobile-specific: If no wallet detected but on mobile, suggest wallet installation
    if (wallets.length === 0 && isMobile) {
      console.log('📱 Mobile device detected with no wallet providers. User may need to open in wallet browser.');
    }
    
    console.log('🔍 Detected EVM wallets:', wallets.map(w => `${w.icon} ${w.name} (Mobile: ${w.mobile})`));
    return wallets;
  }

  // Show wallet installation guide for mobile users
  showWalletInstallationGuide(network) {
    // Use the unified function to ensure consistency across all pages
    if (typeof window.showUnifiedWalletBrowserGuidance === 'function') {
      window.showUnifiedWalletBrowserGuidance();
    } else {
      // Fallback if unified function not available
      console.log('📱 Mobile user detected - wallet browser guidance needed');
    }
  }

  async switchToBase(provider = window.ethereum) {
    console.log('🔵 Attempting to switch to Base network...');
    try {
      console.log('🔵 Requesting wallet_switchEthereumChain to Base (0x2105)...');
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x2105' }], // Base mainnet
      });
      console.log('✅ Successfully switched to Base network');
    } catch (switchError) {
      console.log('🔵 Switch failed, error code:', switchError.code, 'message:', switchError.message);
      if (switchError.code === 4902) {
        console.log('🔵 Base network not found, attempting to add it...');
        // Add Base network
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x2105',
              chainName: 'Base',
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: [window.RPC_CONFIG ? window.RPC_CONFIG.getBaseEndpoint() : 'https://mainnet.base.org'],
              blockExplorerUrls: ['https://basescan.org']
            }]
          });
          console.log('✅ Successfully added and switched to Base network');
        } catch (addError) {
          console.error('❌ Failed to add Base network:', addError);
          throw addError;
        }
      } else {
        console.error('❌ Failed to switch to Base network:', switchError);
        throw switchError;
      }
    }
  }

  async connectWithChainSelection() {
    console.log('🔍 connectWithChainSelection called - showing chain selection modal');
    console.log('🔍 isConnecting flag before modal:', this.isConnecting);
    
    // Reset the connecting flag before showing modal to ensure clean state
    this.isConnecting = false;
    
    // For index page - show chain selection modal
    return new Promise((resolve) => {
      this.showChainSelectionModal(resolve);
    });
  }

  async connectToSpecificChain(chainName) {
    console.log('🔍 connectToSpecificChain called with chain:', chainName);
    console.log('🔍 Current isConnecting flag:', this.isConnecting);
    
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      console.log('Connection already in progress, please wait...');
      return false;
    }

    try {
      this.isConnecting = true;
      console.log('🔍 Set isConnecting to true in connectToSpecificChain');
      
      let result = false;
      
      // Handle chain-specific connections directly without showing modal
      if (chainName === 'solana') {
        console.log('🟣 Connecting directly to Solana...');
        result = await this.connectSolanaWalletDirect(); // Use direct version that doesn't check isConnecting
      } else if (chainName === 'base') {
        console.log('🔵 Connecting directly to Base...');
        result = await this.connectBaseWalletDirect(); // Use a direct version that doesn't check isConnecting
      } else {
        // If we get here, unknown chain specified
        console.log('❌ Unknown chain specified:', chainName);
        result = false;
      }
      
      console.log('🔍 Chain connection result:', result);
      return result;
    } catch (error) {
      console.error('Error connecting to specific chain:', error);
      this.showStatus('Failed to connect wallet: ' + error.message, 'error');
      return false;
    } finally {
      this.isConnecting = false;
      console.log('🔍 Reset isConnecting to false in connectToSpecificChain');
    }
  }

  showChainSelectionModal(callback) {
    // Add CSS animations if not already added
    if (!document.getElementById('wallet-modal-styles')) {
      const style = document.createElement('style');
      style.id = 'wallet-modal-styles';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .wallet-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.3s ease-out;
        }
        .chain-selection-modal {
          background: linear-gradient(135deg, #1a1a2e, #16213e);
          border: 2px solid #00eaff;
          border-radius: 16px;
          box-shadow: 0 0 30px rgba(0, 234, 255, 0.3);
          max-width: 450px;
          width: 90vw;
          max-height: 80vh;
          overflow: hidden;
          animation: slideUp 0.3s ease-out;
          margin: 1rem;
          font-family: 'Orbitron', Arial, sans-serif;
        }
        .chain-option {
          display: flex;
          align-items: center;
          padding: 1.2rem;
          background: rgba(0, 234, 255, 0.03);
          border: 1px solid rgba(0, 234, 255, 0.15);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: white;
          text-decoration: none;
          font-size: 1rem;
          font-family: inherit;
          width: 100%;
          box-sizing: border-box;
          margin-bottom: 0.8rem;
        }
        .chain-option:hover {
          background: rgba(0, 234, 255, 0.08);
          border-color: rgba(0, 234, 255, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0, 234, 255, 0.2);
        }
        .chain-option:active {
          transform: translateY(0);
        }
        .chain-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          margin-right: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .base-icon {
          background: rgba(0, 82, 255, 0.1);
          border: 1px solid rgba(0, 82, 255, 0.3);
        }
        .solana-icon {
          background: rgba(153, 69, 255, 0.1);
          border: 1px solid rgba(153, 69, 255, 0.3);
        }
        .chain-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .chain-name {
          font-weight: 600;
          font-size: 1.1rem;
        }
        .chain-arrow {
          color: #00eaff;
          font-weight: bold;
          margin-left: 1rem;
          font-size: 1.2rem;
        }
        @media (max-width: 480px) {
          .chain-selection-modal {
            width: 95vw;
            margin: 0.5rem;
          }
          .chain-option {
            padding: 1rem;
          }
          .chain-icon {
            width: 40px;
            height: 40px;
            font-size: 1.2rem;
          }
          .chain-name {
            font-size: 1rem;
          }
          .chain-desc {
            font-size: 0.8rem;
          }
        }
      `;
      document.head.appendChild(style);
    }

    const modal = document.createElement('div');
    modal.className = 'wallet-modal-overlay';
    
    modal.innerHTML = `
      <div class="chain-selection-modal">
        <div style="
          padding: 1.5rem;
          border-bottom: 1px solid rgba(0, 234, 255, 0.2);
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <h3 style="margin: 0; color: #00eaff; font-size: 1.3rem; font-weight: 600;">Select Network</h3>
          <button class="close-modal" style="
            background: none;
            border: none;
            color: #00eaff;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background-color 0.2s;
          ">×</button>
        </div>
        <div style="padding: 1.5rem;">
          <button class="chain-option" data-chain="base">
            <div class="chain-icon base-icon">🔵</div>
            <div class="chain-info">
              <span class="chain-name">BASE</span>
            </div>
            <div class="chain-arrow">→</div>
          </button>
          <button class="chain-option" data-chain="solana">
            <div class="chain-icon solana-icon">🟣</div>
            <div class="chain-info">
              <span class="chain-name">SOLANA</span>
            </div>
            <div class="chain-arrow">→</div>
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle chain selection
    modal.querySelectorAll('.chain-option').forEach(btn => {
      btn.addEventListener('click', async () => {
        const chain = btn.dataset.chain;
        document.body.removeChild(modal);
        
        try {
          // Set isConnecting to prevent other connections
          this.isConnecting = true;
          
          if (chain === 'base') {
            // Handle Base wallet connection with multi-wallet support directly
            if (window.multiWalletManager) {
              try {
                const connected = await window.multiWalletManager.showWalletSelection('ethereum', async (selectedWallet) => {
                  console.log(`🔵 Connecting to selected Base wallet: ${selectedWallet.name}`);
                  try {
                    return await this.connectToBaseProvider(selectedWallet.provider, selectedWallet.name);
                  } catch (error) {
                    console.error('🔵 Error in connectToBaseProvider:', error);
                    this.showStatus('Failed to connect Base wallet: ' + error.message, 'error');
                    return false;
                  }
                });
                callback(connected);
              } catch (error) {
                console.error('🔵 Multi-wallet manager error for Base:', error);
                // Fallback to direct connection if multi-wallet manager fails
                console.log('🔵 Falling back to direct Base connection...');
                const connected = await this.connectBaseWalletDirect();
                callback(connected);
              }
            } else {
              // Fallback to direct connection
              console.log('🔵 Multi-wallet manager not available, using direct connection...');
              const connected = await this.connectBaseWalletDirect();
              callback(connected);
            }
          } else if (chain === 'solana') {
            // Handle Solana wallet connection with multi-wallet support directly  
            if (window.multiWalletManager) {
              try {
                const connected = await window.multiWalletManager.showWalletSelection('solana', async (selectedWallet) => {
                  console.log(`🟣 Connecting to selected Solana wallet: ${selectedWallet.name}`);
                  try {
                    return await this.connectToSolanaProvider(selectedWallet.provider, selectedWallet.name);
                  } catch (error) {
                    console.error('🟣 Error in connectToSolanaProvider:', error);
                    this.showStatus('Failed to connect Solana wallet: ' + error.message, 'error');
                    return false;
                  }
                });
                callback(connected);
              } catch (error) {
                console.error('🟣 Multi-wallet manager error for Solana:', error);
                // Fallback to direct connection if multi-wallet manager fails
                console.log('🟣 Falling back to direct Solana connection...');
                const connected = await this.connectSolanaWalletDirect();
                callback(connected);
              }
            } else {
              // Fallback to direct connection
              console.log('🟣 Multi-wallet manager not available, using direct connection...');
              const connected = await this.connectSolanaWalletDirect();
              callback(connected);
            }
          }
        } catch (error) {
          console.error('Chain connection error:', error);
          callback(false);
        } finally {
          this.isConnecting = false;
        }
      });
    });
    
    // Handle close
    modal.querySelector('.close-modal').addEventListener('click', () => {
      document.body.removeChild(modal);
      callback(false);
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
        callback(false);
      }
    });
  }

  async connectWallet(chain = null) {
    console.log('🔍 connectWallet called with chain:', chain);
    
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      console.log('Connection already in progress, please wait...');
      return false;
    }

    try {
      this.isConnecting = true;
      
      // If no chain specified, show chain selection instead of auto-detecting
      if (!chain) {
        console.log('✅ No chain specified, showing chain selection modal');
        this.isConnecting = false; // Reset flag before showing modal
        return await this.connectWithChainSelection();
      }
      
      console.log('🔍 Chain specified:', chain);
      
      // Handle chain-specific connections
      if (chain === 'solana') {
        console.log('🟣 Connecting to Solana...');
        return await this.connectSolanaWallet();
      }
      
      // For Base/EVM chains
      if (chain === 'base') {
        console.log('🔵 Connecting to Base...');
        return await this.connectBaseWallet();
      }

      // If we get here, something went wrong
      console.log('❌ Unknown chain specified:', chain);
      return false;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      this.showStatus('Failed to connect wallet: ' + error.message, 'error');
      return false;
    } finally {
      this.isConnecting = false;
    }
  }

  async disconnectWallet() {
    try {
      // Properly disconnect from Solana wallets
      if (this.currentChain === 'solana' && this.provider) {
        try {
          if (this.provider.disconnect && typeof this.provider.disconnect === 'function') {
            await this.provider.disconnect();
          }
        } catch (solanaError) {
          console.log('Solana wallet disconnect method not available or failed:', solanaError);
        }
      }
      
      // Clear wallet state
      this.account = null;
      this.isConnected = false;
      this.signer = null;
      this.provider = null;
      this.currentChain = null;
      
      // Clear localStorage
      localStorage.removeItem('wildwest_wallet_connected');
      
      // Update UI
      this.updateWalletUI();
      this.hideWalletDropdown();
      this.showStatus('Wallet disconnected', 'info');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  }

  // Alias for disconnectWallet for convenience
  async disconnect() {
    return this.disconnectWallet();
  }

  hideWalletDropdown() {
    const walletDropdownMenu = document.getElementById('walletDropdownMenu');
    if (walletDropdownMenu) {
      walletDropdownMenu.style.display = 'none';
    }
  }

  updateWalletUI() {
    const connectBtn = document.getElementById('connectWalletBtn');
    const walletBtnText = document.getElementById('walletBtnText');
    const chainIndicator = document.getElementById('chainIndicator');
    const chainName = document.getElementById('chainName');
    
    if (!connectBtn) return;

    if (this.isConnected && this.account) {
      const shortAddress = `${this.account.slice(0, 6)}...${this.account.slice(-4)}`;
      
      if (walletBtnText) {
        walletBtnText.textContent = shortAddress;
      } else {
        connectBtn.textContent = shortAddress;
      }
      
      // Remove all state classes first
      connectBtn.classList.remove('disconnected', 'evm', 'solana');
      connectBtn.classList.add('connected');
      
      // Add appropriate chain class for the indicator color and show chain name
      if (this.currentChain === 'solana') {
        connectBtn.classList.add('solana');
        if (chainIndicator) {
          chainIndicator.style.display = 'inline-block';
        }
        if (chainName) {
          chainName.textContent = 'SOLANA';
          chainName.style.display = 'block';
        }
      } else if (this.currentChain === 8453 || this.currentChain === 84532) {
        connectBtn.classList.add('evm');
        if (chainIndicator) {
          chainIndicator.style.display = 'inline-block';
        }
        if (chainName) {
          chainName.textContent = 'BASE';
          chainName.style.display = 'block';
        }
      } else {
        connectBtn.classList.add('evm');
        if (chainIndicator) {
          chainIndicator.style.display = 'inline-block';
        }
        if (chainName) {
          const chainNameText = this.getChainName(this.currentChain);
          chainName.textContent = chainNameText.toUpperCase();
          chainName.style.display = 'block';
        }
      }
    } else {
      if (walletBtnText) {
        walletBtnText.textContent = 'Connect Wallet';
      } else {
        connectBtn.textContent = 'CONNECT WALLET';
      }
      
      // Remove all state classes and add disconnected
      connectBtn.classList.remove('connected', 'evm', 'solana');
      connectBtn.classList.add('disconnected');
      
      if (chainIndicator) {
        chainIndicator.style.display = 'none';
      }
      if (chainName) {
        chainName.style.display = 'none';
      }
    }
  }

  getChainName(chainId) {
    const chains = {
      1: 'Ethereum',
      8453: 'Base',
      84532: 'Base Sepolia',
      137: 'Polygon'
    };
    return chains[chainId] || chainId === 'solana' ? 'Solana' : `Chain ${chainId}`;
  }

  setupEventHandlers() {
    // Check if another script is handling the wallet button
    if (window.TOKEN_FURNACE_HANDLES_WALLET_BUTTON) {
      console.log('Token furnace is handling wallet button, skipping wallet.js button setup');
      return;
    }
    if (window.BASE_LOCKING_HANDLES_WALLET_BUTTON) {
      console.log('Base locking page is handling wallet button, skipping wallet.js button setup');
      return;
    }
    if (window.SOLANA_LOCKING_HANDLES_WALLET_BUTTON) {
      console.log('Solana locking page is handling wallet button, skipping wallet.js button setup');
      return;
    }
    if (window.BANNER_ADMIN_HANDLES_WALLET_BUTTON) {
      console.log('Banner admin page is handling wallet button, skipping wallet.js button setup');
      return;
    }
    
    const connectBtn = document.getElementById('connectWalletBtn');
    
    if (connectBtn) {
      // Remove any existing listeners to prevent duplicates
      connectBtn.replaceWith(connectBtn.cloneNode(true));
      const newConnectBtn = document.getElementById('connectWalletBtn');
      
      newConnectBtn.addEventListener('click', async () => {
        if (this.isConnected) {
          // Show dropdown menu instead of immediately disconnecting
          const walletDropdownMenu = document.getElementById('walletDropdownMenu');
          if (walletDropdownMenu) {
            const isVisible = walletDropdownMenu.style.display === 'block';
            walletDropdownMenu.style.display = isVisible ? 'none' : 'block';
          } else {
            // Fallback: disconnect if no dropdown available
            await this.disconnectWallet();
          }
        } else {
          if (!this.isConnecting) {
            await this.connectWallet();
          }
        }
      });
      
      // Setup disconnect button in dropdown
      const disconnectBtn = document.getElementById('disconnectBtn');
      if (disconnectBtn) {
        disconnectBtn.addEventListener('click', async () => {
          await this.disconnectWallet();
        });
      }
      
      // Hide dropdown when clicking outside
      document.addEventListener('click', (e) => {
        const walletDropdownMenu = document.getElementById('walletDropdownMenu');
        const connectBtn = document.getElementById('connectWalletBtn');
        
        if (walletDropdownMenu && connectBtn && 
            !connectBtn.contains(e.target) && 
            !walletDropdownMenu.contains(e.target)) {
          walletDropdownMenu.style.display = 'none';
        }
      });
    }

    // Listen for account changes (only set up once)
    if (typeof window.ethereum !== 'undefined' && !this.listenersSetup) {
      this.listenersSetup = true;
      
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          this.disconnectWallet();
        } else if (accounts[0] !== this.account) {
          this.account = accounts[0];
          this.updateWalletUI();
        }
      });

      window.ethereum.on('chainChanged', (chainId) => {
        const numericChainId = parseInt(chainId, 16);
        this.currentChain = numericChainId === 8453 ? 'base' : numericChainId; // Map Base chainId to 'base'
        console.log('🔗 Chain changed to:', chainId, '→', this.currentChain);
        this.updateWalletUI();
        window.location.reload();
      });
    }
  }

  showStatus(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Simple status display
    const statusDiv = document.createElement('div');
    statusDiv.textContent = message;
    statusDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem;
      border-radius: 8px;
      z-index: 9999;
      font-weight: bold;
      max-width: 300px;
      ${type === 'success' ? 'background: #0f5132; color: #d1e7dd;' : ''}
      ${type === 'error' ? 'background: #842029; color: #f8d7da;' : ''}
      ${type === 'info' ? 'background: #055160; color: #cff4fc;' : ''}
    `;
    
    document.body.appendChild(statusDiv);
    
    setTimeout(() => {
      if (statusDiv.parentNode) {
        document.body.removeChild(statusDiv);
      }
    }, 3000);
  }

  // Utility methods for dApp integration
  async getBalance() {
    if (!this.isConnected || !this.account || !this.provider) return '0';
    
    try {
      const balance = await this.provider.getBalance(this.account);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0';
    }
  }

  async sendTransaction(to, value, data = '0x') {
    if (!this.isConnected || !this.signer) {
      throw new Error('Wallet not connected');
    }
    
    try {
      const tx = await this.signer.sendTransaction({
        to,
        value: ethers.utils.parseEther(value.toString()),
        data
      });
      
      return tx;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }
}

// Initialize wallet when DOM is loaded
let wildWestWallet;

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded - initializing wallet system');
  wildWestWallet = new WildWestWallet();
  // Make it globally available
  window.wildWestWallet = wildWestWallet;
  
  // Clear any pending connection states that might interfere
  if (wildWestWallet) {
    wildWestWallet.isConnecting = false;
    console.log('🔄 Cleared any pending connection states');
  }
  
  console.log('wildWestWallet initialized and made globally available');
});

// Also make it available immediately if DOM is already loaded
if (document.readyState === 'loading') {
  // DOM is still loading, wait for DOMContentLoaded
} else {
  // DOM is already loaded
  console.log('DOM already loaded - initializing wallet system immediately');
  wildWestWallet = new WildWestWallet();
  window.wildWestWallet = wildWestWallet;
  
  // Clear any pending connection states that might interfere
  if (wildWestWallet) {
    wildWestWallet.isConnecting = false;
    console.log('🔄 Cleared any pending connection states');
  }
  
  console.log('wildWestWallet initialized and made globally available');
}

// Export for use in other files
window.WildWestWallet = WildWestWallet;

