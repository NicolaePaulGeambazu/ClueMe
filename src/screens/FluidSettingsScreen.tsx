
import React, { useState } from 'react';
import { View, TouchableOpacity, Switch, Animated } from 'react-native';
import { 
  User, 
  Bell, 
  Palette, 
  Shield, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Globe,
  Smartphone,
} from 'lucide-react-native';
import {
  FluidScreen,
  FluidText,
  FluidContainer,
  FluidCard,
  useFluidTheme,
  useFluidAnimation,
} from '../design-system';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
  showChevron = true,
}) => {
  const { colors, spacing } = useFluidTheme();
  const { scale, springTo } = useFluidAnimation({ initialValue: 1 });

  const handlePress = () => {
    if (onPress) {
      springTo(0.98).start(() => {
        springTo(1).start();
      });
      onPress();
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={!onPress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
        }}
        activeOpacity={0.7}
      >
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.backgroundSecondary,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing.md,
        }}>
          {icon}
        </View>

        <View style={{ flex: 1 }}>
          <FluidText variant="bodyLarge" weight="medium">
            {title}
          </FluidText>
          {subtitle && (
            <FluidText
              variant="bodySmall"
              color={colors.textSecondary}
              style={{ marginTop: 2 }}
            >
              {subtitle}
            </FluidText>
          )}
        </View>

        {rightElement || (showChevron && onPress && (
          <ChevronRight size={20} color={colors.textTertiary} />
        ))}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function FluidSettingsScreen() {
  const { colors, spacing } = useFluidTheme();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  const { 
    opacity,
    startEntranceAnimation 
  } = useFluidAnimation({ 
    initialValue: 0,
    autoStart: true,
  });

  React.useEffect(() => {
    startEntranceAnimation();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const settingSections = [
    {
      title: 'Account',
      items: [
        {
          icon: <User size={20} color={colors.primary} />,
          title: 'Profile',
          subtitle: user?.email || 'Manage your account',
          onPress: () => console.log('Navigate to profile'),
        },
        {
          icon: <Shield size={20} color={colors.success} />,
          title: 'Privacy & Security',
          subtitle: 'Control your data and privacy',
          onPress: () => console.log('Navigate to privacy'),
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: theme === 'dark' ? <Moon size={20} color={colors.secondary} /> : <Sun size={20} color={colors.warning} />,
          title: 'Theme',
          subtitle: theme === 'dark' ? 'Dark mode' : 'Light mode',
          onPress: toggleTheme,
          rightElement: (
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          ),
          showChevron: false,
        },
        {
          icon: <Bell size={20} color={colors.warning} />,
          title: 'Notifications',
          subtitle: notificationsEnabled ? 'Enabled' : 'Disabled',
          rightElement: (
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          ),
          showChevron: false,
        },
        {
          icon: <Globe size={20} color={colors.info} />,
          title: 'Language',
          subtitle: 'English',
          onPress: () => console.log('Navigate to language'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: <HelpCircle size={20} color={colors.info} />,
          title: 'Help & Support',
          subtitle: 'Get help and contact us',
          onPress: () => console.log('Navigate to help'),
        },
        {
          icon: <Smartphone size={20} color={colors.secondary} />,
          title: 'About',
          subtitle: 'Version 1.0.0',
          onPress: () => console.log('Navigate to about'),
        },
      ],
    },
  ];

  return (
    <FluidScreen
      title="Settings"
      subtitle="Customize your experience"
      safeArea
      padding="none"
      background="primary"
      scrollable
    >
      <Animated.View style={{ opacity, flex: 1 }}>
        {/* User Profile Header */}
        <FluidContainer padding="large" style={{ marginBottom: spacing.md }}>
          <FluidCard variant="elevated" padding="large">
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <View style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: spacing.md,
              }}>
                <FluidText variant="headlineSmall" color={colors.textInverse} weight="bold">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </FluidText>
              </View>
              
              <View style={{ flex: 1 }}>
                <FluidText variant="titleLarge" weight="semibold">
                  {user?.displayName || 'User'}
                </FluidText>
                <FluidText variant="bodyMedium" color={colors.textSecondary}>
                  {user?.email || 'user@example.com'}
                </FluidText>
              </View>
            </View>
          </FluidCard>
        </FluidContainer>

        {/* Settings Sections */}
        {settingSections.map((section, sectionIndex) => (
          <FluidContainer key={section.title} padding="medium" style={{ marginBottom: spacing.sm }}>
            <FluidText
              variant="labelLarge"
              color={colors.textSecondary}
              weight="medium"
              style={{ 
                marginBottom: spacing.sm,
                marginLeft: spacing.md,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {section.title}
            </FluidText>
            
            <FluidCard variant="elevated" padding="none">
              {section.items.map((item, itemIndex) => (
                <View key={item.title}>
                  <SettingItem {...item} />
                  {itemIndex < section.items.length - 1 && (
                    <View style={{
                      height: 1,
                      backgroundColor: colors.border,
                      marginLeft: spacing.lg + 40 + spacing.md,
                    }} />
                  )}
                </View>
              ))}
            </FluidCard>
          </FluidContainer>
        ))}

        {/* Sign Out */}
        <FluidContainer padding="medium" style={{ marginTop: spacing.lg }}>
          <FluidCard variant="elevated" padding="none">
            <SettingItem
              icon={<LogOut size={20} color={colors.error} />}
              title="Sign Out"
              subtitle="Sign out of your account"
              onPress={handleSignOut}
              showChevron={false}
            />
          </FluidCard>
        </FluidContainer>

        {/* Footer */}
        <FluidContainer center padding="large">
          <FluidText variant="caption" color={colors.textTertiary} align="center">
            ClueMe v1.0.0{'\n'}
            Made with ❤️ for productivity
          </FluidText>
        </FluidContainer>
      </Animated.View>
    </FluidScreen>
  );
}
