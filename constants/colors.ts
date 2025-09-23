import { Platform } from 'react-native';

// iOS-compliant color system following Apple Human Interface Guidelines
export const colors = {
  // System colors that adapt to light/dark mode
  system: {
    // Primary colors
    blue: '#007AFF',
    green: '#34C759',
    indigo: '#5856D6',
    orange: '#FF9500',
    pink: '#FF2D92',
    purple: '#AF52DE',
    red: '#FF3B30',
    teal: '#5AC8FA',
    yellow: '#FFCC00',
    
    // Grayscale
    gray: '#8E8E93',
    gray2: '#AEAEB2',
    gray3: '#C7C7CC',
    gray4: '#D1D1D6',
    gray5: '#E5E5EA',
    gray6: '#F2F2F7',
  },
  
  // App-specific brand colors
  brand: {
    primary: '#0066CC',
    secondary: '#DC2626',
    accent: '#8B5CF6',
    success: '#28A745',
    warning: '#FFC107',
    error: '#DC3545',
    info: '#17A2B8',
  },
  
  // Background colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F2F2F7',
    tertiary: '#FFFFFF',
    grouped: '#F2F2F7',
    elevated: '#FFFFFF',
  },
  
  // Text colors
  text: {
    primary: '#000000',
    secondary: '#3C3C43',
    tertiary: '#3C3C43',
    quaternary: '#3C3C43',
    placeholder: '#3C3C43',
    link: '#007AFF',
    destructive: '#FF3B30',
  },
  
  // Border and separator colors
  separator: {
    opaque: '#C6C6C8',
    nonOpaque: '#3C3C43',
  },
  
  // Fill colors for buttons and controls
  fill: {
    primary: '#007AFF',
    secondary: '#E5E5EA',
    tertiary: '#F2F2F7',
    quaternary: '#F2F2F7',
  },
  
  // Medical app specific colors
  medical: {
    emergency: '#FF3B30',
    urgent: '#FF9500',
    routine: '#34C759',
    critical: '#FF2D92',
    stable: '#007AFF',
    
    // Vital signs colors
    heartRate: '#FF3B30',
    bloodPressure: '#007AFF',
    temperature: '#FF9500',
    oxygen: '#34C759',
    respiratory: '#5856D6',
  },
};

// Dark mode colors (iOS 13+)
export const darkColors = {
  system: {
    blue: '#0A84FF',
    green: '#30D158',
    indigo: '#5E5CE6',
    orange: '#FF9F0A',
    pink: '#FF375F',
    purple: '#BF5AF2',
    red: '#FF453A',
    teal: '#64D2FF',
    yellow: '#FFD60A',
    
    gray: '#8E8E93',
    gray2: '#636366',
    gray3: '#48484A',
    gray4: '#3A3A3C',
    gray5: '#2C2C2E',
    gray6: '#1C1C1E',
  },
  
  background: {
    primary: '#000000',
    secondary: '#1C1C1E',
    tertiary: '#2C2C2E',
    grouped: '#000000',
    elevated: '#1C1C1E',
  },
  
  text: {
    primary: '#FFFFFF',
    secondary: '#EBEBF5',
    tertiary: '#EBEBF5',
    quaternary: '#EBEBF5',
    placeholder: '#EBEBF5',
    link: '#0A84FF',
    destructive: '#FF453A',
  },
  
  separator: {
    opaque: '#38383A',
    nonOpaque: '#EBEBF5',
  },
  
  fill: {
    primary: '#0A84FF',
    secondary: '#1C1C1E',
    tertiary: '#2C2C2E',
    quaternary: '#3A3A3C',
  },
};

// Helper function to get color based on theme
export const getColor = (
  colorPath: string,
  isDarkMode: boolean = false
): string => {
  const pathArray = colorPath.split('.');
  let colorObj: any = isDarkMode ? darkColors : colors;
  
  for (const key of pathArray) {
    colorObj = colorObj[key];
    if (!colorObj) break;
  }
  
  return colorObj || colors.system.gray;
};

// iOS-specific color utilities
export const iosColors = {
  // System colors that automatically adapt to appearance
  systemBlue: Platform.select({
    ios: 'systemBlue',
    default: colors.system.blue,
  }),
  systemGreen: Platform.select({
    ios: 'systemGreen',
    default: colors.system.green,
  }),
  systemRed: Platform.select({
    ios: 'systemRed',
    default: colors.system.red,
  }),
  systemGray: Platform.select({
    ios: 'systemGray',
    default: colors.system.gray,
  }),
  
  // Background colors
  systemBackground: Platform.select({
    ios: 'systemBackground',
    default: colors.background.primary,
  }),
  secondarySystemBackground: Platform.select({
    ios: 'secondarySystemBackground',
    default: colors.background.secondary,
  }),
  
  // Text colors
  label: Platform.select({
    ios: 'label',
    default: colors.text.primary,
  }),
  secondaryLabel: Platform.select({
    ios: 'secondaryLabel',
    default: colors.text.secondary,
  }),
  
  // Separator colors
  separator: Platform.select({
    ios: 'separator',
    default: colors.separator.opaque,
  }),
};

// Accessibility colors
export const accessibilityColors = {
  highContrast: {
    text: '#000000',
    background: '#FFFFFF',
    border: '#000000',
  },
  reducedTransparency: {
    background: '#F2F2F7',
    overlay: '#000000',
  },
};

// Status bar styles
export const statusBarStyles = {
  light: 'light-content' as const,
  dark: 'dark-content' as const,
  auto: 'auto' as const,
};