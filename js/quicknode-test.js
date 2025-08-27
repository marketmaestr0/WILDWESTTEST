// QuickNode Endpoint Availability Test
// Check if QuickNode endpoints are actually available via GitHub Secrets

(function() {
  'use strict';
  
  console.log('🚀 QuickNode Availability Test Loading...');
  
  // Test function to check if QuickNode endpoints are working
  async function testQuickNodeAvailability() {
    console.log('\n🧪 === QUICKNODE AVAILABILITY TEST ===');
    
    // Check if production config has been populated with actual endpoints
    let foundQuickNodeEndpoints = false;
    
    if (window.PRODUCTION_CONFIG?.rpc) {
      console.log('✅ Production config has RPC section');
      
      const solanaEndpoint = window.PRODUCTION_CONFIG.rpc.solana;
      const baseEndpoint = window.PRODUCTION_CONFIG.rpc.base;
      
      console.log('📡 Configured endpoints:');
      console.log('- Solana:', solanaEndpoint);
      console.log('- Base:', baseEndpoint);
      
      // Test if these look like QuickNode endpoints
      if (solanaEndpoint && (solanaEndpoint.includes('quicknode') || (solanaEndpoint.includes('solana') && !solanaEndpoint.includes('api.mainnet-beta.solana.com')))) {
        console.log('🎯 Solana endpoint appears to be QuickNode!');
        foundQuickNodeEndpoints = true;
        
        // Test the Solana endpoint
        try {
          const response = await fetch(solanaEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'getVersion'
            }),
            signal: AbortSignal.timeout(5000)
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ QuickNode Solana endpoint is working!', data.result);
          } else {
            console.error('❌ QuickNode Solana endpoint failed:', response.status);
          }
        } catch (error) {
          console.error('❌ QuickNode Solana endpoint error:', error.message);
        }
      } else {
        console.log('⚠️ Solana endpoint does not appear to be QuickNode');
      }
      
      if (baseEndpoint && (baseEndpoint.includes('quicknode') || (baseEndpoint.includes('base') && !baseEndpoint.includes('mainnet.base.org')))) {
        console.log('🎯 Base endpoint appears to be QuickNode!');
        foundQuickNodeEndpoints = true;
        
        // Test the Base endpoint
        try {
          const response = await fetch(baseEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'eth_chainId'
            }),
            signal: AbortSignal.timeout(5000)
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ QuickNode Base endpoint is working! Chain ID:', data.result);
          } else {
            console.error('❌ QuickNode Base endpoint failed:', response.status);
          }
        } catch (error) {
          console.error('❌ QuickNode Base endpoint error:', error.message);
        }
      } else {
        console.log('⚠️ Base endpoint does not appear to be QuickNode');
      }
    } else {
      console.log('❌ Production config does not have RPC section');
    }
    
    if (!foundQuickNodeEndpoints) {
      console.log('\n🚨 QUICKNODE ENDPOINTS NOT DETECTED!');
      console.log('📋 Possible causes:');
      console.log('1. GitHub Secrets not configured properly');
      console.log('2. GitHub Actions deployment not populating production-config.js');
      console.log('3. QuickNode endpoints not being injected during build');
      console.log('4. Running in local development without secrets');
      
      console.log('\n💡 Recommendations:');
      console.log('1. Check GitHub repository secrets configuration');
      console.log('2. Verify GitHub Actions deployment logs');
      console.log('3. Ensure production-config.js is being populated during deployment');
      console.log('4. Test on production URL (not localhost) to ensure secrets are available');
    } else {
      console.log('\n✅ QuickNode endpoints detected and configured!');
    }
    
    console.log('\n🧪 === END QUICKNODE TEST ===\n');
  }
  
  // Expose test function globally
  window.testQuickNodeAvailability = testQuickNodeAvailability;
  
  // Auto-run test after a delay
  setTimeout(() => {
    console.log('🚀 Auto-running QuickNode availability test...');
    testQuickNodeAvailability();
  }, 2000);
  
  console.log('🚀 QuickNode Availability Test Ready');
  console.log('💡 Run testQuickNodeAvailability() to check QuickNode status');
  
})();
