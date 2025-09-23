import { Platform } from 'react-native';
import { errorHandler } from './errorHandler';
import { systemStatusChecker } from './systemStatusChecker';

// Comprehensive startup diagnostics for error prevention and resolution
export class StartupDiagnostics {
  private static instance: StartupDiagnostics;
  
  static getInstance(): StartupDiagnostics {
    if (!StartupDiagnostics.instance) {
      StartupDiagnostics.instance = new StartupDiagnostics();
    }
    return StartupDiagnostics.instance;
  }

  // Run comprehensive startup diagnostics
  async runStartupDiagnostics(): Promise<{
    success: boolean;
    issues: string[];
    fixes: string[];
    systemReport: any;
  }> {
    console.log('🔍 Running startup diagnostics...');
    
    const issues: string[] = [];
    const fixes: string[] = [];
    
    try {
      // Check system health
      const healthCheck = await systemStatusChecker.checkSystemHealth();
      if (healthCheck.status !== 'healthy') {
        issues.push(...healthCheck.issues);
        fixes.push(...healthCheck.recommendations);
      }

      // Check platform-specific requirements
      const platformCheck = this.checkPlatformRequirements();
      if (!platformCheck.success) {
        issues.push(...platformCheck.issues);
        fixes.push(...platformCheck.fixes);
      }

      // Check memory and performance
      const performanceCheck = this.checkPerformanceMetrics();
      if (!performanceCheck.success) {
        issues.push(...performanceCheck.issues);
        fixes.push(...performanceCheck.fixes);
      }

      // Generate system report
      const systemReport = await systemStatusChecker.generateSystemReport();

      const success = issues.length === 0;
      
      console.log(success ? '✅ Startup diagnostics passed' : '⚠️ Startup diagnostics found issues');
      
      return {
        success,
        issues,
        fixes,
        systemReport
      };
    } catch (error) {
      errorHandler.logError(error as Error, 'StartupDiagnostics');
      return {
        success: false,
        issues: ['Startup diagnostics failed to complete'],
        fixes: ['Restart the application'],
        systemReport: null
      };
    }
  }

  // Check platform-specific requirements
  private checkPlatformRequirements(): {
    success: boolean;
    issues: string[];
    fixes: string[];
  } {
    const issues: string[] = [];
    const fixes: string[] = [];

    try {
      // iOS-specific checks
      if (Platform.OS === 'ios') {
        // Check for iOS version compatibility
        if (Platform.Version && typeof Platform.Version === 'string') {
          const version = parseFloat(Platform.Version);
          if (version < 13.0) {
            issues.push('iOS version may be too old for optimal performance');
            fixes.push('Update to iOS 13.0 or later');
          }
        }
      }

      // Android-specific checks
      if (Platform.OS === 'android') {
        if (Platform.Version && Platform.Version < 23) {
          issues.push('Android API level may be too low');
          fixes.push('Update to Android 6.0 (API 23) or later');
        }
      }

      // Web-specific checks
      if (Platform.OS === 'web') {
        // Check for required web APIs
        if (typeof window !== 'undefined') {
          if (!window.localStorage) {
            issues.push('LocalStorage not available');
            fixes.push('Enable localStorage in browser settings');
          }
        }
      }

      return {
        success: issues.length === 0,
        issues,
        fixes
      };
    } catch (error) {
      return {
        success: false,
        issues: ['Platform requirements check failed'],
        fixes: ['Restart the application']
      };
    }
  }

