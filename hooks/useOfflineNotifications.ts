import React from 'react';
import { Alert, Platform } from 'react-native';
import { useOfflineStore } from '@/store/offlineStore';

export function useOfflineNotifications() {
  const { isOnline, pendingActions } = useOfflineStore();
  const [hasShownOfflineAlert, setHasShownOfflineAlert] = React.useState(false);
  const [hasShownOnlineAlert, setHasShownOnlineAlert] = React.useState(false);

  React.useEffect(() => {
    if (!isOnline && !hasShownOfflineAlert) {
      setHasShownOfflineAlert(true);
      setHasShownOnlineAlert(false);
      
      Alert.alert(
        '📱 Working Offline',
        'You are currently offline. All your work will be saved locally and synchronized when you reconnect to the internet.',
        [{ text: 'OK' }]
      );
    } else if (isOnline && !hasShownOnlineAlert && hasShownOfflineAlert) {
      setHasShownOnlineAlert(true);
      setHasShownOfflineAlert(false);
      
      const pendingCount = pendingActions.length;
      const message = pendingCount > 0 
        ? `You are back online! ${pendingCount} pending actions will be synchronized automatically.`
        : 'You are back online! All your data is synchronized.';
      
      Alert.alert(
        '✅ Back Online',
        message,
        [{ text: 'OK' }]
      );
    }
  }, [isOnline, hasShownOfflineAlert, hasShownOnlineAlert, pendingActions.length]);

  const showOfflineToast = React.useCallback((message: string) => {
    if (Platform.OS === 'web') {
      console.log('📱 Offline:', message);
    } else {
      Alert.alert('Offline Mode', message, [{ text: 'OK' }]);
    }
  }, []);

  const showSyncToast = React.useCallback((message: string) => {
    if (Platform.OS === 'web') {
      console.log('🔄 Sync:', message);
    } else {
      Alert.alert('Sync Status', message, [{ text: 'OK' }]);
    }
  }, []);

  return {
    isOnline,
    pendingActions,
    showOfflineToast,
    showSyncToast,
  };
}