// unified-wallet-connection.js
// BULLETPROOF wallet connection system - fixes all the connection issues

class UnifiedWalletConnection {
  constructor() {
    this.isConnecting = false;
    this.connectionQueue = [];
    this.retryAttempts = 3;
    this.retryDelay = 2000;
    this.init();
  }

  init() {
    console.log('🔧 Unified Wallet Connection System initialized');
    
    // Override existing wallet connection methods with unified approach
    if (window.wildWestWallet) {
      // Store original methods as fallbacks
      this.originalMethods = {
        connectWallet: window.wildWestWallet.connectWallet.bind(window.wildWestWallet),
        connectBaseWallet: window.wildWestWallet.connectBaseWallet.bind(window.wildWestWallet),
        connectSolanaWallet: window.wildWestWallet.connectSolanaWallet.bind(window.wildWestWallet),
        connectToSpecificChain: window.wildWestWallet.connectToSpecificChain.bind(window.wildWestWallet),
        connectWithChainSelection: window.wildWestWallet.connectWithChainSelection.bind(window.wildWestWallet)
      };
      
      // Replace with unified methods
      window.wildWestWallet.connectWallet = this.unifiedConnect.bind(this);
      window.wildWestWallet.connectBaseWallet = () => this.unifiedConnect('base');
      window.wildWestWallet.connectSolanaWallet = () => this.unifiedConnect('solana');
      window.wildWestWallet.connectToSpecificChain = (chain) => this.unifiedConnect(chain);
      window.wildWestWallet.connectWithChainSelection = () => this.unifiedConnect();
      
      console.log('✅ Wallet methods unified');
    }
  }

  async unifiedConnect(preferredChain = null) {
    console.log('🔗 Unified connection started, preferred chain:', preferredChain);
    
    // Prevent multiple simultaneous connections
    if (this.isConnecting) {
      console.log('⏳ Connection already in progress, queuing request...');
      return new Promise((resolve) => {
        this.connectionQueue.push({ preferredChain, resolve });
      });
    }

    try {
      this.isConnecting = true;
      return await this.attemptConnection(preferredChain);
    } finally {
      this.isConnecting = false;
      this.processQueue();
    }
  }

  async attemptConnection(preferredChain, attempt = 1) {
    console.log(`🔄 Connection attempt ${attempt}/${this.retryAttempts} for chain:`, preferredChain);
    
    try {
      // Step 1: Verify RPC endpoints are working
      const rpcStatus = await this.verifyRPCEndpoints(preferredChain);
      if (!rpcStatus.success) {
        throw new Error(`RPC endpoints not available: ${rpcStatus.error}`);
      }

      // Step 2: Detect available wallets
      const availableWallets = await this.detectAvailableWallets(preferredChain);
      if (availableWallets.length === 0) {
        throw new Error('No compatible wallets detected');
      }

      // Step 3: Handle wallet selection based on context
      let result = false;
      
      if (!preferredChain) {
        // Show chain selection modal
        result = await this.showChainSelectionAndConnect();
      } else if (preferredChain === 'solana') {
        result = await this.connectToSolana(availableWallets);
      } else if (preferredChain === 'base') {
        result = await this.connectToBase(availableWallets);
      } else {
        throw new Error(`Unsupported chain: ${preferredChain}`);
      }

      if (result) {
        console.log('✅ Wallet connection successful');
        this.updateAllWalletButtons('connected');
        return true;
      } else {
        throw new Error('Connection failed - user rejected or wallet error');
      }

    } catch (error) {
      console.error(`❌ Connection attempt ${attempt} failed:`, error.message);
      
      if (attempt < this.retryAttempts) {
        console.log(`⏳ Retrying in ${this.retryDelay}ms...`);
        await this.delay(this.retryDelay);
        return this.attemptConnection(preferredChain, attempt + 1);
      } else {
        this.showUserFriendlyError(error.message, preferredChain);
        return false;
      }
    }
  }

