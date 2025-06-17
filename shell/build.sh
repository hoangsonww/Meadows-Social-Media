#!/usr/bin/env bash
# scripts/build.sh
# Build for production and export static files

set -euo pipefail

echo "📦 Installing dependencies..."
npm ci

echo "🔨 Building production bundle..."
npm run build

echo "📂 Exporting static files..."
npm run export

echo "✅ Build + export complete."
