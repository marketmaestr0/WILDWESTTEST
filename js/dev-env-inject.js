// Development Environment Injection
// This file provides development-specific environment variables

// Only active in development environment
if (window.location.hostname === 'localhost' || 
    window.location.hostname.includes('127.0.0.1') ||
    window.location.hostname.includes('localhost')) {
    
    console.log('🛠️ Development environment detected - dev-env-inject.js loaded');
    
    // Override production settings for development
    if (window.ENV_CONFIG) {
        // Development overrides
        window.ENV_CONFIG.isDevelopment = true;
        console.log('🔧 Development environment configuration applied');
    } else {
        console.warn('⚠️ ENV_CONFIG not available for development overrides');
    }
} else {
    console.log('🌐 Production environment - skipping dev-env-inject.js');
}
