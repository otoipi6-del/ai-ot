#!/bin/bash

# AI-OT Setup Script
# Run this script after cloning the repository

set -e

echo "🚀 Setting up AI-OT..."

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ required. Current: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup environment
echo "🔧 Setting up environment..."
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "📝 Created .env.local. Please fill in your API keys."
fi

# Check for required env vars
echo "🔍 Checking environment variables..."
if [ -z "$SUPABASE_URL" ]; then
    echo "⚠️  SUPABASE_URL not set. Please configure in .env.local"
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "⚠️  SUPABASE_SERVICE_ROLE_KEY not set. Please configure in .env.local"
fi

# Setup Supabase (if CLI is installed)
if command -v supabase &> /dev/null; then
    echo "🗄️  Setting up Supabase..."
    supabase link --project-ref cbsmjeaxrcgrxiplytll
    supabase db push
    echo "✅ Supabase migrations applied"
else
    echo "⚠️  Supabase CLI not found. Please install it:"
    echo "   npm install -g supabase"
    echo "   Then run: supabase db push"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Fill in .env.local with your API keys"
echo "2. Run: npm run dev"
echo "3. Open http://localhost:3000"
echo ""
echo "To upload documents:"
echo "  curl -X POST http://localhost:3000/api/ingest \"
echo "    -F "file=@document.pdf" \"
echo "    -F "title=Your Document""
