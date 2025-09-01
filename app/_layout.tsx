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
    
    console.log('=== ROUTE PROTECTION ===');
    console.log('Current segments:', segments);
    console.log('In auth group (tabs):', inAuthGroup);
    console.log('Has session:', !!currentSession);
    console.log('Is admin:', isAdmin);
    console.log('Is authenticated:', isAuthenticated);
    
    if (!isAuthenticated && inAuthGroup) {
      // User is not authenticated but trying to access protected routes
      console.log('Redirecting to login - no authentication');
      router.replace('/login');
    } else if (isAuthenticated && !inAuthGroup && segments[0] !== 'login') {
      // User is authenticated but not in protected routes (and not on login)
      console.log('Redirecting to tabs - user authenticated');
      router.replace('/(tabs)');
    }
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
  const { loadCurrentPCRDraft, initializeStaffDatabase } = usePCRStore();
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize staff database first
        await initializeStaffDatabase();
        
        // Check for existing session
        const storedSession = await AsyncStorage.getItem('currentSession');
        if (storedSession) {
          const session = JSON.parse(storedSession);
          usePCRStore.setState({ 
            currentSession: session,
            isAdmin: session.isAdmin
          });
          console.log('Restored session for:', session.name);
        }
        
        // Load any existing draft
        await loadCurrentPCRDraft();
        console.log('App initialized, draft loaded if available');
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        // Hide splash screen after initialization
        SplashScreen.hideAsync().catch(console.error);
      }
    };
    
    initializeApp();
  }, [loadCurrentPCRDraft, initializeStaffDatabase]);
  
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