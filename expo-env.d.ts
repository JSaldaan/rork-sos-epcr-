/// <reference types="expo/types" />

// Global type declarations
declare const __DEV__: boolean;

// React Native Web compatibility
declare module 'react-native' {
  interface PlatformStatic {
    OS: 'ios' | 'android' | 'web' | 'windows' | 'macos';
  }
}

// Zustand store types - Updated for compatibility
declare module 'zustand' {
  export function create<T>(
    fn: (
      set: (partial: T | Partial<T> | ((state: T) => T | Partial<T>), replace?: boolean) => void,
      get: () => T
    ) => T
  ): () => T;
}