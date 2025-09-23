import { Platform } from 'react-native';

// iOS-compliant font system
export const fonts = {
  // iOS System fonts
  system: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  systemBold: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  
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
};

// Helper function to get iOS-compliant font style
export const getFontStyle = (size: keyof typeof fonts.sizes, weight: keyof typeof fonts.weights = 'regular') => ({
  fontFamily: fonts.system,
  fontSize: fonts.sizes[size],
  fontWeight: fonts.weights[weight],
});

// Common text styles for iOS compliance
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
  
  // Semantic styles
  buttonText: getFontStyle('callout', 'semibold'),
  inputText: getFontStyle('body', 'regular'),
  labelText: getFontStyle('subheadline', 'medium'),
  errorText: getFontStyle('footnote', 'regular'),
};