import { Platform } from 'react-native';

// iOS-compliant font system following Apple Human Interface Guidelines
export const fonts = {
  // iOS System fonts - using SF Pro for iOS, fallback for other platforms
  system: Platform.select({
    ios: 'System',
    android: 'Roboto',
    web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    default: 'System'
  }),
  
  // Font weights (iOS compliant)
  weights: {
    thin: '100' as const,
    ultraLight: '200' as const,
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
    black: '900' as const,
  },
  
  // Font sizes following iOS Human Interface Guidelines
  // These sizes are optimized for accessibility and readability
  sizes: {
    caption2: 11,
    caption1: 12,
    footnote: 13,
    subheadline: 15,
    callout: 16,
    body: 17,
    headline: 17,
    title3: 20,
    title2: 22,
    title1: 28,
    largeTitle: 34,
  },
  
  // Line heights for better readability (iOS standard)
  lineHeights: {
    caption2: 13,
    caption1: 16,
    footnote: 18,
    subheadline: 20,
    callout: 21,
    body: 22,
    headline: 22,
    title3: 25,
    title2: 28,
    title1: 34,
    largeTitle: 41,
  },
};

// Helper function to get iOS-compliant font style
export const getFontStyle = (
  size: keyof typeof fonts.sizes, 
  weight: keyof typeof fonts.weights = 'regular',
  includeLineHeight: boolean = true
) => ({
  fontFamily: fonts.system,
  fontSize: fonts.sizes[size],
  fontWeight: fonts.weights[weight],
  ...(includeLineHeight && { lineHeight: fonts.lineHeights[size] }),
});

// Common text styles for iOS compliance
// These follow Apple's typography guidelines
export const textStyles = {
  largeTitle: getFontStyle('largeTitle', 'bold'),
  title1: getFontStyle('title1', 'bold'),
  title2: getFontStyle('title2', 'bold'),
  title3: getFontStyle('title3', 'semibold'),
  headline: getFontStyle('headline', 'semibold'),
  body: getFontStyle('body', 'regular'),
  callout: getFontStyle('callout', 'regular'),
  subheadline: getFontStyle('subheadline', 'regular'),
  footnote: getFontStyle('footnote', 'regular'),
  caption1: getFontStyle('caption1', 'regular'),
  caption2: getFontStyle('caption2', 'regular'),
  
  // Semantic styles for app-specific use
  buttonText: getFontStyle('callout', 'semibold'),
  inputText: getFontStyle('body', 'regular'),
  labelText: getFontStyle('subheadline', 'medium'),
  errorText: getFontStyle('footnote', 'regular'),
  navigationTitle: getFontStyle('headline', 'semibold'),
  tabBarLabel: getFontStyle('caption1', 'medium'),
};

// Accessibility helpers
export const getAccessibleFontSize = (baseSize: number, scale: number = 1) => {
  // iOS automatically scales fonts based on user preferences
  // This helper can be used for custom scaling if needed
  return Math.round(baseSize * scale);
};

// Color-aware text styles for iOS dark mode support
export const getTextColor = (isDarkMode: boolean = false) => ({
  primary: isDarkMode ? '#FFFFFF' : '#000000',
  secondary: isDarkMode ? '#EBEBF5' : '#3C3C43',
  tertiary: isDarkMode ? '#EBEBF5' : '#3C3C43',
  quaternary: isDarkMode ? '#EBEBF5' : '#3C3C43',
  placeholder: isDarkMode ? '#EBEBF5' : '#3C3C43',
  link: isDarkMode ? '#0A84FF' : '#007AFF',
  destructive: isDarkMode ? '#FF453A' : '#FF3B30',
});