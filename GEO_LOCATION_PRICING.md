# Geolocation and Regional Pricing System

This document outlines the geolocation and regional pricing system implemented in ClearCue to support worldwide availability with localized pricing.

## Overview

The system automatically detects user location and provides appropriate pricing in local currencies, ensuring the app is accessible and affordable worldwide.

## Architecture

### Core Services

1. **GeolocationService** (`src/services/geolocationService.ts`)
   - Detects user location using device locale and geolocation
   - Manages regional pricing configurations
   - Provides currency symbols and formatting

2. **RemoteConfigService** (`src/services/remoteConfigService.ts`)
   - Integrates with Firebase Remote Config for dynamic pricing
   - Uses GeolocationService for location-based pricing
   - Provides fallback pricing when remote config is unavailable

3. **PremiumService** (`src/services/premiumService.ts`)
   - Manages subscription tiers and features
   - Uses regional pricing from RemoteConfigService
   - Handles in-app purchase integration

## Supported Regions

### Primary Markets

| Country | Currency | Monthly Price | Yearly Price | Savings |
|---------|----------|---------------|--------------|---------|
| United Kingdom | GBP | £1.49 | £15.00 | Save 16% |
| United States | USD | $1.99 | $19.99 | Save 17% |
| European Union | EUR | €1.99 | €19.99 | Save 17% |
| Canada | CAD | C$2.49 | C$24.99 | Save 16% |
| Australia | AUD | A$2.99 | A$29.99 | Save 17% |

### Emerging Markets

| Country | Currency | Monthly Price | Yearly Price | Savings |
|---------|----------|---------------|--------------|---------|
| Japan | JPY | ¥298 | ¥2,980 | Save 17% |
| India | INR | ₹149 | ₹1,499 | Save 17% |
| Brazil | BRL | R$9.90 | R$99.90 | Save 16% |
| Mexico | MXN | $39.90 | $399.90 | Save 17% |
| South Korea | KRW | ₩2,500 | ₩25,000 | Save 17% |

### European Markets

| Country | Currency | Monthly Price | Yearly Price | Savings |
|---------|----------|---------------|--------------|---------|
| Germany | EUR | €1.99 | €19.99 | Save 17% |
| France | EUR | €1.99 | €19.99 | Save 17% |
| Italy | EUR | €1.99 | €19.99 | Save 17% |
| Spain | EUR | €1.99 | €19.99 | Save 17% |
| Netherlands | EUR | €1.99 | €19.99 | Save 17% |
| Sweden | SEK | kr19.90 | kr199.90 | Save 17% |
| Norway | NOK | kr19.90 | kr199.90 | Save 17% |
| Denmark | DKK | kr14.90 | kr149.90 | Save 17% |
| Switzerland | CHF | CHF2.50 | CHF24.90 | Save 17% |

### Asia-Pacific Markets

| Country | Currency | Monthly Price | Yearly Price | Savings |
|---------|----------|---------------|--------------|---------|
| Singapore | SGD | S$2.99 | S$29.99 | Save 17% |
| Hong Kong | HKD | HK$15.90 | HK$159.90 | Save 17% |
| Taiwan | TWD | NT$60 | NT$600 | Save 17% |
| Thailand | THB | ฿69 | ฿690 | Save 17% |
| Malaysia | MYR | RM8.90 | RM89.90 | Save 17% |
| Indonesia | IDR | Rp29,000 | Rp290,000 | Save 17% |
| Philippines | PHP | ₱99 | ₱990 | Save 17% |
| Vietnam | VND | ₫45,000 | ₫450,000 | Save 17% |

## Location Detection Methods

### 1. Device Locale Detection (Primary)
- Uses `Intl.DateTimeFormat().resolvedOptions().locale`
- Maps locale to country code (e.g., "en-US" → "US")
- Fallback mapping for language-only locales

### 2. Geolocation API (Future Enhancement)
- React Native Geolocation API
- Reverse geocoding to determine country
- Requires user permission

### 3. IP-based Detection (Future Enhancement)
- Third-party geolocation service
- Automatic country detection
- No user permission required

## Currency Formatting

### Automatic Currency Symbol Detection
```typescript
// Example usage
const currencySymbol = geolocationService.getCurrentCurrencySymbol();
// Returns: £, $, €, ¥, ₹, etc.
```

### Price Display
```typescript
// In components
<Text>{plan.currencySymbol}{plan.price}</Text>
// Displays: £1.49, $1.99, €1.99, etc.
```

