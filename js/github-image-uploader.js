// GitHub Image Uploader - Direct GitHub API integration
// This is an alias/wrapper for the main GitHubActionsUploader for admin panel compatibility

class GitHubImageUploader {
    constructor() {
        // Initialize the main uploader
        this.uploader = new GitHubActionsUploader();
        console.log('🔧 GitHub Image Uploader initialized (admin panel compatibility)');
    }

    // Upload banner image - wrapper for admin panel
    async uploadBanner(file, position, projectName, linkUrl, endDate) {
        try {
            console.log('📤 Uploading banner via admin panel...');
            
            // Use the secure config uploader
            if (window.SECURE_CONFIG && window.SECURE_CONFIG.uploadBannerToGitHub) {
                return await window.SECURE_CONFIG.uploadBannerToGitHub(
                    file, 
                    position, 
                    projectName, 
                    linkUrl, 
                    endDate
                );
            } else {
                throw new Error('Secure configuration not available');
            }
        } catch (error) {
            console.error('❌ Admin panel upload failed:', error);
            throw error;
        }
    }

    // Upload project banner
    async uploadProjectBanner(file, projectName, linkUrl, endDate) {
        return this.uploadBanner(file, 'project-banner', projectName, linkUrl, endDate);
    }

    // Upload project logo
    async uploadProjectLogo(file, projectName, linkUrl, endDate) {
        return this.uploadBanner(file, 'project-logo', projectName, linkUrl, endDate);
    }

    // Upload trader profile picture
    async uploadTraderPfp(file, projectName, linkUrl, endDate) {
        return this.uploadBanner(file, 'trader-pfp', projectName, linkUrl, endDate);
    }

    // Upload top banner
    async uploadTopBanner(file, projectName, linkUrl, endDate) {
        return this.uploadBanner(file, 'top', projectName, linkUrl, endDate);
    }

    // Upload bottom banner
    async uploadBottomBanner(file, projectName, linkUrl, endDate) {
        return this.uploadBanner(file, 'bottom', projectName, linkUrl, endDate);
    }

    // Validate file
    validateFile(file) {
        if (window.SECURE_CONFIG && window.SECURE_CONFIG.validateUploadFile) {
            return window.SECURE_CONFIG.validateUploadFile(file);
        }
        
        // Fallback validation
        const errors = [];
        
        if (!file) {
            errors.push('No file selected');
        } else {
            if (!file.type.startsWith('image/')) {
                errors.push('File must be an image');
            }
            if (file.size > 5 * 1024 * 1024) {
                errors.push('File too large (max 5MB)');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

// Make available globally for admin panel
window.GitHubImageUploader = GitHubImageUploader;

console.log('🔧 GitHub Image Uploader loaded - admin panel integration ready');
