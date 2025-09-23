import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Platform,
  Dimensions 
} from 'react-native';
import { 
  Server, 
  Database, 
  Wifi, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  Trash2,
  AlertTriangle,
  Settings
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CacheClearButton from './CacheClearButton';
import { emergencyReset, clearDevelopmentCaches } from '@/utils/cacheManager';

interface SystemStatusProps {
  queryClient?: any;
  onClose?: () => void;
}

interface StatusItem {
  id: string;
  label: string;
  status: 'online' | 'offline' | 'warning' | 'checking';
  details?: string;
}

export default function SystemStatusScreen({ queryClient, onClose }: SystemStatusProps) {
  const [systemStatus, setSystemStatus] = useState<StatusItem[]>([
    { id: 'server', label: 'Development Server', status: 'checking' },
    { id: 'cache', label: 'Cache Status', status: 'checking' },
    { id: 'storage', label: 'Local Storage', status: 'checking' },
    { id: 'network', label: 'Network Connection', status: 'checking' }
  ]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const checkSystemStatus = async (): Promise<void> => {
    setIsRefreshing(true);
    
    try {
      const updatedStatus: StatusItem[] = [];
      
      // Check server status
      try {
        const serverResponse = await fetch(window.location.origin, { 
          method: 'HEAD',
          cache: 'no-cache'
        });
        updatedStatus.push({
          id: 'server',
          label: 'Development Server',
          status: serverResponse.ok ? 'online' : 'warning',
          details: serverResponse.ok ? 'Server responding' : 'Server issues detected'
        });
      } catch {
        updatedStatus.push({
          id: 'server',
          label: 'Development Server',
          status: 'offline',
          details: 'Server not responding'
        });
      }
      
      // Check cache status
      try {
        const cacheSize = Platform.OS === 'web' && typeof localStorage !== 'undefined' 
          ? Object.keys(localStorage).length 
          : 0;
        updatedStatus.push({
          id: 'cache',
          label: 'Cache Status',
          status: cacheSize > 50 ? 'warning' : 'online',
          details: `${cacheSize} cached items`
        });
      } catch {
        updatedStatus.push({
          id: 'cache',
          label: 'Cache Status',
          status: 'warning',
          details: 'Cache check failed'
        });
      }
      
      // Check storage
      try {
        if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
          localStorage.setItem('test', 'test');
          localStorage.removeItem('test');
          updatedStatus.push({
            id: 'storage',
            label: 'Local Storage',
            status: 'online',
            details: 'Storage accessible'
          });
        } else {
          updatedStatus.push({
            id: 'storage',
            label: 'Local Storage',
            status: 'online',
            details: 'Native storage available'
          });
        }
      } catch {
        updatedStatus.push({
          id: 'storage',
          label: 'Local Storage',
          status: 'offline',
          details: 'Storage not accessible'
        });
      }
      
      // Check network
      try {
        const networkStatus = Platform.OS === 'web' 
          ? navigator.onLine 
          : true; // Assume online for native
        updatedStatus.push({
          id: 'network',
          label: 'Network Connection',
          status: networkStatus ? 'online' : 'offline',
          details: networkStatus ? 'Connected' : 'Disconnected'
        });
      } catch {
        updatedStatus.push({
          id: 'network',
          label: 'Network Connection',
          status: 'warning',
          details: 'Network check failed'
        });
      }
      
      setSystemStatus(updatedStatus);
    } catch (error) {
      console.error('System status check failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const getStatusIcon = (status: StatusItem['status']) => {
    const iconColor = getStatusColor(status);
    switch (status) {
      case 'online':
        return <CheckCircle size={20} color={iconColor} />;
      case 'offline':
        return <AlertCircle size={20} color={iconColor} />;
      case 'warning':
        return <AlertTriangle size={20} color={iconColor} />;
      case 'checking':
        return <RefreshCw size={20} color={iconColor} />;
      default:
        return <AlertCircle size={20} color={iconColor} />;
    }
  };

  const getStatusColor = (status: StatusItem['status']) => {
    switch (status) {
      case 'online':
        return '#10b981';
      case 'offline':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const handleEmergencyReset = async (): Promise<void> => {
    console.log('🚨 Emergency reset initiated from System Status');
    await emergencyReset(queryClient);
  };

  const handleQuickCacheClear = async (): Promise<void> => {
    console.log('🧹 Quick cache clear initiated');
    await clearDevelopmentCaches(queryClient);
    await checkSystemStatus(); // Refresh status after clearing
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Settings size={24} color="#1f2937" />
            <Text style={styles.headerTitle}>System Status & Cache Management</Text>
          </View>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* System Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Server size={20} color="#374151" />
            <Text style={styles.sectionTitle}>System Status</Text>
            <TouchableOpacity 
              onPress={checkSystemStatus}
              disabled={isRefreshing}
              style={styles.refreshButton}
            >
              <RefreshCw 
                size={16} 
                color="#6366f1" 
                style={isRefreshing ? styles.spinning : undefined}
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.statusList}>
            {systemStatus.map((item) => (
              <View key={item.id} style={styles.statusItem}>
                <View style={styles.statusLeft}>
                  {getStatusIcon(item.status)}
                  <View style={styles.statusText}>
                    <Text style={styles.statusLabel}>{item.label}</Text>
                    {item.details && (
                      <Text style={[styles.statusDetails, { color: getStatusColor(item.status) }]}>
                        {item.details}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Cache Management */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Database size={20} color="#374151" />
            <Text style={styles.sectionTitle}>Cache Management</Text>
          </View>
          
          <View style={styles.cacheActions}>
            <CacheClearButton 
              queryClient={queryClient}
              variant="development"
              onComplete={() => checkSystemStatus()}
            />
            
            <CacheClearButton 
              queryClient={queryClient}
              variant="restart"
              onComplete={() => checkSystemStatus()}
            />
            
            <CacheClearButton 
              queryClient={queryClient}
              variant="emergency"
              onComplete={() => checkSystemStatus()}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlertTriangle size={20} color="#374151" />
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={handleQuickCacheClear}
            >
              <Trash2 size={18} color="#6366f1" />
              <Text style={styles.quickActionText}>Quick Cache Clear</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickActionButton, styles.emergencyButton]}
              onPress={handleEmergencyReset}
            >
              <AlertTriangle size={18} color="#ef4444" />
              <Text style={[styles.quickActionText, styles.emergencyText]}>
                Emergency Reset
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* System Info */}
        <View style={styles.section}>
          <Text style={styles.systemInfo}>
            Platform: {Platform.OS} • Version: {Platform.Version}
            {Platform.OS === 'web' && (
              `\nUser Agent: ${navigator.userAgent.split(' ').slice(-2).join(' ')}`
            )}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flexShrink: 1,
  },
  closeButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  refreshButton: {
    padding: 4,
  },
  spinning: {
    // Placeholder for spinning animation
  },
  statusList: {
    gap: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  statusText: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  statusDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  cacheActions: {
    gap: 8,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    flex: 1,
    minWidth: (width - 48) / 2 - 6,
  },
  emergencyButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6366f1',
  },
  emergencyText: {
    color: '#ef4444',
  },
  systemInfo: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
    textAlign: 'center',
  },
});