#!/bin/bash

# Vercel Deployment Helper Script
# This script helps you prepare for Vercel deployment

set -e

echo "🚀 Vercel Deployment Helper"
echo "============================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "ℹ $1"
}

# Check if we're in the app directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the app directory."
    exit 1
fi

print_success "Found package.json"

# Check for required files
echo ""
echo "📋 Checking deployment files..."

if [ -f "vercel.json" ]; then
    print_success "vercel.json exists"
else
    print_error "vercel.json not found"
    exit 1
fi

if [ -f ".vercelignore" ]; then
    print_success ".vercelignore exists"
else
    print_warning ".vercelignore not found (optional)"
fi

if [ -f "next.config.js" ]; then
    print_success "next.config.js exists"
else
    print_error "next.config.js not found"
    exit 1
fi

# Check for Prisma
echo ""
echo "🗄️  Checking database setup..."

if [ -f "prisma/schema.prisma" ]; then
    print_success "Prisma schema found"
else
    print_error "Prisma schema not found"
    exit 1
fi

# Check if node_modules exists
if [ -d "node_modules" ]; then
    print_success "Dependencies installed"
else
    print_warning "Dependencies not installed. Run 'npm install' first."
fi

# Environment variables check
echo ""
echo "🔐 Environment Variables Checklist"
echo "=================================="
echo ""
echo "You will need to set these in Vercel:"
echo ""
echo "1. DATABASE_URL"
echo "   Example: postgresql://user:pass@host:5432/db"
echo ""
echo "2. NEXTAUTH_URL"
echo "   Example: https://your-app.vercel.app"
echo ""
echo "3. NEXTAUTH_SECRET"
echo "   Generate with: openssl rand -base64 32"
echo ""
echo "4. ABACUSAI_API_KEY"
echo "   Get from: AbacusAI dashboard"
echo ""
echo "5. NODE_ENV"
echo "   Value: production"
echo ""

# Offer to generate NEXTAUTH_SECRET
echo "Would you like to generate a NEXTAUTH_SECRET now? (y/n)"
read -r generate_secret

if [ "$generate_secret" = "y" ] || [ "$generate_secret" = "Y" ]; then
    echo ""
    echo "Generated NEXTAUTH_SECRET:"
    echo "=========================="
    openssl rand -base64 32
    echo ""
    print_info "Copy this value and save it securely!"
    echo ""
fi

# Database setup instructions
echo ""
echo "🗄️  Database Setup"
echo "=================="
echo ""
echo "Before deploying, ensure your database is ready:"
echo ""
echo "1. Create a PostgreSQL database (Vercel Postgres, Supabase, Neon, etc.)"
echo "2. Get the DATABASE_URL connection string"
echo "3. Run migrations:"
echo "   export DATABASE_URL='your-database-url'"
echo "   npx prisma migrate deploy"
echo "4. Generate Prisma Client:"
echo "   npx prisma generate"
echo "5. (Optional) Seed production data:"
echo "   ALLOW_PRODUCTION_SEED=true npx tsx scripts/seed-production.ts"
echo ""

# Git check
echo ""
echo "📦 Git Repository"
echo "================="
echo ""

if [ -d ".git" ]; then
    print_success "Git repository initialized"
    
    # Check if there are uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        print_warning "You have uncommitted changes"
        echo ""
        echo "Uncommitted files:"
        git status --short
        echo ""
        echo "Would you like to commit these changes? (y/n)"
        read -r commit_changes
        
        if [ "$commit_changes" = "y" ] || [ "$commit_changes" = "Y" ]; then
            echo "Enter commit message:"
            read -r commit_message
            git add .
            git commit -m "$commit_message"
            print_success "Changes committed"
        fi
    else
        print_success "No uncommitted changes"
    fi
    
    # Check if remote is set
    if git remote -v | grep -q "origin"; then
        print_success "Git remote configured"
        echo ""
        echo "Remote URL:"
        git remote get-url origin
    else
        print_warning "No git remote configured"
        echo "Add a remote with: git remote add origin <url>"
    fi
else
    print_error "Not a git repository"
    echo "Initialize with: git init"
    exit 1
fi

# Vercel CLI check
echo ""
echo "🔧 Vercel CLI"
echo "============="
echo ""

if command -v vercel &> /dev/null; then
    print_success "Vercel CLI installed"
    vercel --version
else
    print_warning "Vercel CLI not installed"
    echo ""
    echo "Install with: npm i -g vercel"
    echo ""
    echo "Would you like to install it now? (y/n)"
    read -r install_vercel
    
    if [ "$install_vercel" = "y" ] || [ "$install_vercel" = "Y" ]; then
        npm i -g vercel
        print_success "Vercel CLI installed"
    fi
fi

# Final checklist
echo ""
echo "✅ Pre-Deployment Checklist"
echo "==========================="
echo ""
echo "Before deploying, make sure:"
echo ""
echo "□ Database is created and accessible"
echo "□ Database migrations are run"
echo "□ All environment variables are ready"
echo "□ Code is committed to Git"
echo "□ Code is pushed to remote repository"
echo "□ You have a Vercel account"
echo ""

# Deployment options
echo ""
echo "🚀 Ready to Deploy?"
echo "==================="
echo ""
echo "Choose deployment method:"
echo ""
echo "1. Deploy via Vercel Dashboard (Recommended for first deployment)"
echo "   → Go to: https://vercel.com/new"
echo "   → Import your Git repository"
echo "   → Set root directory to 'app'"
echo "   → Add environment variables"
echo "   → Click Deploy"
echo ""
echo "2. Deploy via Vercel CLI"
echo "   → Run: vercel"
echo "   → Follow the prompts"
echo "   → Add environment variables"
echo "   → Run: vercel --prod"
echo ""

echo "📚 Documentation"
echo "================"
echo ""
echo "For detailed instructions, see:"
echo "  • VERCEL_DEPLOYMENT.md - Complete deployment guide"
echo "  • VERCEL_ENV_VARS.md - Environment variables reference"
echo "  • VERCEL_CHECKLIST.md - Step-by-step checklist"
echo "  • VERCEL_README.md - Overview and quick start"
echo ""

print_success "Pre-deployment check complete!"
echo ""
echo "Good luck with your deployment! 🎉"
