// multi-wallet-manager.js
// Universal multi-wallet detection and handling system
// Gracefully handles cases where users have multiple compatible wallets

class MultiWalletManager {
  constructor() {
    this.detectedWallets = {
      ethereum: [],
      solana: []
    };
    this.userPreferences = this.loadUserPreferences();
    this.init();
  }

  init() {
    // Check if wallet auto-connection is blocked
    if (window.WALLET_AUTO_CONNECTION_BLOCKED) {
      console.log('🚫 Multi-wallet manager initialization blocked');
      return;
    }
    
    // Scan for all available wallets on page load
    this.scanAllWallets();
    console.log('🔍 Multi-wallet manager initialized');
    console.log('📊 Detected wallets:', this.detectedWallets);
  }

  // Comprehensive wallet scanning
  scanAllWallets() {
    this.scanEthereumWallets();
    this.scanSolanaWallets();
  }

  // Enhanced Ethereum wallet detection with multi-wallet support
  scanEthereumWallets() {
    // Check if wallet auto-connection is blocked
    if (window.WALLET_AUTO_CONNECTION_BLOCKED) {
      console.log('🚫 Ethereum wallet scanning blocked');
      return;
    }
    
    const wallets = [];
    
    // Check if we have multiple providers injected
    if (window.ethereum?.providers && Array.isArray(window.ethereum.providers)) {
      console.log('🔍 Multiple Ethereum providers detected:', window.ethereum.providers.length);
      
      window.ethereum.providers.forEach((provider, index) => {
        const wallet = this.identifyEthereumProvider(provider, index);
        if (wallet) wallets.push(wallet);
      });
    } else if (window.ethereum) {
      // Single provider or main provider
      const wallet = this.identifyEthereumProvider(window.ethereum, 0);
      if (wallet) wallets.push(wallet);
    }

    // Check for specific wallet injections (some wallets inject their own objects)
    this.checkSpecificEthereumWallets(wallets);

    this.detectedWallets.ethereum = wallets;
    console.log('🦊 Ethereum wallets found:', wallets.map(w => `${w.icon} ${w.name}`));
  }

  // Enhanced Solana wallet detection with multi-wallet support
  scanSolanaWallets() {
    // Check if wallet auto-connection is blocked
    if (window.WALLET_AUTO_CONNECTION_BLOCKED) {
      console.log('🚫 Solana wallet scanning blocked');
      return;
    }
    
    const wallets = [];
    
    // Check for multiple Solana providers
    if (window.solana?.providers && Array.isArray(window.solana.providers)) {
      console.log('🔍 Multiple Solana providers detected:', window.solana.providers.length);
      
      window.solana.providers.forEach((provider, index) => {
        const wallet = this.identifySolanaProvider(provider, index);
        if (wallet) wallets.push(wallet);
      });
    } else if (window.solana) {
      // Single provider or main provider
      const wallet = this.identifySolanaProvider(window.solana, 0);
      if (wallet) wallets.push(wallet);
    }

    // Check for specific Solana wallet injections
    this.checkSpecificSolanaWallets(wallets);

    this.detectedWallets.solana = wallets;
    console.log('🟣 Solana wallets found:', wallets.map(w => `${w.icon} ${w.name}`));
  }

  // Identify Ethereum provider by properties
  identifyEthereumProvider(provider, index = 0) {
    if (!provider) return null;

    let wallet = {
      provider: provider,
      index: index,
      mobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    };

    // Identify specific wallet types
    if (provider.isMetaMask) {
      wallet.name = 'MetaMask';
      wallet.icon = '🦊';
      wallet.deeplink = 'metamask://dapp/' + window.location.hostname;
      wallet.priority = 1;
    } else if (provider.isCoinbaseWallet || provider.selectedProvider?.isCoinbaseWallet) {
      wallet.name = 'Coinbase Wallet';
      wallet.icon = '🔵';
      wallet.deeplink = 'cbwallet://dapp?url=' + encodeURIComponent(window.location.href);
      wallet.priority = 2;
    } else if (provider.isRainbow) {
      wallet.name = 'Rainbow Wallet';
      wallet.icon = '🌈';
      wallet.deeplink = 'rainbow://dapp/' + window.location.hostname;
      wallet.priority = 3;
    } else if (provider.isTrust) {
      wallet.name = 'Trust Wallet';
      wallet.icon = '🛡️';
      wallet.deeplink = 'trust://browser_tab_open?url=' + encodeURIComponent(window.location.href);
      wallet.priority = 4;
    } else if (provider.isBraveWallet) {
      wallet.name = 'Brave Wallet';
      wallet.icon = '🦁';
      wallet.priority = 5;
      wallet.mobile = false;
    } else {
      wallet.name = `Web3 Wallet ${index > 0 ? index + 1 : ''}`;
      wallet.icon = '🔗';
      wallet.priority = 10;
    }

    return wallet;
  }

