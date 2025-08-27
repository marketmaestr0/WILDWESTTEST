// mobile-wallet-debug.js
// 📱 DEBUG TOOLS FOR MOBILE WALLET TESTING

// Create mobile debug panel for testing
function createMobileDebugPanel() {
  // Only show on mobile
  if (!window.mobileWalletDetector?.isMobile) {
    console.log('🖥️ Desktop detected - mobile debug panel not needed');
    return;
  }
  
  console.log('📱 Creating mobile debug panel...');
  
  // Remove existing panel
  const existingPanel = document.getElementById('mobile-debug-panel');
  if (existingPanel) existingPanel.remove();
  
  const panel = document.createElement('div');
  panel.id = 'mobile-debug-panel';
  panel.style.cssText = `
    position: fixed;
    bottom: 10px;
    left: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.9);
    border: 2px solid #00eaff;
    border-radius: 10px;
    padding: 15px;
    font-family: monospace;
    font-size: 12px;
    color: #00eaff;
    z-index: 999999999;
    max-height: 200px;
    overflow-y: auto;
  `;
  
  panel.innerHTML = `
    <div style="text-align: center; margin-bottom: 10px;">
      <strong>📱 MOBILE WALLET DEBUG</strong>
      <button onclick="this.parentElement.parentElement.style.display='none'" style="
        float: right;
        background: none;
        border: 1px solid #00eaff;
        color: #00eaff;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 10px;
        cursor: pointer;
      ">✕</button>
    </div>
    <div id="debug-content">Loading...</div>
    <div style="text-align: center; margin-top: 10px;">
      <button onclick="refreshMobileDebug()" style="
        background: #007bff;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 5px;
        font-size: 11px;
        cursor: pointer;
        margin: 0 5px;
      ">🔄 Refresh</button>
      <button onclick="window.mobileWalletDetector.showMobileWalletModal()" style="
        background: #00ff88;
        color: black;
        border: none;
        padding: 8px 12px;
        border-radius: 5px;
        font-size: 11px;
        cursor: pointer;
        margin: 0 5px;
      ">📱 Show Wallets</button>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  // Initial debug info
  refreshMobileDebug();
  
  console.log('✅ Mobile debug panel created');
}

// Refresh debug information
function refreshMobileDebug() {
  const debugContent = document.getElementById('debug-content');
  if (!debugContent) return;
  
  const info = window.debugMobileWallets ? window.debugMobileWallets() : {};
  const detectedWallets = window.mobileWalletDetector?.getDetectedWallets() || [];
  
  let html = `
    <div><strong>Mobile Device:</strong> ${info.isMobile ? '✅ YES' : '❌ NO'}</div>
    <div><strong>User Agent:</strong> ${navigator.userAgent.substring(0, 50)}...</div>
    <div><strong>Screen Size:</strong> ${window.innerWidth}x${window.innerHeight}</div>
    <div><strong>Touch Support:</strong> ${'ontouchstart' in window ? '✅ YES' : '❌ NO'}</div>
    <div style="margin: 8px 0;"><strong>Detected Wallets (${detectedWallets.length}):</strong></div>
  `;
  
  if (detectedWallets.length > 0) {
    detectedWallets.forEach(wallet => {
      const statusIcon = wallet.status === 'available' ? '✅' : 
                        wallet.status === 'detected' ? '🔍' : '📥';
      html += `<div style="margin-left: 10px;">${statusIcon} ${wallet.name} (${wallet.status})</div>`;
    });
  } else {
    html += `<div style="margin-left: 10px; color: #ffaa00;">No wallets detected</div>`;
  }
  
  // Check for specific wallet providers
  html += `<div style="margin: 8px 0;"><strong>Provider Check:</strong></div>`;
  html += `<div style="margin-left: 10px;">window.ethereum: ${window.ethereum ? '✅' : '❌'}</div>`;
  html += `<div style="margin-left: 10px;">window.solana: ${window.solana ? '✅' : '❌'}</div>`;
  html += `<div style="margin-left: 10px;">MetaMask: ${window.ethereum?.isMetaMask ? '✅' : '❌'}</div>`;
  html += `<div style="margin-left: 10px;">Phantom: ${window.solana?.isPhantom ? '✅' : '❌'}</div>`;
  html += `<div style="margin-left: 10px;">Trust: ${window.ethereum?.isTrust ? '✅' : '❌'}</div>`;
  
  debugContent.innerHTML = html;
}

// Show mobile debug panel when mobile detected
window.showMobileDebug = function() {
  createMobileDebugPanel();
};

// Auto-show debug panel on mobile (can be disabled)
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    if (window.mobileWalletDetector?.isMobile) {
      // Only auto-show if localhost or specific debug parameter
      const isDebugMode = window.location.hostname === 'localhost' || 
                         window.location.search.includes('debug=mobile');
      
      if (isDebugMode) {
        createMobileDebugPanel();
      } else {
        // Add floating debug button instead
        const debugBtn = document.createElement('button');
        debugBtn.innerHTML = '🐛';
        debugBtn.style.cssText = `
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 50px;
          height: 50px;
          background: rgba(0, 234, 255, 0.8);
          border: none;
          border-radius: 50%;
          color: black;
          font-size: 20px;
          cursor: pointer;
          z-index: 999999998;
          box-shadow: 0 4px 15px rgba(0, 234, 255, 0.3);
        `;
        debugBtn.onclick = createMobileDebugPanel;
        document.body.appendChild(debugBtn);
      }
    }
  }, 2000);
});

// Test functions for mobile
window.testMobileWalletConnect = function() {
  if (!window.wildWestWallet) {
    alert('❌ WildWestWallet not loaded');
    return;
  }
  
  console.log('🧪 Testing mobile wallet connection...');
  
  window.wildWestWallet.connectWallet()
    .then(result => {
      console.log('✅ Connection test result:', result);
      alert(result ? '✅ Wallet connected!' : '❌ Connection failed');
    })
    .catch(error => {
      console.error('❌ Connection test error:', error);
      alert('❌ Connection error: ' + error.message);
    });
};

window.testMobileWalletDetection = function() {
  console.log('🧪 Testing mobile wallet detection...');
  
  if (!window.mobileWalletDetector) {
    alert('❌ Mobile wallet detector not loaded');
    return;
  }
  
  const result = window.debugMobileWallets();
  console.log('📊 Detection result:', result);
  
  alert(`📱 Mobile: ${result.isMobile}\n🔍 Detected: ${result.detectedWallets.length}\n✅ Available: ${result.availableCount}`);
};

console.log('🐛 Mobile Debug Tools loaded');
console.log('💡 Functions: showMobileDebug(), testMobileWalletConnect(), testMobileWalletDetection()');

// Also expose on window for easy access
window.refreshMobileDebug = refreshMobileDebug;
