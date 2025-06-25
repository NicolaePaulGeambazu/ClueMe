import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';
import { Chrome as Home, Plus, Settings } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/Colors';

// Import tab screens
import HomeScreen from './index';
import AddScreen from './add';
import SettingsScreen from './settings';

const Tab = createBottomTabNavigator();

export default function TabLayout() {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: any }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = <Home size={size} color={color} strokeWidth={2} />;
          } else if (route.name === 'Add') {
            iconName = <Plus size={size} color={color} strokeWidth={2} />;
          } else if (route.name === 'Settings') {
            iconName = <Settings size={size} color={color} strokeWidth={2} />;
          }

          return iconName;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: [styles.tabBar, { 
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        }],
        tabBarItemStyle: styles.tabBarItem,
        tabBarLabelStyle: styles.tabBarLabel,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Add" component={AddScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    paddingBottom: 8,
    paddingTop: 8,
    height: 88,
  },
  tabBarItem: {
    paddingTop: 8,
  },
  tabBarLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    marginTop: 4,
  },
}); 