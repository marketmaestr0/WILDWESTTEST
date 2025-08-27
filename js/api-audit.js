/**
 * API Efficiency Audit Tool
 * Scans for external API calls and ensures QuickNode usage
 */

const API_AUDIT = {
  // External APIs that should be minimized or replaced
  EXTERNAL_APIS: [
    'coingecko.com',
    'alchemy.com',
    'infura.io',
    'moralis.io',
    'api.mainnet-beta.solana.com',
    'mainnet.base.org'
  ],

  // Preferred QuickNode patterns
  QUICKNODE_PATTERNS: [
    'quiknode.pro',
    'RPC_CONFIG.getSolanaEndpoint',
    'RPC_CONFIG.getBaseEndpoint',
    'window.ENV_CONFIG?.rpc'
  ],

  // Scan page for API usage
  scanPage: function() {
    const results = {
      externalAPIs: [],
      quickNodeUsage: [],
      recommendations: []
    };

    // Check script tags for external APIs
    const scripts = document.querySelectorAll('script');
    scripts.forEach((script, index) => {
      const content = script.textContent || script.innerHTML;
      
      // Check for external API usage
      this.EXTERNAL_APIS.forEach(api => {
        if (content.includes(api)) {
          results.externalAPIs.push({
            api: api,
            scriptIndex: index,
            line: this.findLineNumber(content, api)
          });
        }
      });

      // Check for QuickNode usage
      this.QUICKNODE_PATTERNS.forEach(pattern => {
        if (content.includes(pattern)) {
          results.quickNodeUsage.push({
            pattern: pattern,
            scriptIndex: index
          });
        }
      });
    });

    // Runtime QuickNode detection via injected config
    try {
      const rpc = window.PRODUCTION_CONFIG && window.PRODUCTION_CONFIG.rpc;
      if (rpc && (String(rpc.base||'').includes('quiknode.pro') || String(rpc.solana||'').includes('quiknode.pro'))) {
        results.quickNodeUsage.push({ pattern: 'window.PRODUCTION_CONFIG.rpc (QuickNode URLs)', scriptIndex: -1 });
      }
    } catch(_) {}

    // Generate recommendations
    if (results.externalAPIs.length > 0) {
      results.recommendations.push('Replace external API calls with QuickNode endpoints for better performance');
    }
    
    if (results.quickNodeUsage.length === 0) {
      results.recommendations.push('No QuickNode usage detected - consider implementing RPC_CONFIG');
    }

    return results;
  },

  findLineNumber: function(content, searchString) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchString)) {
        return i + 1;
      }
    }
    return -1;
  },

  // Generate efficiency report
  generateReport: function() {
    const results = this.scanPage();
    
    console.log('🔍 API Efficiency Audit Report');
    console.log('==============================');
    
    if (results.externalAPIs.length > 0) {
      console.log('❌ External API Dependencies Found:');
      results.externalAPIs.forEach(item => {
        console.log(`  - ${item.api} (Script ${item.scriptIndex}, Line ${item.line})`);
      });
    } else {
      console.log('✅ No external API dependencies found');
    }

    if (results.quickNodeUsage.length > 0) {
      console.log('✅ QuickNode Usage Detected:');
      results.quickNodeUsage.forEach(item => {
        console.log(`  - ${item.pattern} (Script ${item.scriptIndex})`);
      });
    } else {
      console.log('⚠️ No QuickNode usage detected');
    }

    if (results.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      results.recommendations.forEach(rec => {
        console.log(`  - ${rec}`);
      });
    }

    return results;
  },

  // Test RPC endpoints
  testEndpoints: async function() {
    console.log('🧪 Testing RPC Endpoints...');
    
    if (window.RPC_CONFIG) {
      try {
        // Test Solana endpoint
        const solanaEndpoint = window.RPC_CONFIG.getSolanaEndpoint();
        console.log(`Testing Solana: ${solanaEndpoint}`);
        
        const solanaTest = await fetch(solanaEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getHealth'
          })
        });
        
        console.log(`✅ Solana endpoint: ${solanaTest.ok ? 'OK' : 'FAILED'}`);

        // Test Base endpoint
        const baseEndpoint = window.RPC_CONFIG.getBaseEndpoint();
        console.log(`Testing Base: ${baseEndpoint}`);
        
        const baseTest = await fetch(baseEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_chainId'
          })
        });
        
        console.log(`✅ Base endpoint: ${baseTest.ok ? 'OK' : 'FAILED'}`);
        
      } catch (error) {
        console.error('❌ Endpoint testing failed:', error);
      }
    } else {
      console.log('❌ RPC_CONFIG not available');
    }
  }
};

// Make available globally for manual testing
window.API_AUDIT = API_AUDIT;

// Auto-run audit on page load
if (document.readyState === 'complete') {
  API_AUDIT.generateReport();
} else {
  window.addEventListener('load', () => API_AUDIT.generateReport());
}

console.log('🔧 API Efficiency Audit loaded. Run API_AUDIT.generateReport() or API_AUDIT.testEndpoints() for manual checks.');
