import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { usePCRStore } from "@/store/pcrStore";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleSheet, Platform, View, Text } from 'react-native';
import { Shield } from 'lucide-react-native';

// Prevent auto-hide splash screen
SplashScreen.preventAutoHideAsync().catch((error) => {
  console.log('SplashScreen.preventAutoHideAsync error:', error);
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
  const [showFallback, setShowFallback] = React.useState(false);
  
  useEffect(() => {
    let isMounted = true;
    let initTimeout: ReturnType<typeof setTimeout>;
    
    const initializeApp = async () => {
      try {
        console.log('Starting app initialization...');
        
        // Set a maximum initialization time for iOS
        initTimeout = setTimeout(() => {
          console.log('Initialization timeout reached, continuing anyway...');
          if (isMounted) {
            setHasInitialized(true);
          }
        }, Platform.OS === 'ios' ? 3000 : 5000);
        
        // Initialize staff database first with timeout
        await Promise.race([
          initializeStaffDatabase(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Staff DB init timeout')), 2000)
          )
        ]).catch((error) => {
          console.log('Staff database initialization failed:', error.message);
        });
        
        // Check for existing session with timeout
        try {
          const existingSession = await Promise.race([
            AsyncStorage.getItem('currentSession'),
            new Promise<null>((_, reject) => 
              setTimeout(() => reject(new Error('Session load timeout')), 1000)
            )
          ]);
          
          if (existingSession) {
            try {
              const session = JSON.parse(existingSession);
              usePCRStore.setState({ 
                currentSession: session,
                isAdmin: session.isAdmin || false
              });
              console.log('Session restored:', session.name);
            } catch (parseError) {
              console.log('Invalid session data, clearing...');
              await AsyncStorage.removeItem('currentSession').catch(() => {});
              usePCRStore.setState({ 
                currentSession: null,
                isAdmin: false
              });
            }
          }
        } catch (sessionError) {
          console.log('Session loading failed:', sessionError);
        }
        
        // Load app data with timeout
        await Promise.race([
          Promise.all([
            loadCurrentPCRDraft().catch(() => console.log('No draft to load')),
            loadCompletedPCRs().catch(() => console.log('No PCRs to load'))
          ]),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Data load timeout')), 2000)
          )
        ]).catch((error) => {
          console.log('Data loading failed:', error.message);
        });
        
        console.log('App initialization complete');
        
        // Clear the timeout since we completed successfully
        if (initTimeout) {
          clearTimeout(initTimeout);
        }
        
        if (isMounted) {
          setHasInitialized(true);
        }
      } catch (error) {
        console.error('App initialization error:', error);
        if (isMounted) {
          setHasInitialized(true); // Continue anyway
        }
      } finally {
        // Always hide splash screen with a reasonable delay
        const hideDelay = Platform.OS === 'ios' ? 1000 : 500;
        setTimeout(() => {
          SplashScreen.hideAsync().catch((hideError) => {
            console.log('Splash screen hide error:', hideError);
          });
        }, hideDelay);
      }
    };
    
    if (!hasInitialized) {
      initializeApp();
    }
    
    return () => {
      isMounted = false;
      if (initTimeout) {
        clearTimeout(initTimeout);
      }
    };
  }, [loadCurrentPCRDraft, initializeStaffDatabase, loadCompletedPCRs, hasInitialized]);
  
  // Fallback timer for iOS
  React.useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (Platform.OS === 'ios' && !hasInitialized) {
        console.log('Showing iOS fallback loading state');
        setShowFallback(true);
      }
    }, 5000); // Show fallback after 5 seconds on iOS
    
    return () => clearTimeout(fallbackTimer);
  }, [hasInitialized]);
  
  if (!hasInitialized) {
    if (showFallback && Platform.OS === 'ios') {
      return (
        <View style={styles.fallbackContainer}>
          <Shield size={48} color="#0066CC" />
          <Text style={styles.fallbackTitle}>MediCare Pro</Text>
          <Text style={styles.fallbackSubtitle}>Loading...</Text>
        </View>
      );
    }
    
    return null; // Keep splash screen visible
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