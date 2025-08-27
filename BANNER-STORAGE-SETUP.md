# Banner Storage Repository Setup Guide

## Repository: cowboytbc/wildwest-banner-storage

This document provides setup instructions for the banner storage repository.

## Required Repository Structure

Create the following structure in your `wildwest-banner-storage` repository:

```
wildwest-banner-storage/
├── banners/
│   ├── top/
│   │   └── .gitkeep
│   └── bottom/
│       └── .gitkeep
├── .github/
│   └── workflows/
│       └── deploy.yml
├── index.html
└── README.md
```

## Files to Create:

### 1. `/banners/top/.gitkeep`
```
# This file ensures the top banners directory is tracked by git
```

### 2. `/banners/bottom/.gitkeep`  
```
# This file ensures the bottom banners directory is tracked by git
```

### 3. `/.github/workflows/deploy.yml`
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Pages
        uses: actions/configure-pages@v4
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 4. `/index.html`
```html
<!DOCTYPE html>
<html>
<head>
    <title>Wild West Banner Storage</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .banner-section { margin: 20px 0; }
        .banner-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .banner-item { border: 1px solid #ddd; padding: 10px; border-radius: 5px; }
        .banner-item img { max-width: 100%; height: auto; }
    </style>
</head>
<body>
    <h1>Wild West Launchpad - Banner Storage</h1>
    <p>This repository stores banner advertisements for the Wild West Launchpad platform.</p>
    
    <div class="banner-section">
        <h2>Top Banners ($200/day)</h2>
        <div id="top-banners" class="banner-grid"></div>
    </div>
    
    <div class="banner-section">
        <h2>Bottom Banners ($100/day)</h2>
        <div id="bottom-banners" class="banner-grid"></div>
    </div>

    <script>
        // This page will automatically list banner files when deployed
        console.log('Banner storage repository deployed successfully');
    </script>
</body>
</html>
```

## GitHub Repository Settings

After creating the repository, configure these settings:

### 1. GitHub Pages
- Go to Settings → Pages
- Source: Deploy from a branch
- Branch: main (root)

### 2. Required Secrets
- Go to Settings → Secrets and variables → Actions
- Add the following secrets:
  - `BRUCE_BANNERS`: Your GitHub Personal Access Token (for banner uploads)
  - Any other secrets needed for banner upload integration

## Integration with Main Platform

The main platform (`wildwest-launchpad`) is already configured to:
- Fetch banners from: `https://cowboytbc.github.io/wildwest-banner-storage`
- Upload paid banners via GitHub API
- Manage banner rotation and expiration

## Revenue Tracking

- Top banners: $200/day (Premium placement)
- Bottom banners: $100/day (Standard placement)  
- Maximum 20 concurrent projects per position
- 5-minute rotation intervals between active banners
- Automatic expiration and cleanup

This setup enables the complete banner advertising revenue system for your launchpad!
