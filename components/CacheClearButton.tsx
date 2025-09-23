import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { RefreshCw, Trash2, AlertTriangle } from 'lucide-react-native';
import { emergencyReset, restartServer, clearDevelopmentCaches } from '@/utils/cacheManager';

interface CacheClearButtonProps {
  queryClient?: any;
  variant?: 'emergency' | 'development' | 'restart';
  onComplete?: () => void;
}

export default function CacheClearButton({ 
  queryClient, 
  variant = 'development',
  onComplete 
}: CacheClearButtonProps) {
  const [isClearing, setIsClearing] = useState<boolean>(false);

  const handleCacheClear = async (): Promise<void> => {
    if (isClearing) return;

    const actions = {
      emergency: {
        title: 'Emergency Reset',
        message: 'This will clear ALL caches and restart the app. Continue?',
        action: () => emergencyReset(queryClient)
      },
      development: {
        title: 'Clear Development Caches',
        message: 'This will clear development caches. Continue?',
        action: () => clearDevelopmentCaches(queryClient)
      },
      restart: {
        title: 'Restart Server',
        message: 'This will restart the development server. Continue?',
        action: () => restartServer()
      }
    };

    const currentAction = actions[variant];

    Alert.alert(
      currentAction.title,
      currentAction.message,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            
            try {
              console.log(`🚀 Starting ${variant} cache clear...`);
              await currentAction.action();
              
              if (onComplete) {
                onComplete();
              }
              
              // Show success message
              if (Platform.OS !== 'web') {
                Alert.alert(
                  'Success',
                  'Cache cleared successfully. Please restart the app manually.',
                  [{ text: 'OK' }]
                );
              }
            } catch (error) {
              console.error('Cache clear failed:', error);
              Alert.alert(
                'Error',
                'Cache clearing failed. Please try again.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsClearing(false);
            }
          }
        }
      ]
    );
  };

  const getButtonConfig = () => {
    switch (variant) {
      case 'emergency':
        return {
          icon: AlertTriangle,
          text: 'Emergency Reset',
          color: '#ef4444',
          backgroundColor: '#fef2f2'
        };
      case 'restart':
        return {
          icon: RefreshCw,
          text: 'Restart Server',
          color: '#f59e0b',
          backgroundColor: '#fffbeb'
        };
      default:
        return {
          icon: Trash2,
          text: 'Clear Cache',
          color: '#6366f1',
          backgroundColor: '#f0f9ff'
        };
    }
  };

  const config = getButtonConfig();
  const IconComponent = config.icon;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: config.backgroundColor },
        isClearing && styles.buttonDisabled
      ]}
      onPress={handleCacheClear}
      disabled={isClearing}
      testID={`cache-clear-${variant}`}
    >
      <View style={styles.buttonContent}>
        <IconComponent 
          size={20} 
          color={config.color}
          style={isClearing ? styles.iconSpinning : undefined}
        />
        <Text style={[styles.buttonText, { color: config.color }]}>
          {isClearing ? 'Clearing...' : config.text}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginVertical: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  iconSpinning: {
    // Note: For actual spinning animation, you'd need react-native-reanimated
    // This is just a placeholder for the spinning state
  },
});