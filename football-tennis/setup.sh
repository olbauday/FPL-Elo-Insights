#!/bin/bash
# Quick setup script for Football Tennis

echo "🚀 Setting up Football Knowledge Tennis..."
echo ""

# Check if .env exists and has been configured
if grep -q "YOUR_PROJECT" backend/.env; then
    echo "❌ ERROR: Please edit backend/.env with your Supabase credentials first!"
    echo ""
    echo "Edit backend/.env and replace:"
    echo "  - SUPABASE_URL with your project URL"
    echo "  - SUPABASE_SERVICE_KEY with your service role key"
    echo ""
    echo "Get these from: Supabase Dashboard → Settings → API"
    exit 1
fi

echo "✅ Environment configured"
echo ""

# Import FPL data
echo "📊 Importing FPL data..."
cd database/seeds
node import-fpl-data.js
if [ $? -ne 0 ]; then
    echo "❌ Failed to import FPL data"
    exit 1
fi
echo ""

# Seed categories
echo "🎯 Seeding categories..."
node seed-categories.js
if [ $? -ne 0 ]; then
    echo "❌ Failed to seed categories"
    exit 1
fi
echo ""

cd ../..

echo "✅ Setup complete!"
echo ""
echo "🎾 To start playing:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend && npm run dev"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend && npm run dev"
echo ""
echo "Then open http://localhost:5173 in your browser!"