  // Identify Solana provider by properties  
  identifySolanaProvider(provider, index = 0) {
    if (!provider) return null;

    let wallet = {
      provider: provider,
      index: index,
      mobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    };

    // Identify specific wallet types
    if (provider.isPhantom) {
      wallet.name = 'Phantom';
      wallet.icon = '👻';
      wallet.deeplink = 'phantom://browse/' + encodeURIComponent(window.location.href);
      wallet.priority = 1;
    } else if (provider.isSolflare) {
      wallet.name = 'Solflare';
      wallet.icon = '☀️';
      wallet.deeplink = 'solflare://browse/' + encodeURIComponent(window.location.href);
      wallet.priority = 2;
    } else if (provider.isBackpack) {
      wallet.name = 'Backpack';
      wallet.icon = '🎒';
      wallet.priority = 3;
    } else if (provider.isSlope || window.slope) {
      wallet.name = 'Slope';
      wallet.icon = '📈';
      wallet.priority = 4;
    } else if (provider.isMathWallet) {
      wallet.name = 'MathWallet';
      wallet.icon = '🧮';
      wallet.priority = 5;
    } else {
      wallet.name = `Solana Wallet ${index > 0 ? index + 1 : ''}`;
      wallet.icon = '🟣';
      wallet.priority = 10;
    }

    return wallet;
  }

  // Check for wallets that inject their own objects
  checkSpecificEthereumWallets(wallets) {
    // WalletConnect
    if (window.WalletConnect) {
      wallets.push({
        name: 'WalletConnect',
        icon: '🔗',
        provider: window.WalletConnect,
        priority: 6,
        mobile: true,
        walletconnect: true
      });
    }

    // Ledger Live
    if (window.ethereum?.isLedger) {
      if (!wallets.find(w => w.name.includes('Ledger'))) {
        wallets.push({
          name: 'Ledger Live',
          icon: '🔒',
          provider: window.ethereum,
          priority: 7,
          mobile: false
        });
      }
    }
  }

  // Check for wallets that inject their own objects
  checkSpecificSolanaWallets(wallets) {
    // Glow Wallet
    if (window.glow) {
      wallets.push({
        name: 'Glow',
        icon: '✨',
        provider: window.glow,
        priority: 6,
        mobile: true
      });
    }

    // Coin98
    if (window.coin98?.sol) {
      wallets.push({
        name: 'Coin98',
        icon: '🪙',
        provider: window.coin98.sol,
        priority: 7,
        mobile: true
      });
    }
  }

  // Get available wallets for a specific blockchain
  getWallets(blockchain) {
    const wallets = this.detectedWallets[blockchain] || [];
    
    // Sort by user preference, then by priority
    return wallets.sort((a, b) => {
      const aPreferred = this.userPreferences[blockchain] === a.name;
      const bPreferred = this.userPreferences[blockchain] === b.name;
      
      if (aPreferred && !bPreferred) return -1;
      if (!aPreferred && bPreferred) return 1;
      
      return (a.priority || 10) - (b.priority || 10);
    });
  }

  // Show wallet selection modal when multiple wallets are available
  async showWalletSelection(blockchain, onSelect) {
    const wallets = this.getWallets(blockchain);
    
    if (wallets.length === 0) {
      throw new Error(`No ${blockchain} wallets detected`);
    }
    
    if (wallets.length === 1) {
      // Only one wallet available, use it directly
      console.log(`🎯 Only one ${blockchain} wallet found: ${wallets[0].name}`);
      return await onSelect(wallets[0]);
    }

    // Multiple wallets - show selection UI
    console.log(`🔄 Multiple ${blockchain} wallets detected, showing selection...`);
    return this.createWalletSelectionModal(blockchain, wallets, onSelect);
  }

