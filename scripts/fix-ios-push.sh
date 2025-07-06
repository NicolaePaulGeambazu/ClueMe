#!/bin/bash

# Fix iOS Push Notification Issues Script
# This script helps resolve common iOS push notification problems

echo "🔧 Fixing iOS Push Notification Issues..."

# Navigate to iOS directory
cd ios

echo "🧹 Cleaning iOS build..."
# Clean Xcode build
xcodebuild clean -workspace ClearCue2.xcworkspace -scheme ClearCue2

echo "📦 Cleaning CocoaPods..."
# Clean CocoaPods
rm -rf Pods
rm -rf Podfile.lock

echo "📦 Installing CocoaPods..."
# Reinstall CocoaPods
pod install

echo "🔧 Updating bundle identifier..."
# Update bundle identifier in project.pbxproj if needed
# (This is already done in the project file)

echo "✅ iOS Push Notification fixes applied!"
echo ""
echo "📱 Next steps:"
echo "1. Open ios/ClearCue2.xcworkspace in Xcode"
echo "2. Select your development team in Signing & Capabilities"
echo "3. Ensure 'Push Notifications' capability is enabled"
echo "4. Build and run on a physical device (not simulator)"
echo ""
echo "⚠️  Note: Push notifications require a physical device and proper Apple Developer account setup"
echo "   iOS Simulator will fall back to local notifications automatically" 