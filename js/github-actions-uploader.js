class GitHubActionsUploader {
    constructor() {
        this.baseApiUrl = 'https://api.github.com/repos';
    }

    getGitHubConfig() {
        if (typeof window.SECURE_CONFIG === 'undefined') {
            throw new Error('Secure configuration not loaded. Make sure secure-config.js is included.');
        }
        
        const config = window.SECURE_CONFIG.getGitHubConfig();
        const token = window.SECURE_CONFIG.getGitHubToken();
        
        if (!token) {
            throw new Error('GitHub token not available. Service not properly configured.');
        }
        
        return {
            ...config,
            token: token
        };
    }

    async uploadImage(file, category) {
        try {
            const config = this.getGitHubConfig();
            
            // Generate filename with timestamp
            const timestamp = Date.now();
            const filename = timestamp + '_' + file.name;
            
            // Determine folder path
            let folderPath = '';
            switch (category) {
                case 'project-banner':
                    folderPath = 'project-banners';
                    break;
                case 'project-logo':
                    folderPath = 'project-logos';
                    break;
                case 'trader-pfp':
                    folderPath = 'trader-pfps';
                    break;
                case 'banner-top':
                    folderPath = 'banners/top';
                    break;
                case 'banner-bottom':
                    folderPath = 'banners/bottom';
                    break;
                default:
                    folderPath = 'banners';
            }
            
            const filePath = folderPath + '/' + filename;
            
            // Convert file to base64
            const base64Content = await this.fileToBase64(file);
            
            // Use the configured repo for uploads
            const apiUrl = this.baseApiUrl + '/' + config.owner + '/' + config.repo + '/contents/' + filePath;
            
            // Prepare API payload
            const payload = {
                message: 'Upload ' + category + ': ' + filename,
                content: base64Content,
                branch: config.branch || 'main'
            };
            
            // Make API request to GitHub
            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': 'Bearer ' + config.token,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'WildWest-Uploader'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error('GitHub API error: ' + response.status + ' - ' + errorText);
            }
            
            const responseData = await response.json();
            
            return {
                success: true,
                message: 'Successfully uploaded ' + filename,
                filename: filename,
                path: filePath,
                url: 'https://raw.githubusercontent.com/' + config.owner + '/' + config.repo + '/main/' + filePath,
                github_response: responseData
            };
            
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    }

    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    }

    async uploadProjectBanner(file) {
        return this.uploadImage(file, 'project-banner');
    }

    async uploadProjectLogo(file) {
        return this.uploadImage(file, 'project-logo');
    }

    async uploadTraderPfp(file) {
        return this.uploadImage(file, 'trader-pfp');
    }

    async uploadTopBanner(file) {
        return this.uploadImage(file, 'banner-top');
    }

    async uploadBottomBanner(file) {
        return this.uploadImage(file, 'banner-bottom');
    }

    async uploadGenericBanner(file) {
        return this.uploadImage(file, 'banners');
    }
}

console.log(' GitHubActionsUploader loaded - Using SECURE_CONFIG system');
