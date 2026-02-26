import {
  DefaultTheme,
  DarkTheme as NativeDarkTheme,
} from '@react-navigation/native';

export type Theme = {
  dark: boolean;
  colors: {
    primary: string;
    primaryForeground: string;
    background: string;
    card: string;
    cardElevated: string;
    text: string;
    textSecondary: string;
    border: string;
    notification: string;
    default: string;
    highlight: string;
    error: string;
    errorForeground: string;
    success: string;
    muted: string;
    tabBar: string;
    tabBarBorder: string;
    inputBackground: string;
  };
};

export const LightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6366f1',
    primaryForeground: '#ffffff',
    error: '#ef4444',
    errorForeground: '#ffffff',
    success: '#22c55e',
    background: '#f8fafc',
    card: '#ffffff',
    cardElevated: '#f1f5f9',
    text: '#0f172a',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    default: '#e2e8f0',
    highlight: '#94a3b8',
    muted: '#64748b',
    notification: '#ef4444',
    tabBar: '#ffffff',
    tabBarBorder: '#e2e8f0',
    inputBackground: '#f1f5f9',
  },
};

export const DarkTheme: Theme = {
  ...NativeDarkTheme,
  colors: {
    ...NativeDarkTheme.colors,
    primary: '#818cf8',
    primaryForeground: '#0f172a',
    error: '#f87171',
    errorForeground: '#1e1e1e',
    success: '#4ade80',
    background: '#0f172a',
    card: '#1e293b',
    cardElevated: '#334155',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    border: '#334155',
    default: '#334155',
    highlight: '#64748b',
    muted: '#94a3b8',
    notification: '#f87171',
    tabBar: '#1e293b',
    tabBarBorder: '#334155',
    inputBackground: '#1e293b',
  },
};
