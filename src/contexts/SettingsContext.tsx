import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsContextType {
  fabPosition: 'left' | 'right';
  setFabPosition: (position: 'left' | 'right') => void;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = '@clearcue_settings';

interface SettingsData {
  fabPosition: 'left' | 'right';
}

const defaultSettings: SettingsData = {
  fabPosition: 'right',
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fabPosition, setFabPositionState] = useState<'left' | 'right'>(defaultSettings.fabPosition);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from AsyncStorage on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const storedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        const settings: SettingsData = JSON.parse(storedSettings);
        setFabPositionState(settings.fabPosition || defaultSettings.fabPosition);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setFabPosition = async (position: 'left' | 'right') => {
    try {
      setFabPositionState(position);
      const settings: SettingsData = { fabPosition: position };
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving FAB position setting:', error);
    }
  };

  const value: SettingsContextType = {
    fabPosition,
    setFabPosition,
    isLoading,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
