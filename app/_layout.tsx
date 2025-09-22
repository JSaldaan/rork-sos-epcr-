import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { usePCRStore } from "@/store/pcrStore";
// Note: AsyncStorage usage should be replaced with provider pattern in production
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SecurityManager } from '@/utils/security';
import { initializeCleanSecurity } from '@/utils/clearSecurityLocks';
import { StyleSheet } from 'react-native';

SplashScreen.preventAutoHideAsync();

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
    // Faster app initialization
    const timer = setTimeout(() => {
      setIsAppReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    if (!isAppReady) {
      return;
    }
    
    const segmentsArray = segments as string[];
    const inAuthGroup = segmentsArray[0] === '(tabs)';
    const isAuthenticated = !!currentSession || isAdmin;
    const isOnRootPath = segmentsArray.length === 0;
    const isOnLoginPage = segmentsArray[0] === 'login';
    const isOnAdminTab = segmentsArray.length > 1 && segmentsArray[1] === 'admin';

    
    // Determine user role
    const isAdminUser = currentSession?.role === 'admin' || 
                       currentSession?.role === 'Admin' || 
                       currentSession?.role === 'SuperAdmin';
    const isStaffUser = currentSession && !isAdminUser;
    

    
    // Always redirect to login first on app startup
    if (isOnRootPath) {
      router.replace('/login');
      return;
    }
    
    // If not authenticated and trying to access protected routes
    if (!isAuthenticated && inAuthGroup) {
      router.replace('/login');
      return;
    }
    
    // If authenticated but on login page, redirect based on role
    if (isAuthenticated && isOnLoginPage) {
      if (isAdminUser) {
        router.replace('/(tabs)/admin');
      } else {
        router.replace('/(tabs)');
      }
      return;
    }
    
    // Role-based access control for tabs
    if (isAuthenticated && inAuthGroup) {
      // Admin users should only access admin tab
      if (isAdminUser && !isOnAdminTab) {
        router.replace('/(tabs)/admin');
        return;
      }
      
      // Staff users should not access admin tab
      if (isStaffUser && isOnAdminTab) {
        router.replace('/(tabs)');
        return;
      }
    }
    

  }, [currentSession, isAdmin, segments, router, isAppReady]);
  
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
    let splashTimeout: ReturnType<typeof setTimeout> | null = null;
    
    const initializeApp = async () => {
      try {

        
        // Initialize security and database
        await initializeCleanSecurity();
        await initializeStaffDatabase();
        
        // Initialize security system
        await SecurityManager.initialize();
        
        // Check for existing session instead of always clearing
        const existingSession = await AsyncStorage.getItem('currentSession');
        if (existingSession) {
          try {
            const session = JSON.parse(existingSession);
            usePCRStore.setState({ 
              currentSession: session,
              isAdmin: session.isAdmin || false
            });

          } catch {
            await AsyncStorage.removeItem('currentSession');
            usePCRStore.setState({ 
              currentSession: null,
              isAdmin: false
            });
          }
        } else {
          usePCRStore.setState({ 
            currentSession: null,
            isAdmin: false
          });
        }
        
        // Load draft and completed PCRs in parallel
        await Promise.all([
          loadCurrentPCRDraft(),
          loadCompletedPCRs()
        ]);
        

        if (isMounted) {
          setHasInitialized(true);
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('App initialization error:', error);
        }
        if (isMounted) {
          setHasInitialized(true);
        }
      } finally {
        // Hide splash screen after initialization
        splashTimeout = setTimeout(() => {
          SplashScreen.hideAsync().catch(() => {});
        }, 100);
      }
    };
    
    if (!hasInitialized) {
      initializeApp();
    }
    
    return () => {
      isMounted = false;
      if (splashTimeout) {
        clearTimeout(splashTimeout);
      }
    };
  }, [loadCurrentPCRDraft, initializeStaffDatabase, loadCompletedPCRs, hasInitialized]);
  
  return <RootLayoutNav />;
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
});

export default function RootLayout() {
  // Cleanup security system on app unmount
  React.useEffect(() => {
    return () => {
      SecurityManager.shutdown();
    };
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={styles.rootContainer}>
        <AppInitializer />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}