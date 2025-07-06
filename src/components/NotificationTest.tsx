import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useNotifications } from '../hooks/useNotifications';
import { Colors } from '../constants/Colors';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useFamily } from '../hooks/useFamily';
import { useTranslation } from 'react-i18next';
import { notificationService } from '../services/notificationService';

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
    sendNotificationToUser,
    sendTestNotification,
    notifyTaskCreated,
    notifyTaskAssigned,
    notifyTaskUpdated,
    notifyTaskCompleted,
    sendTaskReminder,
  } = useNotifications();
  const { user } = useAuth();
  const { family } = useFamily();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

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
    try {
      setIsSending(true);
      const granted = await requestPermissions();
      if (granted) {
        Alert.alert(t('common.success'), t('notifications.permissionsGranted'));
      } else {
        Alert.alert(t('notifications.permissionDenied'), t('notifications.permissionDeniedMessage'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('notifications.permissionError'));
    } finally {
      setIsSending(false);
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

  const handleSendTestNotification = async () => {
    try {
      setIsSending(true);
      await sendTestNotification();
      Alert.alert(t('common.success'), t('notifications.testSent'));
    } catch (error) {
      Alert.alert(t('common.error'), t('notifications.testError'));
    } finally {
      setIsSending(false);
    }
  };

  const handleTestTaskCreated = async () => {
    if (!family) {
      Alert.alert(t('notifications.noFamily'), t('notifications.noFamilyMessage'));
      return;
    }

    try {
      setIsSending(true);
      const taskData = {
        taskId: 'test-task-' + Date.now(),
        taskTitle: t('notifications.testTaskTitle'),
        taskDescription: t('notifications.testTaskDescription'),
        assignedBy: user?.uid || '',
        assignedByDisplayName: user?.displayName || user?.email || t('notifications.testUser'),
        assignedTo: [user?.uid || ''],
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        priority: 'medium' as const,
      };

      await notifyTaskCreated(taskData);
      Alert.alert(t('common.success'), t('notifications.taskCreatedSent'));
    } catch (error) {
      Alert.alert(t('common.error'), t('notifications.taskCreatedError'));
    } finally {
      setIsSending(false);
    }
  };

  const handleTestTaskAssigned = async () => {
    try {
      setIsSending(true);
      const taskData = {
        taskId: 'test-assigned-' + Date.now(),
        taskTitle: t('notifications.testAssignedTitle'),
        taskDescription: t('notifications.testAssignedDescription'),
        assignedBy: user?.uid || '',
        assignedByDisplayName: user?.displayName || user?.email || t('notifications.testUser'),
        assignedTo: [user?.uid || ''],
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        priority: 'high' as const,
      };

      await notifyTaskAssigned(taskData);
      Alert.alert(t('common.success'), t('notifications.taskAssignedSent'));
    } catch (error) {
      Alert.alert(t('common.error'), t('notifications.taskAssignedError'));
    } finally {
      setIsSending(false);
    }
  };

  const handleTestTaskUpdated = async () => {
    try {
      setIsSending(true);
      const taskData = {
        taskId: 'test-updated-' + Date.now(),
        taskTitle: t('notifications.testUpdatedTitle'),
        taskDescription: t('notifications.testUpdatedDescription'),
        assignedBy: user?.uid || '',
        assignedByDisplayName: user?.displayName || user?.email || t('notifications.testUser'),
        assignedTo: [user?.uid || ''],
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        priority: 'low' as const,
      };

      await notifyTaskUpdated(taskData, 'due_date');
      Alert.alert(t('common.success'), t('notifications.taskUpdatedSent'));
    } catch (error) {
      Alert.alert(t('common.error'), t('notifications.taskUpdatedError'));
    } finally {
      setIsSending(false);
    }
  };

  const handleTestTaskCompleted = async () => {
    try {
      setIsSending(true);
      const taskData = {
        taskId: 'test-completed-' + Date.now(),
        taskTitle: t('notifications.testCompletedTitle'),
        taskDescription: t('notifications.testCompletedDescription'),
        assignedBy: user?.uid || '',
        assignedByDisplayName: user?.displayName || user?.email || t('notifications.testUser'),
        assignedTo: [user?.uid || ''],
        dueDate: new Date().toISOString(),
        priority: 'medium' as const,
      };

      await notifyTaskCompleted(taskData, user?.displayName || user?.email || t('notifications.testUser'));
      Alert.alert(t('common.success'), t('notifications.taskCompletedSent'));
    } catch (error) {
      Alert.alert(t('common.error'), t('notifications.taskCompletedError'));
    } finally {
      setIsSending(false);
    }
  };

  const handleTestTaskReminder = async () => {
    try {
      setIsSending(true);
      const taskData = {
        taskId: 'test-reminder-' + Date.now(),
        taskTitle: t('notifications.testReminderTitle'),
        taskDescription: t('notifications.testReminderDescription'),
        assignedBy: user?.uid || '',
        assignedByDisplayName: user?.displayName || user?.email || t('notifications.testUser'),
        assignedTo: [user?.uid || ''],
        dueDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        priority: 'high' as const,
      };

      await sendTaskReminder(taskData, 'due_soon');
      Alert.alert(t('common.success'), t('notifications.taskReminderSent'));
    } catch (error) {
      Alert.alert(t('common.error'), t('notifications.taskReminderError'));
    } finally {
      setIsSending(false);
    }
  };

  const handleTestBackgroundChecking = async () => {
    try {
      setIsSending(true);
      console.log('🧪 Testing background reminder checking...');

      // This will trigger the background checking manually
      await notificationService.checkAndNotifyOverdueReminders();
      await notificationService.checkAndNotifyUpcomingReminders();

      Alert.alert(
        t('common.success'),
        'Background reminder checking completed! Check console for details.'
      );
    } catch (error) {
      console.error('Background checking test error:', error);
      Alert.alert(t('common.error'), 'Failed to test background checking');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>{t('notifications.loadingSettings')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{t('notifications.testingTitle')}</Text>

      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>{t('notifications.status')}:</Text>
        <Text style={[styles.statusValue, { color: isEnabled ? '#4CAF50' : '#F44336' }]}>
          {isEnabled ? t('notifications.enabled') : t('notifications.disabled')}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('notifications.basicNotifications')}</Text>

        <TouchableOpacity
          style={[styles.button, !isEnabled && styles.buttonDisabled]}
          onPress={handleRequestPermissions}
          disabled={isEnabled || isSending}
        >
          <Text style={styles.buttonText}>
            {isSending ? t('notifications.requesting') : t('notifications.requestPermissions')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, !isEnabled && styles.buttonDisabled]}
          onPress={handleSendTestNotification}
          disabled={!isEnabled || isSending}
        >
          <Text style={styles.buttonText}>
            {isSending ? t('notifications.sending') : t('notifications.sendTest')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('notifications.taskNotifications')}</Text>

        <TouchableOpacity
          style={[styles.button, !isEnabled && styles.buttonDisabled]}
          onPress={handleTestTaskCreated}
          disabled={!isEnabled || isSending || !family}
        >
          <Text style={styles.buttonText}>
            {isSending ? t('notifications.sending') : t('notifications.testTaskCreated')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, !isEnabled && styles.buttonDisabled]}
          onPress={handleTestTaskAssigned}
          disabled={!isEnabled || isSending}
        >
          <Text style={styles.buttonText}>
            {isSending ? t('notifications.sending') : t('notifications.testTaskAssigned')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, !isEnabled && styles.buttonDisabled]}
          onPress={handleTestTaskUpdated}
          disabled={!isEnabled || isSending}
        >
          <Text style={styles.buttonText}>
            {isSending ? t('notifications.sending') : t('notifications.testTaskUpdated')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, !isEnabled && styles.buttonDisabled]}
          onPress={handleTestTaskCompleted}
          disabled={!isEnabled || isSending}
        >
          <Text style={styles.buttonText}>
            {isSending ? t('notifications.sending') : t('notifications.testTaskCompleted')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, !isEnabled && styles.buttonDisabled]}
          onPress={handleTestTaskReminder}
          disabled={!isEnabled || isSending}
        >
          <Text style={styles.buttonText}>
            {isSending ? t('notifications.sending') : t('notifications.testTaskReminder')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, !isEnabled && styles.buttonDisabled]}
          onPress={handleTestBackgroundChecking}
          disabled={!isEnabled || isSending}
        >
          <Text style={styles.buttonText}>
            {isSending ? t('notifications.sending') : 'Test Background Checking'}
          </Text>
        </TouchableOpacity>
      </View>

      {!family && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            {t('notifications.familyRequired')}
          </Text>
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>{t('notifications.howItWorks')}</Text>
        <Text style={styles.infoText}>
          {t('notifications.howItWorks1')}
        </Text>
        <Text style={styles.infoText}>
          {t('notifications.howItWorks2')}
        </Text>
        <Text style={styles.infoText}>
          {t('notifications.howItWorks3')}
        </Text>
        <Text style={styles.infoText}>
          {t('notifications.howItWorks4')}
        </Text>
      </View>
    </ScrollView>
  );
};

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  warningContainer: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFEAA7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    color: '#856404',
    fontSize: 14,
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: '#E3F2FD',
    borderColor: '#BBDEFB',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1976D2',
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 4,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});
