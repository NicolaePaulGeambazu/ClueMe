# Firebase Remote Config Setup for Dynamic Pricing

This guide shows you how to set up Firebase Remote Config to manage pricing dynamically without code changes.

## Overview

With Firebase Remote Config, you can:
- ✅ Change prices instantly without app updates
- ✅ A/B test different pricing strategies
- ✅ Add new countries without code changes
- ✅ Respond to market changes in real-time
- ✅ Optimize pricing based on user behavior

## Firebase Console Setup

### 1. Enable Remote Config

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Engage** → **Remote Config**
4. Click **Get started**

### 2. Create Pricing Configuration

Create a new parameter called `regional_pricing_config` with this JSON structure:

```json
{
  "regional_pricing": {
    "GB": {
      "monthlyPrice": 1.49,
      "yearlyPrice": 15.00,
      "currency": "GBP",
      "yearlySavings": "Save 16%",
      "currencySymbol": "£",
      "locale": "en-GB"
    },
    "US": {
      "monthlyPrice": 1.99,
      "yearlyPrice": 19.99,
      "currency": "USD",
      "yearlySavings": "Save 17%",
      "currencySymbol": "$",
      "locale": "en-US"
    },
    "EU": {
      "monthlyPrice": 1.99,
      "yearlyPrice": 19.99,
      "currency": "EUR",
      "yearlySavings": "Save 17%",
      "currencySymbol": "€",
      "locale": "en-EU"
    },
    "CA": {
      "monthlyPrice": 2.49,
      "yearlyPrice": 24.99,
      "currency": "CAD",
      "yearlySavings": "Save 16%",
      "currencySymbol": "C$",
      "locale": "en-CA"
    },
    "AU": {
      "monthlyPrice": 2.99,
      "yearlyPrice": 29.99,
      "currency": "AUD",
      "yearlySavings": "Save 17%",
      "currencySymbol": "A$",
      "locale": "en-AU"
    },
    "JP": {
      "monthlyPrice": 298,
      "yearlyPrice": 2980,
      "currency": "JPY",
      "yearlySavings": "Save 17%",
      "currencySymbol": "¥",
      "locale": "ja-JP"
    },
    "IN": {
      "monthlyPrice": 149,
      "yearlyPrice": 1499,
      "currency": "INR",
      "yearlySavings": "Save 17%",
      "currencySymbol": "₹",
      "locale": "en-IN"
    },
    "BR": {
      "monthlyPrice": 9.90,
      "yearlyPrice": 99.90,
      "currency": "BRL",
      "yearlySavings": "Save 16%",
      "currencySymbol": "R$",
      "locale": "pt-BR"
    },
    "MX": {
      "monthlyPrice": 39.90,
      "yearlyPrice": 399.90,
      "currency": "MXN",
      "yearlySavings": "Save 17%",
      "currencySymbol": "$",
      "locale": "es-MX"
    },
    "KR": {
      "monthlyPrice": 2500,
      "yearlyPrice": 25000,
      "currency": "KRW",
      "yearlySavings": "Save 17%",
      "currencySymbol": "₩",
      "locale": "ko-KR"
    },
    "DE": {
      "monthlyPrice": 1.99,
      "yearlyPrice": 19.99,
      "currency": "EUR",
      "yearlySavings": "Save 17%",
      "currencySymbol": "€",
      "locale": "de-DE"
    },
    "FR": {
      "monthlyPrice": 1.99,
      "yearlyPrice": 19.99,
      "currency": "EUR",
      "yearlySavings": "Save 17%",
      "currencySymbol": "€",
      "locale": "fr-FR"
    },
    "IT": {
      "monthlyPrice": 1.99,
      "yearlyPrice": 19.99,
      "currency": "EUR",
      "yearlySavings": "Save 17%",
      "currencySymbol": "€",
      "locale": "it-IT"
    },
    "ES": {
      "monthlyPrice": 1.99,
      "yearlyPrice": 19.99,
      "currency": "EUR",
      "yearlySavings": "Save 17%",
      "currencySymbol": "€",
      "locale": "es-ES"
    },
    "NL": {
      "monthlyPrice": 1.99,
      "yearlyPrice": 19.99,
      "currency": "EUR",
      "yearlySavings": "Save 17%",
      "currencySymbol": "€",
      "locale": "nl-NL"
    },
    "SE": {
      "monthlyPrice": 19.90,
      "yearlyPrice": 199.90,
      "currency": "SEK",
      "yearlySavings": "Save 17%",
      "currencySymbol": "kr",
      "locale": "sv-SE"
    },
    "NO": {
      "monthlyPrice": 19.90,
      "yearlyPrice": 199.90,
      "currency": "NOK",
      "yearlySavings": "Save 17%",
      "currencySymbol": "kr",
      "locale": "no-NO"
    },
    "DK": {
      "monthlyPrice": 14.90,
      "yearlyPrice": 149.90,
      "currency": "DKK",
      "yearlySavings": "Save 17%",
      "currencySymbol": "kr",
      "locale": "da-DK"
    },
    "CH": {
      "monthlyPrice": 2.50,
      "yearlyPrice": 24.90,
      "currency": "CHF",
      "yearlySavings": "Save 17%",
      "currencySymbol": "CHF",
      "locale": "de-CH"
    },
    "SG": {
      "monthlyPrice": 2.99,
      "yearlyPrice": 29.99,
      "currency": "SGD",
      "yearlySavings": "Save 17%",
      "currencySymbol": "S$",
      "locale": "en-SG"
    },
    "HK": {
      "monthlyPrice": 15.90,
      "yearlyPrice": 159.90,
      "currency": "HKD",
      "yearlySavings": "Save 17%",
      "currencySymbol": "HK$",
      "locale": "en-HK"
    },
    "TW": {
      "monthlyPrice": 60,
      "yearlyPrice": 600,
      "currency": "TWD",
      "yearlySavings": "Save 17%",
      "currencySymbol": "NT$",
      "locale": "zh-TW"
    },
    "TH": {
      "monthlyPrice": 69,
      "yearlyPrice": 690,
      "currency": "THB",
      "yearlySavings": "Save 17%",
      "currencySymbol": "฿",
      "locale": "th-TH"
    },
    "MY": {
      "monthlyPrice": 8.90,
      "yearlyPrice": 89.90,
      "currency": "MYR",
      "yearlySavings": "Save 17%",
      "currencySymbol": "RM",
      "locale": "ms-MY"
    },
    "ID": {
      "monthlyPrice": 29000,
      "yearlyPrice": 290000,
      "currency": "IDR",
      "yearlySavings": "Save 17%",
      "currencySymbol": "Rp",
      "locale": "id-ID"
    },
    "PH": {
      "monthlyPrice": 99,
      "yearlyPrice": 990,
      "currency": "PHP",
      "yearlySavings": "Save 17%",
      "currencySymbol": "₱",
      "locale": "en-PH"
    },
    "VN": {
      "monthlyPrice": 45000,
      "yearlyPrice": 450000,
      "currency": "VND",
      "yearlySavings": "Save 17%",
      "currencySymbol": "₫",
      "locale": "vi-VN"
    }
  },
  "default_pricing": {
    "monthlyPrice": 1.49,
    "yearlyPrice": 15.00,
    "currency": "GBP",
    "yearlySavings": "Save 16%",
    "currencySymbol": "£"
  }
}
```