  // Create wallet selection modal
  createWalletSelectionModal(blockchain, wallets, onSelect) {
    return new Promise((resolve, reject) => {
      // Remove any existing wallet selection modal
      const existingModal = document.getElementById('multi-wallet-modal');
      if (existingModal) {
        existingModal.remove();
      }

      // Create modal HTML
      const modal = document.createElement('div');
      modal.id = 'multi-wallet-modal';
      modal.innerHTML = `
        <div class="multi-wallet-overlay">
          <div class="multi-wallet-content">
            <div class="multi-wallet-header">
              <h3>🔗 Select ${blockchain.toUpperCase()} Wallet</h3>
              <p>Multiple compatible wallets detected. Choose your preferred wallet:</p>
            </div>
            <div class="multi-wallet-list">
              ${wallets.map((wallet, index) => `
                <button class="multi-wallet-option" data-index="${index}">
                  <span class="wallet-icon">${wallet.icon}</span>
                  <span class="wallet-name">${wallet.name}</span>
                  ${this.userPreferences[blockchain] === wallet.name ? '<span class="preferred-badge">⭐ Preferred</span>' : ''}
                </button>
              `).join('')}
            </div>
            <div class="multi-wallet-footer">
              <label class="remember-choice">
                <input type="checkbox" id="remember-wallet-choice"> 
                Remember my choice for ${blockchain.toUpperCase()}
              </label>
              <button class="multi-wallet-cancel">Cancel</button>
            </div>
          </div>
        </div>
      `;

      // Add modal styles
      modal.innerHTML += `
        <style>
          .multi-wallet-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(4px);
          }
          
          .multi-wallet-content {
            background: linear-gradient(135deg, #1a0909 0%, #2d1010 100%);
            border: 2px solid #ffae00;
            border-radius: 16px;
            padding: 24px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 0 32px #ff1a1a66;
            color: #fffbe7;
            font-family: 'Orbitron', Arial, sans-serif;
          }
          
          .multi-wallet-header h3 {
            margin: 0 0 8px 0;
            font-size: 1.4em;
            text-align: center;
            color: #ffae00;
          }
          
          .multi-wallet-header p {
            margin: 0 0 20px 0;
            text-align: center;
            opacity: 0.9;
            font-size: 0.9em;
          }
          
          .multi-wallet-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 20px;
          }
          
          .multi-wallet-option {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            background: rgba(255, 174, 0, 0.1);
            border: 1px solid rgba(255, 174, 0, 0.3);
            border-radius: 8px;
            color: #fffbe7;
            cursor: pointer;
            transition: all 0.2s;
            font-family: inherit;
            font-size: 1em;
            width: 100%;
            text-align: left;
          }
          
          .multi-wallet-option:hover {
            background: rgba(255, 174, 0, 0.2);
            border-color: #ffae00;
            transform: translateY(-1px);
          }
          
          .wallet-icon {
            font-size: 1.5em;
          }
          
          .wallet-name {
            flex: 1;
            font-weight: 600;
          }
          
          .preferred-badge {
            font-size: 0.8em;
            color: #ffae00;
            font-weight: bold;
          }
          
          .multi-wallet-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
          }
          
          .remember-choice {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.9em;
            cursor: pointer;
          }
          
          .multi-wallet-cancel {
            padding: 8px 16px;
            background: rgba(255, 26, 26, 0.2);
            border: 1px solid rgba(255, 26, 26, 0.5);
            border-radius: 6px;
            color: #fffbe7;
            cursor: pointer;
            font-family: inherit;
            transition: all 0.2s;
          }
          
          .multi-wallet-cancel:hover {
            background: rgba(255, 26, 26, 0.3);
            border-color: #ff1a1a;
          }
        </style>
      `;

      document.body.appendChild(modal);

      // Add event listeners
      modal.querySelectorAll('.multi-wallet-option').forEach((button, index) => {
        button.addEventListener('click', async () => {
          const selectedWallet = wallets[index];
          const rememberChoice = document.getElementById('remember-wallet-choice').checked;
          
          if (rememberChoice) {
            this.saveUserPreference(blockchain, selectedWallet.name);
          }
          
          modal.remove();
          
          try {
            const result = await onSelect(selectedWallet);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      });

      modal.querySelector('.multi-wallet-cancel').addEventListener('click', () => {
        modal.remove();
        reject(new Error('User cancelled wallet selection'));
      });

      // Close on overlay click
      modal.querySelector('.multi-wallet-overlay').addEventListener('click', (e) => {
        if (e.target === modal.querySelector('.multi-wallet-overlay')) {
          modal.remove();
          reject(new Error('User cancelled wallet selection'));
        }
      });
    });
  }

  // Save user wallet preference
  saveUserPreference(blockchain, walletName) {
    this.userPreferences[blockchain] = walletName;
    localStorage.setItem('wild-west-wallet-preferences', JSON.stringify(this.userPreferences));
    console.log(`💾 Saved ${blockchain} wallet preference: ${walletName}`);
  }

  // Load user wallet preferences
  loadUserPreferences() {
    try {
      const saved = localStorage.getItem('wild-west-wallet-preferences');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.warn('Failed to load wallet preferences:', error);
      return {};
    }
  }

  // Clear user preferences
  clearPreferences() {
    this.userPreferences = {};
    localStorage.removeItem('wild-west-wallet-preferences');
    console.log('🗑️ Cleared wallet preferences');
  }

  // Get preferred wallet for blockchain
  getPreferredWallet(blockchain) {
    const wallets = this.getWallets(blockchain);
    const preferredName = this.userPreferences[blockchain];
    
    if (preferredName) {
      const preferred = wallets.find(w => w.name === preferredName);
      if (preferred) {
        console.log(`⭐ Using preferred ${blockchain} wallet: ${preferredName}`);
        return preferred;
      }
    }
    
    // Return highest priority wallet if no preference
    return wallets[0] || null;
  }

  // Check if multiple wallets are available
  hasMultipleWallets(blockchain) {
    return this.detectedWallets[blockchain].length > 1;
  }

  // Get wallet count
  getWalletCount(blockchain) {
    return this.detectedWallets[blockchain].length;
  }
}

// Global instance
window.multiWalletManager = new MultiWalletManager();

console.log('🔄 Multi-wallet manager loaded');
