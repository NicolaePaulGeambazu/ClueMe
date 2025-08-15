
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { FluidContainer, FluidHeader } from '../components/design-system';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  type: 'toggle' | 'navigation' | 'action';
  icon: string;
  value?: boolean;
  onPress?: () => void;
  destructive?: boolean;
}

const SettingsFluid: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { user, signOut } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [badgeEnabled, setBadgeEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => signOut(),
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Account Deleted', 'Your account has been deleted.');
          },
        },
      ]
    );
  };

  const settingSections = [
    {
      title: 'Account',
      items: [
        {
          id: 'profile',
          title: 'Profile',
          subtitle: user?.email || 'Not signed in',
          type: 'navigation' as const,
          icon: 'person-outline',
          onPress: () => console.log('Navigate to profile'),
        },
        {
          id: 'subscription',
          title: 'Subscription',
          subtitle: 'Premium Plan',
          type: 'navigation' as const,
          icon: 'diamond-outline',
          onPress: () => console.log('Navigate to subscription'),
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          id: 'notifications',
          title: 'Push Notifications',
          subtitle: 'Receive reminder notifications',
          type: 'toggle' as const,
          icon: 'notifications-outline',
          value: notificationsEnabled,
          onPress: () => setNotificationsEnabled(!notificationsEnabled),
        },
        {
          id: 'sound',
          title: 'Sound',
          subtitle: 'Play sound for notifications',
          type: 'toggle' as const,
          icon: 'volume-high-outline',
          value: soundEnabled,
          onPress: () => setSoundEnabled(!soundEnabled),
        },
        {
          id: 'badge',
          title: 'Badge Count',
          subtitle: 'Show unread count on app icon',
          type: 'toggle' as const,
          icon: 'radio-button-on-outline',
          value: badgeEnabled,
          onPress: () => setBadgeEnabled(!badgeEnabled),
        },
      ],
    },
    {
      title: 'Appearance',
      items: [
        {
          id: 'darkMode',
          title: 'Dark Mode',
          subtitle: 'Use dark theme',
          type: 'toggle' as const,
          icon: 'moon-outline',
          value: darkModeEnabled,
          onPress: () => setDarkModeEnabled(!darkModeEnabled),
        },
        {
          id: 'language',
          title: 'Language',
          subtitle: 'English (UK)',
          type: 'navigation' as const,
          icon: 'language-outline',
          onPress: () => console.log('Navigate to language settings'),
        },
      ],
    },
    {
      title: 'Data & Privacy',
      items: [
        {
          id: 'backup',
          title: 'Backup & Sync',
          subtitle: 'iCloud backup enabled',
          type: 'navigation' as const,
          icon: 'cloud-outline',
          onPress: () => console.log('Navigate to backup settings'),
        },
        {
          id: 'privacy',
          title: 'Privacy Settings',
          subtitle: 'Manage your privacy preferences',
          type: 'navigation' as const,
          icon: 'shield-outline',
          onPress: () => console.log('Navigate to privacy settings'),
        },
        {
          id: 'export',
          title: 'Export Data',
          subtitle: 'Download your data',
          type: 'navigation' as const,
          icon: 'download-outline',
          onPress: () => console.log('Export data'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          title: 'Help & Support',
          subtitle: 'Get help with ClueMe',
          type: 'navigation' as const,
          icon: 'help-circle-outline',
          onPress: () => console.log('Navigate to help'),
        },
        {
          id: 'feedback',
          title: 'Send Feedback',
          subtitle: 'Help us improve ClueMe',
          type: 'navigation' as const,
          icon: 'chatbubble-outline',
          onPress: () => console.log('Send feedback'),
        },
        {
          id: 'about',
          title: 'About ClueMe',
          subtitle: 'Version 2.1.0',
          type: 'navigation' as const,
          icon: 'information-circle-outline',
          onPress: () => console.log('Navigate to about'),
        },
      ],
    },
    {
      title: 'Account Actions',
      items: [
        {
          id: 'signOut',
          title: 'Sign Out',
          type: 'action' as const,
          icon: 'log-out-outline',
          onPress: handleSignOut,
        },
        {
          id: 'deleteAccount',
          title: 'Delete Account',
          type: 'action' as const,
          icon: 'trash-outline',
          destructive: true,
          onPress: handleDeleteAccount,
        },
      ],
    },
  ];

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      onPress={item.onPress}
      style={{
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
      }}
    >
      <Icon
        name={item.icon}
        size={24}
        color={item.destructive ? '#FF3B30' : '#007AFF'}
        style={{ marginRight: 16 }}
      />
      
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: 17,
          fontWeight: '400',
          color: item.destructive ? '#FF3B30' : '#000000',
          marginBottom: item.subtitle ? 2 : 0,
        }}>
          {item.title}
        </Text>
        {item.subtitle && (
          <Text style={{
            fontSize: 15,
            color: '#8E8E93',
          }}>
            {item.subtitle}
          </Text>
        )}
      </View>
      
      {item.type === 'toggle' && (
        <Switch
          value={item.value}
          onValueChange={item.onPress}
          trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
          thumbColor="#FFFFFF"
        />
      )}
      
      {item.type === 'navigation' && (
        <Icon name="chevron-forward" size={20} color="#C7C7CC" />
      )}
    </TouchableOpacity>
  );

  const renderSection = (section: { title: string; items: SettingItem[] }) => (
    <View key={section.title} style={{ marginBottom: 32 }}>
      <Text style={{
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
        marginHorizontal: 20,
      }}>
        {section.title}
      </Text>
      
      <View style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginHorizontal: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      }}>
        {section.items.map((item, index) => (
          <View key={item.id}>
            {renderSettingItem(item)}
            {index < section.items.length - 1 && (
              <View style={{
                height: 1,
                backgroundColor: '#F2F2F7',
                marginLeft: 60,
              }} />
            )}
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      <FluidContainer>
        <FluidHeader title="Settings" />
        
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ paddingTop: 20 }}>
            {settingSections.map(renderSection)}
          </View>
        </ScrollView>
      </FluidContainer>
    </SafeAreaView>
  );
};

export default SettingsFluid;
