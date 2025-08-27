// Dynamic banner rotation system
// Handles automatic banner switching every 5 minutes

class BannerRotationManager {
  constructor() {
    this.rotationTimer = null;
    this.expirationTimer = null;
    this.cleanupTimer = null;
    this.isInitialized = false;
    this.currentTopBanner = null;
    this.currentBottomBanner = null;
    this.lastCleanupCheck = null;
  }

  // Initialize the banner system
  async init() {
    if (this.isInitialized) return;
    
    console.log('🎯 Initializing Banner Rotation System');
    console.log(`💰 Pricing: Top Banner $${window.BANNER_CONFIG.PRICING.TOP_BANNER}/day, Bottom Banner $${window.BANNER_CONFIG.PRICING.BOTTOM_BANNER}/day`);
    console.log(`🔄 Rotation interval: ${window.BANNER_CONFIG.PRICING.ROTATION_INTERVAL / 1000 / 60} minutes`);
    console.log('🚀 Immediate activation: Banners go live upon payment confirmation');
    
    // Fetch banners from GitHub first
    console.log('📡 Fetching banners from GitHub repository...');
    await window.BANNER_CONFIG.fetchBanners();
    
    this.updateBanners();
    this.startRotationTimer();
    this.isInitialized = true;
    
    // Add click tracking
    this.setupClickTracking();
  }

  // Force immediate banner activation (called after payment)
  activateBannerImmediately(bannerId) {
    console.log(`🚀 Forcing immediate activation for banner: ${bannerId}`);
    this.updateBanners();
    
    // Log the immediate activation
    const topBanner = window.BANNER_CONFIG.getCurrentBanner('top');
    const bottomBanner = window.BANNER_CONFIG.getCurrentBanner('bottom');
    
    console.log('🔄 Updated banner rotation after immediate activation:', {
      top: topBanner?.projectName || 'Default',
      bottom: bottomBanner?.projectName || 'Default'
    });
    
    return true;
  }

  // Update both banners with current rotation
  updateBanners() {
    this.updateTopBanner();
    this.updateBottomBanner();
    
    console.log('🔄 Banners updated:', {
      top: this.currentTopBanner?.projectName || 'Advertise Here',
      bottom: this.currentBottomBanner?.projectName || 'Advertise Here'
    });
    
    // Additional debugging info
    if (this.currentTopBanner && !this.currentTopBanner.isDefault) {
      console.log('🔍 Top Banner Details:', {
        id: this.currentTopBanner.id,
        project: this.currentTopBanner.projectName,
        imageUrl: this.currentTopBanner.imageUrl?.substring(0, 50) + '...',
        hasValidUrl: !!this.currentTopBanner.imageUrl && this.currentTopBanner.imageUrl !== 'undefined'
      });
    }
  }

  // Update top banner
  updateTopBanner() {
    const banner = window.BANNER_CONFIG.getCurrentBanner('top');
    this.currentTopBanner = banner;
    
    const topAdContent = document.querySelector('.top-ad .ad-content');
    if (topAdContent) {
      if (banner.isDefault) {
        // Default "Advertise Here" display - don't override, just ensure button is visible
        topAdContent.innerHTML = `<span class="ad-text">ADVERTISE HERE</span>`;
        topAdContent.style.cursor = 'default';
        topAdContent.style.pointerEvents = 'none'; // Disable clicking on the default banner area
        
        // Find the advertise button in the parent container and make sure it's visible
        const topAdSection = document.querySelector('.top-ad');
        let advertiseBtn = topAdSection.querySelector('.advertise-btn');
        if (advertiseBtn) {
          advertiseBtn.style.display = 'block';
        }
        
        // Remove any click handlers for default banners
        topAdContent.onclick = null;
        topAdContent.removeEventListener('click', topAdContent._bannerClickHandler);
        return; // Exit early, don't add click handlers
      } else {
        // Custom project banner - display image directly
        const imageUrl = banner.imageUrl;
        
        // Safety check for undefined imageUrl
        if (!imageUrl || imageUrl === 'undefined') {
          console.error('❌ Banner imageUrl is undefined for banner:', banner);
          // Fallback to default advertising banner instead of infinite recursion
          topAdContent.innerHTML = `<span class="ad-text">ADVERTISE HERE</span>`;
          // Show advertise button
          const topAdSection = document.querySelector('.top-ad');
          const advertiseBtn = topAdSection.querySelector('.advertise-btn');
          if (advertiseBtn) {
            advertiseBtn.style.display = 'block';
          }
          return;
        }
        
        topAdContent.innerHTML = `
          <div class="custom-banner" style="width: 100%; height: 100%; background-image: url('${imageUrl}'); background-size: cover; background-position: center; background-repeat: no-repeat; border-radius: 15px; position: relative; overflow: hidden; cursor: pointer; pointer-events: auto;">
            <div class="banner-overlay" style="position: absolute; bottom: 5px; right: 10px; background: rgba(0,0,0,0.7); color: #00eaff; padding: 2px 8px; border-radius: 4px; font-size: 0.7em; font-weight: 600; pointer-events: none;">
              ${banner.projectName}
            </div>
          </div>
        `;
        topAdContent.style.cursor = 'pointer';
        topAdContent.style.pointerEvents = 'auto';
        
        // Hide the advertise button when showing custom banner
        const topAdSection = document.querySelector('.top-ad');
        let advertiseBtn = topAdSection.querySelector('.advertise-btn');
        if (advertiseBtn) {
          advertiseBtn.style.display = 'none';
        }
      }
      
      // Only add click handlers for paid banners (non-default)
      if (!banner.isDefault) {
        // Update click handler - use both onclick and addEventListener for better compatibility
        topAdContent.onclick = () => this.handleBannerClick(banner, 'top');
        
        // Remove any existing click listeners and add new one
        topAdContent.removeEventListener('click', topAdContent._bannerClickHandler);
        topAdContent._bannerClickHandler = (event) => {
          console.log('🖱️ Click event triggered on top banner');
          event.preventDefault();
          event.stopPropagation();
          this.handleBannerClick(banner, 'top');
        };
        topAdContent.addEventListener('click', topAdContent._bannerClickHandler);
        
        console.log('🖱️ Top banner click handler attached for:', banner.projectName, 'Link:', banner.link || banner.linkUrl);
      }
    }
  }

