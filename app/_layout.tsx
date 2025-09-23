import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, Component, ReactNode, useRef } from "react";
import { StyleSheet, View, Text, Platform, StatusBar, AppState } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { usePCRStore } from "@/store/pcrStore";
import { textStyles } from '@/constants/fonts';
import { colors } from '@/constants/colors';
import { clearAllCaches } from '@/utils/cacheManager';
import { errorHandler, safeAsyncCall } from '@/utils/errorHandler';
import { systemStatusChecker, logSystemStatus } from '@/utils/systemStatusChecker';


// Prevent auto-hide splash screen with comprehensive error handling
safeAsyncCall(
  () => SplashScreen.preventAutoHideAsync(),
  undefined,
  'SplashScreen-PreventAutoHide'
).catch(() => {
  // Fail silently - splash screen errors are not critical
});

// Clear cache using comprehensive cache manager
const clearAppCache = async (queryClient?: any) => {
  try {
    console.log('🧹 Starting comprehensive cache clear...');
    const result = await clearAllCaches(queryClient, {
      preserveUserSession: true,
      preserveStaffDatabase: true,
      preserveAppSettings: true,
      clearQueryCache: true,
      clearImageCache: true,
    });
    
    if (result.success) {
      console.log('✅ Comprehensive cache clear completed');
    } else {
      console.warn('⚠️ Some cache operations failed:', result.results);
    }
    
    return result.success;
  } catch (error) {
    console.error('❌ Cache clear failed:', error);
    return false;
  }
};

// Force restart app state
const forceAppRestart = () => {
  if (Platform.OS === 'web') {
    window.location.reload();
  } else {
    // For native, we'll reset the navigation state
    console.log('🔄 Forcing app restart...');
  }
};

// Error Boundary for iOS stability
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Use centralized error handler
    const handler = errorHandler.createErrorBoundaryHandler('RootErrorBoundary');
    handler(error, errorInfo);
    
    // Log system status for debugging
    logSystemStatus().catch(() => {});
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>Please restart the app</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

// Create a fresh query client with optimized settings
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500) return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

let queryClient = createQueryClient();

// Function to reset query client
const resetQueryClient = () => {
  queryClient.clear();
  queryClient.cancelQueries();
  queryClient = createQueryClient();
  console.log('🔄 Query client reset completed');
};

