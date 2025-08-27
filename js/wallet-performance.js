/**
 * Performance Optimization for Wallet Browsers
 * Detects wallet browsers and mobile devices to reduce heavy animations and effects
 */

(function() {
  'use strict';

  // Detection functions
  function isMobileDevice() {
    return window.innerWidth <= 768 || 
           /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  function isWalletBrowser() {
    return /MetaMask|Trust|Coinbase|Rainbow|WalletConnect|Phantom/i.test(navigator.userAgent) || 
           window.ethereum || window.solana;
  }

  function hasLowPerformance() {
    // Detect if device has reduced performance capabilities
    return navigator.hardwareConcurrency <= 2 || // Low core count
           navigator.deviceMemory && navigator.deviceMemory <= 4 || // Low memory
           navigator.connection && navigator.connection.saveData; // Data saving mode
  }

  // Apply performance optimizations
  function applyPerformanceOptimizations() {
    const shouldOptimize = isMobileDevice() || isWalletBrowser() || hasLowPerformance();
    
    if (!shouldOptimize) return;

    console.log('📱 Applying performance optimizations for wallet browser/mobile device');

    // Create optimization stylesheet
    const style = document.createElement('style');
    style.id = 'wallet-performance-optimizations';
    
    let css = `
      /* Disable or reduce heavy animations */
      @media (max-width: 768px), (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.1s !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.1s !important;
        }
        
        body::before, body::after {
          animation: none !important;
          filter: none !important;
          will-change: auto !important;
        }
        
        .ember, [class*="ember"] {
          display: none !important;
        }
      }
    `;

    // Additional optimizations for wallet browsers specifically
    if (isWalletBrowser()) {
      css += `
        /* Wallet browser specific optimizations */
        body::before, body::after {
          animation-duration: 8s !important;
          filter: blur(0.5px) brightness(1.01) !important;
        }
        
        [class*="flicker"], [class*="pulse"], [class*="glow"] {
          animation-duration: 4s !important;
        }
        
        /* Reduce blur effects that are GPU intensive */
        * {
          filter: none !important;
          backdrop-filter: none !important;
        }
        
        /* Simplify box shadows */
        * {
          box-shadow: none !important;
        }
      `;
    }

    style.textContent = css;
    document.head.appendChild(style);

    // Disable particle systems
    if (window.stopEmberSystem) {
      window.stopEmberSystem();
    }

    // Throttle scroll events
    let scrollTimer = null;
    const originalAddEventListener = window.addEventListener;
    window.addEventListener = function(type, listener, options) {
      if (type === 'scroll' && shouldOptimize) {
        const throttledListener = function(...args) {
          if (scrollTimer) return;
          scrollTimer = setTimeout(() => {
            listener.apply(this, args);
            scrollTimer = null;
          }, 100);
        };
        return originalAddEventListener.call(this, type, throttledListener, options);
      }
      return originalAddEventListener.call(this, type, listener, options);
    };

    // Pause animations when page is hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        document.body.style.animationPlayState = 'paused';
      } else {
        document.body.style.animationPlayState = 'running';
      }
    });
  }

  // Initialize optimizations
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyPerformanceOptimizations);
  } else {
    applyPerformanceOptimizations();
  }

  // Expose utility functions globally
  window.WalletPerformance = {
    isMobileDevice,
    isWalletBrowser,
    hasLowPerformance,
    shouldOptimize: () => isMobileDevice() || isWalletBrowser() || hasLowPerformance()
  };

})();
