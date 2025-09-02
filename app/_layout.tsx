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
  const [lastAuthState, setLastAuthState] = React.useState<boolean | null>(null);
  
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
    const isAuthenticated = !!(currentSession || isAdmin);
    const isOnRootPath = (segments as string[]).length === 0;
    const isOnLoginPage = segments[0] === 'login';
    
    console.log('=== ROUTE PROTECTION ===');
    console.log('Current segments:', segments);
    console.log('In auth group (tabs):', inAuthGroup);
    console.log('Has session:', !!currentSession);
    console.log('Is admin:', isAdmin);
    console.log('Is authenticated:', isAuthenticated);
    console.log('Is on root path:', isOnRootPath);
    console.log('Is on login page:', isOnLoginPage);
    console.log('Last auth state:', lastAuthState);
    
    // Track auth state changes to detect logout
    if (lastAuthState === true && isAuthenticated === false) {
      // User just logged out - force to login immediately
      console.log('Auth state changed: User logged out, forcing to login');
      // Use setTimeout to ensure state updates are complete
      setTimeout(() => {
        router.replace('/login');
      }, 0);
      setLastAuthState(false);
      return;
    }
    
    // Update last auth state
    if (lastAuthState !== isAuthenticated) {
      setLastAuthState(isAuthenticated);
    }
    
    // Always redirect to login if not authenticated and trying to access protected routes
    if (!isAuthenticated && inAuthGroup) {
      console.log('Redirecting to login - no authentication');
      setTimeout(() => {
        router.replace('/login');
      }, 0);
    }
    // If user is on root path, always go to login (app startup)
    else if (isOnRootPath) {
      console.log('App starting, redirecting to login');
      setTimeout(() => {
        router.replace('/login');
      }, 0);
    }
    // Prevent authenticated users from going back to protected routes after logout
    else if (!isAuthenticated && !isOnLoginPage && !isOnRootPath) {
      console.log('Not authenticated and not on login - redirecting');
      setTimeout(() => {
        router.replace('/login');
      }, 0);
    }
    console.log('=== END ROUTE PROTECTION ===');
  }, [currentSession, isAdmin, segments, router, isInitialized, lastAuthState]);
  
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

function AppInitializer() {
  const { loadCurrentPCRDraft, initializeStaffDatabase, loadCompletedPCRs, isLoggingOut } = usePCRStore();
  const [hasInitialized, setHasInitialized] = React.useState(false);
  
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
        
        // Only restore session on first app load, not after logout
        if (!hasInitialized && !isLoggingOut) {
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
        }
        
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
  }, [loadCurrentPCRDraft, initializeStaffDatabase, loadCompletedPCRs, hasInitialized, isLoggingOut]);
  
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