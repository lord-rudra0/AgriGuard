#!/bin/bash

# Agricultural Monitoring System - Vercel Deployment Script

echo "🚀 Starting Vercel deployment for Agricultural Monitoring System..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel..."
    vercel login
fi

echo "📦 Deploying to Vercel..."

# Deploy the project
vercel --prod

echo "✅ Deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Go to your Vercel dashboard"
echo "2. Navigate to your project settings"
echo "3. Add the following environment variables:"
echo "   - MONGO_URI (your MongoDB connection string)"
echo "   - JWT_SECRET (a secure random string)"
echo "   - GEMINI_API_KEY (your Google Gemini API key)"
echo "4. Optionally add SMTP variables for email functionality"
echo "5. Redeploy: vercel --prod"
echo ""
echo "🌐 Your application will be available at the URL provided by Vercel"