  // Update bottom banner
  updateBottomBanner() {
    const banner = window.BANNER_CONFIG.getCurrentBanner('bottom');
    this.currentBottomBanner = banner;
    
    // Debug: Log the actual banner data we're getting
    console.log('🔍 Bottom Banner Retrieved:', {
      projectName: banner.projectName,
      link: banner.link,
      linkUrl: banner.linkUrl,
      filename: banner.filename,
      isDefault: banner.isDefault,
      fullBanner: banner
    });
    
    const bottomAdContent = document.querySelector('.bottom-ad .ad-content');
    if (bottomAdContent) {
      if (banner.isDefault) {
        // Default "Advertise Here" display - don't override, just ensure button is visible
        bottomAdContent.innerHTML = `<span class="ad-text">ADVERTISE HERE</span>`;
        bottomAdContent.style.cursor = 'default';
        bottomAdContent.style.pointerEvents = 'none'; // Disable clicking on the default banner area
        
        // Find the advertise button in the parent container and make sure it's visible
        const bottomAdSection = document.querySelector('.bottom-ad');
        let advertiseBtn = bottomAdSection.querySelector('.advertise-btn');
        if (advertiseBtn) {
          advertiseBtn.style.display = 'block';
        }
        
        // Remove any click handlers for default banners
        bottomAdContent.onclick = null;
        bottomAdContent.removeEventListener('click', bottomAdContent._bannerClickHandler);
        return; // Exit early, don't add click handlers
      } else {
        // Custom project banner - display image directly
        const imageUrl = banner.imageUrl;
        
        // Safety check for undefined imageUrl
        if (!imageUrl || imageUrl === 'undefined') {
          console.error('❌ Banner imageUrl is undefined for banner:', banner);
          // Fallback to default advertising banner instead of infinite recursion
          bottomAdContent.innerHTML = `<span class="ad-text">ADVERTISE HERE</span>`;
          // Show advertise button
          const bottomAdSection = document.querySelector('.bottom-ad');
          const advertiseBtn = bottomAdSection.querySelector('.advertise-btn');
          if (advertiseBtn) {
            advertiseBtn.style.display = 'block';
          }
          return;
        }
        
        bottomAdContent.innerHTML = `
          <div class="custom-banner" style="width: 100%; height: 100%; background-image: url('${imageUrl}'); background-size: cover; background-position: center; background-repeat: no-repeat; border-radius: 15px; position: relative; overflow: hidden; cursor: pointer; pointer-events: auto;">
            <div class="banner-overlay" style="position: absolute; bottom: 5px; right: 10px; background: rgba(0,0,0,0.7); color: #00eaff; padding: 2px 8px; border-radius: 4px; font-size: 0.7em; font-weight: 600; pointer-events: none;">
              ${banner.projectName}
            </div>
          </div>
        `;
        bottomAdContent.style.cursor = 'pointer';
        bottomAdContent.style.pointerEvents = 'auto';
        
        // Hide the advertise button when showing custom banner
        const bottomAdSection = document.querySelector('.bottom-ad');
        let advertiseBtn = bottomAdSection.querySelector('.advertise-btn');
        if (advertiseBtn) {
          advertiseBtn.style.display = 'none';
        }
      }
      
      // Only add click handlers for paid banners (non-default)
      if (!banner.isDefault) {
        // Update click handler - use both onclick and addEventListener for better compatibility
        bottomAdContent.onclick = () => this.handleBannerClick(banner, 'bottom');
        
        // Remove any existing click listeners and add new one
        bottomAdContent.removeEventListener('click', bottomAdContent._bannerClickHandler);
        bottomAdContent._bannerClickHandler = (event) => {
          console.log('🖱️ Click event triggered on bottom banner');
          event.preventDefault();
          event.stopPropagation();
          this.handleBannerClick(banner, 'bottom');
        };
        bottomAdContent.addEventListener('click', bottomAdContent._bannerClickHandler);
        
        console.log('🖱️ Bottom banner click handler attached for:', banner.projectName, 'Link:', banner.link || banner.linkUrl);
      }
    }
  }

