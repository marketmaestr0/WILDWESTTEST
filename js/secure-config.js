// Secure Configuration Manager
// Service-wide token model - Users upload via owner's hidden GitHub token

class SecureConfig {
  constructor() {
    this.isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    
    // Debug: Log what's available in the environment
    console.log('🔍 SecureConfig Debug Info:');
    console.log('  - Environment:', this.isProduction ? 'PRODUCTION' : 'DEVELOPMENT');
    console.log('  - window.SECURE_CONFIG exists:', !!window.SECURE_CONFIG);
    console.log('  - window.ENV_CONFIG exists:', !!window.ENV_CONFIG);
    console.log('  - window.PRODUCTION_CONFIG exists:', !!window.PRODUCTION_CONFIG);
    console.log('  - PRODUCTION_CONFIG.token available:', !!(window.PRODUCTION_CONFIG && window.PRODUCTION_CONFIG.token));
    console.log('  - Available window properties:', Object.keys(window).filter(k => k.includes('CONFIG') || k.includes('TOKEN')));
    
    this.config = this.loadConfig();
  }

  loadConfig() {
    // GitHub-exclusive configuration with service-wide token
    // Users upload banners using the service owner's GitHub token (hidden from them)
    
    // Get token first to avoid circular dependency
    const serviceToken = this.getServiceTokenDirect();
    
    return {
      github: {
        owner: 'cowboytbc',
        repo: 'wildwest-banner-storage', // Your existing storage repository
        token: serviceToken, // Service owner's token - hidden from users
        branch: 'main',
        folder: 'banners',
        baseUrl: 'https://cowboytbc.github.io/wildwest-banner-storage' // GitHub Pages URL for direct access
      },
      storage: 'github', // Exclusively GitHub storage
      paymentVerification: false // No verification needed
    };
  }

  // Direct token retrieval without circular dependency
  getServiceTokenDirect() {
    // Enhanced debugging for token detection
    console.log('🔍 Token Detection Debug:');
    console.log('  - typeof window:', typeof window);
    console.log('  - window.PRODUCTION_CONFIG exists:', !!window.PRODUCTION_CONFIG);
    console.log('  - window.PRODUCTION_CONFIG:', window.PRODUCTION_CONFIG);
    console.log('  - window.PRODUCTION_CONFIG.token exists:', !!(window.PRODUCTION_CONFIG && window.PRODUCTION_CONFIG.token));
    console.log('  - window.PRODUCTION_CONFIG.token value:', window.PRODUCTION_CONFIG ? window.PRODUCTION_CONFIG.token : 'N/A');
    console.log('  - window.PRODUCTION_CONFIG.token type:', window.PRODUCTION_CONFIG ? typeof window.PRODUCTION_CONFIG.token : 'N/A');
    console.log('  - Full PRODUCTION_CONFIG object:', JSON.stringify(window.PRODUCTION_CONFIG, null, 2));
    
    // Check for any override or modification
    if (window.PRODUCTION_CONFIG && window.PRODUCTION_CONFIG.token === null) {
      console.warn('🚨 CRITICAL: PRODUCTION_CONFIG.token was set to null - checking for overrides...');
      console.log('  - Check if original local config overrode injected config');
      console.log('  - Look for any code that sets token to null');
    }
    
    // Method 0: Production token configuration (injected at build time)
    if (typeof window !== 'undefined' && window.PRODUCTION_CONFIG && window.PRODUCTION_CONFIG.token) {
      console.log('✅ Production GitHub token loaded from build-time injection');
      return window.PRODUCTION_CONFIG.token;
    }

    // Method 1: Runtime environment configuration (your service token)
    if (typeof window !== 'undefined' && window.ENV_CONFIG && window.ENV_CONFIG.github && window.ENV_CONFIG.github.token) {
      console.log('✅ Service GitHub token loaded - users can upload anonymously');
      return window.ENV_CONFIG.github.token;
    }

    // Method 2: Environment variables (server deployment)
    if (typeof process !== 'undefined' && process.env && process.env.GITHUB_TOKEN) {
      console.log('✅ Service GitHub token loaded from environment');
      return process.env.GITHUB_TOKEN;
    }
    
    // Method 3: Check for GitHub Secrets injected at build time
    if (typeof window !== 'undefined' && window.GITHUB_SECRETS && window.GITHUB_SECRETS.PERSONAL_ACCESS_TOKEN) {
      console.log('✅ Service GitHub token loaded from GitHub Secrets');
      return window.GITHUB_SECRETS.PERSONAL_ACCESS_TOKEN;
    }
    
    // Method 4: Check for fallback token function
    if (typeof window !== 'undefined' && window.getProductionToken) {
      const fallbackToken = window.getProductionToken();
      if (fallbackToken) {
        console.log('✅ Service GitHub token loaded from fallback detection');
        return fallbackToken;
      }
    }
    
    // Method 5: Check manual token setting from console
    if (typeof window !== 'undefined' && window.MANUAL_GITHUB_TOKEN) {
      console.log('✅ Service GitHub token loaded from manual setting');
      return window.MANUAL_GITHUB_TOKEN;
    }
    
    // Method 6: Hardcoded production token (temporary for testing)
    // This should be replaced by proper GitHub Secrets injection
    console.log('⚠️ Using fallback token detection...');
    console.log('📍 Available globals:', Object.keys(window).filter(k => k.includes('TOKEN') || k.includes('GITHUB') || k.includes('SECRET')));

    // Service not properly configured
    console.error('❌ Cloud storage service not configured - uploads unavailable');
    console.error('🔍 Debug: window.ENV_CONFIG exists?', !!window.ENV_CONFIG);
    console.error('🔍 Debug: process.env exists?', typeof process !== 'undefined' && !!process.env);
    return null;
  }

