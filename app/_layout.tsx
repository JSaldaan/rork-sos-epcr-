import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments, useNavigationContainerRef } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, Component, ReactNode } from "react";
import { StyleSheet, View, Text } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { usePCRStore } from "@/store/pcrStore";
import { textStyles } from '@/constants/fonts';

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
    console.error('App Error Boundary caught an error:', error, errorInfo);
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
  const navigationRef = useNavigationContainerRef();
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  
  // Wait for navigation container to be ready
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    
    const checkNavigationReady = () => {
      if (navigationRef?.isReady?.()) {
        setIsNavigationReady(true);
      } else {
        // Retry after a short delay
        timeoutId = setTimeout(checkNavigationReady, 50);
      }
    };
    
    checkNavigationReady();
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [navigationRef]);
  
  useEffect(() => {
    if (!isNavigationReady || !navigationRef?.isReady?.()) {
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
      inAuthGroup,
      navigationReady: navigationRef.isReady()
    });
    
    // Handle navigation logic with safety checks
    try {
      if (isOnRootPath) {
        console.log('Navigating to login from root');
        router.replace('/login');
      } else if (!isAuthenticated && inAuthGroup) {
        console.log('Navigating to login - not authenticated in auth group');
        router.replace('/login');
      } else if (isAuthenticated && isOnLoginPage) {
        console.log('Navigating to tabs - authenticated on login page');
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback: try again after a delay
      setTimeout(() => {
        try {
          if (isOnRootPath || (!isAuthenticated && inAuthGroup)) {
            router.replace('/login');
          } else if (isAuthenticated && isOnLoginPage) {
            router.replace('/(tabs)');
          }
        } catch (retryError) {
          console.error('Navigation retry failed:', retryError);
        }
      }, 100);
    }
  }, [currentSession, segments, router, isNavigationReady, navigationRef]);
  
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
        setIsAppReady(true);
      } catch (error) {
        console.error('App initialization error:', error);
        // Still mark as ready to allow app to function
        setIsAppReady(true);
      } finally {
        try {
          // Hide splash screen after a short delay to ensure UI is ready
          setTimeout(async () => {
            try {
              await SplashScreen.hideAsync();
            } catch (error) {
              console.log('Splash screen hide error (safe to ignore):', error);
            }
          }, 500);
        } catch (error) {
          console.log('Splash screen timer error (safe to ignore):', error);
        }
      }
    };
    
    // Initialize app with a small delay for iOS stability
    const timer = setTimeout(() => {
      initializeApp();
    }, 200);
    
    return () => clearTimeout(timer);
  }, [initializeStaffDatabase, loadCompletedPCRs, loadCurrentPCRDraft]);
  
  // Don't render navigation until app is ready
  if (!isAppReady) {
    return null; // Splash screen will be visible
  }
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={styles.container}>
          <RootLayoutNav />
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorTitle: {
    ...textStyles.title1,
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    ...textStyles.body,
    color: '#666',
    textAlign: 'center',
  },
});