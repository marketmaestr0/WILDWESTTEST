// Banner rental configuration and management system - PRODUCTION READY
// Pricing: Top Banner $200/day, Bottom Banner $100/day
// Maximum 20 projects per banner slot
// 5-minute rotation intervals

const BANNER_CONFIG = {
  // Pricing configuration
  PRICING: {
    TOP_BANNER: 200, // $200 per day
    BOTTOM_BANNER: 100, // $100 per day
    MAX_PROJECTS_PER_SLOT: 20,
    ROTATION_INTERVAL: 5 * 60 * 1000 // 5 minutes in milliseconds
  },

  // GitHub API configuration for fetching banners
  API_CONFIG: {
    baseUrl: 'https://api.github.com/repos',
    endpoints: {
      contents: '/contents/banners',
      raw: 'https://raw.githubusercontent.com'
    }
  },

  // Cache for banner data
  _bannerCache: {
    top: [],
    bottom: [],
    lastFetch: null,
    cacheExpiry: 5 * 60 * 1000 // 5 minutes cache
  },

  // Top banner slots (fetched from GitHub)
  get TOP_BANNERS() {
    return this._bannerCache.top;
  },

  // Bottom banner slots (fetched from GitHub)  
  get BOTTOM_BANNERS() {
    return this._bannerCache.bottom;
  },

  // Fetch banners from GitHub repository - PRODUCTION READY
  async fetchBannersFromGitHub() {
    try {
      const now = Date.now();
      
      // Check if cache is still valid
      if (this._bannerCache.lastFetch && 
          (now - this._bannerCache.lastFetch) < this._bannerCache.cacheExpiry) {
        console.log('📦 Using cached banner data');
        return true;
      }

      console.log('🔄 Fetching banners from cloud storage...');
      
      // Use serverless proxy for production, direct API for development
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1');
      
      // Use direct GitHub API for production
      if (isLocalhost) {
        return await this.fetchBannersLocal();
      } else {
        return await this.fetchBannersGitHub();
      }

    } catch (error) {
      console.error('❌ Error fetching banners from cloud storage:', error);
      console.log('🔧 Banner system disabled - check configuration');
      return false;
    }
  },

  // Alias for fetchBannersFromGitHub for compatibility
  async fetchBanners() {
    return await this.fetchBannersFromGitHub();
  },

  // Local development banner fetching - uses same GitHub API
  async fetchBannersLocal() {
    console.log('🔧 Local development - using cloud storage API...');
    return await this.fetchBannersGitHub();
  },

  // Setup default banners when repository doesn't exist
  setupDefaultBanners() {
    console.log('🎯 Setting up default banners - repository will be created on first upload');
    
    this._bannerCache.top = [];
    this._bannerCache.bottom = [];
    this._bannerCache.lastFetch = Date.now();
    
    console.log('✅ Default banner configuration ready');
  },

  // Force refresh banner cache
  clearCache() {
    this._bannerCache.top = [];
    this._bannerCache.bottom = [];
    this._bannerCache.lastFetch = null;
    console.log('🗑️ Banner cache cleared - will fetch fresh data');
  },

  // Production banner fetching via GitHub API
  async fetchBannersGitHub() {
    console.log('🌐 Using secure cloud storage for production...');
    
    try {
      // Get GitHub configuration - use fallback if SECURE_CONFIG not available
      let githubConfig = window.SECURE_CONFIG ? window.SECURE_CONFIG.getGitHubConfig() : null;
      
      // Fallback configuration if SECURE_CONFIG is not available
      if (!githubConfig) {
        console.log('📦 Using fallback GitHub config for banner storage');
        githubConfig = {
          owner: 'cowboytbc',
          repo: 'wildwest-banner-storage',
          baseUrl: 'https://cowboytbc.github.io/wildwest-banner-storage'
        };
      }
      
      // Fetch banners from GitHub repository
      const topBannersUrl = `${this.API_CONFIG.baseUrl}/${githubConfig.owner}/${githubConfig.repo}/contents/banners/top`;
      const bottomBannersUrl = `${this.API_CONFIG.baseUrl}/${githubConfig.owner}/${githubConfig.repo}/contents/banners/bottom`;
      
      console.log('🔄 Fetching banners from GitHub API...');
      
      const [topResponse, bottomResponse] = await Promise.all([
        fetch(topBannersUrl).catch(() => ({ ok: false })),
        fetch(bottomBannersUrl).catch(() => ({ ok: false }))
      ]);
      
      const topBanners = [];
      const bottomBanners = [];
      
      if (topResponse.ok) {
        const topFiles = await topResponse.json();
        if (Array.isArray(topFiles)) {
          for (const file of topFiles) {
            if (file.type === 'file' && this.isImageFile(file.name)) {
              topBanners.push(this.createBannerFromFile(file, 'top', githubConfig));
            }
          }
        }
      }
      
      if (bottomResponse.ok) {
        const bottomFiles = await bottomResponse.json();
        if (Array.isArray(bottomFiles)) {
          for (const file of bottomFiles) {
            if (file.type === 'file' && this.isImageFile(file.name)) {
              bottomBanners.push(this.createBannerFromFile(file, 'bottom', githubConfig));
            }
          }
        }
      }
      
      this._bannerCache.top = topBanners;
      this._bannerCache.bottom = bottomBanners;
      this._bannerCache.lastFetch = Date.now();

      console.log(`✅ Processed ${topBanners.length} top banners and ${bottomBanners.length} bottom banners from GitHub`);
      return true;
      
    } catch (error) {
      console.error('❌ Error fetching banners from GitHub API:', error);
      this.setupDefaultBanners();
      return false;
    }
  },
  
  // Helper function to check if file is an image
  isImageFile(filename) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  },
  
  // Create banner object from GitHub file
  createBannerFromFile(file, position, githubConfig) {
    // Extract URL from filename format: ProjectName_YYYY-MM-DD_timestamp_encodedUrl.ext
    let decodedUrl = 'mailto:ads@wildwestlaunchpad.com?subject=Banner Advertising Inquiry'; // fallback
    
    try {
      const parts = file.name.split('_');
      if (parts.length >= 4) {
        // Get the encoded URL part (4th part, before file extension)
        const encodedUrlPart = parts[3].split('.')[0]; // Remove file extension
        
        // Reverse the URL-safe base64 encoding: restore +, /, and =
        const base64Url = encodedUrlPart.replace(/-/g, '+').replace(/_/g, '/');
        
        // Pad with = if needed for proper base64 decoding
        const paddedBase64 = base64Url + '='.repeat((4 - base64Url.length % 4) % 4);
        
        // Decode from base64
        decodedUrl = atob(paddedBase64);
        
        console.log(`🔗 Decoded banner URL (createBannerFromFile): ${file.name} -> ${decodedUrl}`);
      }
    } catch (urlError) {
      console.warn(`⚠️ Could not decode URL from filename ${file.name}, using fallback:`, urlError);
    }
    
    return {
      imageUrl: `${this.API_CONFIG.endpoints.raw}/${githubConfig.owner}/${githubConfig.repo}/main/${file.path}`,
      link: decodedUrl,
      linkUrl: decodedUrl,
      position: position,
      isDefault: false,
      filename: file.name,
      projectName: this.extractProjectNameFromFilename(file.name),
      id: `github_${file.sha}`,
      active: true
    };
  },
  
  // Extract project name from filename
  extractProjectNameFromFilename(filename) {
    // Extract project name from filename format: ProjectName_YYYY-MM-DD_timestamp_encodedUrl.ext
    const parts = filename.split('_');
    return parts[0] || 'Advertiser';
  },

  // Process banner data from serverless API
  processBannerData(banners) {
    // Process banners and decode URLs
    const processedBanners = { top: [], bottom: [] };
    
    // Process top banners
    if (banners.top && Array.isArray(banners.top)) {
      processedBanners.top = banners.top.map(banner => {
        return this.decodeBannerUrl(banner);
      });
    }
    
    // Process bottom banners  
    if (banners.bottom && Array.isArray(banners.bottom)) {
      processedBanners.bottom = banners.bottom.map(banner => {
        return this.decodeBannerUrl(banner);
      });
    }
    
    // Cache the processed banners
    this._bannerCache.top = processedBanners.top;
    this._bannerCache.bottom = processedBanners.bottom;
    this._bannerCache.lastFetch = Date.now();
    
    console.log(`✅ Processed ${this._bannerCache.top.length} top banners and ${this._bannerCache.bottom.length} bottom banners`);
    return true;
  },

  // Helper function to decode banner URL from filename
  decodeBannerUrl(banner) {
    if (!banner.filename && !banner.name) return banner;
    
    const filename = banner.filename || banner.name;
    let decodedUrl = 'mailto:ads@wildwestlaunchpad.com?subject=Banner Advertising Inquiry'; // fallback
    
    try {
      const parts = filename.split('_');
      if (parts.length >= 4) {
        // Get the encoded URL part (4th part, before file extension)
        const encodedUrlPart = parts[3].split('.')[0]; // Remove file extension
        
        // Reverse the URL-safe base64 encoding: restore +, /, and =
        const base64Url = encodedUrlPart.replace(/-/g, '+').replace(/_/g, '/');
        
        // Pad with = if needed for proper base64 decoding
        const paddedBase64 = base64Url + '='.repeat((4 - base64Url.length % 4) % 4);
        
        // Decode from base64
        decodedUrl = atob(paddedBase64);
        
        console.log(`🔗 Decoded banner URL (decodeBannerUrl): ${filename} -> ${decodedUrl}`);
      }
    } catch (urlError) {
      console.warn(`⚠️ Could not decode URL from filename ${filename}, using fallback:`, urlError);
    }
    
    // Return banner with decoded URL and project name
    return {
      ...banner,
      link: decodedUrl,
      linkUrl: decodedUrl,
      projectName: this.extractProjectNameFromFilename(filename) || banner.projectName || 'Advertiser'
    };
  },

  // Process banner files from direct GitHub API
  async processBannerFiles(files) {
    const topBanners = [];
    const bottomBanners = [];
    
    for (const file of files) {
      if (file.type === 'file' && (file.name.endsWith('.jpg') || file.name.endsWith('.png') || file.name.endsWith('.gif'))) {
        const bannerData = await this.parseBannerFromFile(file);
        if (bannerData) {
          if (bannerData.position === 'top') {
            topBanners.push(bannerData);
          } else if (bannerData.position === 'bottom') {
            bottomBanners.push(bannerData);
          }
        }
      }
    }

    this._bannerCache.top = topBanners;
    this._bannerCache.bottom = bottomBanners;
    this._bannerCache.lastFetch = Date.now();

    console.log(`✅ Fetched ${topBanners.length} top banners and ${bottomBanners.length} bottom banners from GitHub`);
    return true;
  },

  // Process banner data from serverless proxy
  async processBannerData(banners) {
    const topBanners = [];
    const bottomBanners = [];
    
    for (const banner of banners) {
      // Extract URL from banner name if it follows the encoded format
      let decodedUrl = 'mailto:ads@wildwestlaunchpad.com?subject=Banner Advertising Inquiry'; // fallback
      
      try {
        const parts = banner.name.split('_');
        if (parts.length >= 4) {
          // Get the encoded URL part (4th part, before file extension)
          const encodedUrlPart = parts[3].split('.')[0]; // Remove file extension
          
          // Reverse the URL-safe base64 encoding: restore +, /, and =
          const base64Url = encodedUrlPart.replace(/-/g, '+').replace(/_/g, '/');
          
          // Pad with = if needed for proper base64 decoding
          const paddedBase64 = base64Url + '='.repeat((4 - base64Url.length % 4) % 4);
          
          // Decode from base64
          decodedUrl = atob(paddedBase64);
          
          console.log(`🔗 Decoded banner URL (processBannerData): ${banner.name} -> ${decodedUrl}`);
        }
      } catch (urlError) {
        console.warn(`⚠️ Could not decode URL from banner name ${banner.name}, using fallback:`, urlError);
      }
      
      const bannerData = {
        imageUrl: banner.url,
        link: decodedUrl,
        linkUrl: decodedUrl, // Add for compatibility
        position: banner.name.toLowerCase().includes('top') ? 'top' : 'bottom',
        isDefault: false,
        filename: banner.name,
        projectName: this.extractProjectNameFromFilename(banner.name), // Extract project name
        id: `proxy_${banner.name}`, // Add unique ID
        active: true
      };
      
      if (bannerData.position === 'top') {
        topBanners.push(bannerData);
      } else {
        bottomBanners.push(bannerData);
      }
    }

    this._bannerCache.top = topBanners;
    this._bannerCache.bottom = bottomBanners;
    this._bannerCache.lastFetch = Date.now();

    console.log(`✅ Fetched ${topBanners.length} top banners and ${bottomBanners.length} bottom banners via proxy`);
    return true;
  },

  // Parse banner information from GitHub file
  async parseBannerFromFile(file) {
    try {
      const imageUrl = file.download_url;
      const fileName = file.name.toLowerCase();
      
      // Determine position from filename
      let position = 'bottom'; // default
      if (fileName.includes('top')) {
        position = 'top';
      }
      
      // Extract URL from filename format: ProjectName_YYYY-MM-DD_timestamp_encodedUrl.ext
      let decodedUrl = 'mailto:ads@wildwestlaunchpad.com?subject=Banner Advertising Inquiry'; // fallback
      
      try {
        const parts = file.name.split('_');
        if (parts.length >= 4) {
          // Get the encoded URL part (4th part, before file extension)
          const encodedUrlPart = parts[3].split('.')[0]; // Remove file extension
          
          // Reverse the URL-safe base64 encoding: restore +, /, and =
          const base64Url = encodedUrlPart.replace(/-/g, '+').replace(/_/g, '/');
          
          // Pad with = if needed for proper base64 decoding
          const paddedBase64 = base64Url + '='.repeat((4 - base64Url.length % 4) % 4);
          
          // Decode from base64
          decodedUrl = atob(paddedBase64);
          
          console.log(`🔗 Decoded banner URL: ${file.name} -> ${decodedUrl}`);
        }
      } catch (urlError) {
        console.warn(`⚠️ Could not decode URL from filename ${file.name}, using fallback:`, urlError);
      }
      
      return {
        imageUrl: imageUrl,
        link: decodedUrl,
        linkUrl: decodedUrl, // Add for compatibility
        position: position,
        isDefault: false,
        filename: file.name,
        projectName: this.extractProjectNameFromFilename(file.name), // Extract project name
        size: file.size
      };
    } catch (error) {
      console.error('Error parsing banner file:', error);
      return null;
    }
  },

  // Rest of the configuration methods...
  getActiveBanners: function(position) {
    const banners = position === 'top' ? this.TOP_BANNERS : this.BOTTOM_BANNERS;
    const now = Date.now();
    
    return banners.filter(banner => {
      // Default banners are always active
      if (banner.isDefault) return true;
      
      // Check if banner has expired based on endDate
      if (banner.endDate && now > banner.endDate.getTime()) {
        console.log(`⏰ Filtering out expired banner: ${banner.projectName} (expired ${banner.endDate.toDateString()})`);
        return false;
      }
      
      // GitHub banners without timing info are always active (old format)
      if (!banner.startTime && !banner.duration && !banner.endDate) return true;
      
      // New format banners are active if not expired
      if (banner.endDate && !banner.isExpired) return true;
      
      // Legacy paid banners with startTime/duration timing
      if (banner.startTime && banner.duration) {
        return now >= banner.startTime && now <= (banner.startTime + banner.duration);
      }
      
      // Default to inactive if no valid timing found
      return false;
    });
  },

  getCurrentBanner: function(position) {
    const activeBanners = this.getActiveBanners(position);
    if (activeBanners.length === 0) {
      return this.getDefaultBanner(position);
    }
    
    const rotationIndex = Math.floor(Date.now() / this.PRICING.ROTATION_INTERVAL) % activeBanners.length;
    return activeBanners[rotationIndex];
  },

  // Check for expired banners and clean up cache
  checkExpiredBanners: function() {
    const now = Date.now();
    let expiredCount = 0;
    
    // Check top banners
    this._bannerCache.top = this._bannerCache.top.filter(banner => {
      if (banner.endDate && now > banner.endDate.getTime()) {
        console.log(`🗑️ Removing expired top banner: ${banner.projectName}`);
        expiredCount++;
        return false;
      }
      return true;
    });
    
    // Check bottom banners
    this._bannerCache.bottom = this._bannerCache.bottom.filter(banner => {
      if (banner.endDate && now > banner.endDate.getTime()) {
        console.log(`🗑️ Removing expired bottom banner: ${banner.projectName}`);
        expiredCount++;
        return false;
      }
      return true;
    });
    
    if (expiredCount > 0) {
      console.log(`⏰ Cleaned up ${expiredCount} expired banners`);
      // Trigger banner rotation update if banners expired
      if (window.bannerRotationManager) {
        window.bannerRotationManager.updateBanners();
      }
    }
    
    return expiredCount;
  },

  getDefaultBanner: function(position) {
    return {
      imageUrl: `https://via.placeholder.com/728x90/FF6B35/FFFFFF?text=Advertise+Here+-+${position === 'top' ? '$200' : '$100'}/day`,
      link: 'mailto:ads@wildwestlaunchpad.com?subject=Banner Advertising Inquiry&body=Hi, I\'d like to inquire about banner advertising on your platform.',
      isDefault: true
    };
  }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BANNER_CONFIG;
}