  // Handle banner clicks
  handleBannerClick(banner, position) {
    const targetUrl = banner.link || banner.linkUrl; // Support both properties
    
    console.log('🖱️ Banner clicked:', {
      projectName: banner.projectName,
      position: position,
      isDefault: banner.isDefault,
      targetUrl: targetUrl
    });
    
    if (banner.isDefault) {
      // Do nothing for default banners - no interaction allowed
      console.log('🎯 Default banner clicked - no action taken');
      return;
    } else {
      // Track click and redirect for paid banners only
      console.log('🔗 Attempting to redirect to:', targetUrl);
      this.trackBannerClick(banner, position);
      
      // Validate URL before opening
      if (targetUrl && targetUrl !== 'undefined') {
        console.log('✅ Opening URL in new tab:', targetUrl);
        try {
          const opened = window.open(targetUrl, '_blank');
          if (opened) {
            console.log('✅ Window opened successfully');
          } else {
            console.error('❌ Popup blocked or failed to open');
            // Fallback: try to navigate in current tab
            window.location.href = targetUrl;
          }
        } catch (error) {
          console.error('❌ Error opening URL:', error);
          // Fallback: try to navigate in current tab
          window.location.href = targetUrl;
        }
      } else {
        console.error('❌ Invalid banner URL:', targetUrl);
        alert('Invalid banner URL: ' + targetUrl);
      }
    }
  }

  // Track banner clicks for analytics
  trackBannerClick(banner, position) {
    const targetUrl = banner.link || banner.linkUrl; // Support both properties
    
    console.log('📊 Banner Click Tracked:', {
      banner: banner.projectName,
      position: position,
      timestamp: new Date().toISOString(),
      url: targetUrl
    });
    
    // Here you could send analytics to your backend
    // fetch('/api/banner-analytics', { ... })
  }

  // Start automatic rotation timer
  startRotationTimer() {
    // Clear existing timer
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
    }
    
    // Set up new timer that checks for expired banners and rotates
    this.rotationTimer = setInterval(() => {
      // Check for expired banners first
      window.BANNER_CONFIG.checkExpiredBanners();
      
      // Then update banner display
      this.updateBanners();
    }, window.BANNER_CONFIG.PRICING.ROTATION_INTERVAL);
    
    // Also set up a more frequent expiration checker (every minute)
    if (this.expirationTimer) {
      clearInterval(this.expirationTimer);
    }
    
    this.expirationTimer = setInterval(() => {
      const expiredCount = window.BANNER_CONFIG.checkExpiredBanners();
      if (expiredCount > 0) {
        console.log(`⏰ Found ${expiredCount} expired banners, updating display...`);
        this.updateBanners();
      }
    }, 60000); // Check every minute
    
    console.log('⏰ Banner rotation timer started with expiration checking');
  }

  // Stop rotation timer
  stopRotationTimer() {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
      console.log('⏹️ Banner rotation timer stopped');
    }
    
    if (this.expirationTimer) {
      clearInterval(this.expirationTimer);
      this.expirationTimer = null;
      console.log('⏹️ Banner expiration timer stopped');
    }
  }







  // Setup click tracking for existing ad banners
  setupClickTracking() {
    // Remove existing click handlers from static "ADVERTISE HERE" content
    const adBanners = document.querySelectorAll('.ad-content');
    adBanners.forEach(banner => {
      // Remove old click handlers
      banner.onclick = null;
    });
  }

  // Get stats for admin
  getStats() {
    const topActive = window.BANNER_CONFIG.getActiveBanners('top').length;
    const bottomActive = window.BANNER_CONFIG.getActiveBanners('bottom').length;
    const timeUntilRotation = window.BANNER_CONFIG.getTimeUntilRotation();
    
    return {
      topBanners: {
        active: topActive,
        available: window.BANNER_CONFIG.PRICING.MAX_PROJECTS_PER_SLOT - topActive,
        current: this.currentTopBanner?.projectName || 'Default'
      },
      bottomBanners: {
        active: bottomActive,
        available: window.BANNER_CONFIG.PRICING.MAX_PROJECTS_PER_SLOT - bottomActive,
        current: this.currentBottomBanner?.projectName || 'Default'
      },
      nextRotation: Math.ceil(timeUntilRotation / 1000 / 60), // minutes
      revenue: {
        dailyPotential: (topActive * window.BANNER_CONFIG.PRICING.TOP_BANNER) + (bottomActive * window.BANNER_CONFIG.PRICING.BOTTOM_BANNER)
      }
    };
  }
  
  // Cleanup method to stop all timers
  destroy() {
    this.stopRotationTimer();
    console.log('🛑 Banner system destroyed');
  }
}

// Create global instance
window.bannerRotationManager = new BannerRotationManager();
