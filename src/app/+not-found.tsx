import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Colors } from '../constants/Colors';
import { AlertTriangle, Home } from 'lucide-react-native';

export default function NotFoundScreen({ navigation }: any) {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <AlertTriangle size={64} color={colors.error} strokeWidth={2} />
        <Text style={styles.title}>Oops!</Text>
        <Text style={styles.text}>This screen doesn't exist.</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('MainTabs')}
        >
          <Home size={20} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.buttonText}>Go to home screen!</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 