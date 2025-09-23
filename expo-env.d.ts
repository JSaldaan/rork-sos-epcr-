/// <reference types="expo/types" />

// Global type declarations
declare const __DEV__: boolean;

// React Native Web compatibility
declare module 'react-native' {
  interface PlatformStatic {
    OS: 'ios' | 'android' | 'web' | 'windows' | 'macos';
  }
}

// Zustand store types
declare module 'zustand' {
  export function create<T>(fn: (set: any, get: any) => T): () => T;
}