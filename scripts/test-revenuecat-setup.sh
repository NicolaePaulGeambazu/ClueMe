#!/bin/bash

echo "🧪 Testing RevenueCat Setup for ClearCue"
echo "========================================"

# Check if .env file exists
if [ -f ".env" ]; then
    echo "✅ .env file found"
    
    # Check RevenueCat API key
    if grep -q "REVENUECAT_IOS_API_KEY" .env; then
        API_KEY=$(grep "REVENUECAT_IOS_API_KEY" .env | cut -d'=' -f2)
        if [ "$API_KEY" != "appl_YOUR_IOS_API_KEY" ] && [ "$API_KEY" != "" ]; then
            echo "✅ RevenueCat iOS API key is set"
        else
            echo "⚠️  RevenueCat iOS API key needs to be updated"
        fi
    else
        echo "❌ RevenueCat iOS API key not found in .env"
    fi
else
    echo "❌ .env file not found"
fi

echo ""
echo "📱 Testing Native Module Setup"
echo "=============================="

# Check if react-native-purchases is installed
if grep -q "react-native-purchases" package.json; then
    echo "✅ react-native-purchases is installed"
else
    echo "❌ react-native-purchases is not installed"
fi

echo ""
echo "🔧 Next Steps:"
echo "1. Make sure you have a valid RevenueCat API key in .env"
echo "2. Run 'npx react-native run-ios' to test on iOS simulator"
echo "3. Check the console for any remaining NativeEventEmitter errors"
echo "4. If errors persist, try cleaning and rebuilding:"
echo "   - cd ios && rm -rf build && cd .."
echo "   - npx react-native run-ios --reset-cache"
echo ""
echo "💡 Note: NativeEventEmitter errors are normal in development mode"
echo "   and will be resolved when the app is properly built for production." 