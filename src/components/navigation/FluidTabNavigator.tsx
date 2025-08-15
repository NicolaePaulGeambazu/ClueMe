
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Animated } from 'react-native';
import { Home, Plus, Settings, List } from 'lucide-react-native';
import { useFluidTheme, FluidContainer } from '../../design-system';
import { useFluidAnimation } from '../../design-system/hooks/useFluidAnimation';

// Import screen components
import HomeScreen from '../../screens/index';
import FluidHomeScreen from '../../screens/FluidHomeScreen';
import CountdownScreen from '../../screens/countdown';
import AddReminderTab from '../reminders/AddReminderTab';
import FluidAddReminderTab from '../reminders/FluidAddReminderTab';
import SettingsScreen from '../../screens/settings';
import FluidSettingsScreen from '../../screens/FluidSettingsScreen';
import AddCountdownScreen from '../../screens/add-countdown';
import ListsScreen from '../../screens/lists';
import FluidListsScreen from '../../screens/FluidListsScreen';
import RemindersScreen from '../../screens/reminders';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={FluidHomeScreen} />
      <Stack.Screen name="Countdown" component={CountdownScreen} />
      <Stack.Screen name="AddCountdown" component={AddCountdownScreen} />
      <Stack.Screen name="Reminders" component={RemindersScreen} />
    </Stack.Navigator>
  );
}

// Custom tab bar icon with fluid animations
const FluidTabIcon: React.FC<{
  IconComponent: React.ComponentType<any>;
  focused: boolean;
  color: string;
  size: number;
}> = ({ IconComponent, focused, color, size }) => {
  const { scale } = useFluidAnimation({ 
    initialValue: focused ? 1.1 : 1,
    autoStart: true,
  });
  
  React.useEffect(() => {
    scale.setValue(focused ? 1.1 : 1);
  }, [focused]);
  
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <FluidContainer
        background={focused ? 'primary' : 'transparent'}
        rounded="full"
        padding="small"
        style={{
          opacity: focused ? 0.1 : 0,
          position: 'absolute',
          top: -8,
          left: -8,
          right: -8,
          bottom: -8,
        }}
      />
      <IconComponent 
        size={size} 
        color={color} 
        strokeWidth={focused ? 2.5 : 2} 
      />
    </Animated.View>
  );
};

export default function FluidTabNavigator() {
  const { colors, spacing, getShadowStyle } = useFluidTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          height: 88,
          paddingBottom: 20,
          paddingTop: 8,
          paddingHorizontal: spacing.md,
          ...getShadowStyle('lg'),
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        },
        headerShown: false,
        tabBarShowLabel: false,
        tabBarItemStyle: {
          borderRadius: 16,
          marginHorizontal: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <FluidTabIcon
              IconComponent={Home}
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Add"
        component={FluidAddReminderTab}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <FluidTabIcon
              IconComponent={Plus}
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Lists"
        component={FluidListsScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <FluidTabIcon
              IconComponent={List}
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={FluidSettingsScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <FluidTabIcon
              IconComponent={Settings}
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
