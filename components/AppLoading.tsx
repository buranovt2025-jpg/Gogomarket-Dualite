import React from 'react';
import { View, Image, StyleSheet, useColorScheme, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Используем прямые ссылки для 100% надежной загрузки в среде разработки
const SPLASH_LIGHT = 'https://images.dualite.app/d5f3f285-d75c-4283-a4c0-6b6cacd910a4/gogo_1-47045256-9c5d-403b-8ae8-e35ed8fe7334.webp';
const SPLASH_DARK = 'https://images.dualite.app/d5f3f285-d75c-4283-a4c0-6b6cacd910a4/gogo_2-3da92785-c977-4faa-8bf3-19d1f5c20bbf.webp';

export default function AppLoading() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#FF5A00' : '#FFFFFF' }]}>
      <Image 
        source={{ uri: isDark ? SPLASH_DARK : SPLASH_LIGHT }} 
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width * 0.8,
    height: height * 0.8,
  }
});
