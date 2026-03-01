# Makefile for meadows-social-app

# Default goal
.DEFAULT_GOAL := help

# Directories / files
NODE_MODULES := node_modules
LOCKFILE     := package-lock.json
NEXT_BUILD   := .next

# Phony targets
.PHONY: help install clean dev build start lint format

help:
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  install   Install dependencies (npm ci)"
	@echo "  clean     Remove node_modules, lockfile, and build artifacts"
	@echo "  dev       Run Next.js in development mode"
	@echo "  build     Build for production"
	@echo "  start     Start production server"
	@echo "  lint      Run ESLint"
	@echo "  format    Run Prettier formatting"
	@echo ""

install:
	@echo "📦 Installing dependencies..."
	npm ci

clean:
	@echo "🧹 Cleaning project..."
	rm -rf $(NODE_MODULES) $(LOCKFILE) $(NEXT_BUILD)

dev:
	@echo "🚀 Starting development server..."
	npm run dev

build:
	@echo "🛠  Building for production..."
	npm run build

start:
	@echo "🎬 Launching production server..."
	npm start

lint:
	@echo "🔍 Linting code..."
	npm run lint

format:
	@echo "🎨 Formatting code..."
	npm run format

.PHONY: show-runtime-info
show-runtime-info:
	@echo "Node: $$(node --version 2>/dev/null || echo unavailable)"
	@echo "npm: $$(npm --version 2>/dev/null || echo unavailable)"
	@echo "Python: $$(python3 --version 2>/dev/null || python --version 2>/dev/null || echo unavailable)"
