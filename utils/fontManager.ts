import { Platform } from 'react-native';

// Font loading utility for the app
export class FontManager {
  private static loaded = true; // System fonts are always available

  // System fonts don't need loading, but we keep this for API consistency
  static async loadFonts(): Promise<void> {
    // System fonts are always available, no loading needed
    console.log('✅ System fonts ready');
    return Promise.resolve();
  }

  // Check if fonts are loaded
  static areFontsLoaded(): boolean {
    return this.loaded;
  }

  // Get the appropriate font family for the current platform
  static getSystemFont(): string {
    return Platform.select({
      ios: '-apple-system',
      android: 'Roboto',
      web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      default: '-apple-system'
    }) as string;
  }

  // Get font with fallback
  static getFontFamily(fontName?: string): string {
    if (!fontName) {
      return this.getSystemFont();
    }

    // If custom font is requested but not loaded, fallback to system font
    if (!this.loaded) {
      return this.getSystemFont();
    }

    return fontName;
  }
}

// Export for easy use in components
export const loadFonts = FontManager.loadFonts.bind(FontManager);
export const areFontsLoaded = FontManager.areFontsLoaded.bind(FontManager);
export const getSystemFont = FontManager.getSystemFont.bind(FontManager);
export const getFontFamily = FontManager.getFontFamily.bind(FontManager);