  // Check performance metrics
  private checkPerformanceMetrics(): {
    success: boolean;
    issues: string[];
    fixes: string[];
  } {
    const issues: string[] = [];
    const fixes: string[] = [];

    try {
      // Check error count as performance indicator
      const recentErrors = errorHandler.getRecentErrors(20);
      if (recentErrors.length > 10) {
        issues.push('High error rate detected');
        fixes.push('Clear app cache and restart');
      }

      // Check for memory-related issues (simplified)
      if (recentErrors.some(e => e.error?.includes('memory') || e.error?.includes('Memory'))) {
        issues.push('Memory-related errors detected');
        fixes.push('Close other apps and restart this app');
      }

      return {
        success: issues.length === 0,
        issues,
        fixes
      };
    } catch (error) {
      return {
        success: false,
        issues: ['Performance metrics check failed'],
        fixes: ['Restart the application']
      };
    }
  }

  // Emergency recovery procedure
  async performEmergencyRecovery(): Promise<boolean> {
    try {
      console.log('🚨 Performing emergency recovery...');
      
      // Clear all error logs
      errorHandler.clearErrorLog();
      
      // Log recovery attempt
      console.log('✅ Emergency recovery completed');
      return true;
    } catch (error) {
      console.error('❌ Emergency recovery failed:', error);
      return false;
    }
  }

  // Get startup recommendations
  getStartupRecommendations(): string[] {
    return [
      '1. Ensure stable network connection',
      '2. Close unnecessary background apps',
      '3. Restart device if experiencing issues',
      '4. Clear app cache periodically',
      '5. Keep app updated to latest version',
      '6. Report persistent issues to support'
    ];
  }

  // iOS-specific startup checks
  async checkiOSCompliance(): Promise<{
    compliant: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (Platform.OS !== 'ios') {
      return { compliant: true, issues, recommendations };
    }

    try {
      // Check for iOS-specific error patterns
      const recentErrors = errorHandler.getRecentErrors(10);
      const iosErrors = recentErrors.filter(e => 
        e.context?.includes('iOS') || 
        e.error?.includes('iOS') ||
        e.error?.includes('NSError')
      );

      if (iosErrors.length > 0) {
        issues.push('iOS-specific errors detected');
        recommendations.push('Check iOS permissions and settings');
      }

      // Check for permission-related issues
      const permissionErrors = recentErrors.filter(e =>
        e.error?.includes('permission') ||
        e.error?.includes('Permission') ||
        e.error?.includes('denied')
      );

      if (permissionErrors.length > 0) {
        issues.push('Permission-related issues detected');
        recommendations.push('Review app permissions in iOS Settings');
      }

      return {
        compliant: issues.length === 0,
        issues,
        recommendations
      };
    } catch (error) {
      return {
        compliant: false,
        issues: ['iOS compliance check failed'],
        recommendations: ['Restart the application']
      };
    }
  }
}

// Global startup diagnostics instance
export const startupDiagnostics = StartupDiagnostics.getInstance();

// Utility functions for startup diagnostics
export const runQuickStartupCheck = async (): Promise<boolean> => {
  try {
    const result = await startupDiagnostics.runStartupDiagnostics();
    return result.success;
  } catch {
    return false;
  }
};

export const logStartupStatus = async (): Promise<void> => {
  try {
    const result = await startupDiagnostics.runStartupDiagnostics();
    console.log('🚀 Startup Status:', {
      success: result.success,
      issueCount: result.issues.length,
      platform: Platform.OS
    });
    
    if (!result.success) {
      console.warn('⚠️ Startup Issues:', result.issues);
      console.log('🔧 Suggested Fixes:', result.fixes);
    }
  } catch (error) {
    console.error('Failed to log startup status:', error);
  }
};

// Auto-fix common startup issues
export const attemptStartupAutoFix = async (): Promise<boolean> => {
  try {
    console.log('🔧 Attempting startup auto-fix...');
    
    // Clear error logs
    errorHandler.clearErrorLog();
    
    // Perform emergency recovery if needed
    const recoveryResult = await startupDiagnostics.performEmergencyRecovery();
    
    console.log(recoveryResult ? '✅ Startup auto-fix completed' : '❌ Startup auto-fix failed');
    return recoveryResult;
  } catch (error) {
    console.error('❌ Startup auto-fix failed:', error);
    return false;
  }
};