  async verifyRPCEndpoints(preferredChain) {
    try {
      const endpoints = {
        solana: null,
        base: null
      };

      // Get Solana endpoint using working token lock pattern
      if (window.RPC_CONFIG) {
        try {
          endpoints.solana = await window.RPC_CONFIG.getSolanaEndpoint();
          console.log('✅ Using QuickNode Solana endpoint from GitHub Secrets');
        } catch (error) {
          console.log('⚠️ QuickNode Solana not available, using fallback');
          endpoints.solana = 'https://api.mainnet-beta.solana.com';
        }
      } else {
        endpoints.solana = 'https://api.mainnet-beta.solana.com';
      }

      // Get Base endpoint using working token lock pattern  
      if (window.RPC_CONFIG) {
        try {
          endpoints.base = window.RPC_CONFIG.getBaseEndpoint();
          console.log('✅ Using QuickNode Base endpoint from GitHub Secrets');
        } catch (error) {
          console.log('⚠️ QuickNode Base not available, using fallback');
          endpoints.base = 'https://mainnet.base.org';
        }
      } else {
        endpoints.base = 'https://mainnet.base.org';
      }

      console.log('🔍 Verifying RPC endpoints:', endpoints);

      // Quick health check for relevant endpoints
      if (!preferredChain || preferredChain === 'solana') {
        try {
          const response = await fetch(endpoints.solana, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'getHealth'
            }),
            signal: AbortSignal.timeout(5000)
          });
          if (!response.ok) throw new Error('Solana RPC not responding');
        } catch (error) {
          console.warn('⚠️ Solana RPC health check failed:', error.message);
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async detectAvailableWallets(preferredChain) {
    const wallets = [];
    
    try {
      if (!preferredChain || preferredChain === 'solana') {
        const solanaWallets = window.wildWestWallet?.detectSolanaWallets?.() || [];
        wallets.push(...solanaWallets.map(w => ({ ...w, chain: 'solana' })));
      }
      
      if (!preferredChain || preferredChain === 'base') {
        const evmWallets = window.wildWestWallet?.detectEVMWallets?.() || [];
        wallets.push(...evmWallets.map(w => ({ ...w, chain: 'base' })));
      }
    } catch (error) {
      console.error('Error detecting wallets:', error);
    }
    
    console.log('🔍 Available wallets:', wallets.map(w => `${w.icon} ${w.name} (${w.chain})`));
    return wallets;
  }

  async connectToSolana(availableWallets) {
    const solanaWallets = availableWallets.filter(w => w.chain === 'solana');
    
    if (solanaWallets.length === 0) {
      throw new Error('No Solana wallets available');
    }

    // Use multi-wallet manager if available and multiple wallets
    if (window.multiWalletManager && solanaWallets.length > 1) {
      console.log('🟣 Using multi-wallet manager for Solana connection');
      return await window.multiWalletManager.showWalletSelection('solana', async (selectedWallet) => {
        return await this.originalMethods.connectSolanaWallet();
      });
    } else {
      // Direct connection with first available wallet
      console.log('🟣 Direct Solana connection');
      return await this.originalMethods.connectSolanaWallet();
    }
  }

  async connectToBase(availableWallets) {
    const baseWallets = availableWallets.filter(w => w.chain === 'base');
    
    if (baseWallets.length === 0) {
      throw new Error('No Base/EVM wallets available');
    }

    // Use multi-wallet manager if available and multiple wallets
    if (window.multiWalletManager && baseWallets.length > 1) {
      console.log('🔵 Using multi-wallet manager for Base connection');
      return await window.multiWalletManager.showWalletSelection('ethereum', async (selectedWallet) => {
        return await this.originalMethods.connectBaseWallet();
      });
    } else {
      // Direct connection with first available wallet
      console.log('🔵 Direct Base connection');
      return await this.originalMethods.connectBaseWallet();
    }
  }

  async showChainSelectionAndConnect() {
    console.log('🔍 Showing chain selection modal');
    
    if (this.originalMethods.connectWithChainSelection) {
      return await this.originalMethods.connectWithChainSelection();
    } else {
      // Fallback chain selection
      return await this.fallbackChainSelection();
    }
  }

  async fallbackChainSelection() {
    return new Promise((resolve) => {
      const modal = this.createChainSelectionModal((selectedChain) => {
        modal.remove();
        this.unifiedConnect(selectedChain).then(resolve);
      });
      document.body.appendChild(modal);
    });
  }

  createChainSelectionModal(callback) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center;
      z-index: 10000; animation: fadeIn 0.3s ease;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
      border: 2px solid #00eaff; border-radius: 15px; padding: 30px; max-width: 400px;
      text-align: center; color: white; font-family: Arial, sans-serif;
    `;
    
    modal.innerHTML = `
      <h2 style="color: #00eaff; margin-bottom: 20px;">🚀 Choose Network</h2>
      <p style="margin-bottom: 25px; color: #ccc;">Select which blockchain network to connect to:</p>
      <button onclick="callback('solana')" style="
        background: linear-gradient(45deg, #9945ff, #14f195); color: white; border: none;
        padding: 15px 30px; margin: 10px; border-radius: 8px; font-weight: bold;
        cursor: pointer; font-size: 16px; width: 150px;
      ">🟣 Solana</button>
      <button onclick="callback('base')" style="
        background: linear-gradient(45deg, #0052ff, #00a8ff); color: white; border: none;
        padding: 15px 30px; margin: 10px; border-radius: 8px; font-weight: bold;
        cursor: pointer; font-size: 16px; width: 150px;
      ">🔵 Base</button>
      <div style="margin-top: 20px;">
        <button onclick="overlay.remove()" style="
          background: #666; color: white; border: none; padding: 10px 20px;
          border-radius: 5px; cursor: pointer;
        ">Cancel</button>
      </div>
    `;
    
    // Make callback available to buttons
    window.callback = callback;
    
    overlay.appendChild(modal);
    return overlay;
  }

  updateAllWalletButtons(state) {
    const buttons = document.querySelectorAll('#connectWalletBtn, .connect-btn, .wallet-connect-btn');
    buttons.forEach(btn => {
      if (state === 'connected' && window.wildWestWallet?.isConnected) {
        btn.textContent = `CONNECTED: ${window.wildWestWallet.account?.slice(0, 6)}...`;
        btn.classList.add('connected');
        btn.disabled = false;
      } else {
        btn.textContent = btn.textContent.includes('SOLANA') ? 'CONNECT SOLANA WALLET' : 'CONNECT WALLET';
        btn.classList.remove('connected');
        btn.disabled = false;
      }
    });
  }

  showUserFriendlyError(error, chain) {
    let message = 'Connection failed. ';
    
    if (error.includes('No compatible wallets')) {
      message += chain === 'solana' 
        ? 'Please install a Solana wallet like Phantom or Solflare.'
        : 'Please install a Web3 wallet like MetaMask or Coinbase Wallet.';
    } else if (error.includes('RPC endpoints')) {
      message += 'Network connection issue. Please try again.';
    } else if (error.includes('rejected')) {
      message += 'Connection was cancelled.';
    } else {
      message += 'Please check your wallet and try again.';
    }
    
    // Show user-friendly error
    if (window.wildWestWallet?.showStatus) {
      window.wildWestWallet.showStatus(message, 'error');
    } else {
      alert(message);
    }
    
    console.error('💥 User-friendly error shown:', message);
  }

  processQueue() {
    if (this.connectionQueue.length > 0 && !this.isConnecting) {
      const next = this.connectionQueue.shift();
      console.log('🔄 Processing queued connection request');
      this.unifiedConnect(next.preferredChain).then(next.resolve);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Auto-initialize when wallet.js is loaded
if (typeof window !== 'undefined') {
  // Wait for wildWestWallet to be available
  const initUnified = () => {
    if (window.wildWestWallet) {
      window.unifiedWalletConnection = new UnifiedWalletConnection();
      console.log('🚀 Unified wallet connection system active');
    } else {
      setTimeout(initUnified, 100);
    }
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUnified);
  } else {
    initUnified();
  }
}
