// Development Token Configuration
// FOR LOCAL TESTING ONLY - Never commit your actual token to git!

// This file allows local testing of banner uploads
// Replace 'YOUR_GITHUB_TOKEN_HERE' with your actual GitHub token for testing

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  console.log('🔧 Loading development token configuration for local testing...');
  
  // WARNING: Replace with your actual token for local testing
  // NEVER commit your real token to git!
  const DEV_GITHUB_TOKEN = 'YOUR_GITHUB_TOKEN_HERE';
  
  if (DEV_GITHUB_TOKEN !== 'YOUR_GITHUB_TOKEN_HERE') {
    window.ENV_CONFIG = window.ENV_CONFIG || {};
    window.ENV_CONFIG.github = {
      token: DEV_GITHUB_TOKEN
    };
    
    console.log('✅ Development GitHub token loaded for local testing');
    console.log('🔐 Token configured for banner upload testing');
  } else {
    console.log('⚠️ Development token placeholder detected');
    console.log('📝 Replace YOUR_GITHUB_TOKEN_HERE with your actual token in dev-token-config.js');
  }
} else {
  console.log('🚀 Production environment - using GitHub Secrets injection');
}
