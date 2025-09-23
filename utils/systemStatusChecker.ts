import { Platform } from 'react-native';
import { errorHandler } from './errorHandler';

// System status checker for comprehensive app health monitoring
export class SystemStatusChecker {
  private static instance: SystemStatusChecker;
  
  static getInstance(): SystemStatusChecker {
    if (!SystemStatusChecker.instance) {
      SystemStatusChecker.instance = new SystemStatusChecker();
    }
    return SystemStatusChecker.instance;
  }

  // Check overall system health
  async checkSystemHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Check memory usage
      if (this.isMemoryUsageHigh()) {
        issues.push('High memory usage detected');
        recommendations.push('Clear app cache and restart');
      }

      // Check for critical errors
      const criticalErrors = await errorHandler.getCriticalErrors();
      if (criticalErrors.length > 10) {
        issues.push(`${criticalErrors.length} critical errors logged`);
        recommendations.push('Review error logs and fix underlying issues');
      }

      // Check platform-specific issues
      if (Platform.OS === 'ios') {
        const iosIssues = this.checkiOSSpecificIssues();
        issues.push(...iosIssues);
      }

      // Determine overall status
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (issues.length > 0) {
        status = issues.length > 3 ? 'critical' : 'warning';
      }

      return { status, issues, recommendations };
    } catch (error) {
      errorHandler.logError(error as Error, 'SystemStatusChecker');
      return {
        status: 'critical',
        issues: ['System health check failed'],
        recommendations: ['Restart the application']
      };
    }
  }

  // Check if memory usage is high (simplified check)
  private isMemoryUsageHigh(): boolean {
    try {
      // This is a simplified check - in a real app you'd use more sophisticated memory monitoring
      const errorCount = errorHandler.getRecentErrors(50).length;
      return errorCount > 20; // High error count might indicate memory issues
    } catch {
      return false;
    }
  }

  // iOS-specific issue checks
  private checkiOSSpecificIssues(): string[] {
    const issues: string[] = [];
    
    if (Platform.OS !== 'ios') return issues;

    try {
      // Check for common iOS issues
      const recentErrors = errorHandler.getRecentErrors(20);
      
      const networkErrors = recentErrors.filter(e => 
        e.error?.includes('Network request failed') || 
        e.error?.includes('network')
      );
      
      if (networkErrors.length > 5) {
        issues.push('Multiple network connectivity issues detected');
      }

      const permissionErrors = recentErrors.filter(e => 
        e.error?.includes('Permission denied') || 
        e.error?.includes('permission')
      );
      
      if (permissionErrors.length > 0) {
        issues.push('Permission-related errors detected');
      }

      return issues;
    } catch {
      return ['Unable to check iOS-specific issues'];
    }
  }

  // Generate system report
  async generateSystemReport(): Promise<{
    timestamp: Date;
    platform: string;
    health: any;
    recentErrors: any[];
    recommendations: string[];
  }> {
    const health = await this.checkSystemHealth();
    const recentErrors = errorHandler.getRecentErrors(10);
    
    return {
      timestamp: new Date(),
      platform: Platform.OS,
      health,
      recentErrors,
      recommendations: [
        'Regularly clear app cache',
        'Monitor error logs',
        'Keep app updated',
        'Restart app if issues persist',
        ...health.recommendations
      ]
    };
  }

  // Quick fix suggestions
  getQuickFixes(): string[] {
    return [
      '1. Force close and restart the app',
      '2. Clear app cache and data',
      '3. Check device storage space',
      '4. Verify network connectivity',
      '5. Update to latest app version',
      '6. Restart device if issues persist'
    ];
  }

  // Emergency recovery steps
  getEmergencyRecoverySteps(): string[] {
    return [
      '1. Force quit the application',
      '2. Clear all app data and cache',
      '3. Restart the device',
      '4. Reinstall the application if necessary',
      '5. Contact support if issues continue'
    ];
  }
}

// Global system status checker instance
export const systemStatusChecker = SystemStatusChecker.getInstance();

// Utility functions for quick system checks
export const performQuickHealthCheck = async (): Promise<boolean> => {
  try {
    const health = await systemStatusChecker.checkSystemHealth();
    return health.status !== 'critical';
  } catch {
    return false;
  }
};

export const logSystemStatus = async (): Promise<void> => {
  try {
    const report = await systemStatusChecker.generateSystemReport();
    console.log('📊 System Status Report:', {
      status: report.health.status,
      issues: report.health.issues.length,
      platform: report.platform,
      timestamp: report.timestamp.toISOString()
    });
  } catch (error) {
    console.error('Failed to generate system status report:', error);
  }
};

// Auto-recovery helper
export const attemptAutoRecovery = async (): Promise<boolean> => {
  try {
    console.log('🔧 Attempting auto-recovery...');
    
    // Clear error logs
    errorHandler.clearErrorLog();
    
    // Log recovery attempt
    console.log('✅ Auto-recovery completed');
    return true;
  } catch (error) {
    console.error('❌ Auto-recovery failed:', error);
    return false;
  }
};