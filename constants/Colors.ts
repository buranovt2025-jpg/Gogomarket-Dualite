const tintColorLight = '#FF5A00';
const tintColorDark = '#FF7A33';

export const Colors = {
  light: {
    text: '#1C1C1E',
    textSecondary: '#8E8E93',
    background: '#FFFFFF', // Единый чистый белый фон
    backgroundSecondary: '#F2F2F7', // Только для инпутов и мелких плашек
    tint: tintColorLight,
    tabIconDefault: '#C7C7CC',
    tabIconSelected: tintColorLight,
    border: '#F2F2F7', // Мягкая граница для карточек
    card: '#FFFFFF', // Карточки сливаются с фоном, выделяются границей
    icon: '#1C1C1E',
    danger: '#FF3B30',
    success: '#34C759',
    gradientStart: '#FF5A00',
    gradientEnd: '#FF2A5F',
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    background: '#000000', // Единый глубокий черный фон (OLED)
    backgroundSecondary: '#1C1C1E', // Только для инпутов и мелких плашек
    tint: tintColorDark,
    tabIconDefault: '#636366',
    tabIconSelected: tintColorDark,
    border: '#1C1C1E', // Мягкая граница для карточек
    card: '#000000', // Карточки сливаются с фоном, выделяются границей
    icon: '#FFFFFF',
    danger: '#FF453A',
    success: '#32D74B',
    gradientStart: '#FF7A33',
    gradientEnd: '#FF3366',
  },
};
