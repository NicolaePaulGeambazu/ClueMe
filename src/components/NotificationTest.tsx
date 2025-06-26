import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { useNotifications } from '../hooks/useNotifications';
import { Colors } from '../constants/Colors';
import { useTheme } from '../contexts/ThemeContext';
import { Fonts, FontSizes } from '../constants/Fonts';

export const NotificationTest: React.FC = () => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const {
    isInitialized,
    isEnabled,
    isLoading: hookIsLoading,
    error, 
    requestPermissions,
    getFCMToken,
    registerDeviceForRemoteMessages,
    sendNotificationToUser
  } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  const styles = createStyles(colors);

  const handleTestPermissions = async () => {
    setIsLoading(true);
    try {
      Alert.alert(
        'Notification Permissions',
        `Notifications are ${isEnabled ? 'enabled' : 'disabled'}\nInitialized: ${isInitialized}`
      );
    } catch (error) {
      Alert.alert('Error', `Failed to check permissions: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPermissions = async () => {
    setIsLoading(true);
    try {
      const granted = await requestPermissions();
      Alert.alert(
        'Permission Request',
        `Permission ${granted ? 'granted' : 'denied'}`
      );
    } catch (error) {
      Alert.alert('Error', `Failed to request permissions: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestFCMToken = async () => {
    setIsLoading(true);
    try {
      console.log('Starting FCM token retrieval...');
      
      // First register device for remote messages
      console.log('Registering device for remote messages...');
      await registerDeviceForRemoteMessages();
      
      // Then get FCM token
      console.log('Getting FCM token...');
      const token = await getFCMToken();
      setFcmToken(token);
      
      if (token) {
        console.log('FCM token retrieved successfully:', token.substring(0, 20) + '...');
        Alert.alert(
          'FCM Token Retrieved',
          `Token: ${token.substring(0, 20)}...`,
          [{ text: 'OK' }]
        );
      } else {
        console.log('FCM token is null');
        Alert.alert('Error', 'Failed to get FCM token - token is null');
      }
    } catch (error) {
      console.error('FCM token error:', error);
      Alert.alert('Error', `Failed to get FCM token: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestDeviceRegistration = async () => {
    setIsLoading(true);
    try {
      console.log('Testing device registration...');
      const success = await registerDeviceForRemoteMessages();
      console.log('Device registration result:', success);
      Alert.alert(
        'Device Registration',
        success ? 'Device registered successfully!' : 'Failed to register device'
      );
    } catch (error) {
      console.error('Device registration error:', error);
      Alert.alert('Error', `Failed to register device: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestSendNotification = async () => {
    setIsLoading(true);
    try {
      console.log('Testing notification sending...');
      
      // Test sending a notification to the current user
      await sendNotificationToUser('test-user-id', {
        title: 'Test Notification',
        body: 'This is a test push notification from ClearCue!',
        type: 'general',
        data: {
          testId: '123',
          timestamp: Date.now().toString(),
        },
      });
      
      Alert.alert(
        'Test Notification',
        'Test notification sent! Check your notification center.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Notification sending error:', error);
      Alert.alert('Error', `Failed to send test notification: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Notification Test
      </Text>
      
      <View style={styles.statusContainer}>
        <Text style={[styles.statusText, { color: colors.text }]}>
          Initialized: {isInitialized ? '✅' : '❌'}
        </Text>
        <Text style={[styles.statusText, { color: colors.text }]}>
          Enabled: {isEnabled ? '✅' : '❌'}
        </Text>
        <Text style={[styles.statusText, { color: colors.text }]}>
          Loading: {hookIsLoading ? '🔄' : '✅'}
        </Text>
        {error && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            Error: {error}
          </Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={requestPermissions}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
            {isLoading ? 'Requesting...' : 'Request Permissions'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.secondary }]}
          onPress={handleTestDeviceRegistration}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
            {isLoading ? 'Registering...' : 'Register Device'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.tertiary }]}
          onPress={handleTestFCMToken}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
            {isLoading ? 'Getting Token...' : 'Get FCM Token'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#FF6B6B' }]}
          onPress={handleTestSendNotification}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
            {isLoading ? 'Sending...' : 'Send Test Notification'}
          </Text>
        </TouchableOpacity>
      </View>

      {fcmToken && (
        <View style={styles.tokenContainer}>
          <Text style={[styles.tokenLabel, { color: colors.text }]}>
            FCM Token:
          </Text>
          <Text style={[styles.tokenText, { color: colors.textSecondary }]}>
            {fcmToken.substring(0, 50)}...
          </Text>
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={[styles.infoTitle, { color: colors.text }]}>
          How Push Notifications Work:
        </Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          • <Text style={{ fontWeight: 'bold' }}>App Open:</Text> Shows alert dialog
        </Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          • <Text style={{ fontWeight: 'bold' }}>App Background:</Text> Appears in notification center
        </Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          • <Text style={{ fontWeight: 'bold' }}>App Closed:</Text> Appears on lock screen & notification center
        </Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          • <Text style={{ fontWeight: 'bold' }}>iOS Simulator:</Text> Limited push notification support
        </Text>
      </View>
    </View>
  );
};

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
  statusText: {
    fontFamily: Fonts.text.medium,
    fontSize: FontSizes.body,
    color: colors.text,
  },
  errorText: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.subheadline,
    color: colors.error,
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 16,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.body,
    color: '#FFFFFF',
  },
  tokenContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#e8f4fd',
    borderRadius: 6,
  },
  tokenLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  tokenText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#666',
  },
  infoContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#e8f4fd',
    borderRadius: 6,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#666',
  },
}); 