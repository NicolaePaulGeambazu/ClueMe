#!/bin/bash

# Convert .p8 APNs key to .p12 certificate for Firebase
# This script helps convert Apple's .p8 authentication key to .p12 certificate

echo "🔧 Converting .p8 APNs key to .p12 certificate for Firebase"
echo ""

# Check if OpenSSL is available
if ! command -v openssl &> /dev/null; then
    echo "❌ Error: OpenSSL is not installed. Please install OpenSSL first."
    echo "   On macOS: brew install openssl"
    exit 1
fi

# Get input file
echo "📁 Please provide the path to your .p8 file:"
read -p "Enter path to .p8 file: " P8_FILE

if [ ! -f "$P8_FILE" ]; then
    echo "❌ Error: File not found: $P8_FILE"
    exit 1
fi

# Get Key ID
echo ""
echo "🔑 Please provide your Key ID from Apple Developer Portal:"
read -p "Enter Key ID: " KEY_ID

# Get Team ID
echo ""
echo "👥 Please provide your Team ID from Apple Developer Portal:"
read -p "Enter Team ID: " TEAM_ID

# Get Bundle ID
echo ""
echo "📱 Please provide your Bundle ID:"
read -p "Enter Bundle ID (default: org.reactjs.native.example.clueme2): " BUNDLE_ID
BUNDLE_ID=${BUNDLE_ID:-org.reactjs.native.example.clueme2}

# Create output filename
OUTPUT_FILE="APNs_${BUNDLE_ID}_${KEY_ID}.p12"

echo ""
echo "🔄 Converting .p8 to .p12..."
echo "Input: $P8_FILE"
echo "Output: $OUTPUT_FILE"
echo "Key ID: $KEY_ID"
echo "Team ID: $TEAM_ID"
echo "Bundle ID: $BUNDLE_ID"
echo ""

# Convert .p8 to .p12
openssl pkcs12 -export \
    -inkey "$P8_FILE" \
    -in "$P8_FILE" \
    -out "$OUTPUT_FILE" \
    -name "APNs_${BUNDLE_ID}" \
    -passout pass:clearcue

if [ $? -eq 0 ]; then
    echo "✅ Successfully created .p12 certificate: $OUTPUT_FILE"
    echo ""
    echo "📋 Next steps:"
    echo "1. Go to Firebase Console: https://console.firebase.google.com/"
    echo "2. Select your project: clueme-36fb2"
    echo "3. Go to Project Settings → Cloud Messaging"
    echo "4. Upload the file: $OUTPUT_FILE"
    echo "5. Enter password: clearcue"
    echo "6. Enter Key ID: $KEY_ID"
    echo "7. Enter Team ID: $TEAM_ID"
    echo ""
    echo "🔐 Certificate password: clearcue"
    echo "🔑 Key ID: $KEY_ID"
    echo "👥 Team ID: $TEAM_ID"
    echo ""
    echo "⚠️  Important: Keep this .p12 file secure and don't share it!"
else
    echo "❌ Error: Failed to convert .p8 to .p12"
    exit 1
fi 