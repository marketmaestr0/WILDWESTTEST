// web3-integration.js
// Smart contract integration for Wild West Launchpad
// Connects frontend forms to deployed Solidity contracts

class LaunchpadWeb3 {
  constructor() {
    this.config = null;
    this.contracts = {};
    this.wallet = null;
    this.isInitialized = false;
    this.ethPriceCache = {
      price: 3000, // Default fallback price
      timestamp: 0,
      cacheTime: 5 * 60 * 1000 // 5 minutes
    };
    
    this.init();
  }

  // Fetch current ETH price in USD
  async fetchETHPrice() {
    try {
      // Check cache first
      const now = Date.now();
      if (now - this.ethPriceCache.timestamp < this.ethPriceCache.cacheTime) {
        console.log('📊 Using cached ETH price:', this.ethPriceCache.price);
        return this.ethPriceCache.price;
      }

      // Fetch from CoinGecko API (free, no API key required)
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      
      if (!response.ok) {
        throw new Error('Price API unavailable');
      }

      const data = await response.json();
      const ethPrice = data.ethereum.usd;

      // Update cache
      this.ethPriceCache = {
        price: ethPrice,
        timestamp: now,
        cacheTime: this.ethPriceCache.cacheTime
      };

      console.log('💰 Current ETH price: $' + ethPrice);
      return ethPrice;
    } catch (error) {
      console.warn('⚠️ Failed to fetch ETH price, using fallback:', error.message);
      return this.ethPriceCache.price; // Return cached or default price
    }
  }
  
  async init() {
    try {
      // Load configuration
      await this.loadConfig();
      
      // Wait for wallet
      await this.waitForWallet();
      
      // Initialize contracts when wallet connects
      if (this.wallet && this.wallet.isConnected) {
        await this.initializeContracts();
      }
      
      // Listen for wallet events
      this.setupWalletEvents();
      
      this.isInitialized = true;
      console.log('✅ LaunchpadWeb3 initialized');
    } catch (error) {
      console.error('❌ LaunchpadWeb3 initialization failed:', error);
    }
  }
  
  async loadConfig() {
    try {
      // Try to load testnet config first
      const response = await fetch('./testnet-config.json');
      if (response.ok) {
        this.config = await response.json();
        console.log('📋 Loaded testnet configuration:', this.config);
      } else {
        // Fallback to hardcoded testnet config
        this.config = {
          network: "baseSepolia",
          chainId: 84532,
          contracts: {
            launchpad: "0x0000000000000000000000000000000000000000", // Will be updated after deployment
            feeCollector: "0x0000000000000000000000000000000000000000",
            priceOracle: "0x0000000000000000000000000000000000000000"
          },
          uniswapRouter: "0xD4cbD7c5a6B2b4C7D6Ba8237E30C459e8A2C2c8c",
          weth: "0x4200000000000000000000000000000000000006",
          baseScanUrl: "https://sepolia.basescan.org"
        };
        console.log('📋 Using default testnet configuration');
      }
    } catch (error) {
      console.error('❌ Failed to load configuration:', error);
      throw error;
    }
  }
  
  async waitForWallet() {
    return new Promise((resolve) => {
      const checkWallet = () => {
        if (window.wildWestWallet) {
          this.wallet = window.wildWestWallet;
          resolve();
        } else {
          setTimeout(checkWallet, 100);
        }
      };
      checkWallet();
    });
  }
  
  setupWalletEvents() {
    if (this.wallet && this.wallet.eventEmitter) {
      this.wallet.eventEmitter.on('connected', async () => {
        await this.initializeContracts();
      });
      
      this.wallet.eventEmitter.on('chainChanged', async (chainId) => {
        if (chainId === this.config.chainId) {
          await this.initializeContracts();
        } else {
          this.contracts = {};
          console.log('⚠️ Wrong network. Please switch to Base Sepolia');
        }
      });
      
      this.wallet.eventEmitter.on('disconnected', () => {
        this.contracts = {};
      });
    }
  }
  
  async initializeContracts() {
    if (!this.wallet || !this.wallet.isConnected || !this.wallet.signer) {
      throw new Error('Wallet not connected');
    }
    
    if (this.wallet.currentChain !== this.config.chainId) {
      throw new Error(`Please switch to ${this.config.network} (Chain ID: ${this.config.chainId})`);
    }
    
    try {
      // Initialize contract instances
      this.contracts.launchpad = new ethers.Contract(
        this.config.contracts.launchpad,
        this.getLaunchpadABI(),
        this.wallet.signer
      );
      
      this.contracts.feeCollector = new ethers.Contract(
        this.config.contracts.feeCollector,
        this.getFeeCollectorABI(),
        this.wallet.signer
      );
      
      console.log('✅ Contracts initialized:', Object.keys(this.contracts));
    } catch (error) {
      console.error('❌ Contract initialization failed:', error);
      throw error;
    }
  }
  
