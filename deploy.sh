#!/bin/bash

# WordWise Deployment Script
# This script helps prepare your project for deployment

echo "🚀 WordWise Deployment Preparation"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "📋 Step 1: Checking dependencies..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"
echo ""

echo "📦 Step 2: Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo "✅ Dependencies installed"
echo ""

echo "🏗️  Step 3: Building production bundle..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi
echo "✅ Build successful"
echo ""

echo "🔍 Step 4: Checking build output..."
if [ ! -d "dist" ]; then
    echo "❌ dist directory not found"
    exit 1
fi

echo "✅ Build output verified"
echo ""

echo "📝 Step 5: Deployment checklist..."
echo ""
echo "Before deploying, make sure you have:"
echo "  [ ] Created a GitHub repository"
echo "  [ ] Pushed your code to GitHub"
echo "  [ ] Set up backend hosting (Railway/Render)"
echo "  [ ] Configured all environment variables"
echo "  [ ] Updated .env.production with backend URL"
echo ""

echo "🎯 Next Steps:"
echo ""
echo "1. Deploy Backend:"
echo "   - Go to Railway.app or Render.com"
echo "   - Connect your GitHub repository"
echo "   - Set environment variables (see DEPLOYMENT_CHECKLIST.md)"
echo "   - Deploy and note your backend URL"
echo ""
echo "2. Deploy Frontend to Cloudflare Pages:"
echo "   - Go to dash.cloudflare.com"
echo "   - Create new Pages project"
echo "   - Connect GitHub repository"
echo "   - Build command: npm run build"
echo "   - Build output: dist"
echo "   - Add environment variable: VITE_API_URL=<your-backend-url>/api"
echo ""
echo "3. Configure Services:"
echo "   - Update Google OAuth redirect URIs"
echo "   - Update Stripe webhook endpoint"
echo "   - Update backend CORS settings"
echo ""
echo "📚 For detailed instructions, see:"
echo "   - CLOUDFLARE_DEPLOYMENT_GUIDE.md"
echo "   - DEPLOYMENT_CHECKLIST.md"
echo ""
echo "✅ Preparation complete! Ready to deploy."

