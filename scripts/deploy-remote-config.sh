#!/bin/bash

# Firebase Remote Config Deployment Script for ClearCue Monetization
# This script deploys the monetization configuration to Firebase Remote Config

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying Firebase Remote Config for ClearCue Monetization${NC}"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI is not installed. Please install it first:${NC}"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Firebase. Please login first:${NC}"
    firebase login
fi

# Check if firebase.json exists
if [ ! -f "firebase.json" ]; then
    echo -e "${RED}❌ firebase.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Get the project ID from firebase.json
PROJECT_ID=$(grep -o '"projectId": "[^"]*"' firebase.json | cut -d'"' -f4)

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Could not find projectId in firebase.json${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Project ID: ${PROJECT_ID}${NC}"

# Check if the remote config file exists
if [ ! -f "firebase-remote-config.json" ]; then
    echo -e "${RED}❌ firebase-remote-config.json not found${NC}"
    exit 1
fi

# Validate the JSON file
if ! jq empty firebase-remote-config.json 2>/dev/null; then
    echo -e "${RED}❌ Invalid JSON in firebase-remote-config.json${NC}"
    exit 1
fi

echo -e "${GREEN}✅ JSON validation passed${NC}"

# Deploy the remote config
echo -e "${BLUE}📤 Deploying Remote Config...${NC}"

# Use Firebase CLI to deploy remote config
firebase remoteconfig:get --project=$PROJECT_ID > current-config.json 2>/dev/null || echo "{}" > current-config.json

# Deploy the new configuration
firebase remoteconfig:set firebase-remote-config.json --project=$PROJECT_ID

echo -e "${GREEN}✅ Remote Config deployed successfully!${NC}"

# Show the deployed configuration
echo -e "${BLUE}📋 Deployed Configuration Summary:${NC}"
echo -e "${YELLOW}Free Tier Limits:${NC}"
echo "  - Reminders: $(jq -r '.parameters.monetization_free_tier_reminders.defaultValue.value' firebase-remote-config.json)"
echo "  - Family Members: $(jq -r '.parameters.monetization_free_tier_family_members.defaultValue.value' firebase-remote-config.json)"
echo "  - Lists: $(jq -r '.parameters.monetization_free_tier_lists.defaultValue.value' firebase-remote-config.json)"
echo "  - Countdowns: $(jq -r '.parameters.monetization_free_tier_countdowns.defaultValue.value' firebase-remote-config.json)"

echo -e "${YELLOW}Regional Pricing:${NC}"
echo "  - Countries supported: $(jq -r '.parameters.monetization_regional_pricing.defaultValue.value | fromjson | keys | length' firebase-remote-config.json)"
echo "  - Default country: $(jq -r '.parameters.monetization_default_country.defaultValue.value' firebase-remote-config.json)"
echo "  - Sample pricing (US):"
echo "    Individual Monthly: $$(jq -r '.parameters.monetization_regional_pricing.defaultValue.value | fromjson | .US.individual.monthly' firebase-remote-config.json)"
echo "    Individual Yearly: $$(jq -r '.parameters.monetization_regional_pricing.defaultValue.value | fromjson | .US.individual.yearly' firebase-remote-config.json)"
echo "    Family Monthly: $$(jq -r '.parameters.monetization_regional_pricing.defaultValue.value | fromjson | .US.family.monthly' firebase-remote-config.json)"
echo "    Family Yearly: $$(jq -r '.parameters.monetization_regional_pricing.defaultValue.value | fromjson | .US.family.yearly' firebase-remote-config.json)"

echo -e "${YELLOW}Paywall Triggers:${NC}"
echo "  - Reminder Warning: $(jq -r '.parameters.monetization_paywall_reminder_warning_at.defaultValue.value' firebase-remote-config.json) reminders"
echo "  - Reminder Block: $(jq -r '.parameters.monetization_paywall_reminder_block_at.defaultValue.value' firebase-remote-config.json) reminders"
echo "  - Family Warning: $(jq -r '.parameters.monetization_paywall_family_warning_at.defaultValue.value' firebase-remote-config.json) additional members"
echo "  - Family Block: $(jq -r '.parameters.monetization_paywall_family_block_at.defaultValue.value' firebase-remote-config.json) total members"

echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo -e "${BLUE}💡 You can now update these values in the Firebase Console:${NC}"
echo "   https://console.firebase.google.com/project/$PROJECT_ID/config"
echo ""
echo -e "${YELLOW}⚠️  Note: Changes may take up to 1 hour to propagate to all users.${NC}"

# Clean up temporary files
rm -f current-config.json 