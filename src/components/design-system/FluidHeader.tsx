import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { ArrowLeft, Plus, Settings, Calendar, Users } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/Colors';

interface FluidHeaderProps {
  title: string;
  onBack?: () => void;
  rightComponent?: React.ReactNode;
  rightAction?: {
    icon: string;
    onPress: () => void;
  };
  subtitle?: string;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  showBackButton?: boolean;
}

const FluidHeader: React.FC<FluidHeaderProps> = ({
  title,
  onBack,
  rightComponent,
  rightAction,
  subtitle,
  style,
  titleStyle,
  showBackButton = true,
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme];

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'add':
      case 'plus':
        return <Plus size={24} color={colors.primary} strokeWidth={2} />;
      case 'settings':
        return <Settings size={24} color={colors.primary} strokeWidth={2} />;
      case 'calendar':
      case 'today':
        return <Calendar size={24} color={colors.primary} strokeWidth={2} />;
      case 'person-add':
      case 'users':
        return <Users size={24} color={colors.primary} strokeWidth={2} />;
      default:
        return <Plus size={24} color={colors.primary} strokeWidth={2} />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }, style]}>
      <View style={styles.content}>
        {showBackButton && onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
        )}
        
        <View style={[styles.titleContainer, { alignItems: showBackButton && onBack ? 'flex-start' : 'center' }]}>
          <Text style={[styles.title, { color: colors.text }, titleStyle]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>

        <View style={styles.rightContainer}>
          {rightAction && (
            <TouchableOpacity onPress={rightAction.onPress} style={styles.rightButton}>
              {getIconComponent(rightAction.icon)}
            </TouchableOpacity>
          )}
          {rightComponent}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
    marginLeft: -8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    marginTop: 2,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightButton: {
    padding: 8,
    marginRight: -8,
  },
});

export default FluidHeader;
