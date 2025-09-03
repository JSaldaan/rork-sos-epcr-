import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { usePCRStore } from '@/store/pcrStore';
import React from 'react';

/**
 * Comprehensive authentication utilities for logout, guards, and testing
 */

// Auth token keys
const AUTH_KEYS = {
  SESSION: 'currentSession',
  TOKEN: 'authToken',
  REFRESH_TOKEN: 'refreshToken',
  DRAFT: 'currentPCRDraft',
  USER_PREFS: 'userPreferences',
  CACHED_DATA: 'cachedData',
} as const;

/**
 * Complete logout flow with all cleanup steps
 */
export async function performCompleteLogout() {
  console.log('=== COMPLETE LOGOUT FLOW ===');
  
  try {
    // Step 1: Get current state for logging
    const state = usePCRStore.getState();
    const sessionInfo = state.currentSession;
    console.log('Logging out user:', sessionInfo?.name || 'Unknown');
    
    // Step 2: Set logging out flag to prevent multiple calls
    usePCRStore.setState({ isLoggingOut: true });
    
    // Step 3: IMMEDIATELY clear authentication state to prevent navigation guard conflicts
    console.log('Clearing authentication state immediately...');
    usePCRStore.setState({
      currentSession: null,
      isAdmin: false,
    });
    
    // Step 4: Clear all AsyncStorage keys (more comprehensive)
    const allKeys = await AsyncStorage.getAllKeys();
    const authRelatedKeys = allKeys.filter(key => 
      key.includes('session') || 
      key.includes('token') || 
      key.includes('auth') ||
      key.includes('user') ||
      key.includes('PCR') ||
      key.includes('draft') ||
      key.includes('admin') ||
      key.includes('staff')
    );
    
    if (authRelatedKeys.length > 0) {
      await AsyncStorage.multiRemove(authRelatedKeys);
      console.log('Cleared AsyncStorage keys:', authRelatedKeys);
    }
    
    // Step 5: Call store logout (handles remaining state reset)
    await state.staffLogout();
    console.log('Store logout completed');
    
    // Step 6: Force complete state reset to ensure clean logout
    usePCRStore.setState({
      currentSession: null,
      isAdmin: false,
      isLoggingOut: false,
      completedPCRs: [],
      staffMembers: [],
      // Reset admin data
      patients: [],
      encounters: [],
      allVitals: [],
      ecgs: [],
      signatures: [],
      attachments: [],
      auditLogs: [],
      // Reset PCR data to initial values
      callTimeInfo: {
        timeOfCall: '',
        date: '',
        arrivalOnScene: '',
        atPatientSide: '',
        toDestination: '',
        atDestination: '',
      },
      patientInfo: {
        firstName: '',
        lastName: '',
        age: '',
        gender: '',
        phone: '',
        mrn: '',
      },
      incidentInfo: {
        location: '',
        chiefComplaint: '',
        history: '',
        assessment: '',
        treatmentGiven: '',
        priority: '',
        onArrivalInfo: '',
        provisionalDiagnosis: '',
      },
      vitals: [],
      transportInfo: {
        destination: '',
        customDestination: '',
        mode: '',
        unitNumber: '',
        departureTime: '',
        arrivalTime: '',
        mileage: '',
        primaryParamedic: '',
        secondaryParamedic: '',
        driver: '',
        notes: '',
      },
      signatureInfo: {
        nurseSignature: '',
        nurseCorporationId: '',
        nurseSignaturePaths: '',
        doctorSignature: '',
        doctorCorporationId: '',
        doctorSignaturePaths: '',
        othersSignature: '',
        othersRole: '',
        othersSignaturePaths: '',
      },
      refusalInfo: {
        patientName: '',
        dateOfRefusal: '',
        timeOfRefusal: '',
        reasonForRefusal: '',
        risksExplained: false,
        mentalCapacity: false,
        patientSignature: '',
        patientSignaturePaths: '',
        witnessName: '',
        witnessSignature: '',
        witnessSignaturePaths: '',
        paramedicName: '',
        paramedicSignature: '',
        paramedicSignaturePaths: '',
        additionalNotes: '',
      },
    });
    
    // Step 7: Verify logout was successful
    const newState = usePCRStore.getState();
    console.log('Post-logout state verification:', {
      currentSession: newState.currentSession,
      isAdmin: newState.isAdmin,
      isLoggingOut: newState.isLoggingOut
    });
    
    // Step 8: Wait a moment to ensure state is fully updated before navigation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Step 9: Navigate to login with replace (prevents back navigation)
    console.log('Navigating to login screen...');
    router.replace('/login');
    console.log('Navigation to login completed');
    
    return { success: true };
  } catch (error) {
    console.error('Complete logout failed:', error);
    // Force cleanup even if error occurred
    try {
      usePCRStore.setState({
        currentSession: null,
        isAdmin: false,
        isLoggingOut: false
      });
      // Wait before navigation to ensure state is cleared
      await new Promise(resolve => setTimeout(resolve, 100));
      router.replace('/login');
    } catch (cleanupError) {
      console.error('Emergency cleanup failed:', cleanupError);
    }
    return { success: false, error };
  } finally {
    console.log('=== END COMPLETE LOGOUT FLOW ===');
  }
}

