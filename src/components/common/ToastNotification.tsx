import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Bell } from 'lucide-react-native';

interface ToastNotificationProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'assignment';
  duration?: number;
  onClose: () => void;
  onPress?: () => void;
}

const { width } = Dimensions.get('window');

export default function ToastNotification({
  visible,
  title,
  message,
  type = 'info',
  duration = 5000,
  onClose,
  onPress,
}: ToastNotificationProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in from top
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: colors.success,
          iconColor: '#ffffff',
        };
      case 'error':
        return {
          backgroundColor: colors.error,
          iconColor: '#ffffff',
        };
      case 'warning':
        return {
          backgroundColor: colors.warning,
          iconColor: '#ffffff',
        };
      case 'assignment':
        return {
          backgroundColor: colors.primary,
          iconColor: '#ffffff',
        };
      default:
        return {
          backgroundColor: colors.surface,
          iconColor: colors.text,
        };
    }
  };

  const typeStyles = getTypeStyles();

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
          backgroundColor: typeStyles.backgroundColor,
          paddingTop: insets.top + 10,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
      >
        <View style={styles.iconContainer}>
          <Bell size={20} color={typeStyles.iconColor} />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: typeStyles.iconColor }]}>
            {title}
          </Text>
          <Text style={[styles.message, { color: typeStyles.iconColor }]}>
            {message}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.closeButton} onPress={hideToast}>
        <X size={20} color={typeStyles.iconColor} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    opacity: 0.9,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 16,
    padding: 4,
  },
}); 