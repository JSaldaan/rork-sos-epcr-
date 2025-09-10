import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { Shield, AlertTriangle, CheckCircle, XCircle, Eye, Lock, Activity } from 'lucide-react-native';
import {
  SecurityManager,
  SecurityLogger,
  BruteForceProtection,
  type SecurityLog,
} from '@/utils/security';

interface SecurityDashboardProps {
  onClose?: () => void;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ onClose }) => {
  const [securityStatus, setSecurityStatus] = useState<{
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    issues: string[];
    recommendations: string[];
  }>({ status: 'HEALTHY', issues: [], recommendations: [] });
  
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setIsLoading(true);
      
      // Get security health status
      const healthStatus = await SecurityManager.healthCheck();
      setSecurityStatus(healthStatus);
      
      // Get recent security logs
      const logs = await SecurityLogger.getSecurityLogs();
      // Show only last 50 logs
      setSecurityLogs(logs.slice(-50).reverse());
      
    } catch (error) {
      console.error('Failed to load security data:', error);
      Alert.alert('Error', 'Failed to load security data');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY': return '#10b981';
      case 'WARNING': return '#f59e0b';
      case 'CRITICAL': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'HEALTHY': return <CheckCircle size={24} color="#10b981" />;
      case 'WARNING': return <AlertTriangle size={24} color="#f59e0b" />;
      case 'CRITICAL': return <XCircle size={24} color="#ef4444" />;
      default: return <Shield size={24} color="#6b7280" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return '#10b981';
      case 'MEDIUM': return '#3b82f6';
      case 'HIGH': return '#f59e0b';
      case 'CRITICAL': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const clearSecurityLogs = async () => {
    Alert.alert(
      'Clear Security Logs',
      'Are you sure you want to clear all security logs? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await SecurityLogger.clearOldLogs(0); // Clear all logs
              await loadSecurityData();
              Alert.alert('Success', 'Security logs cleared successfully');
            } catch (error) {
              console.error('Failed to clear logs:', error);
              Alert.alert('Error', 'Failed to clear security logs');
            }
          },
        },
      ]
    );
  };

  const clearAccountLocks = async () => {
    Alert.alert(
      'Clear Account Locks',
      'Are you sure you want to clear all account locks? This will unlock all locked accounts.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Locks',
          style: 'destructive',
          onPress: async () => {
            try {
              await BruteForceProtection.clearAllLocks();
              await loadSecurityData();
              Alert.alert('Success', 'All account locks cleared successfully');
            } catch (error) {
              console.error('Failed to clear locks:', error);
              Alert.alert('Error', 'Failed to clear account locks');
            }
          },
        },
      ]
    );
  };

  const runSecurityScan = async () => {
    try {
      setIsLoading(true);
      
      // Simulate security scan
      await SecurityLogger.logEvent(
        'SUSPICIOUS_ACTIVITY',
        'Manual security scan initiated',
        'LOW'
      );
      
      // Refresh data
      await loadSecurityData();
      
      Alert.alert('Security Scan', 'Security scan completed successfully');
    } catch (error) {
      console.error('Security scan failed:', error);
      Alert.alert('Error', 'Security scan failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Activity size={32} color="#0066CC" />
          <Text style={styles.loadingText}>Loading security data...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Shield size={28} color="#0066CC" />
          <Text style={styles.headerTitle}>Security Dashboard</Text>
        </View>
        {onClose && (
          <Pressable style={styles.closeButton} onPress={onClose}>
            <XCircle size={24} color="#6b7280" />
          </Pressable>
        )}
      </View>

      {/* Security Status */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          {getStatusIcon(securityStatus.status)}
          <Text style={[styles.statusTitle, { color: getStatusColor(securityStatus.status) }]}>
            System Status: {securityStatus.status}
          </Text>
        </View>
        
        {securityStatus.issues.length > 0 && (
          <View style={styles.issuesContainer}>
            <Text style={styles.sectionTitle}>Security Issues:</Text>
            {securityStatus.issues.map((issue, index) => (
              <View key={index} style={styles.issueItem}>
                <AlertTriangle size={16} color="#f59e0b" />
                <Text style={styles.issueText}>{issue}</Text>
              </View>
            ))}
          </View>
        )}
        
        {securityStatus.recommendations.length > 0 && (
          <View style={styles.recommendationsContainer}>
            <Text style={styles.sectionTitle}>Recommendations:</Text>
            {securityStatus.recommendations.map((recommendation, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Text style={styles.recommendationText}>• {recommendation}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Security Actions */}
      <View style={styles.actionsCard}>
        <Text style={styles.cardTitle}>Security Actions</Text>
        <View style={styles.actionsGrid}>
          <Pressable style={styles.actionButton} onPress={runSecurityScan}>
            <Shield size={20} color="#0066CC" />
            <Text style={styles.actionButtonText}>Run Security Scan</Text>
          </Pressable>
          
          <Pressable style={styles.actionButton} onPress={loadSecurityData}>
            <Activity size={20} color="#10b981" />
            <Text style={styles.actionButtonText}>Refresh Status</Text>
          </Pressable>
          
          <Pressable style={[styles.actionButton, styles.warningButton]} onPress={clearAccountLocks}>
            <Lock size={20} color="#f59e0b" />
            <Text style={[styles.actionButtonText, styles.warningButtonText]}>Clear Locks</Text>
          </Pressable>
          
          <Pressable style={[styles.actionButton, styles.dangerButton]} onPress={clearSecurityLogs}>
            <XCircle size={20} color="#ef4444" />
            <Text style={[styles.actionButtonText, styles.dangerButtonText]}>Clear Logs</Text>
          </Pressable>
        </View>
      </View>

      {/* Security Logs */}
      <View style={styles.logsCard}>
        <View style={styles.logsHeader}>
          <Eye size={20} color="#374151" />
          <Text style={styles.cardTitle}>Recent Security Events</Text>
          <Text style={styles.logsCount}>({securityLogs.length})</Text>
        </View>
        
        {securityLogs.length === 0 ? (
          <View style={styles.noLogsContainer}>
            <Text style={styles.noLogsText}>No security events recorded</Text>
          </View>
        ) : (
          <View style={styles.logsList}>
            {securityLogs.map((log) => (
              <View key={log.id} style={styles.logItem}>
                <View style={styles.logHeader}>
                  <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(log.severity) }]}>
                    <Text style={styles.severityText}>{log.severity}</Text>
                  </View>
                  <Text style={styles.logTimestamp}>
                    {new Date(log.timestamp).toLocaleString()}
                  </Text>
                  {log.blocked && (
                    <View style={styles.blockedBadge}>
                      <Lock size={12} color="#ef4444" />
                      <Text style={styles.blockedText}>BLOCKED</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.logEvent}>{log.event}</Text>
                <Text style={styles.logDetails}>{log.details}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Security Tips */}
      <View style={styles.tipsCard}>
        <Text style={styles.cardTitle}>Security Best Practices</Text>
        <View style={styles.tipsList}>
          <Text style={styles.tipItem}>• Use strong, unique Corporation IDs</Text>
          <Text style={styles.tipItem}>• Log out when finished using the app</Text>
          <Text style={styles.tipItem}>• Report suspicious activity immediately</Text>
          <Text style={styles.tipItem}>• Keep the app updated to the latest version</Text>
          <Text style={styles.tipItem}>• Don&apos;t share login credentials with others</Text>
          <Text style={styles.tipItem}>• Use the app only on trusted devices</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 12,
  },
  closeButton: {
    padding: 8,
  },
  statusCard: {
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
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  issuesContainer: {
    marginBottom: 16,
  },
  issueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  issueText: {
    fontSize: 14,
    color: '#f59e0b',
    marginLeft: 8,
    flex: 1,
  },
  recommendationsContainer: {
    marginTop: 8,
  },
  recommendationItem: {
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 14,
    color: '#6b7280',
  },
  actionsCard: {
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 120,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 8,
  },
  dangerButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  dangerButtonText: {
    color: '#ef4444',
  },
  warningButton: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  warningButtonText: {
    color: '#f59e0b',
  },
  logsCard: {
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
  logsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logsCount: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  noLogsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noLogsText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  logsList: {
    gap: 12,
  },
  logItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#e5e7eb',
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  logTimestamp: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
  },
  blockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  blockedText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  logEvent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  logDetails: {
    fontSize: 13,
    color: '#6b7280',
  },
  tipsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});

export default SecurityDashboard;