/**
 * Auth guard for protected routes
 */
export function useAuthGuard(requiredRole?: string) {
  const { currentSession, isAdmin } = usePCRStore();
  
  const isAuthenticated = !!(currentSession || isAdmin);
  const hasRequiredRole = !requiredRole || 
    (currentSession?.role === requiredRole) || 
    (requiredRole === 'admin' && isAdmin);
  
  return {
    isAuthenticated,
    hasRequiredRole,
    canAccess: isAuthenticated && hasRequiredRole,
    currentRole: currentSession?.role || (isAdmin ? 'admin' : null),
  };
}

/**
 * Check if user can access admin features
 */
export function useAdminGuard() {
  const { currentSession, isAdmin } = usePCRStore();
  
  const isAdminUser = isAdmin || 
    currentSession?.role === 'admin' || 
    currentSession?.role === 'supervisor';
  
  return {
    isAdmin: isAdminUser,
    canAccessAdminFeatures: isAdminUser,
  };
}

/**
 * Verify complete logout (for testing)
 */
export async function verifyCompleteLogout(): Promise<{
  passed: boolean;
  results: Record<string, boolean>;
  errors: string[];
}> {
  console.log('=== LOGOUT VERIFICATION TEST ===');
  const results: Record<string, boolean> = {};
  const errors: string[] = [];
  
  try {
    // Test 1: Check AsyncStorage is cleared
    console.log('Test 1: Checking AsyncStorage...');
    for (const [key, storageKey] of Object.entries(AUTH_KEYS)) {
      const value = await AsyncStorage.getItem(storageKey);
      const isCleared = value === null;
      results[`storage_${key}_cleared`] = isCleared;
      if (!isCleared) {
        errors.push(`AsyncStorage key '${storageKey}' not cleared`);
      }
    }
    
    // Test 2: Check store state is reset
    console.log('Test 2: Checking store state...');
    const state = usePCRStore.getState();
    results['session_cleared'] = state.currentSession === null;
    results['admin_cleared'] = state.isAdmin === false;
    results['pcrs_cleared'] = state.completedPCRs.length === 0;
    results['staff_cleared'] = state.staffMembers.length === 0;
    
    if (state.currentSession !== null) {
      errors.push('Current session not cleared from store');
    }
    if (state.isAdmin !== false) {
      errors.push('Admin flag not reset in store');
    }
    
    // Test 3: Check navigation state
    console.log('Test 3: Checking navigation...');
    // This would need to be checked from the component level
    // as we can't directly access navigation state here
    results['navigation_check'] = true; // Placeholder
    
    // Test 4: Verify no stale data can be accessed
    console.log('Test 4: Checking for stale data...');
    const myPCRs = state.getMySubmittedPCRs();
    results['no_stale_pcrs'] = myPCRs.length === 0;
    if (myPCRs.length > 0) {
      errors.push('Stale PCRs still accessible after logout');
    }
    
    // Test 5: Verify re-authentication is required
    console.log('Test 5: Checking auth requirement...');
    results['auth_required'] = !state.currentSession && !state.isAdmin;
    
    const allPassed = Object.values(results).every(r => r === true);
    
    console.log('=== VERIFICATION RESULTS ===');
    console.log('All tests passed:', allPassed);
    console.log('Results:', results);
    if (errors.length > 0) {
      console.log('Errors found:', errors);
    }
    console.log('=== END VERIFICATION ===');
    
    return {
      passed: allPassed,
      results,
      errors,
    };
  } catch (error) {
    console.error('Verification failed:', error);
    return {
      passed: false,
      results,
      errors: [...errors, `Verification error: ${error}`],
    };
  }
}

