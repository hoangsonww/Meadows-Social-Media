#!/usr/bin/env bash
# scripts/dev.sh
# Boot up local development server

set -euo pipefail

echo "🛠️  Starting development server..."
npm install
npm run dev
