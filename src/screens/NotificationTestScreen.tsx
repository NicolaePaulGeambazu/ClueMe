
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useNotifications } from '../hooks/useNotifications';
import notificationService from '../services/notificationService';
import ToastNotification from '../components/common/ToastNotification';

const NotificationTestScreen: React.FC = () => {
  const {
    isInitialized,
    isEnabled,
    isLoading,
    error,
    initialize,
    requestPermissions,
    sendTestNotification,
    getFCMToken,
  } = useNotifications();

  const [scheduledNotifications, setScheduledNotifications] = useState<any[]>([]);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      Alert.alert('iOS Only', 'This notification system only works on iOS devices.');
      return;
    }
    
    loadScheduledNotifications();
    loadFCMToken();
  }, []);

  const loadScheduledNotifications = async () => {
    try {
      const notifications = await notificationService.getScheduledNotifications();
      setScheduledNotifications(notifications);
    } catch (error) {
      console.error('Error loading scheduled notifications:', error);
    }
  };

  const loadFCMToken = async () => {
    try {
      const token = await getFCMToken();
      setFcmToken(token);
    } catch (error) {
      console.error('Error loading FCM token:', error);
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  const handleTestNotification = async () => {
    try {
      await sendTestNotification();
      showToast('Test notification scheduled for 5 seconds from now');
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const handleRequestPermissions = async () => {
    try {
      const granted = await requestPermissions();
      if (granted) {
        showToast('Notification permissions granted!');
        await loadFCMToken();
      } else {
        Alert.alert('Permissions Denied', 'Please enable notifications in Settings');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request permissions');
    }
  };

  const handleCancelAllNotifications = () => {
    Alert.alert(
      'Cancel All Notifications',
      'Are you sure you want to cancel all scheduled notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            notificationService.cancelAllNotifications();
            setScheduledNotifications([]);
            showToast('All notifications cancelled');
          },
        },
      ]
    );
  };

  const handleTestReminderNotification = async () => {
    try {
      const testReminder = {
        id: 'test-reminder-' + Date.now(),
        title: 'Test Reminder',
        description: 'This is a test reminder with UK time formatting',
        dueDate: new Date(Date.now() + 10000).toISOString(), // 10 seconds from now
        dueTime: new Date(Date.now() + 10000).toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        priority: 'high' as const,
        userId: 'test-user',
        createdBy: 'test-user',
        notificationTimings: [
          { type: 'exact' as const, value: 0, label: 'At due time' }
        ]
      };

      await notificationService.scheduleReminderNotifications(testReminder);
      await loadScheduledNotifications();
      showToast('Test reminder notification scheduled');
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule test reminder');
    }
  };

  if (Platform.OS !== 'ios') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          This notification system only works on iOS devices.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ToastNotification
        visible={toastVisible}
        title="Notification Test"
        message={toastMessage}
        type="info"
        onDismiss={() => setToastVisible(false)}
      />

      <View style={styles.header}>
        <Text style={styles.title}>iOS Notification Test</Text>
        <Text style={styles.subtitle}>UK Time Formatting • iOS Only</Text>
      </View>

      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle}>Status</Text>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Initialized:</Text>
          <Text style={[styles.statusValue, { color: isInitialized ? '#4CAF50' : '#F44336' }]}>
            {isInitialized ? 'Yes' : 'No'}
          </Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Permissions:</Text>
          <Text style={[styles.statusValue, { color: isEnabled ? '#4CAF50' : '#F44336' }]}>
            {isEnabled ? 'Granted' : 'Denied'}
          </Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Loading:</Text>
          <Text style={styles.statusValue}>{isLoading ? 'Yes' : 'No'}</Text>
        </View>
        {error && (
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Error:</Text>
            <Text style={[styles.statusValue, { color: '#F44336' }]}>{error}</Text>
          </View>
        )}
      </View>

      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        {!isEnabled && (
          <TouchableOpacity style={styles.primaryButton} onPress={handleRequestPermissions}>
            <Text style={styles.buttonText}>Request Permissions</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.button} onPress={handleTestNotification}>
          <Text style={styles.buttonText}>Send Test Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleTestReminderNotification}>
          <Text style={styles.buttonText}>Test Reminder Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={loadScheduledNotifications}>
          <Text style={styles.buttonText}>Refresh Scheduled Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dangerButton} onPress={handleCancelAllNotifications}>
          <Text style={styles.buttonText}>Cancel All Notifications</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>FCM Token</Text>
        <Text style={styles.tokenText}>
          {fcmToken ? `${fcmToken.substring(0, 50)}...` : 'No token available'}
        </Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Scheduled Notifications ({scheduledNotifications.length})</Text>
        {scheduledNotifications.length === 0 ? (
          <Text style={styles.noNotificationsText}>No scheduled notifications</Text>
        ) : (
          scheduledNotifications.map((notification, index) => (
            <View key={index} style={styles.notificationItem}>
              <Text style={styles.notificationTitle}>{notification.title || 'No title'}</Text>
              <Text style={styles.notificationMessage}>{notification.message || notification.body || 'No message'}</Text>
              <Text style={styles.notificationDate}>
                {notification.date ? new Date(notification.date).toLocaleString('en-GB', {
                  timeZone: 'Europe/London',
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                }) : 'No date'}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  statusSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusLabel: {
    fontSize: 16,
    color: '#666',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  actionsSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  dangerButton: {
    backgroundColor: '#F44336',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tokenText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    backgroundColor: '#f8f8f8',
    padding: 8,
    borderRadius: 4,
  },
  noNotificationsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  notificationItem: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  notificationDate: {
    fontSize: 11,
    color: '#999',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    margin: 20,
  },
});

export default NotificationTestScreen;
