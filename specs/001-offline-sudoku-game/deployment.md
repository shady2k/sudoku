# Free Deployment Guide: Offline Sudoku Game

**Date**: 2025-10-16
**Feature**: 001-offline-sudoku-game

This guide covers **100% free** deployment options for your offline Sudoku game.

---

## Recommended: GitHub Pages (Easiest & Free)

**Why GitHub Pages**:
- ✅ **Completely free** (unlimited bandwidth for public repos)
- ✅ **Zero configuration** needed
- ✅ **Custom domain support** (free subdomain: `yourusername.github.io/sudoku`)
- ✅ **HTTPS by default** (required for Service Workers/PWA)
- ✅ **Perfect for SPAs** with Vite
- ✅ **Integrates with GitHub Actions** for automatic deployment

**Limitations**:
- Only static sites (perfect for your offline-first app)
- No server-side code (you don't need this)
- 1GB storage limit (your app will be <1MB)
- 100GB bandwidth/month (sufficient for personal projects)

---

## Setup GitHub Pages (5 minutes)

### Step 1: Add Vite Base Path

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte()],
  base: '/sudoku/', // Replace 'sudoku' with your repo name
})
```

### Step 2: Create GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main, master ]  # Deploy on push to main/master
  pull_request:
    branches: [ main, master ]  # Test on PRs

# Required for GitHub Pages deployment
permissions:
  contents: read
  pages: write
  id-token: write

# Prevent concurrent deployments
concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  # Test Job - Runs on every push and PR
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: TypeScript type checking
        run: npx tsc --noEmit

      - name: ESLint
        run: npm run lint

      - name: Run unit & integration tests
        run: npm run test:coverage

      - name: Run performance benchmarks
        run: npm run test:bench

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: false

  # Build & Deploy Job - Only runs on main/master branch
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master'

    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build project
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Step 3: Enable GitHub Pages

1. Go to your repo on GitHub
2. **Settings** → **Pages**
3. **Source**: Select "GitHub Actions"
4. Save

### Step 4: Push to GitHub

```bash
git add .
git commit -m "Add GitHub Pages deployment"
git push origin main
```

**Your site will be live at**: `https://yourusername.github.io/sudoku/`

---

## Alternative Free Hosting Options

### Option 2: Netlify (Most Features)

**Why Netlify**:
- ✅ **Completely free** for personal projects
- ✅ **Custom domain support** (even on free tier)
- ✅ **Automatic HTTPS**
- ✅ **Branch previews** (preview PRs before merging)
- ✅ **Instant rollbacks**
- ✅ **100GB bandwidth/month** (free tier)

**Setup**:
1. Create `netlify.toml` in repo root:
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. Connect repo at [netlify.com](https://netlify.com)
3. Auto-deploys on every push

**Your site**: `https://your-app-name.netlify.app`

---

### Option 3: Vercel (Best Performance)

**Why Vercel**:
- ✅ **Completely free** for personal projects
- ✅ **Edge network** (fastest CDN)
- ✅ **Automatic HTTPS**
- ✅ **Preview deployments** for PRs
- ✅ **100GB bandwidth/month** (free tier)

**Setup**:
1. Create `vercel.json`:
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "framework": "vite"
   }
   ```

2. Connect repo at [vercel.com](https://vercel.com)
3. Auto-deploys on every push

**Your site**: `https://your-app-name.vercel.app`

---

### Option 4: Cloudflare Pages (Fastest Global)

**Why Cloudflare Pages**:
- ✅ **Completely free** (unlimited bandwidth!)
- ✅ **Global CDN** (250+ cities)
- ✅ **Fastest performance** globally
- ✅ **Automatic HTTPS**
- ✅ **Unlimited bandwidth** (no limits on free tier)

