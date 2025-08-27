// Enhanced RPC Endpoint Management
// Provides reliable, rate-limit aware endpoint rotation and fallback

(function() {
  'use strict';
  
  console.log('🌐 Enhanced RPC Endpoint Management Loading...');
  
  // Premium public RPC endpoints with better rate limits
  const ENHANCED_RPC_ENDPOINTS = {
    solana: [
      {
        url: "https://rpc.ankr.com/solana",
        name: "Ankr",
        rateLimit: "High",
        reliability: "Excellent",
        priority: 1
      },
      {
        url: "https://solana-mainnet.rpc.extrnode.com",
        name: "Extrnode", 
        rateLimit: "High",
        reliability: "Good",
        priority: 2
      },
      {
        url: "https://api.mainnet-beta.solana.com",
        name: "Official",
        rateLimit: "Low",
        reliability: "Excellent", 
        priority: 3
      },
      {
        url: "https://solana.public-rpc.com",
        name: "Public RPC",
        rateLimit: "Medium",
        reliability: "Good",
        priority: 4
      },
      {
        url: "https://api.metaplex.solana.com",
        name: "Metaplex",
        rateLimit: "Medium",
        reliability: "Good",
        priority: 5
      }
    ],
    base: [
      {
        url: "https://base-rpc.publicnode.com",
        name: "PublicNode",
        rateLimit: "High",
        reliability: "Excellent",
        priority: 1
      },
      {
        url: "https://base.llamarpc.com",
        name: "LlamaRPC",
        rateLimit: "High", 
        reliability: "Good",
        priority: 2
      },
      {
        url: "https://mainnet.base.org",
        name: "Official",
        rateLimit: "Medium",
        reliability: "Excellent",
        priority: 3
      },
      {
        url: "https://base.blockpi.network/v1/rpc/public",
        name: "BlockPI",
        rateLimit: "Medium",
        reliability: "Good",
        priority: 4
      },
      {
        url: "https://base-mainnet.public.blastapi.io",
        name: "BlastAPI",
        rateLimit: "Medium",
        reliability: "Good",
        priority: 5
      }
    ]
  };
  
  // Track endpoint performance and failures
  const endpointStats = {
    solana: {},
    base: {}
  };
  
  // Initialize stats for all endpoints
  Object.keys(ENHANCED_RPC_ENDPOINTS).forEach(network => {
    ENHANCED_RPC_ENDPOINTS[network].forEach(endpoint => {
      endpointStats[network][endpoint.url] = {
        failures: 0,
        successCount: 0,
        avgResponseTime: 0,
        lastTested: 0,
        rateLimited: false,
        rateLimitExpiry: 0
      };
    });
  });
  
  // Test endpoint availability and performance
  async function testEndpoint(network, endpoint) {
    const startTime = Date.now();
    const stats = endpointStats[network][endpoint.url];
    
    try {
      const testPayload = network === 'solana' 
        ? { jsonrpc: '2.0', id: 1, method: 'getVersion' }
        : { jsonrpc: '2.0', id: 1, method: 'eth_chainId' };
        
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        if (data.result) {
          stats.successCount++;
          stats.avgResponseTime = (stats.avgResponseTime + responseTime) / 2;
          stats.lastTested = Date.now();
          stats.rateLimited = false;
          console.log(`✅ ${endpoint.name} (${network}): ${responseTime}ms`);
          return true;
        }
      } else if (response.status === 429) {
        stats.rateLimited = true;
        stats.rateLimitExpiry = Date.now() + (60 * 1000); // 1 minute cooldown
        console.warn(`⚠️ ${endpoint.name} (${network}): Rate limited`);
      }
    } catch (error) {
      stats.failures++;
      console.warn(`❌ ${endpoint.name} (${network}): ${error.message}`);
    }
    
    return false;
  }
  
  // Get best available endpoint for a network
  async function getBestEndpoint(network) {
    const endpoints = ENHANCED_RPC_ENDPOINTS[network];
    const now = Date.now();
    
    // Filter out rate-limited endpoints
    const availableEndpoints = endpoints.filter(endpoint => {
      const stats = endpointStats[network][endpoint.url];
      return !stats.rateLimited || now > stats.rateLimitExpiry;
    });
    
    if (availableEndpoints.length === 0) {
      console.warn(`⚠️ All ${network} endpoints rate limited, using fallback`);
      return endpoints[0]; // Return highest priority even if rate limited
    }
    
    // Sort by priority and performance
    availableEndpoints.sort((a, b) => {
      const statsA = endpointStats[network][a.url];
      const statsB = endpointStats[network][b.url];
      
      // Prioritize by success rate, then by priority
      const successRateA = statsA.successCount / (statsA.successCount + statsA.failures) || 0;
      const successRateB = statsB.successCount / (statsB.successCount + statsB.failures) || 0;
      
      if (Math.abs(successRateA - successRateB) > 0.1) {
        return successRateB - successRateA; // Higher success rate first
      }
      
      return a.priority - b.priority; // Lower priority number = higher priority
    });
    
    return availableEndpoints[0];
  }
  
  // Enhanced RPC manager
  window.ENHANCED_RPC_MANAGER = {
    // Get best Solana endpoint
    getSolanaEndpoint: async function() {
      // Try production config first
      if (window.PRODUCTION_CONFIG?.rpc?.solana) {
        return window.PRODUCTION_CONFIG.rpc.solana;
      }
      
      const bestEndpoint = await getBestEndpoint('solana');
      console.log(`🟣 Using ${bestEndpoint.name} for Solana:`, bestEndpoint.url);
      return bestEndpoint.url;
    },
    
    // Get best Base endpoint
    getBaseEndpoint: async function() {
      // Try production config first
      if (window.PRODUCTION_CONFIG?.rpc?.base) {
        return window.PRODUCTION_CONFIG.rpc.base;
      }
      
      const bestEndpoint = await getBestEndpoint('base');
      console.log(`🔵 Using ${bestEndpoint.name} for Base:`, bestEndpoint.url);
      return bestEndpoint.url;
    },
    
    // Test all endpoints and report status
    testAllEndpoints: async function() {
      console.log('🧪 Testing all RPC endpoints...');
      
      for (const network of ['solana', 'base']) {
        console.log(`\n📡 Testing ${network} endpoints:`);
        
        const endpoints = ENHANCED_RPC_ENDPOINTS[network];
        const results = await Promise.allSettled(
          endpoints.map(endpoint => testEndpoint(network, endpoint))
        );
        
        const workingCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
        console.log(`✅ ${workingCount}/${endpoints.length} ${network} endpoints working`);
      }
      
      return endpointStats;
    },
    
    // Get endpoint statistics
    getStats: function() {
      return endpointStats;
    },
    
    // Get all available endpoints for a network
    getAllEndpoints: function(network) {
      return ENHANCED_RPC_ENDPOINTS[network] || [];
    }
  };
  
  // Auto-test endpoints periodically
  let testInterval;
  function startPeriodicTesting() {
    // Test immediately
    setTimeout(() => window.ENHANCED_RPC_MANAGER.testAllEndpoints(), 1000);
    
    // Then test every 5 minutes
    testInterval = setInterval(() => {
      window.ENHANCED_RPC_MANAGER.testAllEndpoints();
    }, 5 * 60 * 1000);
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startPeriodicTesting);
  } else {
    startPeriodicTesting();
  }
  
  // Stop testing on page unload
  window.addEventListener('beforeunload', () => {
    if (testInterval) clearInterval(testInterval);
  });
  
  console.log('🌐 Enhanced RPC Endpoint Management Ready');
  console.log('💡 Use ENHANCED_RPC_MANAGER.testAllEndpoints() to test all endpoints');
  console.log('💡 Use ENHANCED_RPC_MANAGER.getStats() to see endpoint performance');
  
})();
