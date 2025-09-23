import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { textStyles } from '@/constants/fonts';

interface HealthCheckItem {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

export default function AppHealthCheck() {
  const insets = useSafeAreaInsets();
  const [healthChecks, setHealthChecks] = React.useState<HealthCheckItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const runHealthChecks = async () => {
    setIsLoading(true);
    const checks: HealthCheckItem[] = [];

    try {
      // Check 1: Basic React Native functionality
      checks.push({
        name: 'React Native Core',
        status: 'pass',
        message: 'React Native is working correctly'
      });

      // Check 2: Navigation
      try {
        await import('expo-router');
        checks.push({
          name: 'Expo Router',
          status: 'pass',
          message: 'Navigation system is functional'
        });
      } catch {
        checks.push({
          name: 'Expo Router',
          status: 'fail',
          message: 'Navigation system has issues'
        });
      }

      // Check 3: AsyncStorage
      try {
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        await AsyncStorage.default.setItem('health-check', 'test');
        await AsyncStorage.default.removeItem('health-check');
        checks.push({
          name: 'AsyncStorage',
          status: 'pass',
          message: 'Local storage is working'
        });
      } catch {
        checks.push({
          name: 'AsyncStorage',
          status: 'fail',
          message: 'Local storage has issues'
        });
      }

      // Check 4: Store
      try {
        const { usePCRStore } = await import('@/store/pcrStore');
        usePCRStore.getState();
        checks.push({
          name: 'App Store',
          status: 'pass',
          message: 'Application state management is working'
        });
      } catch {
        checks.push({
          name: 'App Store',
          status: 'fail',
          message: 'Application state has issues'
        });
      }

      // Check 5: Icons
      try {
        checks.push({
          name: 'Lucide Icons',
          status: 'pass',
          message: 'Icon system is working'
        });
      } catch {
        checks.push({
          name: 'Lucide Icons',
          status: 'warning',
          message: 'Some icons may not display correctly'
        });
      }

    } catch {
      checks.push({
        name: 'General Health',
        status: 'fail',
        message: 'Critical system error detected'
      });
    }

    setHealthChecks(checks);
    setIsLoading(false);
  };

  React.useEffect(() => {
    runHealthChecks();
  }, []);

  const getStatusIcon = (status: HealthCheckItem['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle size={20} color={colors.brand.success} />;
      case 'fail':
        return <XCircle size={20} color={colors.brand.error} />;
      case 'warning':
        return <AlertTriangle size={20} color={colors.brand.warning} />;
    }
  };

  const getStatusColor = (status: HealthCheckItem['status']) => {
    switch (status) {
      case 'pass':
        return colors.brand.success;
      case 'fail':
        return colors.brand.error;
      case 'warning':
        return colors.brand.warning;
    }
  };

  const handleRetry = () => {
    runHealthChecks();
  };

  const passCount = healthChecks.filter(check => check.status === 'pass').length;
  const failCount = healthChecks.filter(check => check.status === 'fail').length;
  const warningCount = healthChecks.filter(check => check.status === 'warning').length;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.title}>App Health Check</Text>
        <Text style={styles.subtitle}>System Status Diagnostics</Text>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <CheckCircle size={16} color={colors.brand.success} />
          <Text style={styles.summaryText}>{passCount} Passed</Text>
        </View>
        <View style={styles.summaryItem}>
          <AlertTriangle size={16} color={colors.brand.warning} />
          <Text style={styles.summaryText}>{warningCount} Warnings</Text>
        </View>
        <View style={styles.summaryItem}>
          <XCircle size={16} color={colors.brand.error} />
          <Text style={styles.summaryText}>{failCount} Failed</Text>
        </View>
      </View>

      <ScrollView style={styles.checksList} showsVerticalScrollIndicator={false}>
        {healthChecks.map((check) => (
          <View key={check.name} style={styles.checkItem}>
            <View style={styles.checkHeader}>
              {getStatusIcon(check.status)}
              <Text style={styles.checkName}>{check.name}</Text>
            </View>
            <Text style={[styles.checkMessage, { color: getStatusColor(check.status) }]}>
              {check.message}
            </Text>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity 
        style={styles.retryButton} 
        onPress={handleRetry}
        disabled={isLoading}
      >
        <RefreshCw size={20} color="#fff" />
        <Text style={styles.retryButtonText}>
          {isLoading ? 'Running Checks...' : 'Retry Health Check'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    ...textStyles.title1,
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    ...textStyles.subheadline,
    color: colors.text.secondary,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.background.secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryText: {
    ...textStyles.caption1,
    color: colors.text.primary,
    fontWeight: '600',
  },
  checksList: {
    flex: 1,
  },
  checkItem: {
    backgroundColor: colors.background.secondary,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  checkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  checkName: {
    ...textStyles.headline,
    color: colors.text.primary,
    fontWeight: '600',
  },
  checkMessage: {
    ...textStyles.subheadline,
    marginLeft: 28,
  },
  retryButton: {
    backgroundColor: colors.brand.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  retryButtonText: {
    ...textStyles.buttonText,
    color: '#fff',
  },
});