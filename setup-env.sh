#!/bin/bash

# Dewu Mock API - Environment Setup Script
# This script helps you set up environment variables for local development

echo "🚀 Dewu Mock API - Environment Setup"
echo "======================================"

# Check if .env.local already exists
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled."
        exit 1
    fi
fi

# Copy template
echo "📋 Copying .env.example to .env.local..."
cp .env.example .env.local

echo "✅ .env.local created successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Edit .env.local and add your Supabase credentials:"
echo "   - SUPABASE_URL=https://your-project-id.supabase.co"
echo "   - SUPABASE_ANON_KEY=your-anon-key"
echo ""
echo "2. Get your Supabase credentials from:"
echo "   - Project Settings → API in your Supabase dashboard"
echo ""
echo "3. Start the development server:"
echo "   - npm run dev"
echo ""
echo "📚 For detailed setup instructions, see:"
echo "   - SUPABASE_SETUP.md"
echo "   - ENVIRONMENT_SETUP.md"
echo ""
echo "🎉 Happy coding!"