import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNotifications } from '../hooks/useNotifications';
import { Colors } from '../constants/Colors';
import { useTheme } from '../contexts/ThemeContext';
import { Fonts, FontSizes } from '../constants/Fonts';

export default function NotificationTest() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { 
    isInitialized, 
    isEnabled, 
    isLoading, 
    error, 
    requestPermissions,
    getFCMToken 
  } = useNotifications();

  const styles = createStyles(colors);

  const handleTestNotification = () => {
    const token = getFCMToken();
    if (token) {
      Alert.alert(
        'FCM Token',
        `Token: ${token.substring(0, 50)}...`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'No Token',
        'FCM token not available. Please check notification permissions.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRequestPermissions = async () => {
    const granted = await requestPermissions();
    Alert.alert(
      'Permission Result',
      granted ? 'Notifications enabled!' : 'Notifications denied',
      [{ text: 'OK' }]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Test</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.label}>Status:</Text>
        <Text style={[styles.status, { color: isInitialized ? colors.success : colors.error }]}>
          {isInitialized ? 'Initialized' : 'Not Initialized'}
        </Text>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.label}>Enabled:</Text>
        <Text style={[styles.status, { color: isEnabled ? colors.success : colors.error }]}>
          {isEnabled ? 'Yes' : 'No'}
        </Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleRequestPermissions}
      >
        <Text style={styles.buttonText}>Request Permissions</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleTestNotification}
      >
        <Text style={styles.buttonText}>Show FCM Token</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    margin: 16,
  },
  title: {
    fontFamily: Fonts.display.semibold,
    fontSize: FontSizes.title3,
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontFamily: Fonts.text.medium,
    fontSize: FontSizes.body,
    color: colors.text,
  },
  status: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.body,
  },
  errorContainer: {
    backgroundColor: colors.error + '15',
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
  },
  errorText: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.subheadline,
    color: colors.error,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.body,
    color: '#FFFFFF',
  },
  text: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.body,
    color: colors.text,
    textAlign: 'center',
  },
}); 