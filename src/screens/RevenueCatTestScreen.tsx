import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { testRevenueCatIntegration } from '../services/testRevenueCat';
import { revenueCatService } from '../services/revenueCatService';

export default function RevenueCatTestScreen() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    // Capture console.log output
    const originalLog = console.log;
    const logs: string[] = [];
    
    console.log = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      logs.push(message);
      originalLog(...args);
    };

    try {
      await testRevenueCatIntegration();
    } catch (error) {
      console.log('Test error:', error);
    }

    console.log = originalLog;
    setTestResults(logs);
    setIsRunning(false);
  };

  const testPurchase = async () => {
    try {
      const offerings = await revenueCatService.getOfferings();
      if (offerings?.monthly) {
        const result = await revenueCatService.purchasePackage(offerings.monthly);
        console.log('Purchase result:', result);
        Alert.alert('Purchase Result', `Purchase ${result.success ? 'SUCCESS' : 'FAILED'}: ${result.error || 'Success!'}`);
      } else {
        Alert.alert('No Offering', 'No monthly offering available');
      }
    } catch (error) {
      console.error('Purchase test error:', error);
      Alert.alert('Error', 'Purchase test failed');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>RevenueCat Integration Test</Text>
      
      <TouchableOpacity 
        style={[styles.button, isRunning && styles.buttonDisabled]} 
        onPress={runTest}
        disabled={isRunning}
      >
        <Text style={styles.buttonText}>
          {isRunning ? 'Running Test...' : 'Run Integration Test'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={testPurchase}
      >
        <Text style={styles.buttonText}>Test Purchase (Monthly)</Text>
      </TouchableOpacity>

      {testResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Test Results:</Text>
          {testResults.map((log, index) => (
            <Text key={index} style={styles.logText}>
              {log}
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  logText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 5,
  },
}); 