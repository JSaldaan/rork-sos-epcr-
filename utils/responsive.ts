import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 12 Pro as reference)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// Device type detection
export const getDeviceType = () => {
  const pixelDensity = PixelRatio.get();
  const adjustedWidth = SCREEN_WIDTH * pixelDensity;
  const adjustedHeight = SCREEN_HEIGHT * pixelDensity;
  
  if (Platform.OS === 'web') {
    if (SCREEN_WIDTH < 768) return 'mobile';
    if (SCREEN_WIDTH < 1024) return 'tablet';
    return 'desktop';
  }
  
  if (pixelDensity < 2 && (adjustedWidth >= 1000 || adjustedHeight >= 1000)) {
    return 'tablet';
  } else if (pixelDensity >= 2 && (adjustedWidth >= 1920 || adjustedHeight >= 1920)) {
    return 'tablet';
  } else {
    return 'mobile';
  }
};

// Screen size categories
export const isSmallScreen = () => SCREEN_WIDTH < 375;
export const isMediumScreen = () => SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;
export const isLargeScreen = () => SCREEN_WIDTH >= 414;
export const isTablet = () => getDeviceType() === 'tablet';
export const isDesktop = () => getDeviceType() === 'desktop';

// Responsive scaling functions
export const scaleWidth = (size: number): number => {
  return (SCREEN_WIDTH / BASE_WIDTH) * size;
};

export const scaleHeight = (size: number): number => {
  return (SCREEN_HEIGHT / BASE_HEIGHT) * size;
};

export const scaleFont = (size: number): number => {
  const scale = Math.min(SCREEN_WIDTH / BASE_WIDTH, SCREEN_HEIGHT / BASE_HEIGHT);
  const newSize = size * scale;
  
  // Ensure minimum readable font size
  if (Platform.OS === 'ios') {
    return Math.max(newSize, 12);
  }
  return Math.max(newSize, 14);
};

// Responsive spacing
export const spacing = {
  xs: scaleWidth(4),
  sm: scaleWidth(8),
  md: scaleWidth(12),
  lg: scaleWidth(16),
  xl: scaleWidth(20),
  xxl: scaleWidth(24),
  xxxl: scaleWidth(32),
};

// Responsive dimensions
export const dimensions = {
  // Button heights
  buttonHeight: {
    small: scaleHeight(36),
    medium: scaleHeight(44),
    large: scaleHeight(52),
  },
  
  // Input heights
  inputHeight: {
    small: scaleHeight(40),
    medium: scaleHeight(44),
    large: scaleHeight(48),
  },
  
  // Icon sizes
  iconSize: {
    small: scaleWidth(16),
    medium: scaleWidth(20),
    large: scaleWidth(24),
    xlarge: scaleWidth(32),
  },
  
  // Border radius
  borderRadius: {
    small: scaleWidth(4),
    medium: scaleWidth(8),
    large: scaleWidth(12),
    xlarge: scaleWidth(16),
  },
  
  // Container widths
  containerWidth: {
    small: Math.min(SCREEN_WIDTH - spacing.lg * 2, 400),
    medium: Math.min(SCREEN_WIDTH - spacing.lg * 2, 600),
    large: Math.min(SCREEN_WIDTH - spacing.lg * 2, 800),
    full: SCREEN_WIDTH - spacing.lg * 2,
  },
};

// Typography scale
export const typography = {
  fontSize: {
    xs: scaleFont(10),
    sm: scaleFont(12),
    base: scaleFont(14),
    md: scaleFont(16),
    lg: scaleFont(18),
    xl: scaleFont(20),
    xxl: scaleFont(24),
    xxxl: scaleFont(28),
    xxxxl: scaleFont(32),
  },
  
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
};

// Responsive breakpoints for conditional rendering
export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  largeDesktop: 1440,
};

// Helper function to get responsive value based on screen size
export const getResponsiveValue = <T>(
  mobile: T,
  tablet?: T,
  desktop?: T
): T => {
  const deviceType = getDeviceType();
  
  switch (deviceType) {
    case 'tablet':
      return tablet || mobile;
    case 'desktop':
      return desktop || tablet || mobile;
    default:
      return mobile;
  }
};

// Grid system
export const grid = {
  columns: getResponsiveValue(1, 2, 3),
  gap: spacing.md,
  
  // Flex utilities
  flex: {
    row: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
    },
    column: {
      flexDirection: 'column' as const,
    },
  },
};

// Safe area adjustments
export const safeArea = {
  paddingTop: Platform.select({
    ios: isLargeScreen() ? 44 : 20,
    android: 0,
    web: 0,
  }),
  paddingBottom: Platform.select({
    ios: isLargeScreen() ? 34 : 0,
    android: 0,
    web: 0,
  }),
};

// Device-specific adjustments
export const deviceAdjustments = {
  // Adjust for notched devices
  hasNotch: Platform.OS === 'ios' && (SCREEN_HEIGHT >= 812 || SCREEN_WIDTH >= 812),
  
  // Adjust for small screens
  isCompact: SCREEN_WIDTH < 375 || SCREEN_HEIGHT < 667,
  
  // Adjust for large screens
  isExpanded: SCREEN_WIDTH > 414 || SCREEN_HEIGHT > 896,
};

export default {
  scaleWidth,
  scaleHeight,
  scaleFont,
  spacing,
  dimensions,
  typography,
  breakpoints,
  getResponsiveValue,
  getDeviceType,
  isSmallScreen,
  isMediumScreen,
  isLargeScreen,
  isTablet,
  isDesktop,
  grid,
  safeArea,
  deviceAdjustments,
};