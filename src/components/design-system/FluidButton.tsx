import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, View } from 'react-native';
import { Plus, Settings, Calendar, Users } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/Colors';

interface FluidButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const FluidButton: React.FC<FluidButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme];

  const getIconComponent = (iconName: string, color: string) => {
    const iconSize = size === 'small' ? 16 : size === 'large' ? 20 : 18;
    switch (iconName) {
      case 'add':
      case 'add-circle-outline':
      case 'plus':
        return <Plus size={iconSize} color={color} strokeWidth={2} />;
      case 'settings':
        return <Settings size={iconSize} color={color} strokeWidth={2} />;
      case 'calendar':
        return <Calendar size={iconSize} color={color} strokeWidth={2} />;
      case 'person-add-outline':
      case 'users':
        return <Users size={iconSize} color={color} strokeWidth={2} />;
      default:
        return <Plus size={iconSize} color={color} strokeWidth={2} />;
    }
  };

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.primary,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        };
      case 'danger':
        return {
          backgroundColor: colors.error,
        };
      default:
        return {
          backgroundColor: colors.primary,
        };
    }
  };

  const getTextStyles = (): TextStyle => {
    switch (variant) {
      case 'secondary':
        return {
          color: colors.primary,
        };
      case 'ghost':
        return {
          color: colors.primary,
        };
      case 'danger':
        return {
          color: '#FFFFFF',
        };
      default:
        return {
          color: '#FFFFFF',
        };
    }
  };

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 8,
          paddingHorizontal: 16,
        };
      case 'large':
        return {
          paddingVertical: 16,
          paddingHorizontal: 32,
        };
      default:
        return {
          paddingVertical: 12,
          paddingHorizontal: 24,
        };
    }
  };

  const getTextSizeStyles = (): TextStyle => {
    switch (size) {
      case 'small':
        return {
          fontSize: 14,
        };
      case 'large':
        return {
          fontSize: 18,
        };
      default:
        return {
          fontSize: 16,
        };
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getVariantStyles(),
        getSizeStyles(),
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        {icon && (
          <View style={styles.iconContainer}>
            {getIconComponent(icon, getTextStyles().color as string)}
          </View>
        )}
        <Text
          style={[
            styles.text,
            getTextStyles(),
            getTextSizeStyles(),
            disabled && styles.disabledText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8, // Slightly rounded for modern look
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // iOS accessibility guidelines
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
});

export default FluidButton;
