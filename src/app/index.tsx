import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import EnhancedLoadingScreen from '../components/EnhancedLoadingScreen';

export default function IndexScreen({ navigation }: any) {
  const { isLoading, user } = useAuth();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Loading ClearCue...');

  const styles = createStyles(colors);

  // Simulate loading progress
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      return () => clearInterval(interval);
    } else {
      setLoadingProgress(100);
    }
  }, [isLoading]);

  // Update loading message based on progress
  useEffect(() => {
    if (loadingProgress < 30) {
      setLoadingMessage('Initializing...');
    } else if (loadingProgress < 60) {
      setLoadingMessage('Loading your data...');
    } else if (loadingProgress < 90) {
      setLoadingMessage('Almost ready...');
    } else {
      setLoadingMessage('Welcome to ClearCue!');
    }
  }, [loadingProgress]);

  // Show enhanced loading screen while loading
  if (isLoading) {
    return (
      <EnhancedLoadingScreen
        message={loadingMessage}
        showProgress={true}
        progress={loadingProgress}
        onAnimationComplete={() => {
          console.log('Loading animation completed');
        }}
      />
    );
  }

  // Show debug info when not loading (for development)
  return (
    <View style={styles.container}>
      <View style={styles.loadingContainer}>
        <EnhancedLoadingScreen
          message="Welcome to ClearCue!"
          showProgress={false}
          onAnimationComplete={() => {
            console.log('Welcome animation completed');
          }}
        />
      </View>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
