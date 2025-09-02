import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { usePCRStore } from "@/store/pcrStore";
import AsyncStorage from '@react-native-async-storage/async-storage';


SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  },
});

function RootLayoutNav() {
  const { currentSession, isAdmin } = usePCRStore();
  const segments = useSegments();
  const router = useRouter();
  const [isAppReady, setIsAppReady] = React.useState(false);
  
  useEffect(() => {
    // Wait for app initialization to complete
    const timer = setTimeout(() => {
      setIsAppReady(true);
    }, 500); // Give more time for initialization
    
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    if (!isAppReady) {
      console.log('App not ready yet, waiting...');
      return;
    }
    
    const segmentsArray = segments as string[];
    const inAuthGroup = segmentsArray[0] === '(tabs)';
    const isAuthenticated = !!currentSession || isAdmin;
    const isOnRootPath = segmentsArray.length === 0;
    const isOnLoginPage = segmentsArray[0] === 'login';
    const isOnAdminTab = segmentsArray.length > 1 && segmentsArray[1] === 'admin';
    const isOnStaffTab = inAuthGroup && segmentsArray[1] !== 'admin';
    
    // Determine user role
    const isAdminUser = currentSession?.role === 'admin' || 
                       currentSession?.role === 'Admin' || 
                       currentSession?.role === 'SuperAdmin';
    const isStaffUser = currentSession && !isAdminUser;
    
    console.log('=== ROUTE PROTECTION ===');
    console.log('Current segments:', segments);
    console.log('In auth group (tabs):', inAuthGroup);
    console.log('Has session:', !!currentSession);
    console.log('Is admin:', isAdmin);
    console.log('Is authenticated:', isAuthenticated);
    console.log('Is admin user:', isAdminUser);
    console.log('Is staff user:', isStaffUser);
    console.log('Is on root path:', isOnRootPath);
    console.log('Is on login page:', isOnLoginPage);
    console.log('Is on admin tab:', isOnAdminTab);
    console.log('Is on staff tab:', isOnStaffTab);
    
    // Always redirect to login first on app startup
    if (isOnRootPath) {
      console.log('App starting, redirecting to login');
      router.replace('/login');
      return;
    }
    
    // If not authenticated and trying to access protected routes
    if (!isAuthenticated && inAuthGroup) {
      console.log('Not authenticated, redirecting to login');
      router.replace('/login');
      return;
    }
    
    // If authenticated but on login page, redirect based on role
    if (isAuthenticated && isOnLoginPage) {
      if (isAdminUser) {
        console.log('Admin user authenticated, redirecting to admin tab');
        router.replace('/(tabs)/admin');
      } else {
        console.log('Staff user authenticated, redirecting to staff tabs');
        router.replace('/(tabs)');
      }
      return;
    }
    
    // Role-based access control for tabs
    if (isAuthenticated && inAuthGroup) {
      // Admin users should only access admin tab
      if (isAdminUser && !isOnAdminTab) {
        console.log('Admin user trying to access staff tabs, redirecting to admin');
        router.replace('/(tabs)/admin');
        return;
      }
      
      // Staff users should not access admin tab
      if (isStaffUser && isOnAdminTab) {
        console.log('Staff user trying to access admin tab, redirecting to staff tabs');
        router.replace('/(tabs)');
        return;
      }
    }
    
    console.log('=== END ROUTE PROTECTION ===');
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
    const initializeApp = async () => {
      try {
        console.log('=== APP INITIALIZATION ===');
        
        // Initialize staff database first
        await initializeStaffDatabase();
        console.log('Staff database initialized');
        
        // Clear any existing sessions to force fresh login
        console.log('Clearing any existing sessions to force fresh login');
        await AsyncStorage.removeItem('currentSession');
        
        // Ensure store is in clean state
        usePCRStore.setState({ 
          currentSession: null,
          isAdmin: false
        });
        
        console.log('All users must login fresh on app start');
        
        // Load any existing draft
        await loadCurrentPCRDraft();
        console.log('App initialized, draft loaded if available');
        console.log('=== END APP INITIALIZATION ===');
        setHasInitialized(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        setHasInitialized(true); // Still mark as initialized to prevent infinite loading
      } finally {
        // Hide splash screen after initialization
        SplashScreen.hideAsync().catch(console.error);
      }
    };
    
    if (!hasInitialized) {
      initializeApp();
    }
  }, [loadCurrentPCRDraft, initializeStaffDatabase, loadCompletedPCRs, hasInitialized]);
  
  return <RootLayoutNav />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppInitializer />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}