  // Service token retrieval - Uses owner's token for ALL uploads
  getServiceToken() {
    // Return token from loaded config
    if (this.config && this.config.github && this.config.github.token) {
      return this.config.github.token;
    }
    
    // Fallback to direct token retrieval
    return this.getServiceTokenDirect();
  }

  // Get GitHub configuration
  getGitHubConfig() {
    return this.config.github;
  }

  // Get service GitHub token (owner's token)
  getGitHubToken() {
    return this.config.github.token;
  }

  // Check if GitHub storage is available
  useGitHubStorage() {
    return this.config.storage === 'github';
  }

  // Check if payment verification is enabled
  usePaymentVerification() {
    return this.config.paymentVerification;
  }

  // Check if service is ready for user uploads
  isServiceReady() {
    const token = this.getServiceToken();
    const ready = !!token;
    
    if (ready) {
      console.log('🎉 Service ready - users can upload banners immediately!');
    } else {
      console.warn('⚠️ Service not ready - GitHub token not configured');
    }
    
    return ready;
  }

  // Security: Comprehensive file validation
  validateUploadFile(file) {
    const validationResult = {
      isValid: false,
      errors: []
    };

    // Check if file exists
    if (!file) {
      validationResult.errors.push('No file selected');
      return validationResult;
    }

    // File size validation (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      validationResult.errors.push('File too large (max 5MB)');
    }

