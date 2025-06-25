import React, { createContext, useContext, useState, useEffect } from 'react';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/Colors';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  colors: typeof Colors.light;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  // useEffect(() => {
  //   loadTheme();
  // }, []);

  // const loadTheme = async () => {
  //   try {
  //     const savedTheme = await AsyncStorage.getItem('theme');
  //     if (savedTheme === 'dark' || savedTheme === 'light') {
  //       setTheme(savedTheme);
  //     }
  //   } catch (error) {
  //     console.log('Error loading theme:', error);
  //   }
  // };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // try {
    //   await AsyncStorage.setItem('theme', newTheme);
    // } catch (error) {
    //   console.log('Error saving theme:', error);
    // }
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      colors: Colors[theme],
      isDark: theme === 'dark',
      toggleTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}