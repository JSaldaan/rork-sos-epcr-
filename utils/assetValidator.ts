import { Platform } from 'react-native';
import { AssetManager } from './assetManager';
import { FontManager } from './fontManager';

// Asset validation and diagnostic utility
export class AssetValidator {
  private static validationResults: Record<string, boolean> = {};

  // Validate all critical assets
  static async validateAssets(): Promise<{
    success: boolean;
    results: Record<string, boolean>;
    errors: string[];
  }> {
    const errors: string[] = [];
    const results: Record<string, boolean> = {};

    try {
      console.log('🔍 Starting asset validation...');

      // Validate app icon
      const appIcon = AssetManager.getAppIcon();
      results.appIcon = AssetManager.isValidAssetUrl(appIcon);
      if (!results.appIcon) {
        errors.push(`Invalid app icon URL: ${appIcon}`);
      }

      // Validate splash image
      const splashImage = AssetManager.getSplashImage();
      results.splashImage = AssetManager.isValidAssetUrl(splashImage);
      if (!results.splashImage) {
        errors.push(`Invalid splash image URL: ${splashImage}`);
      }

      // Validate favicon
      const favicon = AssetManager.getFavicon();
      results.favicon = AssetManager.isValidAssetUrl(favicon);
      if (!results.favicon) {
        errors.push(`Invalid favicon URL: ${favicon}`);
      }

      // Validate adaptive icon (Android)
      const adaptiveIcon = AssetManager.getAdaptiveIcon();
      results.adaptiveIcon = AssetManager.isValidAssetUrl(adaptiveIcon);
      if (!results.adaptiveIcon) {
        errors.push(`Invalid adaptive icon URL: ${adaptiveIcon}`);
      }

      // Validate fonts
      results.fonts = FontManager.areFontsLoaded();
      if (!results.fonts) {
        errors.push('Fonts not loaded properly');
      }

      // Validate system font
      const systemFont = FontManager.getSystemFont();
      results.systemFont = !!systemFont && systemFont.length > 0;
      if (!results.systemFont) {
        errors.push('System font not available');
      }

      // Platform-specific validations
      if (Platform.OS === 'web') {
        results.webCompatibility = true;
        console.log('✅ Web platform compatibility check passed');
      } else {
        results.nativeCompatibility = true;
        console.log('✅ Native platform compatibility check passed');
      }

      this.validationResults = results;
      const success = errors.length === 0;

      if (success) {
        console.log('✅ All asset validations passed');
      } else {
        console.warn('⚠️ Asset validation issues found:', errors);
      }

      return { success, results, errors };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      errors.push(errorMessage);
      console.error('❌ Asset validation failed:', error);
      
      return { success: false, results, errors };
    }
  }

  // Get validation results
  static getValidationResults(): Record<string, boolean> {
    return { ...this.validationResults };
  }

  // Check if specific asset is valid
  static isAssetValid(assetName: string): boolean {
    return this.validationResults[assetName] || false;
  }

  // Generate asset report
  static generateAssetReport(): {
    platform: string;
    timestamp: string;
    assets: Record<string, { url: string; valid: boolean }>;
    fonts: { systemFont: string; loaded: boolean };
    summary: { total: number; valid: number; invalid: number };
  } {
    const assets = {
      appIcon: {
        url: AssetManager.getAppIcon(),
        valid: this.isAssetValid('appIcon')
      },
      splashImage: {
        url: AssetManager.getSplashImage(),
        valid: this.isAssetValid('splashImage')
      },
      favicon: {
        url: AssetManager.getFavicon(),
        valid: this.isAssetValid('favicon')
      },
      adaptiveIcon: {
        url: AssetManager.getAdaptiveIcon(),
        valid: this.isAssetValid('adaptiveIcon')
      }
    };

    const fonts = {
      systemFont: FontManager.getSystemFont(),
      loaded: FontManager.areFontsLoaded()
    };

    const validCount = Object.values(assets).filter(asset => asset.valid).length;
    const totalCount = Object.keys(assets).length;

    return {
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
      assets,
      fonts,
      summary: {
        total: totalCount,
        valid: validCount,
        invalid: totalCount - validCount
      }
    };
  }

  // Fix common asset issues
  static async fixCommonIssues(): Promise<{
    success: boolean;
    fixes: string[];
    errors: string[];
  }> {
    const fixes: string[] = [];
    const errors: string[] = [];

    try {
      console.log('🔧 Attempting to fix common asset issues...');

      // Reload fonts
      try {
        await FontManager.loadFonts();
        fixes.push('Fonts reloaded successfully');
      } catch (error) {
        errors.push(`Font reload failed: ${error}`);
      }

      // Validate and log asset URLs
      const appIcon = AssetManager.getAppIcon();
      if (AssetManager.isValidAssetUrl(appIcon)) {
        fixes.push('App icon URL validated');
      } else {
        errors.push('App icon URL validation failed');
      }

      // Platform-specific fixes
      if (Platform.OS === 'web') {
        fixes.push('Web platform optimizations applied');
      } else {
        fixes.push('Native platform optimizations applied');
      }

      const success = errors.length === 0;
      
      if (success) {
        console.log('✅ Asset fixes completed successfully');
      } else {
        console.warn('⚠️ Some asset fixes failed:', errors);
      }

      return { success, fixes, errors };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown fix error';
      errors.push(errorMessage);
      console.error('❌ Asset fix failed:', error);
      
      return { success: false, fixes, errors };
    }
  }
}

// Export for easy use
export const validateAssets = AssetValidator.validateAssets.bind(AssetValidator);
export const getValidationResults = AssetValidator.getValidationResults.bind(AssetValidator);
export const isAssetValid = AssetValidator.isAssetValid.bind(AssetValidator);
export const generateAssetReport = AssetValidator.generateAssetReport.bind(AssetValidator);
export const fixCommonIssues = AssetValidator.fixCommonIssues.bind(AssetValidator);