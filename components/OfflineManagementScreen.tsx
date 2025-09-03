import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useOfflineStore } from '@/store/offlineStore';
import { usePCRStore } from '@/store/pcrStore';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Download,

  Trash2,
  Clock,
  Database,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';

export function OfflineManagementScreen() {
  const {
    isOnline,
    pendingActions,
    lastSyncTime,
    syncInProgress,
    offlineDataVersion,
    syncData,
    clearOfflineData,
    getOfflineDataSize,
    exportOfflineData,

  } = useOfflineStore();

  const { completedPCRs, staffMembers } = usePCRStore();
  const [dataSize, setDataSize] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const loadDataSize = async () => {
      const size = await getOfflineDataSize();
      setDataSize(size);
    };
    loadDataSize();
  }, [getOfflineDataSize, pendingActions, completedPCRs]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSyncData = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Cannot sync while offline. Please check your internet connection.');
      return;
    }

    setLoading(true);
    try {
      await syncData();
      Alert.alert('Success', 'Data synchronized successfully!');
    } catch (error) {
      console.error('Sync error:', error);
      Alert.alert('Error', 'Failed to sync data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      const exportedData = await exportOfflineData();
      
      await Share.share({
        message: exportedData,
        title: 'Offline Data Export',
      });
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear Offline Data',
      'This will permanently delete all offline data including pending actions. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await clearOfflineData();
              Alert.alert('Success', 'All offline data has been cleared.');
            } catch (error) {
              console.error('Clear error:', error);
              Alert.alert('Error', 'Failed to clear offline data.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'completed':
        return '#34C759';
      case 'failed':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return Clock;
      case 'completed':
        return CheckCircle;
      case 'failed':
        return XCircle;
      default:
        return AlertCircle;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Connection Status */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.statusIndicator}>
            {isOnline ? (
              <Wifi size={24} color="#34C759" />
            ) : (
              <WifiOff size={24} color="#FF3B30" />
            )}
            <Text style={[styles.statusText, { color: isOnline ? '#34C759' : '#FF3B30' }]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
        
        {lastSyncTime && (
          <Text style={styles.lastSyncText}>
            Last sync: {new Date(lastSyncTime).toLocaleString()}
          </Text>
        )}
      </View>

      {/* Data Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Overview</Text>
        <View style={styles.dataGrid}>
          <View style={styles.dataItem}>
            <Database size={20} color="#007AFF" />
            <Text style={styles.dataLabel}>Storage Used</Text>
            <Text style={styles.dataValue}>{formatBytes(dataSize)}</Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>PCRs Stored</Text>
            <Text style={styles.dataValue}>{completedPCRs.length}</Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Staff Members</Text>
            <Text style={styles.dataValue}>{staffMembers.length}</Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Data Version</Text>
            <Text style={styles.dataValue}>v{offlineDataVersion}</Text>
          </View>
        </View>
      </View>

      {/* Pending Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Pending Actions ({pendingActions.length})
        </Text>
        
        {pendingActions.length === 0 ? (
          <View style={styles.emptyState}>
            <CheckCircle size={48} color="#34C759" />
            <Text style={styles.emptyStateText}>All actions synchronized</Text>
          </View>
        ) : (
          <View style={styles.actionsList}>
            {pendingActions.map((action) => {
              const StatusIcon = getStatusIcon(action.status);
              return (
                <View key={action.id} style={styles.actionItem}>
                  <StatusIcon size={20} color={getStatusColor(action.status)} />
                  <View style={styles.actionDetails}>
                    <Text style={styles.actionType}>{action.type.replace('_', ' ')}</Text>
                    <Text style={styles.actionTime}>
                      {new Date(action.timestamp).toLocaleString()}
                    </Text>
                    <Text style={styles.actionStatus}>
                      Status: {action.status} • Retries: {action.retryCount}/{action.maxRetries}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        <TouchableOpacity
          style={[styles.actionButton, !isOnline && styles.actionButtonDisabled]}
          onPress={handleSyncData}
          disabled={!isOnline || syncInProgress || loading}
        >
          {syncInProgress || loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <RefreshCw size={20} color="#fff" />
          )}
          <Text style={styles.actionButtonText}>
            {syncInProgress ? 'Syncing...' : 'Sync Now'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.exportButton]}
          onPress={handleExportData}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Download size={20} color="#fff" />
          )}
          <Text style={styles.actionButtonText}>Export Data</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={handleClearData}
          disabled={loading}
        >
          <Trash2 size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>

      {/* Offline Capabilities Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Offline Capabilities</Text>
        <View style={styles.infoList}>
          <Text style={styles.infoItem}>• Create and edit PCRs offline</Text>
          <Text style={styles.infoItem}>• Capture signatures and ECGs</Text>
          <Text style={styles.infoItem}>• Submit reports (queued for sync)</Text>
          <Text style={styles.infoItem}>• Manage staff members</Text>
          <Text style={styles.infoItem}>• View existing reports</Text>
          <Text style={styles.infoItem}>• Automatic sync when online</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  lastSyncText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dataItem: {
    width: '48%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  dataLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  dataValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  actionsList: {
    gap: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  actionDetails: {
    flex: 1,
    marginLeft: 12,
  },
  actionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  actionTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  actionStatus: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  actionButtonDisabled: {
    backgroundColor: '#ccc',
  },
  exportButton: {
    backgroundColor: '#34C759',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoList: {
    gap: 8,
  },
  infoItem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});