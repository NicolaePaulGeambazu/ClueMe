#!/bin/bash

# ClearCue Production Build Script
# This script builds the app for production deployment

set -e  # Exit on any error

echo "🚀 Starting ClearCue Production Build..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js 18 or higher is required. Current version: $(node --version)"
    exit 1
fi

print_success "Node.js version: $(node --version)"

# Install dependencies
print_status "Installing dependencies..."
yarn install --frozen-lockfile

# Run linting
print_status "Running linting..."
yarn lint

# Run type checking
print_status "Running TypeScript type checking..."
yarn typecheck

# Run tests
print_status "Running tests..."
yarn test --coverage --watchAll=false

# Clean previous builds
print_status "Cleaning previous builds..."
yarn clean

# Generate icons
print_status "Generating app icons..."
yarn generate:icons

# iOS-only app - no Android build needed

# Build for iOS
if [ "$1" = "ios" ] || [ "$1" = "all" ] || [ -z "$1" ]; then
    print_status "Building iOS app..."
    
    # Check if Xcode is available
    if ! command -v xcodebuild &> /dev/null; then
        print_warning "Xcode not found. Skipping iOS build."
    else
        cd ios
        # Install pods
        pod install
        
        # Build for simulator first to test
        xcodebuild -workspace ClearCue2.xcworkspace \
                   -scheme ClearCue2 \
                   -configuration Release \
                   -destination 'platform=iOS Simulator,name=iPhone 15' \
                   build
        
        print_success "iOS simulator build completed"
        
        # Build for device (archive)
        xcodebuild -workspace ClearCue2.xcworkspace \
                   -scheme ClearCue2 \
                   -configuration Release \
                   -destination generic/platform=iOS \
                   -archivePath ClearCue2.xcarchive \
                   archive
        
        print_success "iOS device build completed: ios/ClearCue2.xcarchive"
        cd ..
    fi
fi

# Create build artifacts directory
mkdir -p build-artifacts

# Copy build outputs (iOS only)

if [ -d "ios/ClearCue2.xcarchive" ]; then
    print_status "iOS archive created. Use Xcode to export IPA file."
fi

# Generate build report
echo "📋 Build Report" > build-artifacts/build-report.txt
echo "===============" >> build-artifacts/build-report.txt
echo "Build Date: $(date)" >> build-artifacts/build-report.txt
echo "Node Version: $(node --version)" >> build-artifacts/build-report.txt
echo "Yarn Version: $(yarn --version)" >> build-artifacts/build-report.txt
echo "App Version: $(node -p "require('./package.json').version")" >> build-artifacts/build-report.txt

print_success "🎉 Production build completed successfully!"
print_status "Build artifacts are available in the build-artifacts/ directory"

# Optional: Upload to distribution platforms
if [ "$2" = "upload" ]; then
    print_status "Uploading to distribution platforms..."
    # Add upload logic here (Firebase App Distribution, TestFlight, etc.)
fi 