  // Main function to create a token launch
  async createTokenLaunch(formData) {
    if (!this.contracts.launchpad) {
      throw new Error('Contracts not initialized. Please connect wallet and switch to Base Sepolia.');
    }
    
    try {
      console.log('🚀 Creating token launch with data:', formData);
      
      // Validate form data
      this.validateLaunchData(formData);
      
      // Convert form data to contract parameters
      const launchParams = this.formatLaunchParams(formData);
      
      // Estimate gas
      const gasEstimate = await this.contracts.launchpad.estimateGas.createToken(
        launchParams.name,
        launchParams.symbol,
        launchParams.description,
        launchParams.imageUri,
        launchParams.socialLinks,
        { value: launchParams.creationFee }
      );
      
      console.log('⛽ Estimated gas:', gasEstimate.toString());
      
      // Execute transaction
      const tx = await this.contracts.launchpad.createToken(
        launchParams.name,
        launchParams.symbol,
        launchParams.description,
        launchParams.imageUri,
        launchParams.socialLinks,
        {
          value: launchParams.creationFee,
          gasLimit: gasEstimate.mul(120).div(100) // Add 20% buffer
        }
      );
      
      console.log('📝 Transaction submitted:', tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt.transactionHash);
      
      // Extract token address from logs
      const tokenAddress = this.extractTokenAddressFromLogs(receipt.logs);
      
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        tokenAddress: tokenAddress,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
      
    } catch (error) {
      console.error('❌ Token launch failed:', error);
      throw this.formatError(error);
    }
  }
  
  validateLaunchData(data) {
    const required = ['name', 'symbol', 'description'];
    const missing = required.filter(field => !data[field] || data[field].trim() === '');
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    
    if (data.symbol.length > 10) {
      throw new Error('Token symbol must be 10 characters or less');
    }
    
    if (data.name.length > 50) {
      throw new Error('Token name must be 50 characters or less');
    }
  }
  
  formatLaunchParams(formData) {
    return {
      name: formData.name.trim(),
      symbol: formData.symbol.trim().toUpperCase(),
      description: formData.description.trim(),
      imageUri: formData.imageUri || '', // Optional
      socialLinks: this.formatSocialLinks(formData),
      creationFee: this.getCreationFee() // Static creation fee
    };
  }

  // Async version for dynamic pricing
  async formatLaunchParamsDynamic(formData) {
    return {
      name: formData.name.trim(),
      symbol: formData.symbol.trim().toUpperCase(),
      description: formData.description.trim(),
      imageUri: formData.imageUri || '', // Optional
      socialLinks: this.formatSocialLinks(formData),
      creationFee: await this.getCreationFeeDynamic() // Dynamic creation fee
    };
  }

  // Get fee display info for UI
  async getCreationFeeDisplay() {
    try {
      if (this.config.network.toLowerCase().includes('testnet') || 
          this.config.network.toLowerCase().includes('sepolia') ||
          this.config.network.toLowerCase().includes('goerli')) {
        return {
          ethAmount: '0.001',
          usdEquivalent: '~$3.00',
          network: 'testnet'
        };
      }

      const ethPrice = await this.fetchETHPrice();
      const usdAmount = 10;
      const ethAmount = usdAmount / ethPrice;
      
      return {
        ethAmount: ethAmount.toFixed(6),
        usdEquivalent: `$${usdAmount.toFixed(2)}`,
        network: 'mainnet',
        ethPrice: ethPrice
      };
    } catch (error) {
      return {
        ethAmount: '0.0033',
        usdEquivalent: '~$10.00',
        network: 'mainnet',
        error: 'Price unavailable'
      };
    }
  }

  getCreationFee() {
    // For testnet, use a smaller fixed amount
    if (this.config.network.toLowerCase().includes('testnet') || 
        this.config.network.toLowerCase().includes('sepolia') ||
        this.config.network.toLowerCase().includes('goerli')) {
      return ethers.utils.parseEther('0.001'); // Testnet: ~$3 equivalent
    } else {
      // For mainnet, use static $10 equivalent (you can make this dynamic)
      return ethers.utils.parseEther('0.0033'); // Mainnet: ~$10 equivalent (assuming ETH = $3000)
    }
  }

