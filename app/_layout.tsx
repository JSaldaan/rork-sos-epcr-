import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, Component, ReactNode } from "react";
import { StyleSheet, View, Text, Platform, StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { usePCRStore } from "@/store/pcrStore";
import { textStyles } from '@/constants/fonts';
import { colors } from '@/constants/colors';

// Prevent auto-hide splash screen
try {
  SplashScreen.preventAutoHideAsync();
} catch {
  // Ignore errors
}

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RootLayoutNav() {
  const { currentSession } = usePCRStore();
  const segments = useSegments();
  const router = useRouter();
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  
  // Wait for navigation to be ready before handling auth logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsNavigationReady(true);
    }, 100); // Small delay to ensure navigation is mounted
    
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    if (!isNavigationReady) {
      return;
    }
    
    const segmentsArray = segments as string[];
    const inAuthGroup = segmentsArray[0] === '(tabs)';
    const isAuthenticated = !!currentSession;
    const isOnRootPath = segmentsArray.length === 0;
    const isOnLoginPage = segmentsArray[0] === 'login';
    
    console.log('Navigation check:', {
      segments: segmentsArray,
      isAuthenticated,
      isOnRootPath,
      isOnLoginPage,
      inAuthGroup
    });
    
    // Handle navigation logic with safety checks
    try {
      if (!isAuthenticated && inAuthGroup) {
        console.log('Navigating to login - not authenticated in auth group');
        router.replace('/login');
      } else if (isAuthenticated && isOnLoginPage) {
        console.log('Navigating to tabs - authenticated on login page');
        router.replace('/(tabs)');
      } else if (isOnRootPath) {
        console.log('Navigating to login from root');
        router.replace('/login');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback: try again after a delay
      setTimeout(() => {
        try {
          if (!isAuthenticated && inAuthGroup) {
            router.replace('/login');
          } else if (isAuthenticated && isOnLoginPage) {
            router.replace('/(tabs)');
          } else if (isOnRootPath) {
            router.replace('/login');
          }
        } catch (retryError) {
          console.error('Navigation retry failed:', retryError);
        }
      }, 200);
    }
  }, [currentSession, segments, router, isNavigationReady]);
  
  return (
    <Stack 
      screenOptions={{ 
        headerBackTitle: "Back",
        headerStyle: {
          backgroundColor: colors.brand.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen 
        name="login" 
        options={{ 
          headerShown: false,
          gestureEnabled: false,
        }} 
      />
      <Stack.Screen 
        name="(tabs)" 
        options={{ 
          headerShown: false,
          gestureEnabled: false,
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  const { initializeStaffDatabase, loadCompletedPCRs, loadCurrentPCRDraft } = usePCRStore();
  const [isAppReady, setIsAppReady] = useState(false);
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing app...');
        
        // Initialize in sequence for better iOS compatibility
        await initializeStaffDatabase();
        await loadCompletedPCRs();
        await loadCurrentPCRDraft();
        
        console.log('App initialization complete');
        
        // Mark app as ready after initialization
        setIsAppReady(true);
        
        // Hide splash screen after app is ready
        setTimeout(async () => {
          try {
            await SplashScreen.hideAsync();
          } catch (error) {
            console.log('Splash screen hide error (safe to ignore):', error);
          }
        }, 300);
        
      } catch (error) {
        console.error('App initialization error:', error);
        // Still mark as ready to allow app to function
        setIsAppReady(true);
        
        // Hide splash screen even on error
        setTimeout(async () => {
          try {
            await SplashScreen.hideAsync();
          } catch (error) {
            console.log('Splash screen hide error (safe to ignore):', error);
          }
        }, 300);
      }
    };
    
    // Initialize app with a small delay for iOS stability
    const timer = setTimeout(() => {
      initializeApp();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [initializeStaffDatabase, loadCompletedPCRs, loadCurrentPCRDraft]);
  
  // Always render the navigation structure, but show loading state if not ready
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
              <Text style={styles.loadingText}>Loading...</Text>
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
  },
  loadingText: {
    ...textStyles.title3,
    color: colors.text.primary,
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
  },
});