// Make globally available
window.BANNER_CONFIG = BANNER_CONFIG;

// Add test functions for development
window.refreshBannerCache = function() {
  BANNER_CONFIG.clearCache();
  return BANNER_CONFIG.fetchBannersFromGitHub();
};

window.testBannerRepository = async function() {
  console.log('🧪 Testing banner repository connection...');
  try {
    const result = await BANNER_CONFIG.fetchBannersFromGitHub();
    console.log('✅ Repository test result:', result);
    console.log('📊 Cached banners:', {
      top: BANNER_CONFIG.TOP_BANNERS.length,
      bottom: BANNER_CONFIG.BOTTOM_BANNERS.length
    });
    return result;
  } catch (error) {
    console.error('❌ Repository test failed:', error);
    return false;
  }
};

// Debug function to test URL decoding
window.testUrlDecoding = function(filename) {
  console.log('🧪 Testing URL decoding for filename:', filename);
  
  try {
    const parts = filename.split('_');
    console.log('📍 Filename parts:', parts);
    
    if (parts.length >= 4) {
      const encodedUrlPart = parts[3].split('.')[0];
      console.log('📍 Encoded URL part:', encodedUrlPart);
      
      const base64Url = encodedUrlPart.replace(/-/g, '+').replace(/_/g, '/');
      console.log('📍 Restored base64:', base64Url);
      
      const paddedBase64 = base64Url + '='.repeat((4 - base64Url.length % 4) % 4);
      console.log('📍 Padded base64:', paddedBase64);
      
      const decodedUrl = atob(paddedBase64);
      console.log('🔗 Final decoded URL:', decodedUrl);
      
      return decodedUrl;
    } else {
      console.log('❌ Filename does not have enough parts');
      return null;
    }
  } catch (error) {
    console.error('❌ Decoding failed:', error);
    return null;
  }
};

