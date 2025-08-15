#!/bin/bash

# Test Firebase Remote Config Deployment for ClearCue
# This script tests the remote config deployment and shows current values

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing Firebase Remote Config for ClearCue${NC}"

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

# Get the project ID from firebase.json
PROJECT_ID=$(grep -o '"projectId": "[^"]*"' firebase.json | cut -d'"' -f4)

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Could not find projectId in firebase.json${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Project ID: ${PROJECT_ID}${NC}"

# Get current remote config
echo -e "${BLUE}📤 Fetching current Remote Config...${NC}"

# Create a temporary file for the current config
TEMP_CONFIG="temp_remote_config_$(date +%s).json"

# Get the current configuration
firebase remoteconfig:get --project=$PROJECT_ID > $TEMP_CONFIG 2>/dev/null || {
    echo -e "${RED}❌ Failed to fetch remote config${NC}"
    exit 1
}

# Check if the file has content
if [ ! -s "$TEMP_CONFIG" ]; then
    echo -e "${YELLOW}⚠️  No remote config found. Deploying initial configuration...${NC}"
    ./scripts/deploy-remote-config.sh
    exit 0
fi

echo -e "${GREEN}✅ Remote config fetched successfully${NC}"

# Validate JSON
if ! jq empty $TEMP_CONFIG 2>/dev/null; then
    echo -e "${RED}❌ Invalid JSON in remote config${NC}"
    rm -f $TEMP_CONFIG
    exit 1
fi

echo -e "${GREEN}✅ JSON validation passed${NC}"

# Show current configuration
echo -e "${BLUE}📋 Current Configuration:${NC}"

# Check if monetization parameters exist
MONETIZATION_PARAMS=$(jq -r '.parameters | keys[] | select(startswith("monetization_"))' $TEMP_CONFIG 2>/dev/null || echo "")

if [ -z "$MONETIZATION_PARAMS" ]; then
    echo -e "${YELLOW}⚠️  No monetization parameters found in remote config${NC}"
    echo -e "${BLUE}💡 Deploying monetization configuration...${NC}"
    ./scripts/deploy-remote-config.sh
    rm -f $TEMP_CONFIG
    exit 0
fi

echo -e "${GREEN}✅ Monetization parameters found${NC}"

# Display key monetization values
echo -e "${YELLOW}Free Tier Limits:${NC}"
echo "  - Reminders: $(jq -r '.parameters.monetization_free_tier_reminders.defaultValue.value // "Not set"' $TEMP_CONFIG)"
echo "  - Family Members: $(jq -r '.parameters.monetization_free_tier_family_members.defaultValue.value // "Not set"' $TEMP_CONFIG)"
echo "  - Lists: $(jq -r '.parameters.monetization_free_tier_lists.defaultValue.value // "Not set"' $TEMP_CONFIG)"
echo "  - Countdowns: $(jq -r '.parameters.monetization_free_tier_countdowns.defaultValue.value // "Not set"' $TEMP_CONFIG)"

echo -e "${YELLOW}Regional Pricing:${NC}"
echo "  - Countries supported: $(jq -r '.parameters.monetization_regional_pricing.defaultValue.value // "{}" | fromjson | keys | length' $TEMP_CONFIG)"
echo "  - Default country: $(jq -r '.parameters.monetization_default_country.defaultValue.value // "Not set"' $TEMP_CONFIG)"
echo "  - Sample pricing (US):"
echo "    Individual Monthly: $$(jq -r '.parameters.monetization_regional_pricing.defaultValue.value // "{}" | fromjson | .US.individual.monthly // "Not set"' $TEMP_CONFIG)"
echo "    Individual Yearly: $$(jq -r '.parameters.monetization_regional_pricing.defaultValue.value // "{}" | fromjson | .US.individual.yearly // "Not set"' $TEMP_CONFIG)"
echo "    Family Monthly: $$(jq -r '.parameters.monetization_regional_pricing.defaultValue.value // "{}" | fromjson | .US.family.monthly // "Not set"' $TEMP_CONFIG)"
echo "    Family Yearly: $$(jq -r '.parameters.monetization_regional_pricing.defaultValue.value // "{}" | fromjson | .US.family.yearly // "Not set"' $TEMP_CONFIG)"

echo -e "${YELLOW}Paywall Triggers:${NC}"
echo "  - Reminder Warning: $(jq -r '.parameters.monetization_paywall_reminder_warning_at.defaultValue.value // "Not set"' $TEMP_CONFIG) reminders"
echo "  - Reminder Block: $(jq -r '.parameters.monetization_paywall_reminder_block_at.defaultValue.value // "Not set"' $TEMP_CONFIG) reminders"
echo "  - Family Warning: $(jq -r '.parameters.monetization_paywall_family_warning_at.defaultValue.value // "Not set"' $TEMP_CONFIG) additional members"
echo "  - Family Block: $(jq -r '.parameters.monetization_paywall_family_block_at.defaultValue.value // "Not set"' $TEMP_CONFIG) total members"

echo -e "${YELLOW}Feature Flags:${NC}"
echo "  - Allow Recurring: $(jq -r '.parameters.monetization_free_tier_allow_recurring.defaultValue.value // "Not set"' $TEMP_CONFIG)"
echo "  - Allow Custom Notifications: $(jq -r '.parameters.monetization_free_tier_allow_custom_notifications.defaultValue.value // "Not set"' $TEMP_CONFIG)"
echo "  - Allow Multiple Notifications: $(jq -r '.parameters.monetization_free_tier_allow_multiple_notifications.defaultValue.value // "Not set"' $TEMP_CONFIG)"

# Check for conditions
CONDITIONS=$(jq -r '.conditions | length' $TEMP_CONFIG 2>/dev/null || echo "0")
if [ "$CONDITIONS" -gt 0 ]; then
    echo -e "${YELLOW}Conditions:${NC}"
    jq -r '.conditions[] | "  - \(.name): \(.expression)"' $TEMP_CONFIG
else
    echo -e "${YELLOW}Conditions:${NC} None configured"
fi

# Show version info
VERSION=$(jq -r '.version.versionNumber // "Unknown"' $TEMP_CONFIG)
UPDATE_TIME=$(jq -r '.version.updateTime // "Unknown"' $TEMP_CONFIG)
echo -e "${YELLOW}Version Info:${NC}"
echo "  - Version: $VERSION"
echo "  - Last Updated: $UPDATE_TIME"

# Compare with local config
echo -e "${BLUE}🔍 Comparing with local configuration...${NC}"

if [ -f "firebase-remote-config.json" ]; then
    LOCAL_REMINDERS=$(jq -r '.parameters.monetization_free_tier_reminders.defaultValue.value' firebase-remote-config.json 2>/dev/null || echo "Not found")
    REMOTE_REMINDERS=$(jq -r '.parameters.monetization_free_tier_reminders.defaultValue.value' $TEMP_CONFIG 2>/dev/null || echo "Not found")
    
    if [ "$LOCAL_REMINDERS" != "$REMOTE_REMINDERS" ]; then
        echo -e "${YELLOW}⚠️  Local and remote configurations differ${NC}"
        echo "  - Local reminders limit: $LOCAL_REMINDERS"
        echo "  - Remote reminders limit: $REMOTE_REMINDERS"
        echo -e "${BLUE}💡 Consider deploying local configuration${NC}"
    else
        echo -e "${GREEN}✅ Local and remote configurations match${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Local configuration file not found${NC}"
fi

# Show Firebase Console link
echo -e "${GREEN}🎉 Test completed successfully!${NC}"
echo -e "${BLUE}💡 View and edit configuration in Firebase Console:${NC}"
echo "   https://console.firebase.google.com/project/$PROJECT_ID/config"

# Clean up
rm -f $TEMP_CONFIG

echo -e "${BLUE}📝 Next steps:${NC}"
echo "  1. Test the app to ensure remote config is loading"
echo "  2. Monitor analytics for paywall performance"
echo "  3. Adjust values based on user behavior"
echo "  4. Set up A/B tests for optimization" 