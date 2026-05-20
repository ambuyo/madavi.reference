# WordPress Posts Caching & Deployment Guide

## Overview

This site uses a **static caching strategy** for WordPress posts. Posts are fetched at build time and baked into your HTML, making them load instantly without any API calls at runtime.

## How It Works

```
WordPress CMS
      ↓
[cache:posts script] ← Fetches fresh posts
      ↓
.cache/wordpress-posts.json ← Stores posts locally
      ↓
[Astro build] ← Builds HTML with cached posts
      ↓
dist/ (static HTML)
      ↓
Deploy to Hostinger ← Live site with instant-loading posts
```

## Deployment Workflow

### Before Publishing Posts
1. Write and publish posts in WordPress (https://cms.madavi.co)

### Publishing New Posts

#### Option 1: Manual Build & Deploy (Simple)

```bash
# 1. Fetch latest posts from WordPress
npm run cache:posts

# 2. Build the site
npm run build

# 3. Commit and push
git add .
git commit -m "Update: Fresh WordPress posts"
git push origin main
```

#### Option 2: One-Command Build (Easier)

```bash
# This runs both cache:posts and build
npm run build
```

#### Option 3: Using the Deploy Script

```bash
# Make the script executable (first time only)
chmod +x scripts/build-and-deploy.sh

# Run the script
./scripts/build-and-deploy.sh
```

### Verify Deployment

1. **Wait 2-5 minutes** for Hostinger to process the deploy
2. Visit https://madavi.co/blog
3. Verify new posts appear with correct content
4. Test individual post pages to ensure they load

## What Gets Cached

- ✅ All blog posts (title, excerpt, content, featured image)
- ✅ Post metadata (publish date, author, categories)
- ✅ Category information and taxonomy
- ✅ Featured images and image data

## Cache Update Frequency

- **Updated:** When you run `npm run cache:posts`
- **Deployed:** When you deploy the site to Hostinger
- **Displayed:** Immediately on the live site (posts are static HTML)

## Troubleshooting

### Posts Not Showing After Deploy
1. Clear your browser cache: `Ctrl+Shift+Del` (or `Cmd+Shift+Delete`)
2. Wait 5 minutes for Hostinger to fully process
3. Check `.cache/wordpress-posts.json` exists locally
4. Re-run: `npm run cache:posts && npm run build`

### Build Fails
Check that WordPress API is accessible:
```bash
npm run cache:posts
```

If it fails:
- Verify WordPress is online: https://cms.madavi.co
- Check credentials in `src/lib/wordpress/client.ts`
- Ensure internet connection is stable

### Posts Seem Outdated
Posts are only updated when you:
1. Run `npm run cache:posts`
2. Deploy the built site

**Always cache → build → deploy** in that order.

## Environment Variables

Required in `.env`:
```
WP_USERNAME=Amukune
WP_APP_PASSWORD=your-app-password-here
```

See `.env.example` for details.

## Performance Impact

- **Before:** Blog pages waited for WordPress API (~500-2000ms)
- **After:** Posts load with static HTML (~10-50ms)
- **Result:** ~50-100x faster page loads ✨

## FAQ

**Q: How often should I rebuild?**
A: Only when you publish new posts (3x per week in your case)

**Q: Can visitors see posts before I deploy?**
A: No. Posts must be cached and deployed to appear on the live site.

**Q: What if WordPress goes down?**
A: Your site still works! Posts are cached and don't depend on WordPress being online.

**Q: Can I schedule posts?**
A: Not automatically. Scheduled posts will appear once published and you rebuild.

**Q: How do I revert to an old version?**
A: Use git: `git revert <commit-hash>`

## Quick Reference

```bash
# Development
npm run dev                    # Local dev server

# Deployment
npm run cache:posts            # Fetch fresh posts
npm run build                  # Build static site
npm run cache:posts && npm run build  # Both in one command

# Manual script
./scripts/build-and-deploy.sh  # Guided deployment
```

## Support

If posts aren't updating:
1. Verify `.cache/wordpress-posts.json` was created
2. Check Astro build logs for errors
3. Ensure `npm run cache:posts` completes successfully
4. Redeploy to Hostinger after fixing
