// Token Metadata Storage - GitHub Integration
// Extends the existing GitHub Actions uploader for token metadata

class TokenMetadataStorage {
    constructor() {
        this.baseApiUrl = 'https://api.github.com/repos';
        this.imageUploader = new GitHubActionsUploader();
        console.log('🗄️ Token Metadata Storage initialized');
    }

    getGitHubConfig() {
        console.log('🔍 TokenMetadataStorage - Checking GitHub config availability...');
        console.log('  - window.SECURE_CONFIG exists:', !!window.SECURE_CONFIG);
        console.log('  - window.SECURE_CONFIG type:', typeof window.SECURE_CONFIG);
        
        if (typeof window.SECURE_CONFIG === 'undefined') {
            console.error('❌ SECURE_CONFIG not loaded. Make sure secure-config.js is included.');
            throw new Error('Secure configuration not loaded. Make sure secure-config.js is included.');
        }
        
        console.log('  - SECURE_CONFIG.getGitHubConfig exists:', typeof window.SECURE_CONFIG.getGitHubConfig);
        console.log('  - SECURE_CONFIG.getGitHubToken exists:', typeof window.SECURE_CONFIG.getGitHubToken);
        
        const config = window.SECURE_CONFIG.getGitHubConfig();
        console.log('  - GitHub config retrieved:', !!config);
        
        const token = window.SECURE_CONFIG.getGitHubToken();
        console.log('  - GitHub token retrieved:', !!token);
        console.log('  - Token length:', token ? token.length : 'N/A');
        
        if (!token) {
            console.error('❌ No GitHub token found in SECURE_CONFIG');
            
            // Development fallback - try to use a demo/development mode
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.warn('🔧 Development mode detected - attempting to use demo storage');
                // Create a mock configuration for development testing
                return {
                    ...config,
                    token: 'dev-mode', // Special marker for development
                    isDevelopmentMode: true
                };
            }
            
            throw new Error('GitHub token not available. Service not properly configured.');
        }
        
        console.log('✅ TokenMetadataStorage - GitHub config ready');
        
        // Debug the config object
        console.log('🔍 Raw config object:', config);
        console.log('🔍 Config owner:', config ? config.owner : 'CONFIG IS NULL');
        console.log('🔍 Config repo:', config ? config.repo : 'CONFIG IS NULL');
        
        // Override the repository for token metadata storage
        // Use the same repository as banner storage for convenience
        const finalConfig = {
            owner: config?.owner || 'cowboytbc',
            repo: 'wildwest-banner-storage', // Use existing storage repository
            token: token,
            branch: config?.branch || 'main'
        };
        
