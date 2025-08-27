// Configuration for lock creation fees and addresses
// Update these addresses with your actual fee collector addresses

const LOCK_FEE_CONFIG = {
  // Fee amount in USD - SET TO 0 FOR FREE TOKEN LOCKING
  USD_FEE_AMOUNT: 0,
  
  // Base (Ethereum) fee collector address
  BASE_FEE_COLLECTOR: "0x9360c80CA79409b5e315A9791bB0208C02D6ae32",
  
  // Solana fee collector address  
  SOLANA_FEE_COLLECTOR: "F9YqZs2nLqNPKGfTCjKb8AiVADivAEsWumHVWWFyPQgV",
  
  // Addresses exempt from paying fees (now redundant since all are free)
  EXEMPT_ADDRESSES: {
    BASE: ["0x9360c80CA79409b5e315A9791bB0208C02D6ae32"],
    SOLANA: ["F9YqZs2nLqNPKGfTCjKb8AiVADivAEsWumHVWWFyPQgV"]
  },
  
  // Fallback prices if API fails (not needed for free service but kept for compatibility)
  FALLBACK_ETH_PRICE: 3000,
  FALLBACK_SOL_PRICE: 100,
  
  // Cache timeout for price fetching (5 minutes)
  PRICE_CACHE_TIMEOUT: 5 * 60 * 1000
};

// Export for use in other files
if (typeof window !== 'undefined') {
  window.LOCK_FEE_CONFIG = LOCK_FEE_CONFIG;
}