    // File type validation - only images
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      validationResult.errors.push('Invalid file type. Only JPEG, PNG, GIF, and WebP images allowed');
    }

    // File name validation
    if (file.name.length > 100) {
      validationResult.errors.push('File name too long (max 100 characters)');
    }

    // Check for suspicious file extensions
    const suspiciousExtensions = ['.exe', '.js', '.html', '.php', '.asp', '.jsp'];
    const fileName = file.name.toLowerCase();
    if (suspiciousExtensions.some(ext => fileName.includes(ext))) {
      validationResult.errors.push('Suspicious file extension detected');
    }

    validationResult.isValid = validationResult.errors.length === 0;
    return validationResult;
  }

  // Security: Validate banner data
  validateBannerData(data) {
    const validationResult = {
      isValid: false,
      errors: [],
      sanitizedData: {}
    };

    // Project name validation
    if (!data.projectName || typeof data.projectName !== 'string') {
      validationResult.errors.push('Project name is required');
    } else if (data.projectName.trim().length < 2) {
      validationResult.errors.push('Project name must be at least 2 characters');
    } else if (data.projectName.length > 50) {
      validationResult.errors.push('Project name too long (max 50 characters)');
    } else {
      validationResult.sanitizedData.projectName = this.sanitizeHTML(data.projectName.trim());
    }

    // URL validation
    if (!data.linkUrl || typeof data.linkUrl !== 'string') {
      validationResult.errors.push('Link URL is required');
    } else if (!this.isValidURL(data.linkUrl)) {
      validationResult.errors.push('Invalid URL format');
    } else {
      validationResult.sanitizedData.linkUrl = data.linkUrl.trim();
    }

    // Position validation
    if (!['top', 'bottom'].includes(data.position)) {
      validationResult.errors.push('Invalid banner position');
    } else {
      validationResult.sanitizedData.position = data.position;
    }

    // Duration validation
    const duration = parseInt(data.duration);
    if (isNaN(duration) || duration < 1 || duration > 365) {
      validationResult.errors.push('Duration must be between 1 and 365 days');
    } else {
      validationResult.sanitizedData.duration = duration;
    }

    validationResult.isValid = validationResult.errors.length === 0;
    return validationResult;
  }

    // Main upload method - Uses GitHub API directly with secrets
  async uploadBannerToGitHub(file, position, projectName, linkUrl, endDate) {
    console.log('🎯 Using secure cloud storage upload');
    
    // Validate file using existing validation
    const fileValidation = this.validateUploadFile(file);
    if (!fileValidation.isValid) {
      throw new Error(`File validation failed: ${fileValidation.errors.join(', ')}`);
    }
    
    try {
      // Convert file to base64
      const base64Content = await this.fileToBase64(file);
      
      // Create filename with metadata encoding
      const timestamp = Date.now();
      const endDateStr = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Default 30 days
      const encodedUrl = btoa(linkUrl).replace(/[+/=]/g, (m) => ({'+': '-', '/': '_', '=': ''}[m])); // URL-safe base64
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const fileName = `${projectName}_${endDateStr}_${timestamp}_${encodedUrl}.${fileExtension}`;
      
      // Get GitHub configuration
      const githubConfig = this.getGitHubConfig();
      
      // Direct token check with enhanced debugging
      console.log('🔍 Token Debug:');
      console.log('  - githubConfig.token:', !!githubConfig.token);
      console.log('  - getServiceToken():', !!this.getServiceToken());
      console.log('  - config.github.token:', !!this.config?.github?.token);
      
      let token = githubConfig.token || this.getServiceToken();
      
      // Emergency fallback - check if there's a production config available
      if (!token && window.SECURE_CONFIG && window.SECURE_CONFIG !== this) {
        console.log('🔧 Trying production SECURE_CONFIG fallback...');
        token = window.SECURE_CONFIG.getGitHubToken?.() || window.SECURE_CONFIG.getServiceToken?.();
        console.log('  - Production config token available:', !!token);
      }
      
      if (!token) {
        console.error('❌ No token found in any source:');
        console.error('  - window.ENV_CONFIG:', !!window.ENV_CONFIG);
        console.error('  - window.SECURE_CONFIG:', !!window.SECURE_CONFIG);
        console.error('  - process.env:', typeof process !== 'undefined');
        throw new Error('Storage service not available from any source - check deployment configuration');
      }
      
      console.log('✅ Using cloud storage token for upload');
      githubConfig.token = token; // Set it for this upload
      
      // Determine folder path
      let folderPath = '';
      switch (position) {
        case 'top':
          folderPath = 'banners/top';
          break;
        case 'bottom':
          folderPath = 'banners/bottom';
          break;
        case 'project-banner':
          folderPath = 'project-banners';
          break;
        case 'project-logo':
          folderPath = 'project-logos';
          break;
        case 'trader-pfp':
          folderPath = 'trader-pfps';
          break;
        default:
          folderPath = 'banners';
      }
      
      const filePath = folderPath + '/' + fileName;
      
      // GitHub API URL
      const apiUrl = `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${filePath}`;
      
      console.log(`📁 Uploading banner to secure storage: ${fileName}`);
      
      // Upload directly to GitHub API
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${githubConfig.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'WildWest-Launchpad'
        },
        body: JSON.stringify({
          message: `Upload ${position} banner: ${projectName}`,
          content: base64Content,
          branch: githubConfig.branch || 'main'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        console.error('❌ Cloud storage API error:', errorData);
        throw new Error(`Storage upload failed: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Banner uploaded successfully to secure storage!');
      
        return {
        success: true,
        url: result.download_url,
        fileName: fileName,
        message: 'Banner uploaded successfully to secure storage!'
      };    } catch (error) {
      console.error('❌ Banner upload failed:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  // Convert file to base64 string
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Return the base64 content without the data:image/xxx;base64, prefix
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Get banners from GitHub directly
  async getBannersFromGitHub() {
    const config = this.getGitHubConfig();
    const token = this.getGitHubToken();
    
    try {
      const headers = {};
      if (token) {
        headers['Authorization'] = `token ${token}`;
      }

      const response = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.folder}`, {
        headers
      });

      if (!response.ok) {
        console.warn(`GitHub API error: ${response.status}. Falling back to public access.`);
        return { top: [], bottom: [] };
      }

      const folders = await response.json();
      const banners = { top: [], bottom: [] };

      for (const folder of folders) {
        if (folder.type === 'dir' && (folder.name === 'top' || folder.name === 'bottom')) {
          const folderResponse = await fetch(folder.url, { headers });

          if (folderResponse.ok) {
            const files = await folderResponse.json();
            banners[folder.name] = files.filter(file => 
              file.type === 'file' && /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)
            ).map(file => ({
              name: file.name,
              url: `${config.baseUrl}/${config.folder}/${folder.name}/${file.name}`, // Use GitHub Pages URL
              githubUrl: file.download_url, // Keep original for backup
              size: file.size
            }));
          }
        }
      }

      console.log('📁 Loaded banners from GitHub:', banners);
      return banners;
    } catch (error) {
      console.error('Failed to fetch banners from GitHub:', error);
      return { top: [], bottom: [] };
    }
  }

  // Security utility: Sanitize HTML content to prevent XSS
  sanitizeHTML(str) {
    if (typeof str !== 'string') return '';
    
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Security utility: Validate and sanitize file names
  sanitizeFileName(fileName) {
    if (typeof fileName !== 'string') return 'unknown';
    
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace unsafe chars
      .replace(/^\.+/, '') // Remove leading dots
      .replace(/\.+$/, '') // Remove trailing dots
      .substring(0, 100); // Limit length
  }

  // Security utility: Validate URLs
  isValidURL(url) {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  // Security utility: Safe DOM updates to prevent XSS
  setElementContent(elementId, content, isHTML = false) {
    const element = document.getElementById(elementId);
    if (!element) return false;

    if (isHTML) {
      // Sanitize HTML content before insertion
      element.innerHTML = this.sanitizeHTML(content);
    } else {
      // Use textContent for text-only updates (XSS-safe)
      element.textContent = content;
    }
    return true;
  }

  // Security utility: Create safe HTML with sanitized content
  createSafeHTML(template, data = {}) {
    let html = template;
    
    // Replace placeholders with sanitized data
    Object.keys(data).forEach(key => {
      const placeholder = `{{${key}}}`;
      const value = this.sanitizeHTML(data[key]);
      html = html.replace(new RegExp(placeholder, 'g'), value);
    });
    
    return html;
  }

  // Security: Get admin wallets from secure configuration
  getAdminWallets() {
    // In production, these should come from server-side API or secure environment variables
    // For development, use localStorage or environment variables
    const defaultAdmins = [
      '0x9360c80CA79409b5e315A9791bB0208C02D6ae32', // Base fee collector
      'F9YqZs2nLqNPKGfTCjKb8AiVADivAEsWumHVWWFyPQgV'  // Solana fee collector
    ];

    // Check for environment variables (Node.js)
    if (typeof process !== 'undefined' && process.env) {
      const envAdmins = process.env.ADMIN_WALLETS;
      if (envAdmins) {
        return envAdmins.split(',').map(addr => addr.trim());
      }
    }

    // Check for localStorage configuration
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedAdmins = localStorage.getItem('admin_wallets_secure');
      if (storedAdmins) {
        try {
          return JSON.parse(storedAdmins);
        } catch (error) {
          console.warn('Invalid admin wallets configuration in localStorage');
        }
      }
    }

    return defaultAdmins;
  }

  // Security: Check if wallet address is admin
  isAdminWallet(walletAddress) {
    if (!walletAddress) return false;
    
    const adminWallets = this.getAdminWallets();
    const userAddress = walletAddress.toLowerCase();
    
    return adminWallets.some(adminAddr => {
      // For Ethereum addresses, compare lowercase
      if (adminAddr.startsWith('0x')) {
        return adminAddr.toLowerCase() === userAddress;
      }
      // For Solana addresses, compare exactly (case-sensitive)
      return adminAddr === walletAddress;
    });
  }

  // =============================
  // Project storage (projects.json)
  // Reuses the same GitHub token & repo settings as banner uploads
  // =============================

  // Validate a project entry
  validateProjectEntry(entry) {
    const errors = [];
    const out = {};

    const chainId = typeof entry?.chainId === 'string' ? entry.chainId.trim() : String(entry?.chainId || '').trim();
    const tokenAddress = typeof entry?.tokenAddress === 'string' ? entry.tokenAddress.trim() : String(entry?.tokenAddress || entry?.address || '').trim();
    const name = typeof entry?.name === 'string' ? entry.name.trim() : undefined;
    const logoUrl = typeof entry?.logoUrl === 'string' ? entry.logoUrl.trim() : undefined;

    if (!chainId) errors.push('chainId is required');
    if (!tokenAddress) errors.push('tokenAddress is required');

    out.chainId = chainId.toLowerCase();
    out.tokenAddress = tokenAddress.toLowerCase();
    if (name) out.name = name;
    if (logoUrl) out.logoUrl = logoUrl;

    return { isValid: errors.length === 0, errors, data: out };
  }

  // Safe base64 for JSON strings
  toBase64(str) {
    try {
      return btoa(unescape(encodeURIComponent(str)));
    } catch (_) {
      return btoa(str);
    }
  }

  fromBase64(b64) {
    try {
      return decodeURIComponent(escape(atob(b64)));
    } catch (_) {
      return atob(b64);
    }
  }

  normalizeProject(p) {
    return {
      chainId: String(p?.chainId || '').toLowerCase(),
      tokenAddress: String(p?.tokenAddress || p?.address || '').toLowerCase(),
      name: p?.name || undefined,
      logoUrl: p?.logoUrl || undefined
    };
  }

  dedupeProjects(list) {
    const seen = new Set();
    const out = [];
    for (const p of list || []) {
      const np = this.normalizeProject(p);
      if (!np.chainId || !np.tokenAddress) continue;
      const key = `${np.chainId}:${np.tokenAddress}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(np);
    }
    return out;
  }

  async getProjectsFile() {
    const cfg = this.getGitHubConfig();
    const token = this.getGitHubToken();
    const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/projects.json?ref=${cfg.branch || 'main'}`;
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'WildWest-Projects'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, { headers });
    if (res.status === 404) {
      return { sha: null, json: { projects: [] } };
    }
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`GitHub get projects.json failed: ${res.status} ${txt}`);
    }
    const data = await res.json();
    const content = this.fromBase64(data.content || '');
    let json;
    try {
      json = JSON.parse(content);
    } catch {
      json = { projects: [] };
    }
    return { sha: data.sha, json };
  }

  async putProjectsFile(updatedJson, sha) {
    const cfg = this.getGitHubConfig();
    const token = this.getGitHubToken();
    if (!token) throw new Error('GitHub token unavailable for projects update');

    const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/projects.json`;
    const body = {
      message: 'chore: add/update project via site factory',
      content: this.toBase64(JSON.stringify(updatedJson, null, 2)),
      branch: cfg.branch || 'main',
      sha: sha || undefined
    };
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'WildWest-Projects'
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`GitHub update projects.json failed: ${res.status} ${txt}`);
    }
    return res.json();
  }

  // Public: add a project using the same GitHub method as banner uploads
  async addProjectToStorage(entry) {
    const v = this.validateProjectEntry(entry);
    if (!v.isValid) {
      throw new Error('Invalid project entry: ' + v.errors.join(', '));
    }
    const { sha, json } = await this.getProjectsFile();
    const current = Array.isArray(json) ? json : Array.isArray(json.projects) ? json.projects : [];
    const merged = this.dedupeProjects([...current, v.data]);
    const updated = { projects: merged };
    await this.putProjectsFile(updated, sha);
    return { ok: true, count: merged.length };
  }
}

// Create global instance
window.SECURE_CONFIG = new SecureConfig();

console.log('🎯 Service-wide GitHub configuration loaded:', {
  isProduction: window.SECURE_CONFIG.isProduction,
  useGitHubStorage: window.SECURE_CONFIG.useGitHubStorage(),
  usePaymentVerification: window.SECURE_CONFIG.usePaymentVerification(),
  serviceReady: window.SECURE_CONFIG.isServiceReady(),
  storageRepo: window.SECURE_CONFIG.getGitHubConfig().repo,
  tokenStatus: window.SECURE_CONFIG.getGitHubToken() ? '✅ Service Ready' : '❌ Service Unavailable'
});
