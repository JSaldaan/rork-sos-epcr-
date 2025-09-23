import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Utility to clear all security locks and reset the security system
 * This should be called when the app starts having issues with locked accounts
 */
export async function clearAllSecurityLocks(): Promise<void> {
  try {
    console.log('Clearing all security locks...');
    
    // Get all keys from AsyncStorage
    const allKeys = await AsyncStorage.getAllKeys();
    
    // Filter for security-related keys
    const securityKeys = allKeys.filter(key => 
      key.startsWith('lock_') || 
      key.startsWith('attempts_') ||
      key === 'security_logs' ||
      key === 'critical_security_events'
    );
    
    if (securityKeys.length > 0) {
      // Remove all security-related keys
      await AsyncStorage.multiRemove(securityKeys);
      console.log(`Cleared ${securityKeys.length} security-related keys`);
    } else {
      console.log('No security locks found');
    }
    
    // Clear any critical events
    await AsyncStorage.removeItem('critical_security_events');
    
    console.log('Security system reset complete');
  } catch (error) {
    console.error('Error clearing security locks:', error);
    throw error;
  }
}

/**
 * Initialize the app with clean security state
 */
export async function initializeCleanSecurity(): Promise<void> {
  try {
    // Clear all security locks first
    await clearAllSecurityLocks();
    
    // Initialize with clean state
    console.log('Security system initialized with clean state');
  } catch (error) {
    console.error('Error initializing clean security:', error);
  }
}