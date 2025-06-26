import { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';

export default function IndexScreen({ navigation }: any) {
  const { isLoading } = useAuth();
  const { theme } = useTheme();
  const colors = Colors[theme];

  useEffect(() => {
    // Wait for auth to finish loading, then redirect
    if (!isLoading) {
      // Use a timeout to ensure the layout is fully mounted
      const timer = setTimeout(() => {
        // Always go to tabs (anonymous users can use the app)
        navigation.replace('MainTabs');
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, navigation]);

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading ClearCue...</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: Fonts.text.regular,
    fontSize: 16,
    color: colors.textSecondary,
  },
});