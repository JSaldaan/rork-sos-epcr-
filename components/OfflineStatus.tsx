import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Wifi, WifiOff, RefreshCw, Database, Download, Upload, Trash2, Settings } from 'lucide-react-native';
import { useOfflineManager } from '@/utils/offlineManager';

interface OfflineStatusProps {
  showDetails?: boolean;
  onToggleDetails?: () => void;
}

export function OfflineStatus({ showDetails = false, onToggleDetails }: OfflineStatusProps) {
  const {
    isOnline,
    lastSyncTime,
    queuedItems,
    syncInProgress,
    storageUsage,
    syncNow,
    clearQueue,
    getQueueStats,
    exportData,
    cleanupOldData
  } = useOfflineManager();

  const queueStats = getQueueStats();
  const lastSyncFormatted = lastSyncTime 
    ? new Date(lastSyncTime).toLocaleString()
    : 'Never';

  const handleSyncNow = async () => {
    try {
      const result = await syncNow();
      if (result.success) {
        Alert.alert(
          'Sync Complete',
          `Successfully processed ${result.itemsProcessed} items${result.itemsFailed > 0 ? `, ${result.itemsFailed} failed` : ''}`
        );
      } else {
        Alert.alert('Sync Failed', result.errors.join('\n'));
      }
    } catch (error) {
      Alert.alert('Sync Error', 'Failed to sync data');
    }
  };

  const handleClearQueue = () => {
    Alert.alert(
      'Clear Queue',
      'Are you sure you want to clear all queued items? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => clearQueue()
        }
      ]
    );
  };

  const handleExportData = async () => {
    try {
      const data = await exportData();
      // In a real app, you would save this to a file or share it
      Alert.alert(
        'Data Exported',
        `Exported ${(data.length / 1024).toFixed(2)} KB of data. In a production app, this would be saved to a file.`
      );
      console.log('Exported data length:', data.length);
    } catch (error) {
      Alert.alert('Export Failed', 'Failed to export offline data');
    }
  };

  const handleCleanupData = async () => {
    Alert.alert(
      'Cleanup Old Data',
      'Remove data older than 30 days to free up storage?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Cleanup',
          onPress: async () => {
            try {
              const itemsRemoved = await cleanupOldData(30);
              Alert.alert(
                'Cleanup Complete',
                `Removed ${itemsRemoved} old items to free up storage`
              );
            } catch (error) {
              Alert.alert('Cleanup Failed', 'Failed to cleanup old data');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Status Bar */}
      <TouchableOpacity 
        style={[styles.statusBar, isOnline ? styles.online : styles.offline]}
        onPress={onToggleDetails}
        testID="offline-status-bar"
      >
        <View style={styles.statusContent}>
          <View style={styles.statusLeft}>
            {isOnline ? (
              <Wifi size={16} color="#fff" />
            ) : (
              <WifiOff size={16} color="#fff" />
            )}
            <Text style={styles.statusText}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
            {queueStats.total > 0 ? (
              <View style={styles.queueBadge}>
                <Text style={styles.queueBadgeText}>{queueStats.total}</Text>
              </View>
            ) : null}
          </View>
          
          {syncInProgress ? (
            <RefreshCw size={16} color="#fff" style={styles.spinning} />
          ) : null}
        </View>
      </TouchableOpacity>

      {/* Detailed Status */}
      {showDetails && (
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Connection:</Text>
            <Text style={[styles.detailValue, isOnline ? styles.onlineText : styles.offlineText]}>
              {isOnline ? 'Connected' : 'Disconnected'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last Sync:</Text>
            <Text style={styles.detailValue}>{lastSyncFormatted}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Storage Used:</Text>
            <Text style={styles.detailValue}>
              {(storageUsage.used / 1024).toFixed(2)} KB ({storageUsage.percentage.toFixed(1)}%)
            </Text>
          </View>

          {queueStats.total > 0 ? (
            <View style={styles.queueDetails}>
              <Text style={styles.queueTitle}>Queued Items:</Text>
              <View style={styles.queueStats}>
                <View style={styles.queueStat}>
                  <Text style={styles.queueStatLabel}>Pending</Text>
                  <Text style={styles.queueStatValue}>{queueStats.pending}</Text>
                </View>
                <View style={styles.queueStat}>
                  <Text style={styles.queueStatLabel}>Failed</Text>
                  <Text style={[styles.queueStatValue, queueStats.failed > 0 ? styles.errorText : null]}>
                    {queueStats.failed}
                  </Text>
                </View>
                <View style={styles.queueStat}>
                  <Text style={styles.queueStatLabel}>Processing</Text>
                  <Text style={styles.queueStatValue}>{queueStats.processing}</Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleSyncNow}
              disabled={syncInProgress || !isOnline}
              testID="sync-now-button"
            >
              <RefreshCw size={16} color="#fff" />
              <Text style={styles.actionButtonText}>
                {syncInProgress ? 'Syncing...' : 'Sync Now'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={handleExportData}
              testID="export-data-button"
            >
              <Download size={16} color="#007AFF" />
              <Text style={styles.secondaryButtonText}>Export</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={handleCleanupData}
              testID="cleanup-data-button"
            >
              <Database size={16} color="#007AFF" />
              <Text style={styles.secondaryButtonText}>Cleanup</Text>
            </TouchableOpacity>

            {queueStats.total > 0 ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.dangerButton]}
                onPress={handleClearQueue}
                testID="clear-queue-button"
              >
                <Trash2 size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Clear Queue</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  statusBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  online: {
    backgroundColor: '#28a745',
  },
  offline: {
    backgroundColor: '#dc3545',
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  queueBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  queueBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  spinning: {
    // Add animation in a real app
  },
  details: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '600',
  },
  onlineText: {
    color: '#28a745',
  },
  offlineText: {
    color: '#dc3545',
  },
  queueDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  queueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 12,
  },
  queueStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  queueStat: {
    alignItems: 'center',
  },
  queueStatLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  queueStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#495057',
  },
  errorText: {
    color: '#dc3545',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default OfflineStatus;