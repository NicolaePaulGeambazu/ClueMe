import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import notificationService from '../services/notificationService';


const NotificationTestScreen: React.FC = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    try {
      const results = await runNotificationTests();
      setTestResults(results);

      if (results.overallPassed) {
        Alert.alert('Tests Passed', 'All notification timing tests passed!');
      } else {
        Alert.alert('Tests Failed', 'Some notification timing tests failed. Check the results below.');
      }
    } catch (error) {
      Alert.alert('Test Error', `Error running tests: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const testSpecificTiming = () => {
    // Test the specific case you mentioned: event tomorrow at 9:15 with 15min before notification
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 15, 0, 0);

    debugNotificationTiming(
      {
        dueDate: tomorrow.toISOString(),
        dueTime: '09:15',
      },
      {
        type: 'before',
        value: 15,
        label: '15 minutes before',
      }
    );

    Alert.alert(
      'Timing Debug',
      `Debug info logged for:\nDue: ${tomorrow.toLocaleString()}\n15 minutes before notification\nCheck console for details.`
    );
  };

  const testRecurringTiming = () => {
    // Test recurring notification timing
    const today = new Date();
    today.setHours(9, 15, 0, 0);

    debugNotificationTiming(
      {
        dueDate: today.toISOString(),
        dueTime: '09:15',
      },
      {
        type: 'before',
        value: 15,
        label: '15 minutes before',
      }
    );

    Alert.alert(
      'Recurring Debug',
      `Debug info logged for recurring reminder:\nDue: ${today.toLocaleString()}\n15 minutes before notification\nCheck console for details.`
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Notification Timing Test</Text>

      <Text style={styles.description}>
        This screen helps test and debug notification timing issues.
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isRunning && styles.buttonDisabled]}
          onPress={runTests}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testSpecificTiming}>
          <Text style={styles.buttonText}>Test 15min Before Timing</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testRecurringTiming}>
          <Text style={styles.buttonText}>Test Recurring Timing</Text>
        </TouchableOpacity>
      </View>

      {testResults && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>
            Test Results: {testResults.overallPassed ? '✅ PASSED' : '❌ FAILED'}
          </Text>

          {testResults.results.map((result: any, index: number) => (
            <View key={index} style={styles.testResult}>
              <Text style={[
                styles.testName,
                result.passed ? styles.testPassed : styles.testFailed,
              ]}>
                {result.passed ? '✅' : '❌'} {result.testName}
              </Text>

              {result.details.length > 0 && (
                <View style={styles.detailsContainer}>
                  {result.details.map((detail: string, detailIndex: number) => (
                    <Text key={detailIndex} style={styles.detail}>
                      • {detail}
                    </Text>
                  ))}
                </View>
              )}

              {result.errors.length > 0 && (
                <View style={styles.errorsContainer}>
                  {result.errors.map((error: string, errorIndex: number) => (
                    <Text key={errorIndex} style={styles.error}>
                      ⚠️ {error}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>What was fixed:</Text>
        <Text style={styles.infoText}>
          • Removed the * 60 multiplication bug in notification timing calculation{'\n'}
          • Improved timezone handling for notifications{'\n'}
          • Fixed recurring notification scheduling{'\n'}
          • Added comprehensive testing utilities
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
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
  resultsContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  testResult: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  testPassed: {
    color: '#28a745',
  },
  testFailed: {
    color: '#dc3545',
  },
  detailsContainer: {
    marginBottom: 8,
  },
  detail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  errorsContainer: {
    marginTop: 8,
  },
  error: {
    fontSize: 14,
    color: '#dc3545',
    marginBottom: 4,
  },
  infoContainer: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1976d2',
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});

export default NotificationTestScreen;
