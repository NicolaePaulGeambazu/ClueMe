# ClearCue Production Deployment Guide

This guide covers the complete process of preparing and deploying ClearCue for production.

## 🚀 Pre-Production Checklist

### Environment Setup
- [ ] Node.js 18+ installed
- [ ] Yarn package manager installed
- [ ] React Native CLI installed
- [ ] Android Studio (for Android builds)
- [ ] Xcode (for iOS builds)
- [ ] Firebase project configured
- [ ] Environment variables set

### Code Quality
- [ ] All tests passing
- [ ] Linting errors resolved
- [ ] TypeScript compilation successful
- [ ] All hardcoded text replaced with translations
- [ ] Performance optimizations implemented
- [ ] Security review completed

### Configuration
- [ ] Production Firebase configuration
- [ ] App store metadata prepared
- [ ] App icons and splash screens generated
- [ ] Privacy policy and terms of service
- [ ] App store screenshots prepared

## 📱 Build Process

### 1. Environment Variables

Create a `.env.production` file in the project root:

```bash
# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# Analytics (optional)
ANALYTICS_TRACKING_ID=your_analytics_id

# API Configuration
API_BASE_URL=https://api.clearcue.app
```

### 2. Production Build

Run the production build script:

```bash
# Build for both platforms
yarn build:production

# Build for Android only
yarn build:production:android

# Build for iOS only
yarn build:production:ios
```

The build script will:
- Install dependencies
- Run linting and type checking
- Execute tests
- Clean previous builds
- Generate app icons
- Build for target platforms
- Create build artifacts

### 3. Manual Build Commands

If you prefer manual control:

```bash
# Install dependencies
yarn install --frozen-lockfile

# Run quality checks
yarn lint
yarn typecheck
yarn test

# Clean builds
yarn clean

# Generate icons
yarn generate:icons

# Build Android
yarn build:android

# Build iOS
yarn build:ios
```

## 🍎 iOS Deployment

### 1. App Store Connect Setup

1. Create an app in App Store Connect
2. Configure app metadata:
   - App name: ClearCue
   - Bundle ID: com.clearcue.app
   - Category: Productivity
   - Age Rating: 4+

### 2. Build and Upload

1. Open the project in Xcode
2. Select the ClearCue2 scheme
3. Set build configuration to Release
4. Archive the app
5. Upload to App Store Connect

### 3. App Store Review

Prepare the following for review:
- App description
- Screenshots (iPhone and iPad)
- Privacy policy URL
- Support URL
- Marketing URL (optional)

## 🤖 Android Deployment

### 1. Google Play Console Setup

1. Create an app in Google Play Console
2. Configure app metadata:
   - App name: ClearCue
   - Package name: com.clearcue.app
   - Category: Productivity
   - Content rating: Everyone

### 2. Build and Upload

1. Generate a signed APK or AAB:
   ```bash
   # For APK
   yarn build:android
   
   # For App Bundle (recommended)
   yarn build:android:bundle
   ```

2. Upload to Google Play Console

### 3. Play Store Review

Prepare the following for review:
- App description
- Screenshots (phone and tablet)
- Feature graphic
- Privacy policy URL
- Support URL

## 🔧 Configuration Files

### Production Configuration

The app uses environment-specific configuration:

- `src/config/production.ts` - Production settings
- `src/config/development.ts` - Development settings
- `src/config/index.ts` - Configuration selector

### Feature Flags

Production features can be controlled via configuration:

```typescript
features: {
  familySharing: true,
  pushNotifications: true,
  locationReminders: true,
  calendarIntegration: true,
  offlineMode: true,
  dataExport: true,
}
```

### Performance Limits

Production performance limits:

```typescript
performance: {
  maxRemindersPerUser: 1000,
  maxFamilyMembers: 10,
  maxListsPerUser: 50,
  maxItemsPerList: 100,
  cacheExpiryHours: 24,
}
```

## 🌐 Internationalization

The app supports multiple languages:

- English (en) - Default
- Spanish (es)
- French (fr)

### Adding New Languages

1. Create a new locale file: `src/locales/[language].json`
2. Add the language to the language selector
3. Update the i18n configuration

### Translation Keys

All user-facing text should use translation keys:

```typescript
// ✅ Good
<Text>{t('auth.login.title')}</Text>

// ❌ Bad
<Text>Welcome Back</Text>
```

## 🔒 Security Considerations

### Firebase Security Rules

Ensure proper Firebase security rules are configured:

```javascript
// Firestore rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /families/{familyId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.members;
    }
  }
}
```

### App Security

- All API calls use HTTPS
- User data is encrypted in transit
- Firebase Authentication for user management
- Proper input validation and sanitization

## 📊 Monitoring and Analytics

### Firebase Analytics

Configure Firebase Analytics for production:

```typescript
// Enable analytics in production
analytics: {
  enabled: true,
  trackingId: process.env.ANALYTICS_TRACKING_ID,
}
```

### Error Tracking

Consider implementing error tracking:

- Firebase Crashlytics
- Sentry
- Bugsnag

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Code review completed
- [ ] Security audit passed
- [ ] Performance testing completed
- [ ] UI/UX review completed
- [ ] Accessibility testing completed

### Build Verification
- [ ] App builds successfully
- [ ] App launches without crashes
- [ ] All features working correctly
- [ ] Offline functionality tested
- [ ] Push notifications working
- [ ] Deep links working

### Store Submission
- [ ] App metadata complete
- [ ] Screenshots uploaded
- [ ] Privacy policy linked
- [ ] Support information provided
- [ ] App review guidelines followed

### Post-Deployment
- [ ] Monitor crash reports
- [ ] Track user feedback
- [ ] Monitor performance metrics
- [ ] Plan for updates and maintenance

## 🔄 Continuous Deployment

### Automated Builds

Consider setting up CI/CD pipelines:

- GitHub Actions
- Bitrise
- Fastlane
- Firebase App Distribution

### Release Management

- Use semantic versioning
- Maintain a changelog
- Plan feature releases
- Coordinate with marketing

## 📞 Support and Maintenance

### User Support

- Provide clear support channels
- Maintain FAQ documentation
- Monitor user feedback
- Plan for feature requests

### Maintenance

- Regular dependency updates
- Security patches
- Performance optimizations
- Bug fixes and improvements

---

For additional support or questions about production deployment, please contact the development team. 