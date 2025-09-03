import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useOfflineStore } from '@/store/offlineStore';
import { Wifi, WifiOff, Clock, AlertCircle } from 'lucide-react-native';

export function OfflineStatusBar() {
  const { isOnline, pendingActions, lastSyncTime, syncInProgress } = useOfflineStore();
  const [fadeAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (!isOnline || pendingActions.length > 0 || syncInProgress) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOnline, pendingActions.length, syncInProgress, fadeAnim]);

  const getStatusInfo = () => {
    if (syncInProgress) {
      return {
        icon: Clock,
        text: 'Syncing data...',
        color: '#007AFF',
        backgroundColor: '#E3F2FD',
      };
    }
    
    if (!isOnline) {
      return {
        icon: WifiOff,
        text: `Working offline${pendingActions.length > 0 ? ` • ${pendingActions.length} pending` : ''}`,
        color: '#FF9500',
        backgroundColor: '#FFF3E0',
      };
    }
    
    if (pendingActions.length > 0) {
      return {
        icon: AlertCircle,
        text: `${pendingActions.length} actions pending sync`,
        color: '#FF9500',
        backgroundColor: '#FFF3E0',
      };
    }
    
    return {
      icon: Wifi,
      text: 'Connected',
      color: '#34C759',
      backgroundColor: '#E8F5E8',
    };
  };

  const statusInfo = getStatusInfo();
  const IconComponent = statusInfo.icon;

  if (isOnline && pendingActions.length === 0 && !syncInProgress) {
    return null;
  }

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: statusInfo.backgroundColor,
          opacity: fadeAnim 
        }
      ]}
    >
      <View style={styles.content}>
        <IconComponent size={16} color={statusInfo.color} />
        <Text style={[styles.text, { color: statusInfo.color }]}>
          {statusInfo.text}
        </Text>
        {lastSyncTime && !syncInProgress && (
          <Text style={[styles.lastSync, { color: statusInfo.color }]}>
            Last sync: {new Date(lastSyncTime).toLocaleTimeString()}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  lastSync: {
    fontSize: 12,
    marginLeft: 8,
    opacity: 0.7,
  },
});