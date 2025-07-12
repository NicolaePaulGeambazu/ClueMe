module.exports = {
  project: {
    ios: {
      sourceDir: './ios',
    },
    android: {
      sourceDir: './android',
      manifestPath: 'app/src/main/AndroidManifest.xml',
      packageName: 'com.clearcue',
    },
  },
  dependencies: {
    'react-native-vector-icons': {
      platforms: {
        ios: null,
        android: null,
      },
    },
  },
}; 