### 3. Publish Configuration

1. Click **Publish changes**
2. Add a description: "Initial regional pricing configuration"
3. Click **Publish**

## How to Change Prices

### Method 1: Firebase Console (Easiest)

1. Go to **Remote Config** in Firebase Console
2. Click on the `regional_pricing_config` parameter
3. Edit the JSON to change prices
4. Click **Publish changes**

**Example: Increase US pricing**
```json
{
  "regional_pricing": {
    "US": {
      "monthlyPrice": 2.99,  // Changed from 1.99
      "yearlyPrice": 29.99,  // Changed from 19.99
      "currency": "USD",
      "yearlySavings": "Save 17%",
      "currencySymbol": "$",
      "locale": "en-US"
    }
  }
}
```

### Method 2: Firebase CLI (Advanced)

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init remoteconfig`
4. Edit `remoteconfig.json`
5. Deploy: `firebase deploy --only remoteconfig`

## Adding New Countries

### Step 1: Add Country to Firebase Config

```json
{
  "regional_pricing": {
    "NZ": {
      "monthlyPrice": 3.99,
      "yearlyPrice": 39.99,
      "currency": "NZD",
      "yearlySavings": "Save 17%",
      "currencySymbol": "NZ$",
      "locale": "en-NZ"
    }
  }
}
```

### Step 2: Update Geolocation Service (One-time)

Add the country mapping in `src/services/geolocationService.ts`:

```typescript
// In getCountryCodeFromLocale method
const localeMap: { [key: string]: string } = {
  // ... existing mappings
  'en-NZ': 'NZ',  // Add this line
};

