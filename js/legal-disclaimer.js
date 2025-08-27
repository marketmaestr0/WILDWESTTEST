// Legal Disclaimer Modal System
// Comprehensive legal protection and mobile guidance

(function() {
  'use strict';
  
  // Check if disclaimer has been shown in this session
  const DISCLAIMER_KEY = 'wildwest_disclaimer_acknowledged';
  const SESSION_KEY = 'wildwest_session_disclaimer';
  
  function showLegalDisclaimer() {
    // Check if already shown this session
    if (sessionStorage.getItem(SESSION_KEY)) {
      return;
    }
    
    // Check if permanently acknowledged
    if (localStorage.getItem(DISCLAIMER_KEY)) {
      return;
    }
    
    console.log('📋 Showing legal disclaimer modal');
    
    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'legal-disclaimer-backdrop';
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.95);
      backdrop-filter: blur(10px);
      z-index: 999999;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
      box-sizing: border-box;
      animation: disclaimerFadeIn 0.5s ease-out;
      overflow: hidden;
    `;
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Check if user is in a wallet browser (don't show mobile guidance if they are)
    const isInWalletBrowser = /MetaMask|Trust|Coinbase|Rainbow|WalletConnect|Phantom/i.test(navigator.userAgent) || 
                              window.ethereum || window.solana;
    
    // Only show mobile guidance if on mobile AND not in wallet browser
    const showMobileGuidance = isMobile && !isInWalletBrowser;
    
    backdrop.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #0a0a1e 0%, #1a1a2e 30%, #16213e 70%, #0f1419 100%);
        border: 3px solid #00eaff;
        border-radius: 15px;
        padding: 1.5rem 1rem;
        max-width: ${isMobile ? '95vw' : '420px'};
        width: ${isMobile ? '95vw' : '90vw'};
        max-height: ${isMobile ? '95vh' : '85vh'};
        overflow-y: auto;
        overflow-x: hidden;
        -webkit-overflow-scrolling: touch;
        text-align: center;
        color: white;
        font-family: 'Orbitron', Arial, sans-serif;
        box-shadow: 
          0 0 30px rgba(0, 234, 255, 0.4),
          0 10px 25px rgba(0, 0, 0, 0.6),
          inset 0 1px 0 rgba(255, 255, 255, 0.1);
        position: relative;
        animation: disclaimerSlideIn 0.6s ease-out;
        box-sizing: border-box;
      ">
        <!-- Close button -->
        <button onclick="
          alert('Please read and accept the terms to continue using Wild West Launchpad.');
        " style="
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(0, 234, 255, 0.3);
          border-radius: 50%;
          width: ${isMobile ? '44px' : '40px'};
          height: ${isMobile ? '44px' : '40px'};
          color: #00eaff;
          font-size: ${isMobile ? '1.6rem' : '1.4rem'};
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          z-index: 10;
          touch-action: manipulation;
        " onmouseover="this.style.background='rgba(0, 234, 255, 0.2)'; this.style.transform='scale(1.1)'; this.style.boxShadow='0 0 15px rgba(0, 234, 255, 0.5)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.1)'; this.style.transform='scale(1)'; this.style.boxShadow='none'">
          ×
        </button>
        
        <!-- Animated top border -->
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, #00eaff, #00fff7, #00eaff, transparent);
          animation: borderShimmer 3s infinite;
        "></div>
        
        <!-- Side glow effects -->
        <div style="
          position: absolute;
          top: 20%;
          left: -2px;
          width: 4px;
          height: 60%;
          background: linear-gradient(180deg, transparent, #00eaff, transparent);
          animation: sideGlow 4s infinite;
        "></div>
        <div style="
          position: absolute;
          top: 20%;
          right: -2px;
          width: 4px;
          height: 60%;
          background: linear-gradient(180deg, transparent, #00eaff, transparent);
          animation: sideGlow 4s infinite reverse;
        "></div>
        
        <!-- Title -->
        <h1 style="
          color: #00eaff;
          margin-bottom: 0.8rem;
          font-size: ${isMobile ? '1.1rem' : '1.3rem'};
          font-weight: 900;
          text-shadow: 0 0 15px rgba(0, 234, 255, 0.7);
          letter-spacing: 1px;
          text-transform: uppercase;
          line-height: 1.2;
        ">
          Welcome to <span style="font-family: 'Ewert', 'UnifrakturMaguntia', 'Creepster', cursive; letter-spacing: 0.05em; font-size: ${isMobile ? '2.2rem' : '3rem'};">WILDWEST</span>
        </h1>
        
        <!-- Legal disclaimer text -->
        <div style="
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(0, 234, 255, 0.3);
          border-radius: 10px;
          padding: 1rem;
          margin-bottom: 1rem;
          text-align: left;
          line-height: 1.4;
          font-size: 0.8rem;
          color: #e0e0e0;
          max-height: 180px;
          overflow-y: auto;
        ">
          <div style="text-align: center; margin-bottom: 1rem; color: #00eaff; font-weight: 700;">
            � IMPORTANT INFORMATION
          </div>
          
          <p><strong style="color: #00eaff;">HIGH RISK:</strong> 
          Cryptocurrency investments are highly volatile and speculative. You may lose all invested funds. Only invest what you can afford to lose.</p>
          
          <p><strong style="color: #00eaff;">NOT FINANCIAL ADVICE:</strong> 
          This platform provides cryptocurrency tools and services but does not constitute financial, investment, or trading advice. You are solely responsible for your investment decisions. Consult qualified professionals before investing.</p>
          
          <p><strong style="color: #00eaff;">NO WARRANTIES:</strong> 
          This service is provided "AS IS" without warranties.</p>

        </div>
        
        ${showMobileGuidance ? `
        <!-- Mobile-specific guidance -->
        <div style="
          background: rgba(0, 234, 255, 0.1);
          border: 2px solid #00eaff;
          border-radius: 10px;
          padding: ${isMobile ? '1rem' : '0.8rem'};
          margin-bottom: 1rem;
          animation: mobilePulse 3s infinite;
        ">
          <div style="
            font-size: ${isMobile ? '1.8rem' : '1.5rem'};
            margin-bottom: 0.4rem;
            filter: drop-shadow(0 0 10px #00eaff);
          ">📱</div>
          <div style="color: #00eaff; font-weight: 700; margin-bottom: 0.4rem; font-size: ${isMobile ? '1rem' : '0.95rem'};">
            MOBILE USERS - IMPORTANT!
          </div>
          <div style="font-size: ${isMobile ? '0.9rem' : '0.8rem'}; color: #e0e0e0; line-height: 1.4;">
            For proper functionality, open this site in your <strong style="color: #00eaff;">wallet's built-in browser</strong> 
            (MetaMask, Phantom, Trust Wallet, Coinbase Wallet, etc.) instead of your regular mobile browser.
          </div>
        </div>
        ` : ''}
        
        <!-- Acknowledgment section -->
        <div style="
          background: rgba(0, 234, 255, 0.1);
          border: 1px solid rgba(0, 234, 255, 0.3);
          border-radius: 8px;
          padding: ${isMobile ? '1rem' : '0.8rem'};
          margin-bottom: 1rem;
          font-size: ${isMobile ? '0.9rem' : '0.8rem'};
          color: #e0e0e0;
          line-height: 1.4;
        ">
          <strong>By continuing, you confirm that you understand these terms and are ready to explore the Wild West responsibly!</strong>
        </div>
        
        <!-- Action buttons -->
        <div style="display: flex; gap: 0.8rem; justify-content: center; flex-wrap: wrap; margin-top: 1rem;">
          <button onclick="
            sessionStorage.setItem('wildwest_session_disclaimer', 'true');
            localStorage.setItem('wildwest_disclaimer_acknowledged', new Date().toISOString());
            document.getElementById('legal-disclaimer-backdrop').style.animation='disclaimerFadeOut 0.3s ease-in';
            setTimeout(() => document.getElementById('legal-disclaimer-backdrop').remove(), 300);
          " style="
            background: linear-gradient(135deg, #00eaff 0%, #0099dd 100%);
            color: white;
            border: 2px solid #00eaff;
            padding: ${isMobile ? '14px 28px' : '10px 24px'};
            border-radius: 8px;
            font-family: 'Orbitron', Arial, sans-serif;
            font-weight: 600;
            cursor: pointer;
            font-size: ${isMobile ? '0.95rem' : '0.85rem'};
            transition: all 0.3s ease;
            box-shadow: 0 3px 12px rgba(0, 234, 255, 0.3);
            text-transform: uppercase;
            letter-spacing: 0.3px;
            width: 100%;
            max-width: ${isMobile ? '250px' : '200px'};
            touch-action: manipulation;
            min-height: ${isMobile ? '48px' : 'auto'};
          " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 5px 15px rgba(0, 234, 255, 0.5)'; this.style.background='linear-gradient(135deg, #00fff7 0%, #00ccee 100%)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 3px 12px rgba(0, 234, 255, 0.3)'; this.style.background='linear-gradient(135deg, #00eaff 0%, #0099dd 100%)'">
            I Agree & Continue
          </button>
        </div>
      </div>
    `;
    
    // Add CSS animations
    if (!document.getElementById('disclaimerAnimations')) {
      const style = document.createElement('style');
      style.id = 'disclaimerAnimations';
      style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Ewert&family=UnifrakturMaguntia&family=Creepster&display=swap');
        @keyframes disclaimerFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes disclaimerFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes disclaimerSlideIn {
          from { 
            transform: translateY(-50px) scale(0.9); 
            opacity: 0; 
          }
          to { 
            transform: translateY(0) scale(1); 
            opacity: 1; 
          }
        }
        @keyframes borderShimmer {
          0% { transform: translateX(-200%); }
          100% { transform: translateX(200%); }
        }
        @keyframes sideGlow {
          0%, 100% { 
            opacity: 0.3;
            transform: scaleY(0.5);
          }
          50% { 
            opacity: 1;
            transform: scaleY(1);
          }
        }
        @keyframes mobilePulse {
          0%, 100% { 
            border-color: #00eaff; 
            box-shadow: 0 0 10px rgba(0, 234, 255, 0.3);
          }
          50% { 
            border-color: #00fff7; 
            box-shadow: 0 0 20px rgba(0, 234, 255, 0.6);
          }
        }
        
        /* Mobile-specific adjustments */
        @media (max-width: 768px) {
          #legal-disclaimer-backdrop {
            padding: 10px !important;
          }
          
          #legal-disclaimer-backdrop > div {
            border-radius: 12px !important;
            max-height: 95vh !important;
          }
        }
        
        /* Ensure proper scrolling on mobile */
        @media (max-height: 600px) {
          #legal-disclaimer-backdrop > div {
            max-height: 98vh !important;
            padding: 1rem 0.8rem !important;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(backdrop);
    
    // Mark as shown this session
    sessionStorage.setItem(SESSION_KEY, 'true');
  }
  
  // Show disclaimer when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showLegalDisclaimer);
  } else {
    // DOM already loaded
    setTimeout(showLegalDisclaimer, 500);
  }
  
  // Expose function globally for manual triggering
  window.showLegalDisclaimer = showLegalDisclaimer;
  
  console.log('⚖️ Legal disclaimer system loaded');
})();
