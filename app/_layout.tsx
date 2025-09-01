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
  
  useEffect(() => {
    // Wait for store initialization before handling navigation
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    if (!isInitialized) return;
    
    const inAuthGroup = segments[0] === '(tabs)';
    const isAuthenticated = currentSession || isAdmin;
    const isOnRootPath = (segments as string[]).length === 0;
    
    console.log('=== ROUTE PROTECTION ===');
    console.log('Current segments:', segments);
    console.log('In auth group (tabs):', inAuthGroup);
    console.log('Has session:', !!currentSession);
    console.log('Is admin:', isAdmin);
    console.log('Is authenticated:', isAuthenticated);
    console.log('Is on root path:', isOnRootPath);
    
    // Always redirect to login if not authenticated and trying to access protected routes
    if (!isAuthenticated && inAuthGroup) {
      console.log('Redirecting to login - no authentication');
      router.replace('/login');
    }
    // If user is on root path, always go to login (app startup)
    else if (isOnRootPath) {
      console.log('App starting, redirecting to login');
      router.replace('/login');
    }
    // Don't auto-redirect authenticated users to tabs - let them stay on login
    // They can navigate to tabs manually after login
    console.log('=== END ROUTE PROTECTION ===');
  }, [currentSession, isAdmin, segments, router, isInitialized]);
  
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

function AppInitializer() {
  const { loadCurrentPCRDraft, initializeStaffDatabase, loadCompletedPCRs } = usePCRStore();
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('=== APP INITIALIZATION ===');
        
        // Initialize staff database first
        await initializeStaffDatabase();
        console.log('Staff database initialized');
        
        // Always load completed PCRs to ensure they're available
        console.log('Loading completed PCRs on app start...');
        await loadCompletedPCRs();
        console.log('Completed PCRs loaded');
        
        // Check for existing session
        const storedSession = await AsyncStorage.getItem('currentSession');
        if (storedSession) {
          const session = JSON.parse(storedSession);
          usePCRStore.setState({ 
            currentSession: session,
            isAdmin: session.isAdmin
          });
          console.log('Restored session for:', session.name);
          
          // Reload PCRs after session is restored to ensure proper filtering
          console.log('Reloading PCRs after session restore...');
          await loadCompletedPCRs();
        }
        
        // Load any existing draft
        await loadCurrentPCRDraft();
        console.log('App initialized, draft loaded if available');
        console.log('=== END APP INITIALIZATION ===');
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        // Hide splash screen after initialization
        SplashScreen.hideAsync().catch(console.error);
      }
    };
    
    initializeApp();
  }, [loadCurrentPCRDraft, initializeStaffDatabase, loadCompletedPCRs]);
  
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