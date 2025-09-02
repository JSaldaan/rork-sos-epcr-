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
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [hasNavigatedToLogin, setHasNavigatedToLogin] = React.useState(false);
  
  useEffect(() => {
    // Wait for store initialization before handling navigation
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    if (!isInitialized) return;
    
    const segmentsArray = segments as string[];
    const inAuthGroup = segmentsArray[0] === '(tabs)';
    const isAuthenticated = !!currentSession;
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
    
    // On app startup (root path), check authentication
    if (isOnRootPath && !hasNavigatedToLogin) {
      setHasNavigatedToLogin(true);
      if (isAuthenticated) {
        console.log('App starting with existing session, redirecting to tabs');
        router.replace('/(tabs)');
      } else {
        console.log('App starting without session, redirecting to login');
        router.replace('/login');
      }
      return;
    }
    
    // If not authenticated and trying to access protected routes
    if (!isAuthenticated && (inAuthGroup || (!isOnLoginPage && !isOnRootPath))) {
      console.log('Not authenticated, redirecting to login');
      router.replace('/login');
      return;
    }
    
    // Check admin access for admin tab
    if (isOnAdminTab && isAuthenticated && !isAdmin) {
      console.log('Non-admin trying to access admin tab, redirecting');
      router.replace('/(tabs)');
      return;
    }
    
    console.log('=== END ROUTE PROTECTION ===');
  }, [currentSession, isAdmin, segments, router, isInitialized, hasNavigatedToLogin]);
  
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
        
        // Check for existing session
        const existingSession = await AsyncStorage.getItem('currentSession');
        if (existingSession) {
          console.log('Found existing session, will restore it');
          const session = JSON.parse(existingSession);
          // Restore session in store
          const { currentSession: storeSession } = usePCRStore.getState();
          if (!storeSession) {
            usePCRStore.setState({ 
              currentSession: session,
              isAdmin: session.isAdmin
            });
          }
        } else {
          console.log('No existing session found, user needs to login');
        }
        
        // Initialize staff database first
        await initializeStaffDatabase();
        console.log('Staff database initialized');
        
        // Load completed PCRs
        console.log('Loading completed PCRs on app start...');
        await loadCompletedPCRs();
        console.log('Completed PCRs loaded');
        
        // Load any existing draft
        await loadCurrentPCRDraft();
        console.log('App initialized, draft loaded if available');
        console.log('=== END APP INITIALIZATION ===');
        setHasInitialized(true);
      } catch (error) {
        console.error('Error initializing app:', error);
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