        console.log('🔍 Final config for token metadata:', finalConfig);
        return finalConfig;
    }

    // Upload token logo image
    async uploadTokenLogo(file, tokenAddress, tokenSymbol) {
        try {
            console.log('📤 Uploading token logo:', tokenSymbol);
            
            // Create filename with token info
            const filename = `${tokenAddress.toLowerCase()}_logo.${this.getFileExtension(file.name)}`;
            const folderPath = 'token-assets/logos';
            
            return await this.uploadFileToGitHub(file, folderPath, filename);
        } catch (error) {
            console.error('❌ Logo upload failed:', error);
            throw error;
        }
    }

    // Upload token banner image
    async uploadTokenBanner(file, tokenAddress, tokenSymbol) {
        try {
            console.log('📤 Uploading token banner:', tokenSymbol);
            
            // Create filename with token info
            const filename = `${tokenAddress.toLowerCase()}_banner.${this.getFileExtension(file.name)}`;
            const folderPath = 'token-assets/banners';
            
            return await this.uploadFileToGitHub(file, folderPath, filename);
        } catch (error) {
            console.error('❌ Banner upload failed:', error);
            throw error;
        }
    }

    // Save token metadata as JSON
    async saveTokenMetadata(tokenAddress, metadata) {
        try {
            console.log('💾 Saving token metadata:', tokenAddress);
            
            const config = this.getGitHubConfig();
            
            // Handle development mode
            if (config.isDevelopmentMode) {
                console.warn('🔧 Development mode - simulating metadata save for:', tokenAddress);
                console.log('📝 Metadata would be:', metadata);
                return {
                    success: true,
                    message: `Simulated metadata save: ${tokenAddress}`,
                    tokenAddress: tokenAddress.toLowerCase(),
                    isDevelopmentMode: true
                };
            }
            
            const filename = `${tokenAddress.toLowerCase()}.json`;
            const folderPath = 'token-metadata';
            const fullPath = `${folderPath}/${filename}`;
            
            // Load existing metadata to merge with new data
            let existingMetadata = {};
            let sha = null;
            try {
                const existingFile = await this.getFileFromGitHub(config, fullPath);
                sha = existingFile.sha;
                
                // Decode and parse existing metadata
                const existingContent = atob(existingFile.content);
                existingMetadata = JSON.parse(existingContent);
                console.log('📝 Merging with existing metadata file');
            } catch (error) {
                console.log('📄 Creating new metadata file');
            }
            
            // Prepare metadata with timestamp, merging with existing data
            const tokenData = {
                address: tokenAddress.toLowerCase(),
                lastUpdated: new Date().toISOString(),
                ...existingMetadata,  // Keep existing fields
                ...metadata           // Override with new fields
            };
            
            // Convert to JSON
            const content = JSON.stringify(tokenData, null, 2);
            const encodedContent = btoa(unescape(encodeURIComponent(content)));
            
            // Upload to GitHub
            const uploadData = {
                message: `Update metadata for token ${tokenAddress}`,
                content: encodedContent,
                branch: config.branch || 'main'
            };
            
            if (sha) {
                uploadData.sha = sha;
            }
            
            const response = await fetch(`${this.baseApiUrl}/${config.owner}/${config.repo}/contents/${fullPath}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${config.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(uploadData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`GitHub API error: ${errorData.message}`);
            }
            
            const result = await response.json();
            console.log('✅ Metadata saved successfully');
            
            return {
                success: true,
                url: result.content.download_url,
                metadata: tokenData
            };
            
        } catch (error) {
            console.error('❌ Metadata save failed:', error);
            throw error;
        }
    }

    // Load token metadata from GitHub
    async loadTokenMetadata(tokenAddress) {
        try {
            const config = this.getGitHubConfig();
            const filename = `${tokenAddress.toLowerCase()}.json`;
            const folderPath = 'token-metadata';
            const fullPath = `${folderPath}/${filename}`;
            
            const fileData = await this.getFileFromGitHub(config, fullPath);
            const content = atob(fileData.content);
            const metadata = JSON.parse(content);
            
            console.log('📖 Loaded token metadata:', tokenAddress);
            return metadata;
            
        } catch (error) {
            console.log('📭 No metadata found for token:', tokenAddress);
            return null;
        }
    }

    // Get all token metadata from storage
    async loadAllTokenMetadata() {
        try {
            const config = this.getGitHubConfig();
            const folderPath = 'token-metadata';
            
            // Get folder contents
            const response = await fetch(`${this.baseApiUrl}/${config.owner}/${config.repo}/contents/${folderPath}`, {
                headers: {
                    'Authorization': `token ${config.token}`
                }
            });
            
            if (!response.ok) {
                console.log('📂 Token metadata folder not found, will be created when needed');
                return {};
            }
            
            const files = await response.json();
            const metadataPromises = files
                .filter(file => file.name.endsWith('.json'))
                .map(async (file) => {
                    try {
                        const content = await fetch(file.download_url).then(r => r.json());
                        return [content.address, content];
                    } catch (error) {
                        console.warn('⚠️ Failed to load metadata file:', file.name);
                        return null;
                    }
                });
            
            const metadataResults = await Promise.all(metadataPromises);
            const metadataMap = {};
            
            metadataResults.forEach(result => {
                if (result) {
                    metadataMap[result[0]] = result[1];
                }
            });
            
            console.log('📚 Loaded all token metadata:', Object.keys(metadataMap).length, 'tokens');
            return metadataMap;
            
        } catch (error) {
            console.error('❌ Failed to load all metadata:', error);
            return {};
        }
    }

    // Helper methods
    async uploadFileToGitHub(file, folderPath, filename) {
        const config = this.getGitHubConfig();
        
        // Handle development mode
        if (config.isDevelopmentMode) {
            console.warn('🔧 Development mode - simulating file upload for:', filename);
            return {
                success: true,
                message: `Simulated upload: ${filename}`,
                filename: filename,
                path: `${folderPath}/${filename}`,
                url: `https://raw.githubusercontent.com/${config.owner}/${config.repo}/main/${folderPath}/${filename}`,
                isDevelopmentMode: true
            };
        }
        
        const fullPath = `${folderPath}/${filename}`;
        
        // Convert file to base64
        const base64Content = await this.fileToBase64(file);
        
        // Check if file exists to get SHA for update
        let sha = null;
        try {
            const existingFile = await this.getFileFromGitHub(config, fullPath);
            sha = existingFile.sha;
        } catch (error) {
            // File doesn't exist, that's fine
        }
        
        // Upload to GitHub
        const uploadData = {
            message: `Upload ${filename}`,
            content: base64Content,
            branch: config.branch || 'main'
        };
        
        if (sha) {
            uploadData.sha = sha;
        }
        
        const response = await fetch(`${this.baseApiUrl}/${config.owner}/${config.repo}/contents/${fullPath}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${config.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(uploadData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`GitHub API error: ${errorData.message}`);
        }
        
        const result = await response.json();
        
        // Return the proper raw GitHub URL instead of the API download_url
        const rawUrl = `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch || 'main'}/${fullPath}`;
        console.log(`✅ File uploaded successfully: ${rawUrl}`);
        return rawUrl;
    }

    async getFileFromGitHub(config, path) {
        const response = await fetch(`${this.baseApiUrl}/${config.owner}/${config.repo}/contents/${path}`, {
            headers: {
                'Authorization': `token ${config.token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`File not found: ${path}`);
        }
        
        return await response.json();
    }

    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
        });
    }

    getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }
}

// Global instance
window.TokenMetadataStorage = TokenMetadataStorage;