**Setup**:
1. Connect repo at [pages.cloudflare.com](https://pages.cloudflare.com)
2. Build settings:
   - **Build command**: `npm run build`
   - **Build output**: `dist`
3. Auto-deploys on every push

**Your site**: `https://your-app-name.pages.dev`

---

## Comparison Table

| Feature | GitHub Pages | Netlify | Vercel | Cloudflare |
|---------|--------------|---------|--------|------------|
| **Price** | Free | Free | Free | Free |
| **Bandwidth** | 100GB/mo | 100GB/mo | 100GB/mo | **Unlimited** |
| **Build minutes** | Unlimited | 300min/mo | Unlimited | Unlimited |
| **Custom domain** | Yes | Yes | Yes | Yes |
| **HTTPS** | ✅ | ✅ | ✅ | ✅ |
| **Branch previews** | ❌ | ✅ | ✅ | ✅ |
| **Setup complexity** | Easy | Easiest | Easiest | Easy |
| **Performance** | Good | Good | Excellent | **Best** |

---

## Recommended Setup: GitHub Pages + GitHub Actions

For your project, I recommend **GitHub Pages** because:

1. **Already using GitHub** - no external service needed
2. **GitHub Actions for CI** - tests + deploy in one place
3. **Simple workflow** - push to main = auto-deploy
4. **No vendor lock-in** - your code stays on GitHub

---

## Complete GitHub Actions + Pages Setup

### 1. Update `package.json` Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:bench": "vitest bench",
    "test:e2e": "playwright test",
    "lint": "eslint . --ext .ts,.tsx,.svelte",
    "format": "prettier --write ."
  }
}
```

### 2. Add `.nvmrc` (Optional - Locks Node Version)

```
20
```

### 3. Create `.github/workflows/deploy.yml` (shown above)

### 4. Enable GitHub Pages

1. Push code to GitHub
2. Go to **Settings** → **Pages**
3. **Source**: Select "GitHub Actions"
4. Wait ~2 minutes for first deployment

---

## Custom Domain (Free)

### Option A: GitHub Pages Custom Domain (Free)

1. Buy domain from Namecheap/Cloudflare (~$10-15/year for `.com`)
2. Add DNS records:
   ```
   Type: CNAME
   Name: sudoku (or @)
   Value: yourusername.github.io
   ```
3. GitHub **Settings** → **Pages** → Add custom domain
4. Enable "Enforce HTTPS"

**Your site**: `https://sudoku.yourdomain.com`

### Option B: Free Subdomain (Zero Cost)

Use free subdomain services:
- **is-a.dev**: `https://yourusername.is-a.dev` (free, requires PR)
- **js.org**: `https://yourusername.js.org` (free, requires PR)
- **github.io**: `https://yourusername.github.io/sudoku` (automatic)

---

## PWA Considerations for Deployment

Your app is offline-first, so you need Service Worker support:

### Update `vite.config.ts` with PWA Plugin

```typescript
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Offline Sudoku',
        short_name: 'Sudoku',
        description: 'Play Sudoku completely offline',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      }
    })
  ],
  base: '/sudoku/', // Replace with your repo name
})
```

### Install PWA Plugin

```bash
npm install -D vite-plugin-pwa
```

---

## Post-Deployment Checklist

After deploying, verify:

- ✅ Site loads at your URL
- ✅ HTTPS is enabled (required for Service Worker)
- ✅ PWA installs correctly (Chrome: Dev Tools → Application → Manifest)
- ✅ Offline mode works (Chrome: Dev Tools → Network → Offline checkbox)
- ✅ LocalStorage persists across page refreshes
- ✅ Game history saves correctly
- ✅ Responsive on mobile (Chrome: Dev Tools → Device Toolbar)

---

## Monitoring & Analytics (Optional, Free)

### Option 1: Google Analytics 4 (Free)

Add to `index.html`:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Option 2: Plausible Analytics (Privacy-Friendly, Free Tier)

Lighter alternative to Google Analytics, respects user privacy.

---

## Cost Summary

| Item | Cost |
|------|------|
| **Hosting** (GitHub Pages) | $0 |
| **CI/CD** (GitHub Actions) | $0 (2000 min/month free) |
| **HTTPS Certificate** | $0 (automatic) |
| **Custom Domain** (optional) | ~$12/year |
| **Total** | **$0-12/year** |

---

## Recommended Path for You

1. **Phase 1**: Deploy to GitHub Pages (free, automatic)
   - URL: `https://yourusername.github.io/sudoku/`
   - Takes 5 minutes to setup

2. **Phase 2** (optional): Add custom domain
   - Buy domain from Cloudflare (~$10/year for `.com`)
   - URL: `https://sudoku.yourdomain.com`

3. **Phase 3** (optional): Migrate to Cloudflare Pages if you need:
   - Unlimited bandwidth
   - Fastest global performance
   - Same GitHub Actions CI/CD workflow

---

**Bottom Line**: Start with **GitHub Pages + GitHub Actions** (100% free, zero config). You can always migrate to Cloudflare/Netlify/Vercel later if needed, but GitHub Pages is perfect for this project.

Let me know if you want me to generate the complete `.github/workflows/deploy.yml` file for you!
