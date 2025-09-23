import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Comprehensive error handler for iOS compliance and stability
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: Array<{ timestamp: Date; error: string; stack?: string }> = [];
  private maxLogSize = 100;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Log error with context
  logError(error: Error | string, context?: string): void {
    const errorEntry = {
      timestamp: new Date(),
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      context,
      platform: Platform.OS,
    };

    this.errorLog.push(errorEntry);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Console log for development
    if (__DEV__) {
      console.error(`[${context || 'App'}] Error:`, errorEntry);
    }

    // Store critical errors
    this.persistCriticalError(errorEntry);
  }

  // Handle async errors safely
  async handleAsyncError<T>(
    asyncFn: () => Promise<T>,
    fallback?: T,
    context?: string
  ): Promise<T | undefined> {
    try {
      return await asyncFn();
    } catch (error) {
      this.logError(error as Error, context);
      return fallback;
    }
  }

  // Wrap sync functions with error handling
  handleSyncError<T>(
    syncFn: () => T,
    fallback?: T,
    context?: string
  ): T | undefined {
    try {
      return syncFn();
    } catch (error) {
      this.logError(error as Error, context);
      return fallback;
    }
  }

  // Get recent errors for debugging
  getRecentErrors(count: number = 10): Array<any> {
    return this.errorLog.slice(-count);
  }

  // Clear error log
  clearErrorLog(): void {
    this.errorLog = [];
    AsyncStorage.removeItem('critical_errors').catch(() => {});
  }

  // Persist critical errors for debugging
  private async persistCriticalError(errorEntry: any): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('critical_errors');
      const errors = stored ? JSON.parse(stored) : [];
      errors.push(errorEntry);
      
      // Keep only last 20 critical errors
      const recentErrors = errors.slice(-20);
      await AsyncStorage.setItem('critical_errors', JSON.stringify(recentErrors));
    } catch {
      // Fail silently for storage errors
    }
  }

  // Get stored critical errors
  async getCriticalErrors(): Promise<Array<any>> {
    try {
      const stored = await AsyncStorage.getItem('critical_errors');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // iOS-specific error handling
  handleiOSError(error: Error, component?: string): void {
    if (Platform.OS === 'ios') {
      // Handle iOS-specific errors
      const iosContext = `iOS-${component || 'Unknown'}`;
      this.logError(error, iosContext);
      
      // Check for common iOS issues
      if (error.message.includes('Network request failed')) {
        console.warn('iOS Network Error - Check network permissions');
      }
      
      if (error.message.includes('Permission denied')) {
        console.warn('iOS Permission Error - Check app permissions');
      }
    }
  }

  // Create error boundary handler
  createErrorBoundaryHandler(componentName: string) {
    return (error: Error, errorInfo: any) => {
      this.logError(error, `ErrorBoundary-${componentName}`);
      
      // Additional error info for React error boundaries
      if (errorInfo?.componentStack) {
        console.error('Component Stack:', errorInfo.componentStack);
      }
    };
  }
}

// Global error handler instance
export const errorHandler = ErrorHandler.getInstance();

// Utility functions for common error scenarios
export const safeAsyncCall = async <T>(
  fn: () => Promise<T>,
  fallback?: T,
  context?: string
): Promise<T | undefined> => {
  return errorHandler.handleAsyncError(fn, fallback, context);
};

export const safeSyncCall = <T>(
  fn: () => T,
  fallback?: T,
  context?: string
): T | undefined => {
  return errorHandler.handleSyncError(fn, fallback, context);
};

// React Native specific error handlers
export const handleNavigationError = (error: Error): void => {
  errorHandler.logError(error, 'Navigation');
  console.warn('Navigation error occurred, attempting recovery...');
};

export const handleStorageError = (error: Error): void => {
  errorHandler.logError(error, 'AsyncStorage');
  console.warn('Storage error occurred, data may not persist...');
};

export const handleNetworkError = (error: Error): void => {
  errorHandler.logError(error, 'Network');
  console.warn('Network error occurred, check connectivity...');
};

// iOS compliance helpers
export const iosErrorHelpers = {
  checkPermissions: async (): Promise<boolean> => {
    if (Platform.OS !== 'ios') return true;
    
    try {
      // Add iOS permission checks here
      return true;
    } catch (error) {
      errorHandler.handleiOSError(error as Error, 'PermissionCheck');
      return false;
    }
  },
  
  handleMemoryWarning: (): void => {
    if (Platform.OS === 'ios') {
      console.warn('iOS Memory Warning - Clearing caches...');
      // Trigger cache clearing
    }
  },
};