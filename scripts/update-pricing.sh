#!/bin/bash

# Quick Pricing Update Script for ClearCue
# Usage: ./scripts/update-pricing.sh [country] [plan] [period] [new_price]

set -e

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

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    print_error "Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    print_error "Not logged in to Firebase. Please run:"
    echo "firebase login"
    exit 1
fi

# Function to update pricing for a specific country and plan
update_pricing() {
    local country=$1
    local plan=$2
    local period=$3
    local new_price=$4
    
    print_status "Updating pricing for $country - $plan $period to $new_price"
    
    # Create temporary file for the update
    local temp_file=$(mktemp)
    
    # Get current remote config
    firebase remoteconfig:get --output-file="$temp_file"
    
    # Update the pricing in the JSON
    if command -v jq &> /dev/null; then
        # Use jq if available for better JSON handling
        jq --arg country "$country" \
           --arg plan "$plan" \
           --arg period "$period" \
           --arg price "$new_price" \
           '.parameters.monetization_regional_pricing.defaultValue.value |= 
            fromjson | 
            .[$country][$plan][$period] = ($price | tonumber) | 
            tojson' "$temp_file" > "${temp_file}.new"
        
        mv "${temp_file}.new" "$temp_file"
    else
        print_warning "jq not found. Using sed for JSON update (less reliable)"
        # Fallback to sed (less reliable but works for simple cases)
        sed -i.bak "s/\"$country\":{[^}]*\"$plan\":{[^}]*\"$period\":[^,]*/\"$country\":{\"currency\":\"USD\",\"symbol\":\"$\",\"individual\":{\"monthly\":3.99,\"yearly\":35.99},\"family\":{\"monthly\":7.99,\"yearly\":69.99},\"yearlySavingsPercent\":82}/" "$temp_file"
    fi
    
    # Deploy the updated config
    firebase remoteconfig:set "$temp_file"
    
    # Clean up
    rm -f "$temp_file" "${temp_file}.bak"
    
    print_success "Pricing updated successfully!"
}

# Function to show current pricing
show_pricing() {
    local country=${1:-"US"}
    
    print_status "Current pricing for $country:"
    
    # Get current remote config
    local temp_file=$(mktemp)
    firebase remoteconfig:get --output-file="$temp_file"
    
    if command -v jq &> /dev/null; then
        jq --arg country "$country" \
           '.parameters.monetization_regional_pricing.defaultValue.value | 
            fromjson | .[$country]' "$temp_file"
    else
        print_warning "jq not found. Showing raw JSON:"
        cat "$temp_file"
    fi
    
    rm -f "$temp_file"
}

# Function to update all prices by percentage
update_all_prices() {
    local percentage=$1
    local increase=$2  # "increase" or "decrease"
    
    print_status "Updating all prices by $percentage% ($increase)"
    
    # Create temporary file for the update
    local temp_file=$(mktemp)
    
    # Get current remote config
    firebase remoteconfig:get --output-file="$temp_file"
    
    if command -v jq &> /dev/null; then
        # Calculate multiplier
        local multiplier=1
        if [ "$increase" = "increase" ]; then
            multiplier=$(echo "1 + $percentage / 100" | bc -l)
        else
            multiplier=$(echo "1 - $percentage / 100" | bc -l)
        fi
        
        # Update all prices
        jq --arg multiplier "$multiplier" \
           '.parameters.monetization_regional_pricing.defaultValue.value |= 
            fromjson | 
            with_entries(.value |= 
                with_entries(.value |= 
                    if .individual then
                        .individual.monthly = (.individual.monthly * ($multiplier | tonumber))
                        | .individual.yearly = (.individual.yearly * ($multiplier | tonumber))
                        | .family.monthly = (.family.monthly * ($multiplier | tonumber))
                        | .family.yearly = (.family.yearly * ($multiplier | tonumber))
                    else . end
                )
            ) | tojson' "$temp_file" > "${temp_file}.new"
        
        mv "${temp_file}.new" "$temp_file"
        
        # Deploy the updated config
        firebase remoteconfig:set "$temp_file"
        
        print_success "All prices updated by $percentage%!"
    else
        print_error "jq is required for bulk price updates. Please install jq first."
        exit 1
    fi
    
    # Clean up
    rm -f "$temp_file"
}

# Function to show help
show_help() {
    echo "ClearCue Pricing Update Script"
    echo ""
    echo "Usage:"
    echo "  $0 show [country]                    - Show current pricing for country (default: US)"
    echo "  $0 update <country> <plan> <period> <price>  - Update specific price"
    echo "  $0 bulk <percentage> <increase|decrease>     - Update all prices by percentage"
    echo ""
    echo "Examples:"
    echo "  $0 show US                           - Show US pricing"
    echo "  $0 update US individual monthly 4.99 - Update US individual monthly to $4.99"
    echo "  $0 update GB family yearly 59.99     - Update GB family yearly to £59.99"
    echo "  $0 bulk 10 increase                  - Increase all prices by 10%"
    echo "  $0 bulk 5 decrease                   - Decrease all prices by 5%"
    echo ""
    echo "Plans: individual, family"
    echo "Periods: monthly, yearly"
    echo "Countries: US, GB, CA, AU, JP, IN, BR, MX, KR, SG, HK, DE, FR, IT, ES, NL, BE, AT, IE, FI, SE, DK, NO, CH, TW, TH, MY, ID, PH, VN"
}

# Main script logic
case "${1:-help}" in
    "show")
        show_pricing "$2"
        ;;
    "update")
        if [ $# -ne 5 ]; then
            print_error "Invalid number of arguments for update command"
            show_help
            exit 1
        fi
        update_pricing "$2" "$3" "$4" "$5"
        ;;
    "bulk")
        if [ $# -ne 3 ]; then
            print_error "Invalid number of arguments for bulk command"
            show_help
            exit 1
        fi
        update_all_prices "$2" "$3"
        ;;
    "help"|*)
        show_help
        ;;
esac

print_status "Done! Changes will take effect within a few minutes."
print_status "Monitor results at: https://console.firebase.google.com/project/your-project/remote-config" 