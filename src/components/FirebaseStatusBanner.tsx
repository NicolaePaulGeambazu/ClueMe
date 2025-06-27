import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';

interface FirebaseStatusBannerProps {
  useFallback: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export default function FirebaseStatusBanner({
  useFallback,
  error,
  onRetry,
}: FirebaseStatusBannerProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const styles = createStyles(colors);

  if (!useFallback && !error) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {useFallback ? (
            <WifiOff size={20} color={colors.warning} strokeWidth={2} />
          ) : (
            <AlertTriangle size={20} color={colors.error} strokeWidth={2} />
          )}
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {useFallback ? 'Offline Mode' : 'Connection Error'}
          </Text>
          <Text style={styles.description}>
            {useFallback
              ? 'Using local data. Some features may be limited.'
              : error || 'Unable to connect to cloud services.'
            }
          </Text>
        </View>

        {onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Wifi size={16} color={colors.primary} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: Fonts.text.semibold,
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  description: {
    fontFamily: Fonts.text.regular,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  retryButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