// Debug function to check current banners
window.debugBanners = function() {
  console.log('🧪 Current banner data:');
  console.log('Top banners:', BANNER_CONFIG.TOP_BANNERS);
  console.log('Bottom banners:', BANNER_CONFIG.BOTTOM_BANNERS);
  
  // Test current banners
  const currentTop = BANNER_CONFIG.getCurrentBanner('top');
  const currentBottom = BANNER_CONFIG.getCurrentBanner('bottom');
  
  console.log('Current top banner:', currentTop);
  console.log('Current bottom banner:', currentBottom);
  
  return {
    top: currentTop,
    bottom: currentBottom
  };
};

// Debug function to force refresh banners
window.forceRefreshBanners = function() {
  console.log('🔄 Force refreshing banners...');
  BANNER_CONFIG.clearCache();
  return BANNER_CONFIG.fetchBannersFromGitHub().then(() => {
    console.log('✅ Banners refreshed, updating rotation system...');
    if (window.bannerRotationManager) {
      window.bannerRotationManager.updateBanners();
    }
    return window.debugBanners();
  });
};

console.log('🎯 Banner configuration loaded:', {
  topBannerPrice: BANNER_CONFIG.PRICING.TOP_BANNER,
  bottomBannerPrice: BANNER_CONFIG.PRICING.BOTTOM_BANNER,
  rotationInterval: BANNER_CONFIG.PRICING.ROTATION_INTERVAL / 1000 / 60 + ' minutes',
  maxProjectsPerSlot: BANNER_CONFIG.PRICING.MAX_PROJECTS_PER_SLOT,
  apiEndpoints: BANNER_CONFIG.API_CONFIG.endpoints
});
