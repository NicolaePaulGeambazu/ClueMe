import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';
import { Home, Plus, Settings, List } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';

// Import fluid screen components
import HomeFluid from '../../screens/HomeFluid';
import CountdownScreen from '../../screens/countdown';
import AddReminderTab from '../reminders/AddReminderTab';
import SettingsFluid from '../../screens/SettingsFluid';
import AddCountdownScreen from '../../screens/add-countdown';
import ListsFluid from '../../screens/ListsFluid';
import RemindersFluid from '../../screens/RemindersFluid';
import CalendarFluid from '../../screens/CalendarFluid';
import FamilyFluid from '../../screens/FamilyFluid';


const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeFluid} />
      <Stack.Screen name="Countdown" component={CountdownScreen} />
      <Stack.Screen name="AddCountdown" component={AddCountdownScreen} />
      <Stack.Screen name="Reminders" component={RemindersFluid} />
      <Stack.Screen name="Calendar" component={CalendarFluid} />
      <Stack.Screen name="Family" component={FamilyFluid} />
    </Stack.Navigator>
  );
}

export default function TabLayout() {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 88,
          paddingBottom: 20,
          paddingTop: 8,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} strokeWidth={2} />
          ),
          tabBarShowLabel: false,
        }}
      />
      <Tab.Screen
        name="Add"
        component={AddReminderTab}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Plus size={size} color={color} strokeWidth={2} />
          ),
          tabBarShowLabel: false,
        }}
      />
      <Tab.Screen
        name="Lists"
        component={ListsFluid}
        options={{
          tabBarIcon: ({ color, size }) => (
            <List size={size} color={color} strokeWidth={2} />
          ),
          tabBarShowLabel: false,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsFluid}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} strokeWidth={2} />
          ),
          tabBarShowLabel: false,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
