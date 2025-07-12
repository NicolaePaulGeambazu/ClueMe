#!/bin/bash

# ClearCue API Key Setup Script
# This script helps you set up API keys securely

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env already exists
if [ -f ".env" ]; then
    print_warning ".env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Setup cancelled. Your existing .env file is preserved."
        exit 0
    fi
fi

print_status "Setting up API keys for ClearCue..."

# Copy example file
if [ -f "env.example" ]; then
    cp env.example .env
    print_success "Created .env file from env.example"
else
    print_error "env.example file not found!"
    exit 1
fi

# Check if .env is in .gitignore
if grep -q "^\.env$" .gitignore; then
    print_success ".env is already in .gitignore"
else
    echo ".env" >> .gitignore
    print_success "Added .env to .gitignore"
fi

print_status "Please edit the .env file with your actual API keys:"
echo
print_status "Required keys:"
echo "  - REVENUECAT_IOS_API_KEY (from RevenueCat dashboard)"
echo "  - REVENUECAT_ANDROID_API_KEY (from RevenueCat dashboard)"
echo
print_status "Optional keys:"
echo "  - FIREBASE_PROJECT_ID"
echo "  - GOOGLE_MAPS_API_KEY"
echo "  - ADMOB_APP_ID"
echo

# Open .env file for editing
if command -v nano &> /dev/null; then
    print_status "Opening .env file in nano..."
    nano .env
elif command -v vim &> /dev/null; then
    print_status "Opening .env file in vim..."
    vim .env
elif command -v code &> /dev/null; then
    print_status "Opening .env file in VS Code..."
    code .env
else
    print_warning "No text editor found. Please manually edit the .env file."
fi

print_status "Verifying setup..."

# Check if keys are set
if [ -f ".env" ]; then
    if grep -q "REVENUECAT_IOS_API_KEY=appl_" .env && grep -q "REVENUECAT_ANDROID_API_KEY=goog_" .env; then
        print_success "API keys appear to be set correctly!"
    else
        print_warning "Please make sure to set your actual RevenueCat API keys in .env"
    fi
else
    print_error ".env file not found!"
    exit 1
fi

# Verify .env is ignored
if git status --porcelain | grep -q ".env"; then
    print_warning ".env file is tracked by git! This is a security risk."
    print_status "Run: git rm --cached .env to untrack it"
else
    print_success ".env file is properly ignored by git"
fi

print_success "API key setup complete!"
print_status "Next steps:"
echo "  1. Get your RevenueCat API keys from https://app.revenuecat.com/"
echo "  2. Update the .env file with your actual keys"
echo "  3. Test the app: yarn start:ios"
echo "  4. Deploy Firebase config: ./scripts/deploy-remote-config.sh" 