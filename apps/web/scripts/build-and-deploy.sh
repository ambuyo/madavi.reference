#!/bin/bash

# WordPress Posts Build & Deploy Script
# This script prepares your site for deployment to Hostinger
# It fetches the latest WordPress posts and builds your static site

set -e  # Exit on error

echo "========================================"
echo "🚀 Madavi Site Build & Deploy Pipeline"
echo "========================================"
echo ""

# Step 1: Cache latest posts
echo "📝 Step 1: Fetching latest WordPress posts..."
pnpm run cache:posts

if [ $? -ne 0 ]; then
    echo "❌ Failed to cache posts"
    exit 1
fi

echo ""

# Step 2: Build the site
echo "🔨 Step 2: Building Astro site..."
pnpm --filter=web run build

if [ $? -ne 0 ]; then
    echo "❌ Failed to build site"
    exit 1
fi

echo ""
echo "========================================"
echo "✅ Build complete!"
echo "========================================"
echo ""
echo "📦 Deployment steps:"
echo "   1. Commit changes: git add . && git commit -m 'Update: Fresh WordPress posts'"
echo "   2. Push to Hostinger (or your CI/CD pipeline)"
echo "   3. Monitor: Check madavi.co to verify posts are live"
echo ""
echo "💡 Pro tip: Do this every time before publishing new posts!"
echo ""
