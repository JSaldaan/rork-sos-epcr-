import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Wifi, WifiOff } from 'lucide-react-native';
import NetInfo from '@react-native-community/netinfo';

interface OfflineStatusProps {
  showDetails?: boolean;
  onToggleDetails?: () => void;
}

export function OfflineStatus({ showDetails = false, onToggleDetails }: OfflineStatusProps) {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (!showDetails) {
    return (
      <TouchableOpacity 
        style={[styles.statusBar, !isOnline && styles.statusBarOffline]} 
        onPress={onToggleDetails}
      >
        {isOnline ? (
          <Wifi size={16} color="#28a745" />
        ) : (
          <WifiOff size={16} color="#dc3545" />
        )}
        <Text style={[styles.statusText, !isOnline && styles.statusTextOffline]}>
          {isOnline ? 'Online' : 'Offline'}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.detailsContainer}>
      <TouchableOpacity 
        style={[styles.statusBar, !isOnline && styles.statusBarOffline]} 
        onPress={onToggleDetails}
      >
        {isOnline ? (
          <Wifi size={16} color="#28a745" />
        ) : (
          <WifiOff size={16} color="#dc3545" />
        )}
        <Text style={[styles.statusText, !isOnline && styles.statusTextOffline]}>
          {isOnline ? 'Online - Data synced' : 'Offline - Data saved locally'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  statusBarOffline: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
  },
  statusText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#155724',
    fontWeight: '500',
  },
  statusTextOffline: {
    color: '#721c24',
  },
  detailsContainer: {
    marginBottom: 8,
  },
});