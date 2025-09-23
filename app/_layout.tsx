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


// Prevent auto-hide splash screen
try {
  SplashScreen.preventAutoHideAsync();
} catch (error) {
  console.log('SplashScreen preventAutoHideAsync error (safe to ignore):', error);
}

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
    if (error && errorInfo) {
      console.error('App Error Boundary caught an error:', error.message || error, errorInfo.componentStack || errorInfo);
    }
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

// Create a fresh query client with aggressive cache clearing
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // Reduced stale time
      retry: 1,
      refetchOnWindowFocus: false,
      gcTime: 5 * 60 * 1000, // Garbage collect after 5 minutes
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
        console.error('❌ Navigation error:', error);
        // Clear cache and try again
        clearAppCache(queryClient).then(() => {
          router.replace('/login');
          setHasInitialNavigation(true);
        });
      }
    }, 800); // Increased delay for stability
    
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
        }, 1000); // Longer delay for stability
        
      } catch (error) {
        console.error('❌ App initialization error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
        setInitializationError(errorMessage);
        
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
        }, 1000);
      }
    };
    
    // Initialize app with proper delay
    const timer = setTimeout(() => {
      initializeApp();
    }, 300); // Increased delay for mounting
    
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