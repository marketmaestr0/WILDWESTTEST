# 🚀 Wild West Launchpad - Repository Setup Instructions

## 📋 STEP-BY-STEP SETUP

### 1. Create GitHub Repository
```bash
# Navigate to your project directory
cd "c:\Users\crypt\OneDrive\Desktop\WILDWEST LP"

# Initialize git repository
git init
git add .
git commit -m "Initial commit: Wild West Launchpad Platform"
git branch -M main

# Add your new repository as remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/wildwest-launchpad.git
git push -u origin main
```

### 2. Configure GitHub Secrets

Go to your repository: **Settings → Secrets and variables → Actions**

Click **"New repository secret"** and add each of these:

#### 🔑 GITHUB_TOKEN
- **Name**: `GITHUB_TOKEN`
- **Value**: Your GitHub Personal Access Token
- **Permissions needed**: `repo`, `workflow`, `write:packages`

#### 🔑 PERSONAL_ACCESS_TOKEN  
- **Name**: `PERSONAL_ACCESS_TOKEN`
- **Value**: Same as GITHUB_TOKEN (for cross-repo operations)

#### 🌐 SOLANA_RPC_ENDPOINT
- **Name**: `SOLANA_RPC_ENDPOINT`  
- **Value**: Your QuickNode Solana endpoint
- **Format**: `https://your-endpoint.solana-mainnet.quiknode.pro/YOUR_TOKEN/`

#### 🌐 BASE_RPC_ENDPOINT
- **Name**: `BASE_RPC_ENDPOINT`
- **Value**: Your QuickNode Base endpoint  
- **Format**: `https://your-endpoint.base-mainnet.quiknode.pro/YOUR_TOKEN/`

### 3. Banner Storage Repository (ALREADY EXISTS ✅)

Your existing banner storage repository is already configured:
- Repository: `wildwest-banner-storage` ✅
- Structure should include these folders:
   ```
   banners/
   ├── top/
   ├── bottom/
   project-banners/
   project-logos/
   trader-pfps/
   ```

### 4. Enable GitHub Pages

In your main repository:
1. Go to **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: **main** / **(root)**
4. Click **Save**

### 5. Test Deployment

After pushing to main branch:
1. Check **Actions** tab for deployment status
2. Visit your GitHub Pages URL: `https://YOUR_USERNAME.github.io/wildwest-launchpad/`
3. Test banner upload functionality
4. Check `api-status.html` for GitHub integration status

## 🎯 Required QuickNode Endpoints

Make sure you have:
- ✅ **Solana Mainnet** endpoint (for SOL payments)
- ✅ **Base Mainnet** endpoint (for ETH payments)

## 🔐 Security Features

- ✅ **GitHub Secrets**: No tokens in code
- ✅ **Build-time Injection**: Tokens added during deployment
- ✅ **Direct GitHub API**: No serverless middleman
- ✅ **Automatic Updates**: RPC endpoints via GitHub Actions

## 🎮 Platform Features Ready

- ✅ **Banner Advertising**: $200/day top, $100/day bottom
- ✅ **Multi-Wallet**: 20+ wallet integrations
- ✅ **Token Launchpad**: Base + Solana chains
- ✅ **Staking/Locking**: DeFi protocols
- ✅ **Professional UI**: Enterprise-grade design

---

**🔥 Your crypto launchpad is ready for deployment!**
