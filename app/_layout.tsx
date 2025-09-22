import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { usePCRStore } from "@/store/pcrStore";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleSheet, Platform } from 'react-native';

// Prevent auto-hide splash screen
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore errors on web or if already called
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // Increased for better performance
      gcTime: 30 * 60 * 1000, // Increased cache time
      retry: 2, // Better reliability
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true, // Refetch when network reconnects
    },
    mutations: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

function RootLayoutNav() {
  const { currentSession, isAdmin } = usePCRStore();
  const segments = useSegments();
  const router = useRouter();
  const [isAppReady, setIsAppReady] = React.useState(false);
  
  useEffect(() => {
    // Simple app ready state
    const timer = setTimeout(() => {
      setIsAppReady(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    if (!isAppReady) {
      return;
    }
    
    const segmentsArray = segments as string[];
    const inAuthGroup = segmentsArray[0] === '(tabs)';
    const isAuthenticated = !!currentSession;
    const isOnRootPath = segmentsArray.length === 0;
    const isOnLoginPage = segmentsArray[0] === 'login';
    
    // Simple routing logic
    if (isOnRootPath) {
      router.replace('/login');
      return;
    }
    
    if (!isAuthenticated && inAuthGroup) {
      router.replace('/login');
      return;
    }
    
    if (isAuthenticated && isOnLoginPage) {
      router.replace('/(tabs)');
      return;
    }

  }, [currentSession, segments, router, isAppReady]);
  
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

function AppInitializer() {
  const { loadCurrentPCRDraft, initializeStaffDatabase, loadCompletedPCRs } = usePCRStore();
  const [hasInitialized, setHasInitialized] = React.useState(false);
  
  useEffect(() => {
    let isMounted = true;
    
    const initializeApp = async () => {
      try {
        console.log('Starting app initialization...');
        
        // Initialize staff database first
        await initializeStaffDatabase();
        
        // Check for existing session
        const existingSession = await AsyncStorage.getItem('currentSession');
        if (existingSession) {
          try {
            const session = JSON.parse(existingSession);
            usePCRStore.setState({ 
              currentSession: session,
              isAdmin: session.isAdmin || false
            });
            console.log('Session restored:', session.name);
          } catch (error) {
            console.log('Invalid session data, clearing...');
            await AsyncStorage.removeItem('currentSession');
            usePCRStore.setState({ 
              currentSession: null,
              isAdmin: false
            });
          }
        }
        
        // Load app data
        await Promise.all([
          loadCurrentPCRDraft().catch(() => console.log('No draft to load')),
          loadCompletedPCRs().catch(() => console.log('No PCRs to load'))
        ]);
        
        console.log('App initialization complete');
        
        if (isMounted) {
          setHasInitialized(true);
        }
      } catch (error) {
        console.error('App initialization error:', error);
        if (isMounted) {
          setHasInitialized(true); // Continue anyway
        }
      } finally {
        // Always hide splash screen
        setTimeout(() => {
          SplashScreen.hideAsync().catch(() => {
            console.log('Splash screen already hidden or failed to hide');
          });
        }, Platform.OS === 'ios' ? 500 : 100);
      }
    };
    
    if (!hasInitialized) {
      initializeApp();
    }
    
    return () => {
      isMounted = false;
    };
  }, [loadCurrentPCRDraft, initializeStaffDatabase, loadCompletedPCRs, hasInitialized]);
  
  if (!hasInitialized) {
    return null; // Keep splash screen visible
  }
  
  return <RootLayoutNav />;
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={styles.rootContainer}>
        <AppInitializer />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}