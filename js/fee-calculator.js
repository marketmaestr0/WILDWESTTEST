// Fee calculation utilities for lock creation
// NOW FREE - $0 USD equivalent (was $30 USD)

class LockingFeeCalculator {
  constructor() {
    // Use config if available, otherwise defaults
    const config = window.LOCK_FEE_CONFIG || {};
    this.USD_FEE_AMOUNT = config.USD_FEE_AMOUNT || 0; // $0 USD - FREE!
    this.FALLBACK_ETH_PRICE = config.FALLBACK_ETH_PRICE || 3000; // Fallback if API fails
    this.FALLBACK_SOL_PRICE = config.FALLBACK_SOL_PRICE || 100; // Fallback if API fails
    this.priceCache = {};
    this.cacheTimeout = config.PRICE_CACHE_TIMEOUT || (5 * 60 * 1000); // 5 minutes
  }

  // Check if service is free (fee amount is 0)
  isFreeService() {
    return this.USD_FEE_AMOUNT === 0;
  }

  // Get current ETH price in USD
  async getETHPrice() {
    const cacheKey = 'eth_price';
    const now = Date.now();

    // Check cache first
    if (this.priceCache[cacheKey] && (now - this.priceCache[cacheKey].timestamp) < this.cacheTimeout) {
      return this.priceCache[cacheKey].price;
    }

    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      const data = await response.json();
      const price = data.ethereum.usd;
      
      // Cache the result
      this.priceCache[cacheKey] = {
        price: price,
        timestamp: now
      };

      return price;
    } catch (error) {
      console.warn('Failed to fetch ETH price, using fallback:', error);
      return this.FALLBACK_ETH_PRICE;
    }
  }

  // Get current SOL price in USD
  async getSOLPrice() {
    const cacheKey = 'sol_price';
    const now = Date.now();

    // Check cache first
    if (this.priceCache[cacheKey] && (now - this.priceCache[cacheKey].timestamp) < this.cacheTimeout) {
      return this.priceCache[cacheKey].price;
    }

    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
      const data = await response.json();
      const price = data.solana.usd;
      
      // Cache the result
      this.priceCache[cacheKey] = {
        price: price,
        timestamp: now
      };

      return price;
    } catch (error) {
      console.warn('Failed to fetch SOL price, using fallback:', error);
      return this.FALLBACK_SOL_PRICE;
    }
  }

  // Calculate ETH amount for fee (now $0 USD = 0 ETH)
  async getETHFeeAmount() {
    if (this.isFreeService()) {
      return ethers.utils.parseEther("0");
    }
    const ethPrice = await this.getETHPrice();
    const ethAmount = this.USD_FEE_AMOUNT / ethPrice;
    return ethers.utils.parseEther(ethAmount.toString());
  }

  // Calculate SOL amount for fee (now $0 USD = 0 SOL)
  async getSOLFeeAmount() {
    if (this.isFreeService()) {
      return 0; // 0 lamports
    }
    const solPrice = await this.getSOLPrice();
    const solAmount = this.USD_FEE_AMOUNT / solPrice;
    return Math.floor(solAmount * 1000000000); // Convert to lamports
  }

  // Check if address is exempt from fees (now everyone is exempt since it's free)
  isExemptFromFees(address, chain) {
    // If service is free, everyone is effectively exempt
    if (this.isFreeService()) {
      return true;
    }
    
    const config = window.LOCK_FEE_CONFIG;
    if (!config || !config.EXEMPT_ADDRESSES) return false;
    
    const exemptList = chain === 'base' ? config.EXEMPT_ADDRESSES.BASE : config.EXEMPT_ADDRESSES.SOLANA;
    if (!exemptList) return false;
    
    // Case-insensitive comparison for addresses
    return exemptList.some(exemptAddr => 
      exemptAddr.toLowerCase() === address.toLowerCase()
    );
  }

  // Format fee amount for display
  async getFormattedETHFee() {
    if (this.isFreeService()) {
      return 'FREE - No fees required!';
    }
    const ethPrice = await this.getETHPrice();
    const ethAmount = this.USD_FEE_AMOUNT / ethPrice;
    return `${ethAmount.toFixed(6)} ETH (~$${this.USD_FEE_AMOUNT})`;
  }

  async getFormattedSOLFee() {
    if (this.isFreeService()) {
      return 'FREE - No fees required!';
    }
    const solPrice = await this.getSOLPrice();
    const solAmount = this.USD_FEE_AMOUNT / solPrice;
    return `${solAmount.toFixed(4)} SOL (~$${this.USD_FEE_AMOUNT})`;
  }
}

// Global instance
window.lockingFeeCalculator = new LockingFeeCalculator();
