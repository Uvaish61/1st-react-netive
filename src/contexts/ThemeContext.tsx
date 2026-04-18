import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeColors = {
  bg: string;
  card: string;
  text: string;
  subText: string;
  input: string;
  border: string;
  filterBg: string;
  filterActive: string;
};

type ThemeContextValue = {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
};

const THEME_STORAGE_KEY = 'APP_THEME_MODE';

const darkColors: ThemeColors = {
  bg: '#0F1013',
  card: '#181B20',
  text: '#FFFFFF',
  subText: '#B8BFCC',
  input: '#232730',
  border: '#2A3D2E',
  filterBg: '#232730',
  filterActive: '#4CAF50',
};

const lightColors: ThemeColors = {
  bg: '#F2F4F8',
  card: '#FFFFFF',
  text: '#0F172A',
  subText: '#64748B',
  input: '#FFFFFF',
  border: '#E2E8F0',
  filterBg: '#E8EDF5',
  filterActive: '#4CAF50',
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedMode === 'light') {
          setIsDark(false);
        } else if (savedMode === 'dark') {
          setIsDark(true);
        }
      } catch (error) {
        console.log('Error loading theme preference:', error);
      }
    };

    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);

    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light');
    } catch (error) {
      console.log('Error saving theme preference:', error);
    }
  };

  const value = useMemo(
    () => ({
      isDark,
      colors: isDark ? darkColors : lightColors,
      toggleTheme,
    }),
    [isDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within ThemeProvider');
  }

  return context;
};
