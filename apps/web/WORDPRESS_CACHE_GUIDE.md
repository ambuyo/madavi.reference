# WordPress Posts Caching - Quick Reference

## ⚡ The Problem We Solved

**Before:** Blog pages waited 500-2000ms for WordPress API
**After:** Posts load instantly from static HTML (10-50ms)

## 🔄 How Caching Works

1. Posts are fetched from WordPress at **build time**
2. Stored in `.cache/wordpress-posts.json`
3. Baked into your HTML at build
4. Served instantly with zero API calls
5. Updated only when you rebuild and redeploy

## 📋 Publishing Workflow (3x per week)

```bash
# Step 1: Publish post in WordPress
# → Go to https://cms.madavi.co and create/publish your post

# Step 2: Update the cache
npm run cache:posts

# Step 3: Build the site
npm run build

# Step 4: Deploy
git add .
git commit -m "Update: Fresh WordPress posts"
git push
```

Or use the one-liner:
```bash
npm run build  # This automatically runs cache:posts first
```

## 📁 What Each Script Does

| Command | What It Does |
|---------|-------------|
| `npm run cache:posts` | Fetches latest posts from WordPress → stores to `.cache/wordpress-posts.json` |
| `npm run build` | Runs cache:posts, then builds HTML with cached posts |
| `npm run dev` | Local dev server (uses cached posts) |

## ✅ Verify Posts Updated

1. Check `.cache/wordpress-posts.json` was updated (look at timestamp)
2. Build completes without errors
3. Deploy to Hostinger
4. Wait 2-5 minutes
5. Visit https://madavi.co/blog and refresh (Ctrl+Shift+R)
6. New posts should appear

## 🚨 Troubleshooting

**Posts not showing?**
- Clear browser cache: Ctrl+Shift+Del
- Check build output for errors
- Re-run: `npm run cache:posts && npm run build`

**Build fails?**
- Verify WordPress is online: https://cms.madavi.co
- Check credentials in `.env`
- Run `npm run cache:posts` to see the error

**Outdated posts on live site?**
- Posts only update when deployed
- Always: cache → build → deploy (in that order)

## 📊 Performance Gains

- ⚡ 50-100x faster page loads
- 🔒 Site works even if WordPress is down
- 💾 No external API calls at runtime
- 🎯 Better Core Web Vitals

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `.cache/wordpress-posts.json` | Cached posts (auto-generated) |
| `src/lib/data.ts` | Reads from cache, not live API |
| `scripts/cache-wordpress-posts.ts` | Fetches posts and updates cache |
| `DEPLOYMENT.md` | Full deployment guide |

## 💡 Remember

- Cache is updated by **you**, not automatically
- Posts only appear after rebuild + deploy
- Always run `npm run cache:posts` before deploying
- 3x per week publishing = 3x per week cache refresh