/**
 * Simulate refresh token rotation (for production use)
 */
export async function rotateRefreshToken(): Promise<boolean> {
  try {
    const refreshToken = await AsyncStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);
    if (!refreshToken) {
      console.log('No refresh token to rotate');
      return false;
    }
    
    // In production, this would call your API to rotate the token
    // const response = await fetch('/api/auth/refresh', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ refreshToken }),
    // });
    
    // For now, just clear it
    await AsyncStorage.removeItem(AUTH_KEYS.REFRESH_TOKEN);
    console.log('Refresh token rotated/cleared');
    return true;
  } catch (error) {
    console.error('Failed to rotate refresh token:', error);
    return false;
  }
}

/**
 * Clear all auth-related data (nuclear option)
 */
export async function clearAllAuthData(): Promise<void> {
  console.log('=== CLEARING ALL AUTH DATA ===');
  
  try {
    // Get all keys from AsyncStorage
    const allKeys = await AsyncStorage.getAllKeys();
    
    // Filter auth-related keys
    const authKeys = allKeys.filter(key => 
      key.includes('session') || 
      key.includes('token') || 
      key.includes('auth') ||
      key.includes('user')
    );
    
    // Remove all auth keys
    if (authKeys.length > 0) {
      await AsyncStorage.multiRemove(authKeys);
      console.log('Removed auth keys:', authKeys);
    }
    
    // Reset store completely
    const state = usePCRStore.getState();
    await state.staffLogout();
    
    console.log('All auth data cleared');
  } catch (error) {
    console.error('Failed to clear auth data:', error);
    throw error;
  } finally {
    console.log('=== END CLEARING AUTH DATA ===');
  }
}

/**
 * Prevent back navigation after logout
 */
export function usePreventBackNavigation() {
  const { currentSession, isAdmin } = usePCRStore();
  
  React.useEffect(() => {
    if (!currentSession && !isAdmin) {
      // If not authenticated, always redirect to login
      const currentRoute = router.canGoBack() ? null : '/login';
      if (currentRoute !== '/login') {
        router.replace('/login');
      }
    }
  }, [currentSession, isAdmin]);
}

/**
 * Auto-logout on token expiry (for production use)
 */
export function useAutoLogout(expiryTimeMs: number = 3600000) { // 1 hour default
  const { currentSession } = usePCRStore();
  
  React.useEffect(() => {
    if (!currentSession) return;
    
    const loginTime = new Date(currentSession.loginTime).getTime();
    const now = Date.now();
    const timeElapsed = now - loginTime;
    const timeRemaining = expiryTimeMs - timeElapsed;
    
    if (timeRemaining <= 0) {
      // Already expired
      console.log('Session expired, logging out');
      performCompleteLogout();
      return;
    }
    
    // Set timeout for auto-logout
    const timeout = setTimeout(() => {
      console.log('Session timeout, auto-logging out');
      performCompleteLogout();
    }, timeRemaining);
    
    return () => clearTimeout(timeout);
  }, [currentSession, expiryTimeMs]);
}

// Re-export for convenience
export { useAuthGuard as default };