function RootLayoutNav() {
  const { currentSession } = usePCRStore();
  const segments = useSegments();
  const router = useRouter();
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const [hasInitialNavigation, setHasInitialNavigation] = useState(false);
  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Wait for navigation to be ready
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsNavigationReady(true);
      console.log('📱 Navigation system ready');
    }, 100); // Minimal delay to ensure mounting
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle navigation logic only after navigation is ready
  useEffect(() => {
    if (!isNavigationReady || hasInitialNavigation) {
      return;
    }
    
    // Clear any existing timeout
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }
    
    navigationTimeoutRef.current = setTimeout(() => {
      try {
        const segmentsArray = segments as string[];
        const inAuthGroup = segmentsArray[0] === '(tabs)';
        const isAuthenticated = !!currentSession;
        const isOnLoginPage = segmentsArray[0] === 'login';
        
        console.log('🧭 Navigation check:', {
          segments: segmentsArray,
          isAuthenticated,
          inAuthGroup,
          isOnLoginPage,
          ready: isNavigationReady
        });
        
        // Handle initial navigation with proper checks
        if (!isAuthenticated && inAuthGroup) {
          console.log('🔐 Redirecting to login - not authenticated');
          router.replace('/login');
          setHasInitialNavigation(true);
        } else if (isAuthenticated && isOnLoginPage) {
          console.log('✅ Redirecting to tabs - authenticated');
          router.replace('/(tabs)');
          setHasInitialNavigation(true);
        } else if (segmentsArray.length === 0) {
          // Root path - redirect based on auth status
          if (isAuthenticated) {
            console.log('🏠 Redirecting to tabs from root');
            router.replace('/(tabs)');
          } else {
            console.log('🔑 Redirecting to login from root');
            router.replace('/login');
          }
          setHasInitialNavigation(true);
        } else {
          // Already on correct route
          setHasInitialNavigation(true);
        }
      } catch (error) {
        // Use centralized error handling
        errorHandler.logError(error as Error, 'Navigation');
        
        // Attempt recovery
        safeAsyncCall(
          () => clearAppCache(queryClient),
          undefined,
          'NavigationRecovery'
        ).then(() => {
          router.replace('/login');
          setHasInitialNavigation(true);
        }).catch(() => {
          // Final fallback
          setHasInitialNavigation(true);
        });
      }
    }, 500); // Optimized delay for stability
    
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, [currentSession, segments, router, isNavigationReady, hasInitialNavigation]);
  
  // Always render the Stack to ensure proper mounting
  return (
    <Stack 
      screenOptions={{ 
        headerBackTitle: "Back",
        headerStyle: {
          backgroundColor: colors.brand.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          ...textStyles.navigationTitle,
          color: '#FFFFFF',
        },
        animation: Platform.OS === 'ios' ? 'slide_from_right' : 'default',
      }}
    >
      <Stack.Screen 
        name="login" 
        options={{ 
          headerShown: false,
          gestureEnabled: false,
          animation: 'none',
        }} 
      />
      <Stack.Screen 
        name="(tabs)" 
        options={{ 
          headerShown: false,
          gestureEnabled: false,
          animation: 'none',
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  const { initializeStaffDatabase, loadCompletedPCRs, loadCurrentPCRDraft } = usePCRStore();
  const [isAppReady, setIsAppReady] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const appStateRef = useRef(AppState.currentState);
  
  // Handle app state changes for cache management
  useEffect(() => {
    const handleAppStateChange = (nextAppState: any) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('📱 App has come to the foreground - checking cache');
        // Optionally refresh critical data here
      }
      appStateRef.current = nextAppState as any;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Starting app initialization...');
        setInitializationError(null);
        
        // Log initial system status
        await logSystemStatus();
        
        // Clear old cache first
        await clearAppCache(queryClient);
        
        // Reset query client
        resetQueryClient();
        
        // Initialize in sequence for better stability
        console.log('📊 Initializing staff database...');
        await initializeStaffDatabase();
        
        console.log('📋 Loading completed PCRs...');
        await loadCompletedPCRs();
        
        console.log('📝 Loading current PCR draft...');
        await loadCurrentPCRDraft();
        
        console.log('✅ App initialization complete');
        
        // Final system health check
        const healthCheck = await systemStatusChecker.checkSystemHealth();
        if (healthCheck.status === 'critical') {
          console.warn('⚠️ System health check shows critical issues:', healthCheck.issues);
        }
        
        // Mark app as ready after initialization
        setIsAppReady(true);
        
        // Hide splash screen after app is ready
        setTimeout(async () => {
          try {
            await SplashScreen.hideAsync();
            console.log('🎬 Splash screen hidden');
          } catch (error) {
            console.log('Splash screen hide error (safe to ignore):', error);
          }
        }, 500); // Optimized delay
        
      } catch (error) {
        // Use centralized error handling
        errorHandler.logError(error as Error, 'AppInitialization');
        const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
        setInitializationError(errorMessage);
        
        // Generate emergency system report
        const report = await systemStatusChecker.generateSystemReport();
        console.error('🚨 Emergency System Report:', report);
        
        // Attempt emergency cache clear
        clearAppCache(queryClient).then(() => {
          console.log('🔄 Emergency cache clear completed');
        }).catch((cacheError) => {
          console.error('❌ Emergency cache clear failed:', cacheError);
        });
        
        // Still mark as ready to allow app to function
        setIsAppReady(true);
        
        // Hide splash screen even on error
        setTimeout(async () => {
          try {
            await SplashScreen.hideAsync();
          } catch (error) {
            console.log('Splash screen hide error (safe to ignore):', error);
          }
        }, 500);
      }
    };
    
    // Initialize app with proper delay
    const timer = setTimeout(() => {
      initializeApp();
    }, 100); // Optimized delay for mounting
    
    return () => clearTimeout(timer);
  }, [initializeStaffDatabase, loadCompletedPCRs, loadCurrentPCRDraft]);
  
  // Show error state if initialization failed
  if (initializationError) {
    return (
      <ErrorBoundary>
        <GestureHandlerRootView style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Initialization Error</Text>
            <Text style={styles.errorText}>{initializationError}</Text>
            <Text style={styles.errorSubtext}>Please restart the app</Text>
          </View>
        </GestureHandlerRootView>
      </ErrorBoundary>
    );
  }
  
  // Always render the navigation structure to ensure proper mounting
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={styles.container}>
          <StatusBar 
            barStyle={Platform.OS === 'ios' ? 'light-content' : 'default'}
            backgroundColor={Platform.OS === 'android' ? colors.brand.primary : undefined}
          />
          {isAppReady ? (
            <RootLayoutNav />
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Initializing SOS ePCR...</Text>
              <Text style={styles.loadingSubtext}>Please wait</Text>
            </View>
          )}
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: 20,
  },
  loadingText: {
    ...textStyles.title3,
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtext: {
    ...textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    padding: 20,
  },
  errorTitle: {
    ...textStyles.title1,
    color: colors.text.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    ...textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    ...textStyles.caption1,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});