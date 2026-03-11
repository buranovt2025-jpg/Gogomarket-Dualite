import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useFrameworkReady } from '../hooks/useFrameworkReady';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { FavoritesProvider } from '../context/FavoritesContext';
import { LanguageProvider } from '../context/LanguageContext';
import { CustomThemeProvider, useThemeContext } from '../context/ThemeContext';
import Toast from 'react-native-toast-message';

function RootLayoutNav() {
  const { isDark } = useThemeContext();

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <LanguageProvider>
        <AuthProvider>
          <FavoritesProvider>
            <CartProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="+not-found" />
              </Stack>
              <StatusBar 
                style={isDark ? 'light' : 'dark'} 
                backgroundColor={isDark ? '#000' : '#fff'} 
              />
              <Toast />
            </CartProvider>
          </FavoritesProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  useFrameworkReady();
  return (
    <CustomThemeProvider>
      <RootLayoutNav />
    </CustomThemeProvider>
  );
}