// In getCountryName method
const countryNames: { [key: string]: string } = {
  // ... existing mappings
  'NZ': 'New Zealand',  // Add this line
};

// In getCurrencyForCountry method
const currencyMap: { [key: string]: string } = {
  // ... existing mappings
  'NZ': 'NZD',  // Add this line
};

// In getCurrencySymbol method
const symbolMap: { [key: string]: string } = {
  // ... existing mappings
  'NZ': 'NZ$',  // Add this line
};
```

## A/B Testing Pricing

### Create A/B Test

1. Go to **Remote Config** → **A/B Testing**
2. Click **Create experiment**
3. Set up variants:

**Variant A (Control):**
```json
{
  "regional_pricing": {
    "US": {
      "monthlyPrice": 1.99,
      "yearlyPrice": 19.99
    }
  }
}
```

**Variant B (Test):**
```json
{
  "regional_pricing": {
    "US": {
      "monthlyPrice": 2.49,
      "yearlyPrice": 24.99
    }
  }
}
```

4. Set traffic allocation (e.g., 50% each)
5. Launch experiment

## Conditional Pricing

### Holiday Pricing

```json
{
  "regional_pricing": {
    "US": {
      "monthlyPrice": 0.99,
      "yearlyPrice": 9.99,
      "currency": "USD",
      "yearlySavings": "Save 50% - Holiday Special!",
      "currencySymbol": "$",
      "locale": "en-US"
    }
  }
}
```

### Regional Promotions

```json
{
  "regional_pricing": {
    "IN": {
      "monthlyPrice": 99,
      "yearlyPrice": 999,
      "currency": "INR",
      "yearlySavings": "Save 17% - Diwali Special!",
      "currencySymbol": "₹",
      "locale": "en-IN"
    }
  }
}
```

## Monitoring and Analytics

### Track Pricing Changes

1. Go to **Remote Config** → **History**
2. View all configuration changes
3. See when changes were published

### Monitor Impact

1. Go to **Analytics** → **Events**
2. Track subscription events
3. Compare conversion rates before/after price changes

## Best Practices

### 1. Gradual Changes
- Don't increase prices by more than 20% at once
- Test with small user segments first
- Monitor conversion rates closely

### 2. Clear Communication
- Update savings text to reflect changes
- Consider in-app messaging for price changes
- Be transparent about pricing updates

### 3. Fallback Strategy
- Always have default pricing in code
- Test fallback scenarios
- Monitor error rates

### 4. Validation
- Validate JSON structure before publishing
- Test with different device locales
- Verify currency symbols display correctly

## Troubleshooting

### Common Issues

1. **Prices not updating**
   - Check if app is fetching latest config
   - Verify parameter name matches code
   - Check Firebase project configuration

2. **Currency symbols not showing**
   - Verify currencySymbol field in config
   - Check fallback currency mapping
   - Test with different locales

3. **JSON parsing errors**
   - Validate JSON structure
   - Check for missing commas/brackets
   - Use JSON validator tool

### Debug Commands

```typescript
// Check current config
console.log('Remote config:', await firebase.remoteConfig().getValue('regional_pricing_config').asString());

// Check user location
console.log('User location:', geolocationService.getUserLocation());

// Check pricing
console.log('Regional pricing:', await geolocationService.getRegionalPricing());
```

## Security Considerations

### 1. Server-Side Validation
- Validate prices on your backend
- Implement anti-fraud measures
- Use secure payment processing

### 2. Rate Limiting
- Limit config fetch frequency
- Implement caching strategies
- Monitor API usage

### 3. Data Privacy
- Don't store sensitive user data in config
- Follow GDPR compliance
- Implement data retention policies

## Next Steps

1. **Set up Firebase project** and enable Remote Config
2. **Configure initial pricing** using the JSON above
3. **Test with different locales** to verify pricing
4. **Monitor analytics** to track conversion rates
5. **Optimize pricing** based on user behavior

## Support

For issues with Firebase Remote Config:
- [Firebase Documentation](https://firebase.google.com/docs/remote-config)
- [Firebase Support](https://firebase.google.com/support)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase-remote-config) 