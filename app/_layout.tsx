import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { usePCRStore } from "@/store/pcrStore";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleSheet, Platform, View, Text } from 'react-native';
import { Shield } from 'lucide-react-native';

// Prevent auto-hide splash screen with better error handling
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync().catch(() => {
    // Silently ignore - splash screen might already be prevented
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Reduced for iOS stability
      gcTime: 10 * 60 * 1000, // Reduced cache time
      retry: 1, // Reduced retries for iOS
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false, // Disabled for iOS stability
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
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
        console.log('Starting simplified app initialization...');
        
        // Simplified initialization for iOS stability
        if (Platform.OS === 'ios') {
          // iOS: Quick initialization with minimal async operations
          try {
            const existingSession = await AsyncStorage.getItem('currentSession');
            if (existingSession) {
              const session = JSON.parse(existingSession);
              usePCRStore.setState({ 
                currentSession: session,
                isAdmin: session.isAdmin || false
              });
            }
          } catch (error) {
            console.log('Session restore failed, continuing...');
          }
          
          // Initialize staff database in background
          initializeStaffDatabase().catch(() => console.log('Staff DB init deferred'));
          
        } else {
          // Non-iOS: Full initialization
          await initializeStaffDatabase().catch(() => console.log('Staff DB init failed'));
          
          const existingSession = await AsyncStorage.getItem('currentSession').catch(() => null);
          if (existingSession) {
            try {
              const session = JSON.parse(existingSession);
              usePCRStore.setState({ 
                currentSession: session,
                isAdmin: session.isAdmin || false
              });
            } catch (error) {
              await AsyncStorage.removeItem('currentSession').catch(() => {});
            }
          }
          
          await Promise.all([
            loadCurrentPCRDraft().catch(() => {}),
            loadCompletedPCRs().catch(() => {})
          ]);
        }
        
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
        // Hide splash screen
        setTimeout(() => {
          if (Platform.OS !== 'web') {
            SplashScreen.hideAsync().catch(() => {});
          }
        }, Platform.OS === 'ios' ? 500 : 100);
      }
    };
    
    initializeApp();
    
    return () => {
      isMounted = false;
    };
  }, []);
  
  if (!hasInitialized) {
    return (
      <View style={styles.fallbackContainer}>
        <Shield size={48} color="#0066CC" />
        <Text style={styles.fallbackTitle}>MediCare Pro</Text>
        <Text style={styles.fallbackSubtitle}>Loading...</Text>
      </View>
    );
  }
  
  return <RootLayoutNav />;
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  fallbackTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#0066CC',
  },
  fallbackSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
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