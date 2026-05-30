#!/bin/bash
# ProteinHouse — EC2 deploy script
# Usage: ./deploy.sh
# Run from the project root on the EC2 instance.

set -e  # Exit on error

echo "🚀 Starting ProteinHouse deployment..."

# 1. Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# 2. Install dependencies (production only)
echo "📦 Installing dependencies..."
npm ci --omit=dev

# 3. Build
echo "🔨 Building..."
npm run build

# 4. Copy public assets into dist/client
echo "📁 Copying public assets..."
cp -r public/* dist/client/ 2>/dev/null || true

# 5. Reload PM2 (zero-downtime restart)
echo "♻️  Reloading PM2..."
pm2 reload ecosystem.config.cjs --env production --update-env

# 6. Save PM2 state
pm2 save

echo ""
echo "✅ Deployment complete!"
echo "   Status: pm2 status"
echo "   Logs:   pm2 logs proteinhouse"
