import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import notificationService from '../services/notificationService';
import {
  testImmediateLocalNotification,
  testScheduledLocalNotification,
  testSelfAssignmentNotification,
  testFamilyAssignmentNotification,
  checkUserFCMTokens,
  runComprehensiveNotificationTest,
  testRealAssignmentFlow,
  debugNotificationSystem,
  forceRefreshAndTest,
  testAssignmentNotificationSimulator,
  runSimulatorNotificationTests,
  testCompleteAssignmentFlowSimulator
} from '../utils/notificationTestUtils';
import auth from '@react-native-firebase/auth';
import { useTheme } from '../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFamily } from '../hooks/useFamily';
import { useToast } from '../contexts/ToastContext';
import globalNotificationService from '../services/globalNotificationService';

const NotificationTestScreen: React.FC = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { family, members } = useFamily();
  const { showToast } = useToast();
  const [familyMemberId, setFamilyMemberId] = useState('');
  const [testResults, setTestResults] = useState<string[]>([]);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const handleImmediateNotification = () => {
    try {
      testImmediateLocalNotification();
      addTestResult('✅ Immediate notification sent');
    } catch (error) {
      addTestResult(`❌ Immediate notification failed: ${error}`);
    }
  };

  const handleScheduledNotification = () => {
    try {
      testScheduledLocalNotification(5);
      addTestResult('✅ Scheduled notification set for 5 seconds');
    } catch (error) {
      addTestResult(`❌ Scheduled notification failed: ${error}`);
    }
  };

  const handleSelfAssignment = async () => {
    try {
      await testSelfAssignmentNotification();
      addTestResult('✅ Self-assignment notification sent');
    } catch (error) {
      addTestResult(`❌ Self-assignment notification failed: ${error}`);
    }
  };

  const handleFamilyAssignment = async () => {
    if (!familyMemberId.trim()) {
      Alert.alert('Error', 'Please enter a family member user ID');
      return;
    }

    try {
      await testFamilyAssignmentNotification(familyMemberId.trim());
      addTestResult(`✅ Family assignment notification sent to ${familyMemberId}`);
    } catch (error) {
      addTestResult(`❌ Family assignment notification failed: ${error}`);
    }
  };

  const handleCheckFCMTokens = async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        addTestResult('❌ No authenticated user found');
        return;
      }

      const tokens = await checkUserFCMTokens(currentUser.uid);
      addTestResult(`✅ Found ${tokens.length} FCM tokens for current user`);
    } catch (error) {
      addTestResult(`❌ FCM token check failed: ${error}`);
    }
  };

  const handleComprehensiveTest = async () => {
    try {
      await runComprehensiveNotificationTest();
      addTestResult('✅ Comprehensive test completed');
    } catch (error) {
      addTestResult(`❌ Comprehensive test failed: ${error}`);
    }
  };

  const handleClearResults = () => {
    setTestResults([]);
  };

  const runDebugTest = async () => {
    setIsLoading(true);
    try {
      const info = await debugNotificationSystem();
      setDebugInfo(info);
      Alert.alert('Debug Complete', 'Check console for detailed logs');
    } catch (error) {
      Alert.alert('Debug Error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const runForceRefresh = async () => {
    setIsLoading(true);
    try {
      await forceRefreshAndTest();
      Alert.alert('Force Refresh Complete', 'Check console for detailed logs');
    } catch (error) {
      Alert.alert('Force Refresh Error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const testSelfAssignment = async () => {
    try {
      await testSelfAssignmentNotification();
      Alert.alert('Success', 'Self assignment notification sent');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const testFamilyAssignment = async () => {
    if (!members || members.length <= 1) {
      Alert.alert('No Family Members', 'You need at least one family member to test this');
      return;
    }

    const currentUser = auth().currentUser;
    const otherMember = members.find(m => m.userId !== currentUser?.uid);
    
    if (!otherMember) {
      Alert.alert('No Other Members', 'No other family members found');
      return;
    }

    try {
      await testFamilyAssignmentNotification(otherMember.userId);
      Alert.alert('Success', `Family assignment notification sent to ${otherMember.name}`);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const checkTokens = async () => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      Alert.alert('No User', 'No authenticated user found');
      return;
    }

    try {
      const tokens = await checkUserFCMTokens(currentUser.uid);
      Alert.alert('FCM Tokens', `Found ${tokens.length} tokens for current user`);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const getFCMToken = async () => {
    try {
      const token = await notificationService.getFCMToken();
      Alert.alert('FCM Token', token ? `Token: ${token.substring(0, 20)}...` : 'No token received');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const testSimulatorAssignment = async () => {
    try {
      await testAssignmentNotificationSimulator('Simulator Test Task', 'Test User');
      Alert.alert('Success', 'Simulator assignment notification sent');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const runSimulatorTests = () => {
    try {
      runSimulatorNotificationTests();
      Alert.alert('Success', 'Simulator notification tests started. Check console for logs.');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const testCompleteFlow = async () => {
    try {
      await testCompleteAssignmentFlowSimulator();
      Alert.alert('Success', 'Complete assignment flow test started. Check console for logs.');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const testGlobalNotification = async () => {
    try {
      await globalNotificationService.testNotificationSystem();
      Alert.alert('Success', 'Global notification test sent. Check for toast or push notification.');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const testToastNotification = () => {
    try {
      showToast({
        title: '🧪 Toast Test',
        message: 'This is a test toast notification from the global system',
        type: 'info',
      });
      Alert.alert('Success', 'Toast notification sent');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const testAssignmentToast = () => {
    try {
      showToast({
        title: '📋 Task Assigned!',
        message: 'Test User assigned you: Test Assignment Task',
        type: 'assignment',
        reminderId: 'test-reminder-id',
        assignedBy: 'test-user-id',
        assignedByDisplayName: 'Test User',
      });
      Alert.alert('Success', 'Assignment toast notification sent');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    button: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 8,
      marginBottom: 12,
      alignItems: 'center',
    },
    buttonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
    disabledButton: {
      backgroundColor: colors.border,
    },
    debugInfo: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 8,
      marginTop: 20,
    },
    debugText: {
      color: colors.text,
      fontSize: 12,
      fontFamily: 'monospace',
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 10,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Notification Test</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug Tools</Text>
          
          <TouchableOpacity 
            style={[styles.button, isLoading && styles.disabledButton]} 
            onPress={runDebugTest}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Running Debug...' : 'Run Full Debug Test'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, isLoading && styles.disabledButton]} 
            onPress={runForceRefresh}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Refreshing...' : 'Force Refresh FCM Token'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Token Management</Text>
          
          <TouchableOpacity style={styles.button} onPress={getFCMToken}>
            <Text style={styles.buttonText}>Get FCM Token</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={checkTokens}>
            <Text style={styles.buttonText}>Check Stored Tokens</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Notifications</Text>
          
          <TouchableOpacity style={styles.button} onPress={testSelfAssignment}>
            <Text style={styles.buttonText}>Test Self Assignment</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={testFamilyAssignment}>
            <Text style={styles.buttonText}>Test Family Assignment</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Simulator Tests</Text>
          
          <TouchableOpacity style={styles.button} onPress={testSimulatorAssignment}>
            <Text style={styles.buttonText}>Test Simulator Assignment</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={runSimulatorTests}>
            <Text style={styles.buttonText}>Run All Simulator Tests</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={testCompleteFlow}>
            <Text style={styles.buttonText}>Test Complete Assignment Flow</Text>
          </TouchableOpacity>
        </View>

        {debugInfo && (
          <View style={styles.debugInfo}>
            <Text style={styles.sectionTitle}>Debug Information</Text>
            <Text style={styles.debugText}>
              Current User: {debugInfo.currentUser || 'null'}{'\n'}
              FCM Token: {debugInfo.fcmToken ? 'Present' : 'Missing'}{'\n'}
              Tokens in Firestore: {debugInfo.tokensInFirestore.length}{'\n'}
              Notification Permissions: {debugInfo.notificationPermissions ? 'Granted' : 'Denied'}{'\n'}
              Family Members: {debugInfo.familyMembers.length}{'\n'}
              Local Notification Test: {debugInfo.testResults.localNotification ? 'PASS' : 'FAIL'}{'\n'}
              Self Assignment Test: {debugInfo.testResults.selfAssignment ? 'PASS' : 'FAIL'}{'\n'}
              Family Assignment Test: {debugInfo.testResults.familyAssignment ? 'PASS' : 'FAIL'}
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Family Information</Text>
          <Text style={styles.debugText}>
            Family ID: {family?.id || 'No family'}{'\n'}
            Members: {members?.length || 0}{'\n'}
            {members?.map(member => `- ${member.name} (${member.userId})`).join('\n')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationTestScreen; 