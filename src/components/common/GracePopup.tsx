import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';

export interface GracePopupProps {
  visible: boolean;
  message: string;
  type?: 'error' | 'success' | 'info' | 'warning';
  duration?: number;
  onClose?: () => void;
  showCloseButton?: boolean;
  messageParams?: Record<string, any>; // For interpolation
}

const { width } = Dimensions.get('window');

export default function GracePopup({
  visible,
  message,
  type = 'error',
  duration = 4000,
  onClose,
  showCloseButton = true,
  messageParams,
}: GracePopupProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const slideAnim = useRef(new Animated.Value(100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in from bottom
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
      if (duration > 0) {
        const timer = setTimeout(() => {
          hidePopup();
        }, duration);

        return () => clearTimeout(timer);
      }
    } else {
      hidePopup();
    }
  }, [visible, duration]);

  const hidePopup = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose?.();
    });
  };

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          backgroundColor: colors.success,
          iconColor: 'white',
          textColor: 'white',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          backgroundColor: colors.warning,
          iconColor: 'white',
          textColor: 'white',
        };
      case 'info':
        return {
          icon: Info,
          backgroundColor: colors.primary,
          iconColor: 'white',
          textColor: 'white',
        };
      case 'error':
      default:
        return {
          icon: AlertCircle,
          backgroundColor: colors.error,
          iconColor: 'white',
          textColor: 'white',
        };
    }
  };

  const typeConfig = getTypeConfig();
  const IconComponent = typeConfig.icon;

  // Handle message interpolation
  const interpolateMessage = (msg: string, params?: Record<string, any>) => {
    if (!params) return msg;
    let result = msg;
    Object.keys(params).forEach(key => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, String(params[key]));
    });
    return result;
  };

  const displayMessage = interpolateMessage(message, messageParams);

  // Debug logging
  if (__DEV__ && visible) {
    console.log('GracePopup Debug:', {
      originalMessage: message,
      messageParams,
      displayMessage,
    });
  }

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View
        style={[
          styles.popup,
          {
            backgroundColor: typeConfig.backgroundColor,
          },
        ]}
      >
        <View style={styles.content}>
          <IconComponent
            size={20}
            color={typeConfig.iconColor}
            style={styles.icon}
          />
                      <Text
              style={[
                styles.message,
                {
                  color: typeConfig.textColor,
                },
              ]}
              numberOfLines={3}
            >
              {displayMessage}
            </Text>
        </View>
        
        {showCloseButton && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={hidePopup}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={16} color={typeConfig.iconColor} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999, // Very high z-index to appear above all modals
    paddingHorizontal: 16,
    paddingBottom: 50, // Account for safe area
  },
  popup: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minHeight: 56,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontFamily: Fonts.text.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
  },
}); 