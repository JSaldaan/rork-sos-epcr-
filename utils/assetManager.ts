import { Platform } from 'react-native';

// Asset management utility for handling icons and images
export class AssetManager {
  // Default icons using external URLs (since local assets are corrupted)
  private static readonly DEFAULT_ICONS = {
    app: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=1024&h=1024&fit=crop&crop=center',
    splash: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=1024&h=1024&fit=crop&crop=center',
    favicon: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=32&h=32&fit=crop&crop=center',
    adaptive: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=1024&h=1024&fit=crop&crop=center'
  };

  // Medical/Emergency themed icons
  private static readonly MEDICAL_ICONS = {
    ambulance: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop&crop=center',
    medical: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=100&h=100&fit=crop&crop=center',
    hospital: 'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=100&h=100&fit=crop&crop=center',
    emergency: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=100&h=100&fit=crop&crop=center'
  };

  // Get app icon URL
  static getAppIcon(): string {
    return this.DEFAULT_ICONS.app;
  }

  // Get splash screen image URL
  static getSplashImage(): string {
    return this.DEFAULT_ICONS.splash;
  }

  // Get favicon URL
  static getFavicon(): string {
    return this.DEFAULT_ICONS.favicon;
  }

  // Get adaptive icon URL (Android)
  static getAdaptiveIcon(): string {
    return this.DEFAULT_ICONS.adaptive;
  }

  // Get medical themed icon
  static getMedicalIcon(type: keyof typeof AssetManager.MEDICAL_ICONS = 'medical'): string {
    return this.MEDICAL_ICONS[type] || this.MEDICAL_ICONS.medical;
  }

  // Check if we're running on web
  static isWeb(): boolean {
    return Platform.OS === 'web';
  }

  // Get platform-specific asset
  static getPlatformAsset(webUrl: string, nativeUrl: string): string {
    return this.isWeb() ? webUrl : nativeUrl;
  }

  // Validate asset URL
  static isValidAssetUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Get asset with fallback
  static getAssetWithFallback(primaryUrl: string, fallbackUrl?: string): string {
    // Validate and sanitize primary URL
    if (!primaryUrl || !primaryUrl.trim() || primaryUrl.length > 2000) {
      if (fallbackUrl && fallbackUrl.trim() && fallbackUrl.length <= 2000 && this.isValidAssetUrl(fallbackUrl.trim())) {
        return fallbackUrl.trim();
      }
      return this.DEFAULT_ICONS.app;
    }
    
    const sanitizedPrimary = primaryUrl.trim();
    if (this.isValidAssetUrl(sanitizedPrimary)) {
      return sanitizedPrimary;
    }
    
    // Validate and sanitize fallback URL
    if (fallbackUrl && fallbackUrl.trim() && fallbackUrl.length <= 2000) {
      const sanitizedFallback = fallbackUrl.trim();
      if (this.isValidAssetUrl(sanitizedFallback)) {
        return sanitizedFallback;
      }
    }
    
    return this.DEFAULT_ICONS.app;
  }
}

// Export for easy use
export const getAppIcon = AssetManager.getAppIcon.bind(AssetManager);
export const getSplashImage = AssetManager.getSplashImage.bind(AssetManager);
export const getFavicon = AssetManager.getFavicon.bind(AssetManager);
export const getAdaptiveIcon = AssetManager.getAdaptiveIcon.bind(AssetManager);
export const getMedicalIcon = AssetManager.getMedicalIcon.bind(AssetManager);
export const isWeb = AssetManager.isWeb.bind(AssetManager);
export const getPlatformAsset = AssetManager.getPlatformAsset.bind(AssetManager);
export const getAssetWithFallback = AssetManager.getAssetWithFallback.bind(AssetManager);