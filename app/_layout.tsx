import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
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
  
  useEffect(() => {
    const segmentsArray = segments as string[];
    const inAuthGroup = segmentsArray[0] === '(tabs)';
    const isAuthenticated = !!currentSession;
    const isOnRootPath = segmentsArray.length === 0;
    const isOnLoginPage = segmentsArray[0] === 'login';
    
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
  }, [currentSession, segments, router]);
  
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
        await initializeStaffDatabase();
        await loadCompletedPCRs();
        await loadCurrentPCRDraft();
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        try {
          SplashScreen.hideAsync();
        } catch {
          // Ignore errors
        }
      }
    };
    
    initializeApp();
  }, [initializeStaffDatabase, loadCompletedPCRs, loadCurrentPCRDraft]);
  
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView>
        <RootLayoutNav />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}