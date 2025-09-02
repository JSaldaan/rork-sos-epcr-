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
    
    console.log('=== ROUTE PROTECTION ===');
    console.log('Current segments:', segments);
    console.log('In auth group (tabs):', inAuthGroup);
    console.log('Has session:', !!currentSession);
    console.log('Is admin:', isAdmin);
    console.log('Is authenticated:', isAuthenticated);
    console.log('Is on root path:', isOnRootPath);
    console.log('Is on login page:', isOnLoginPage);
    console.log('Is on admin tab:', isOnAdminTab);
    
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
    
    // Check admin access for admin tab
    if (isOnAdminTab && isAuthenticated && !isAdmin && !currentSession?.isAdmin) {
      console.log('Non-admin trying to access admin tab, redirecting');
      router.replace('/(tabs)');
      return;
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
        
        // Check for existing session AFTER staff database is ready
        const existingSession = await AsyncStorage.getItem('currentSession');
        if (existingSession) {
          try {
            const session = JSON.parse(existingSession);
            console.log('Found existing session:', session.name, session.corporationId);
            
            // Validate the session against current staff database
            const staffMember = usePCRStore.getState().staffMembers.find(
              member => member.corporationId === session.corporationId && member.isActive
            );
            
            if (staffMember) {
              // Restore valid session
              usePCRStore.setState({ 
                currentSession: session,
                isAdmin: session.isAdmin || staffMember.role === 'Admin' || staffMember.role === 'SuperAdmin'
              });
              console.log('Session restored successfully');
              
              // Load completed PCRs for authenticated user
              await loadCompletedPCRs();
              console.log('Completed PCRs loaded for authenticated user');
            } else {
              console.log('Session invalid - staff member not found or inactive, clearing session');
              await AsyncStorage.removeItem('currentSession');
            }
          } catch (error) {
            console.error('Error parsing existing session:', error);
            await AsyncStorage.removeItem('currentSession');
          }
        } else {
          console.log('No existing session found, user needs to login');
        }
        
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