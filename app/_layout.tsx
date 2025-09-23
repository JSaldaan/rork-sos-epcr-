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
  const [hasInitialNavigation, setHasInitialNavigation] = useState(false);
  
  useEffect(() => {
    // Only handle initial navigation once
    if (hasInitialNavigation) {
      return;
    }
    
    const timer = setTimeout(() => {
      try {
        const segmentsArray = segments as string[];
        const inAuthGroup = segmentsArray[0] === '(tabs)';
        const isAuthenticated = !!currentSession;
        const isOnLoginPage = segmentsArray[0] === 'login';
        
        console.log('Initial navigation check:', {
          segments: segmentsArray,
          isAuthenticated,
          inAuthGroup,
          isOnLoginPage
        });
        
        // Handle initial navigation
        if (!isAuthenticated && inAuthGroup) {
          console.log('Redirecting to login - not authenticated');
          router.replace('/login');
          setHasInitialNavigation(true);
        } else if (isAuthenticated && isOnLoginPage) {
          console.log('Redirecting to tabs - authenticated');
          router.replace('/(tabs)');
          setHasInitialNavigation(true);
        } else if (segmentsArray.length === 0) {
          // Root path - redirect based on auth status
          if (isAuthenticated) {
            console.log('Redirecting to tabs from root');
            router.replace('/(tabs)');
          } else {
            console.log('Redirecting to login from root');
            router.replace('/login');
          }
          setHasInitialNavigation(true);
        }
      } catch (error) {
        console.error('Navigation error:', error);
        // Fallback to login on error
        router.replace('/login');
        setHasInitialNavigation(true);
      }
    }, 1500); // Longer delay for iOS stability
    
    return () => clearTimeout(timer);
  }, [currentSession, segments, router, hasInitialNavigation]);
  
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
        
        // Hide splash screen after app is ready with longer delay for iOS
        setTimeout(async () => {
          try {
            await SplashScreen.hideAsync();
          } catch (error) {
            console.log('Splash screen hide error (safe to ignore):', error);
          }
        }, 800); // Increased delay for iOS stability
        
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
        }, 800);
      }
    };
    
    // Initialize app with a delay for iOS stability
    const timer = setTimeout(() => {
      initializeApp();
    }, 200); // Increased delay
    
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