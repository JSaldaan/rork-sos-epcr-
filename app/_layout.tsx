import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { usePCRStore } from "@/store/pcrStore";

// Prevent auto-hide splash screen
try {
  SplashScreen.preventAutoHideAsync();
} catch {
  // Ignore errors
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RootLayoutNav() {
  const { currentSession } = usePCRStore();
  const segments = useSegments();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    // Mark component as mounted after first render
    setIsMounted(true);
  }, []);
  
  useEffect(() => {
    // Only attempt navigation after component is mounted and navigation is ready
    if (!isMounted) {
      return;
    }
    
    // Add a delay to ensure the Stack navigator is fully ready
    const timer = setTimeout(() => {
      try {
        const segmentsArray = segments as string[];
        const inAuthGroup = segmentsArray[0] === '(tabs)';
        const isAuthenticated = !!currentSession;
        const isOnRootPath = segmentsArray.length === 0;
        const isOnLoginPage = segmentsArray[0] === 'login';
        
        console.log('Navigation check:', {
          segments: segmentsArray,
          isAuthenticated,
          isOnRootPath,
          isOnLoginPage,
          inAuthGroup
        });
        
        if (isOnRootPath) {
          console.log('Navigating to login from root');
          router.replace('/login');
          return;
        }
        
        if (!isAuthenticated && inAuthGroup) {
          console.log('Navigating to login - not authenticated in auth group');
          router.replace('/login');
          return;
        }
        
        if (isAuthenticated && isOnLoginPage) {
          console.log('Navigating to tabs - authenticated on login page');
          router.replace('/(tabs)');
          return;
        }
      } catch (error) {
        console.log('Navigation error:', error);
        // Retry navigation after a longer delay
        setTimeout(() => {
          try {
            const segmentsArray = segments as string[];
            const inAuthGroup = segmentsArray[0] === '(tabs)';
            const isAuthenticated = !!currentSession;
            const isOnRootPath = segmentsArray.length === 0;
            const isOnLoginPage = segmentsArray[0] === 'login';
            
            if (isOnRootPath) {
              router.replace('/login');
            } else if (!isAuthenticated && inAuthGroup) {
              router.replace('/login');
            } else if (isAuthenticated && isOnLoginPage) {
              router.replace('/(tabs)');
            }
          } catch (retryError) {
            console.log('Navigation retry failed:', retryError);
          }
        }, 2000);
      }
    }, 500); // Increased delay to ensure Stack is ready
    
    return () => clearTimeout(timer);
  }, [currentSession, segments, router, isMounted]);
  
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const { initializeStaffDatabase, loadCompletedPCRs, loadCurrentPCRDraft } = usePCRStore();
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing app...');
        await initializeStaffDatabase();
        await loadCompletedPCRs();
        await loadCurrentPCRDraft();
        console.log('App initialization complete');
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        try {
          await SplashScreen.hideAsync();
        } catch (error) {
          console.log('Splash screen hide error (safe to ignore):', error);
        }
      }
    };
    
    // Add a small delay to ensure everything is ready
    const timer = setTimeout(() => {
      initializeApp();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [initializeStaffDatabase, loadCompletedPCRs, loadCurrentPCRDraft]);
  
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={styles.container}>
        <RootLayoutNav />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});