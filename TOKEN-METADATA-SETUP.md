# Token Metadata Storage Setup Guide

This guide will help you set up GitHub storage for token metadata (descriptions, logos, banners, links) that token creators can edit through the trending widget.

## 📋 Prerequisites

1. **GitHub Repository**: You need a GitHub repository for storing token metadata (can be the same as your banner storage)
2. **GitHub Personal Access Token**: With repository write permissions
3. **Existing Wild West Launchpad**: With the secure config system already working

## 🔧 Setup Steps

### Step 1: Repository Structure

Your GitHub storage repository will automatically create this structure when tokens are edited:

```
your-storage-repo/
├── token-metadata/           # JSON metadata files
│   ├── 0x123...abc.json     # Token metadata by address
│   └── 0x456...def.json
├── token-assets/
│   ├── logos/               # Token logo images
│   │   ├── 0x123...abc_logo.png
│   │   └── 0x456...def_logo.jpg
│   └── banners/             # Token banner images
│       ├── 0x123...abc_banner.png
│       └── 0x456...def_banner.jpg
```

### Step 2: Configure Storage Repository

In your `js/secure-config.js` file, make sure your GitHub configuration includes the storage repository:

```javascript
// Example configuration (your actual values will be injected by GitHub Actions)
window.SECURE_CONFIG = {
    getGitHubConfig: () => ({
        storageRepo: 'cowboytbc/wildwest-banner-storage', // Your storage repo
        branch: 'main',
        // ... other config
    }),
    getGitHubToken: () => 'your-github-token'
};
```

### Step 3: Verify Script Loading

Make sure these scripts are loaded in your main index.html:

```html
<!-- GitHub Storage System -->
<script src="js/secure-config.js"></script>
<script src="js/github-actions-uploader.js"></script>
<script src="js/token-metadata-storage.js"></script>
```

### Step 4: Include in Trending Widget

The trending widget (`trending-widget-v2.html`) now automatically includes:

```html
<!-- GitHub Storage System -->
<script src="js/secure-config.js"></script>
<script src="js/github-actions-uploader.js"></script>
<script src="js/token-metadata-storage.js"></script>
```

## 🎯 How It Works

### For Token Creators:
1. **Connect Wallet**: Users connect their wallet on the main page
2. **Edit Icon**: Edit icons (✏️) appear on token cards they created
3. **Edit Modal**: Click to open editing form with:
   - Description (250 chars max)
   - Website URL
   - Telegram URL  
   - Logo upload (500x500 recommended)
   - Banner upload (1500x500 recommended)
4. **Save**: Data uploads to GitHub storage automatically

### For Users:
- See enhanced token cards with creator-provided metadata
- Professional logos and banners instead of fallback text
- Direct links to projects' websites and communities

### Data Flow:
```
Token Creator → Edit Form → GitHub Storage → All Users See Updates
```

## 📁 Metadata File Structure

Each token gets a JSON file in `token-metadata/0x[address].json`:

```json
{
  "address": "0x1234567890123456789012345678901234567890",
  "name": "Example Token",
  "symbol": "EXAMPLE",
  "creator": "0x9876543210987654321098765432109876543210",
  "description": "This is an amazing DeFi token that does incredible things...",
  "website": "https://example-token.com",
  "telegram": "https://t.me/exampletoken",
  "logo": "https://raw.githubusercontent.com/user/repo/main/token-assets/logos/0x1234...logo.png",
  "banner": "https://raw.githubusercontent.com/user/repo/main/token-assets/banners/0x1234...banner.jpg",
  "lastUpdated": "2024-08-23T15:30:00.000Z"
}
```

## 🔒 Security Features

- **Creator Verification**: Only connected wallet that created the token can edit
- **File Validation**: Images must be valid image files under 5MB
- **URL Validation**: Website/Telegram URLs must use HTTPS
- **GitHub Token Security**: Token never exposed to end users
- **Version Control**: All changes tracked in GitHub history

## 🚀 Testing

1. Deploy your launchpad with the new files
2. Connect a wallet that created tokens
3. Look for edit icons (✏️) on your token cards
4. Try editing a token's metadata
5. Check your GitHub storage repo for new files

## 🛠️ Troubleshooting

### Edit Icons Not Showing
- Ensure wallet is connected on main page
- Check console for "Storage system initialized" message
- Verify connected wallet address matches token creator

### Upload Failures
- Check GitHub token permissions (needs repo write access)
- Verify storage repository exists and is accessible
- Check browser console for specific error messages

### Metadata Not Loading
- Check network tab for failed GitHub API calls
- Verify repository structure and file permissions
- Ensure raw GitHub URLs are accessible

## 📞 Support

If you encounter issues:
1. Check browser console for error messages
2. Verify GitHub token has correct permissions
3. Test with a simple file upload to confirm GitHub API access
4. Check that secure-config.js is loading properly

The system is designed to fail gracefully - if storage isn't available, the trending widget still works with basic token data.