## Firebase Remote Config Integration

### Configuration Keys
```json
{
  "premium_monthly_price": 1.49,
  "premium_yearly_price": 15.00,
  "premium_currency": "GBP",
  "premium_yearly_savings": "Save 16%",
  "regional_pricing_enabled": true
}
```

### Regional Pricing Override
```json
{
  "regional_pricing": {
    "US": {
      "monthlyPrice": 1.99,
      "yearlyPrice": 19.99,
      "currency": "USD",
      "yearlySavings": "Save 17%"
    }
  }
}
```

## Implementation Details

### GeolocationService Methods

```typescript
// Initialize location detection
await geolocationService.initialize();

// Get user location
const location = geolocationService.getUserLocation();
// Returns: { countryCode, countryName, currency, currencySymbol, locale, timezone }

// Get regional pricing
const pricing = geolocationService.getRegionalPricing();
// Returns: { monthlyPrice, yearlyPrice, currency, yearlySavings, currencySymbol }

// Get currency symbol
const symbol = geolocationService.getCurrentCurrencySymbol();
// Returns: "£", "$", "€", etc.
```

### PremiumService Integration

```typescript
// Get subscription plans with regional pricing
const plans = premiumService.getSubscriptionPlans();
// Returns plans with correct currency symbols and pricing

// Check premium status
const isPremium = premiumService.isPremium();

// Check specific features
const hasFeature = premiumService.hasFeature('noAds');
```

## Fallback Strategy

### 1. Location Detection Fallback
1. Try device locale detection
2. Fallback to default location (GB)
3. Use default pricing (GBP £1.49/£15.00)

### 2. Pricing Fallback
1. Try Firebase Remote Config
2. Fallback to hardcoded regional pricing
3. Fallback to default pricing (GBP)

### 3. Currency Fallback
1. Try detected currency
2. Fallback to GBP (£)

## Testing

### Manual Testing Checklist

- [ ] Test with different device locales
- [ ] Verify currency symbols display correctly
- [ ] Check pricing accuracy for each region
- [ ] Test fallback scenarios
- [ ] Verify Firebase Remote Config integration

### Test Cases

```typescript
// Test different locales
const testLocales = [
  'en-GB', 'en-US', 'en-CA', 'en-AU',
  'de-DE', 'fr-FR', 'es-ES', 'it-IT',
  'ja-JP', 'ko-KR', 'zh-CN', 'hi-IN'
];

// Test currency formatting
const testCurrencies = [
  'GBP', 'USD', 'EUR', 'CAD', 'AUD',
  'JPY', 'INR', 'BRL', 'MXN', 'KRW'
];
```

## Future Enhancements

### 1. Advanced Geolocation
- GPS-based location detection
- IP-based geolocation
- Location permission handling

### 2. Dynamic Pricing
- Real-time currency conversion
- Market-specific pricing strategies
- A/B testing for pricing

### 3. Localization
- Localized feature descriptions
- Regional feature availability
- Cultural pricing considerations

### 4. Analytics
- Regional usage analytics
- Pricing conversion rates
- Revenue optimization

## Security Considerations

### 1. Location Privacy
- Minimal location data collection
- Local processing when possible
- Clear privacy policy

### 2. Pricing Security
- Server-side price validation
- Anti-fraud measures
- Secure payment processing

### 3. Data Protection
- GDPR compliance
- Data encryption
- Secure storage

## Deployment Checklist

### Pre-Launch
- [ ] Configure Firebase Remote Config
- [ ] Set up regional pricing
- [ ] Test all supported regions
- [ ] Verify currency formatting
- [ ] Check fallback scenarios

### Post-Launch
- [ ] Monitor regional usage
- [ ] Track conversion rates
- [ ] Optimize pricing strategy
- [ ] Add new regions as needed

## Support

For questions or issues with the geolocation and regional pricing system:

1. Check the implementation in `src/services/geolocationService.ts`
2. Review Firebase Remote Config setup
3. Test with different device locales
4. Verify currency formatting in components

## Related Files

- `src/services/geolocationService.ts` - Core geolocation service
- `src/services/remoteConfigService.ts` - Firebase Remote Config integration
- `src/services/premiumService.ts` - Premium subscription management
- `src/components/premium/PremiumUpgradeModal.tsx` - Pricing display component
- `src/hooks/usePremium.ts` - Premium state management hook 