  // Dynamic version that fetches real ETH price
  async getCreationFeeDynamic() {
    try {
      // For testnet, use smaller fixed amount
      if (this.config.network.toLowerCase().includes('testnet') || 
          this.config.network.toLowerCase().includes('sepolia') ||
          this.config.network.toLowerCase().includes('goerli')) {
        return ethers.utils.parseEther('0.001'); // Testnet: ~$3 equivalent
      }

      // Fetch current ETH price
      const ethPrice = await this.fetchETHPrice();
      
      // Calculate ETH amount for $10 USD
      const usdAmount = 10; // $10 USD
      const ethAmount = usdAmount / ethPrice;
      
      console.log(`💵 Creation fee: $${usdAmount} = ${ethAmount.toFixed(6)} ETH (ETH price: $${ethPrice})`);
      
      return ethers.utils.parseEther(ethAmount.toString());
    } catch (error) {
      console.warn('⚠️ Failed to calculate dynamic fee, using fallback');
      return this.getCreationFee(); // Fallback to static pricing
    }
  }
  
  formatSocialLinks(formData) {
    const links = [];
    if (formData.website) links.push(`website:${formData.website}`);
    if (formData.twitter) links.push(`twitter:${formData.twitter}`);
    if (formData.telegram) links.push(`telegram:${formData.telegram}`);
    if (formData.discord) links.push(`discord:${formData.discord}`);
    return links.join(',');
  }
  
  extractTokenAddressFromLogs(logs) {
    // Look for TokenCreated event
    for (const log of logs) {
      try {
        const decoded = this.contracts.launchpad.interface.parseLog(log);
        if (decoded.name === 'TokenCreated') {
          return decoded.args.token;
        }
      } catch (e) {
        // Skip non-matching logs
      }
    }
    return null;
  }
  
  formatError(error) {
    if (error.reason) {
      return new Error(error.reason);
    }
    
    if (error.message.includes('user rejected')) {
      return new Error('Transaction was cancelled by user');
    }
    
    if (error.message.includes('insufficient funds')) {
      return new Error('Insufficient ETH balance for transaction');
    }
    
    if (error.code === 'NETWORK_ERROR') {
      return new Error('Network error. Please check your connection.');
    }
    
    return error;
  }
  
  // Get current ETH price in USD
  async getEthPrice() {
    if (!this.contracts.launchpad) {
      throw new Error('Contracts not initialized');
    }
    
    try {
      const priceWithDecimals = await this.contracts.launchpad.getCurrentEthPriceView();
      return parseFloat(ethers.utils.formatUnits(priceWithDecimals, 8));
    } catch (error) {
      console.error('Failed to get ETH price:', error);
      return 2000; // Fallback price
    }
  }
  
  // Get token information
  async getTokenInfo(tokenAddress) {
    if (!this.wallet || !this.wallet.provider) {
      throw new Error('Wallet not connected');
    }
    
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        this.getERC20ABI(),
        this.wallet.provider
      );
      
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
        tokenContract.totalSupply()
      ]);
      
      return {
        name,
        symbol,
        decimals,
        totalSupply: ethers.utils.formatUnits(totalSupply, decimals),
        address: tokenAddress
      };
    } catch (error) {
      console.error('Failed to get token info:', error);
      throw error;
    }
  }
  
  // Contract ABIs (simplified for core functions)
  getLaunchpadABI() {
    return [
      "function createToken(string memory name, string memory symbol, string memory description, string memory imageUri, string memory socialLinks) external payable returns (address)",
      "function tokens(address) external view returns (address token, address creator, uint256 ethRaised, uint256 tokensSold, bool graduated, bool isPublic, uint256 liquidityLocked, address feeCollector)",
      "function buyTokens(address tokenAddress) external payable",
      "function getCurrentEthPriceView() external view returns (uint256)",
      "event TokenCreated(address indexed token, address indexed creator, string name, string symbol)"
    ];
  }
  
  getFeeCollectorABI() {
    return [
      "function getClaimableETH(address user) external view returns (uint256)",
      "function claimETH() external",
      "function getEstimatedFees() external view returns (uint256 token0Fees, uint256 token1Fees, uint256 estimatedETH)"
    ];
  }
  
  getERC20ABI() {
    return [
      "function name() external view returns (string)",
      "function symbol() external view returns (string)",
      "function decimals() external view returns (uint8)",
      "function totalSupply() external view returns (uint256)",
      "function balanceOf(address account) external view returns (uint256)"
    ];
  }
}

// Initialize global instance
window.launchpadWeb3 = new LaunchpadWeb3();
