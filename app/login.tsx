import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { usePCRStore } from '@/store/pcrStore';
import { Shield, Users, TestTube, AlertTriangle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { verifyCompleteLogout } from '@/utils/auth';
import {
  SecurityManager,
  SecurityLogger,
  BruteForceProtection,
  InputValidator,
  MalwareProtection,
} from '@/utils/security';
import { SecurityDashboard } from '@/components/SecurityDashboard';
import { ResponsiveContainer } from '@/components/ResponsiveLayout';
import { SalesModal } from '@/components/SalesModal';
import { spacing, dimensions, typography } from '@/utils/responsive';

const LoginScreen: React.FC = () => {
  const {
    adminLogin,
    staffLogin,
  } = usePCRStore();
  
  const [password, setPassword] = useState<string>('');
  const [corporationId, setCorporationId] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [loginMode, setLoginMode] = useState<'staff' | 'admin'>('staff');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSecurityDashboard, setShowSecurityDashboard] = useState<boolean>(false);
  const [showSalesModal, setShowSalesModal] = useState<boolean>(false);
  const [accountLocked, setAccountLocked] = useState<boolean>(false);
  const [lockoutTime, setLockoutTime] = useState<number>(0);

  // Initialize security system
  useEffect(() => {
    const initSecurity = async () => {
      try {
        await SecurityManager.initialize();
        console.log('Security system initialized');
      } catch (error) {
        console.error('Failed to initialize security system:', error);
      }
    };
    initSecurity();
  }, []);

  // Check for account lockout
  useEffect(() => {
    const checkLockout = async () => {
      if (corporationId) {
        const isLocked = await BruteForceProtection.isAccountLocked(corporationId);
        setAccountLocked(isLocked);
        if (isLocked) {
          const remaining = await BruteForceProtection.getRemainingLockoutTime(corporationId);
          setLockoutTime(remaining);
        }
      }
    };
    checkLockout();
  }, [corporationId]);

  const handleStaffLogin = async () => {
    const trimmedId = corporationId.trim().toUpperCase();
    
    if (!trimmedId) {
      setLoginError('Please enter your Corporation ID');
      return;
    }
    
    // Security validation
    if (!InputValidator.validateCorporationId(trimmedId)) {
      setLoginError('Invalid Corporation ID format');
      await SecurityLogger.logEvent(
        'LOGIN_FAILURE',
        `Invalid Corporation ID format: ${trimmedId}`,
        'MEDIUM'
      );
      return;
    }
    
    // Check for malicious input
    const malwareScan = MalwareProtection.scanInput(trimmedId);
    if (!malwareScan.safe) {
      setLoginError('Security threat detected in input');
      await SecurityLogger.logEvent(
        'INJECTION_ATTEMPT',
        `Malicious input detected: ${malwareScan.threats.join(', ')}`,
        'CRITICAL',
        true
      );
      return;
    }
    
    // Check account lockout
    const isLocked = await BruteForceProtection.isAccountLocked(trimmedId);
    if (isLocked) {
      const remaining = await BruteForceProtection.getRemainingLockoutTime(trimmedId);
      const minutes = Math.ceil(remaining / (60 * 1000));
      setLoginError(`Account locked. Try again in ${minutes} minutes.`);
      setAccountLocked(true);
      setLockoutTime(remaining);
      return;
    }
    
    setIsLoading(true);
    setLoginError('');
    
    try {
      // Log login attempt
      await SecurityLogger.logEvent(
        'LOGIN_ATTEMPT',
        `Staff login attempt for: ${trimmedId}`,
        'LOW'
      );
      
      // First validate the corporation ID to check role
      await usePCRStore.getState().loadStaffMembers();
      const staff = await usePCRStore.getState().validateCorporationId(trimmedId);
      
      if (staff && (staff.role === 'SuperAdmin' || staff.role === 'Admin')) {
        setLoginError('Admin and Super Admin accounts must use Admin Only login');
        await BruteForceProtection.recordLoginAttempt(trimmedId, false);
        setIsLoading(false);
        return;
      }
      
      const success = await staffLogin(trimmedId);
      
      // Record login attempt for brute force protection
      await BruteForceProtection.recordLoginAttempt(trimmedId, success);
      
      if (success) {
        setCorporationId('');
        setLoginError('');
        setAccountLocked(false);
        setLockoutTime(0);
        
        await SecurityLogger.logEvent(
          'LOGIN_SUCCESS',
          `Staff login successful for: ${trimmedId}`,
          'LOW'
        );
        
        console.log('Staff login successful, redirecting to tabs');
        router.replace('/(tabs)');
      } else {
        setLoginError('Invalid Corporation ID or account inactive');
        await SecurityLogger.logEvent(
          'LOGIN_FAILURE',
          `Staff login failed for: ${trimmedId}`,
          'MEDIUM'
        );
      }
    } catch (error) {
      console.error('Staff login error:', error);
      setLoginError('Login failed. Please try again.');
      await SecurityLogger.logEvent(
        'LOGIN_FAILURE',
        `Staff login error for ${trimmedId}: ${error}`,
        'HIGH'
      );
      await BruteForceProtection.recordLoginAttempt(trimmedId, false);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAdminLogin = async () => {
    const trimmedPassword = password.trim();
    
    if (!trimmedPassword) {
      setLoginError('Please enter admin credentials');
      return;
    }
    
    // Security validation for admin login
    const malwareScan = MalwareProtection.scanInput(trimmedPassword);
    if (!malwareScan.safe) {
      setLoginError('Security threat detected in input');
      await SecurityLogger.logEvent(
        'INJECTION_ATTEMPT',
        `Malicious admin input detected: ${malwareScan.threats.join(', ')}`,
        'CRITICAL',
        true
      );
      return;
    }
    
    setIsLoading(true);
    setLoginError('');
    
    try {
      await SecurityLogger.logEvent(
        'LOGIN_ATTEMPT',
        'Admin login attempt',
        'MEDIUM'
      );
      
      // Check if it's the system admin password
      if (trimmedPassword === 'admin123') {
        if (adminLogin(trimmedPassword)) {
          setPassword('');
          setLoginError('');
          
          await SecurityLogger.logEvent(
            'LOGIN_SUCCESS',
            'System admin login successful',
            'HIGH'
          );
          
          console.log('System admin login successful, redirecting to tabs');
          router.replace('/(tabs)');
        } else {
          setLoginError('System admin login failed');
          await SecurityLogger.logEvent(
            'LOGIN_FAILURE',
            'System admin login failed',
            'HIGH'
          );
        }
      } else {
        // Check if it's a staff member with admin/super admin role using corporation ID as password
        const upperPassword = trimmedPassword.toUpperCase();
        
        if (!InputValidator.validateCorporationId(upperPassword)) {
          setLoginError('Invalid admin credentials format');
          await SecurityLogger.logEvent(
            'LOGIN_FAILURE',
            'Invalid admin Corporation ID format',
            'MEDIUM'
          );
          setIsLoading(false);
          return;
        }
        
        await usePCRStore.getState().loadStaffMembers();
        const staff = await usePCRStore.getState().validateCorporationId(upperPassword);
        
        if (staff && (staff.role === 'SuperAdmin' || staff.role === 'Admin')) {
          const success = await staffLogin(upperPassword);
          if (success) {
            setPassword('');
            setLoginError('');
            
            await SecurityLogger.logEvent(
              'LOGIN_SUCCESS',
              `Admin staff login successful: ${upperPassword}`,
              'HIGH'
            );
            
            console.log('Admin staff login successful, redirecting to tabs');
            router.replace('/(tabs)');
          } else {
            setLoginError('Admin login failed');
            await SecurityLogger.logEvent(
              'LOGIN_FAILURE',
              `Admin staff login failed: ${upperPassword}`,
              'HIGH'
            );
          }
        } else {
          setLoginError('Invalid admin credentials. Use system password or admin Corporation ID');
          await SecurityLogger.logEvent(
            'LOGIN_FAILURE',
            'Invalid admin credentials provided',
            'MEDIUM'
          );
        }
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setLoginError('Admin login failed. Please try again.');
      await SecurityLogger.logEvent(
        'LOGIN_FAILURE',
        `Admin login error: ${error}`,
        'HIGH'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogin = () => {
    if (loginMode === 'staff') {
      handleStaffLogin();
    } else {
      handleAdminLogin();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ResponsiveContainer maxWidth="small" padding="large" centered>
        <View style={styles.loginContainer}>
          <View style={styles.loginHeader}>
          <View style={styles.logoSection}>
            <Shield size={56} color="#0066CC" />
            <Text style={styles.brandTitle}>MediCare Pro</Text>
            <Text style={styles.brandSubtitle}>Professional ePCR System</Text>
          </View>
          <View style={styles.featuresPreview}>
            <Text style={styles.featuresTitle}>✨ Enterprise Features</Text>
            <Text style={styles.featureItem}>🏥 Complete Patient Documentation</Text>
            <Text style={styles.featureItem}>📊 Real-time Vital Signs Tracking</Text>
            <Text style={styles.featureItem}>🔒 HIPAA Compliant Security</Text>
            <Text style={styles.featureItem}>📱 Offline Capability</Text>
            <Text style={styles.featureItem}>🎤 AI-Powered Voice Notes</Text>
            <Text style={styles.featureItem}>📈 Advanced Analytics Dashboard</Text>
          </View>
        </View>
        
        <View style={styles.loginModeContainer}>
          <Pressable
            style={[styles.modeButton, loginMode === 'staff' && styles.modeButtonActive]}
            onPress={() => {
              setLoginMode('staff');
              setLoginError('');
              setPassword('');
              setCorporationId('');
            }}
          >
            <Users size={20} color={loginMode === 'staff' ? '#fff' : '#0066CC'} />
            <Text style={[styles.modeButtonText, loginMode === 'staff' && styles.modeButtonTextActive]}>
              Staff Access
            </Text>
          </Pressable>
          
          <Pressable
            style={[styles.modeButton, loginMode === 'admin' && styles.modeButtonActive]}
            onPress={() => {
              setLoginMode('admin');
              setLoginError('');
              setPassword('');
              setCorporationId('');
            }}
          >
            <Shield size={20} color={loginMode === 'admin' ? '#fff' : '#DC2626'} />
            <Text style={[styles.modeButtonText, loginMode === 'admin' && styles.modeButtonTextActive, loginMode === 'admin' && styles.adminModeText]}>
              Admin Only
            </Text>
          </Pressable>
        </View>
        
        {loginMode === 'staff' ? (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Corporation ID</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your Corporation ID (e.g., PARA001)"
              value={corporationId}
              onChangeText={(text) => {
                setCorporationId(text);
                setLoginError('');
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              onSubmitEditing={handleLogin}
              editable={!isLoading}
              clearButtonMode="while-editing"
              returnKeyType="go"
              maxLength={20}
              selectTextOnFocus={true}
            />
            <Text style={styles.inputHint}>
              Use your assigned Corporation ID to access the system
            </Text>
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Admin Credentials</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter system password or admin Corporation ID"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setLoginError('');
              }}
              secureTextEntry
              autoCapitalize="characters"
              onSubmitEditing={handleLogin}
              editable={!isLoading}
              clearButtonMode="while-editing"
              returnKeyType="go"
              selectTextOnFocus={true}
            />
          </View>
        )}
        
        {loginError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{loginError}</Text>
          </View>
        ) : null}
        
        <Pressable
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.loginButtonText}>
            {isLoading ? 'Authenticating...' : 'Login'}
          </Text>
        </Pressable>
        
        <Pressable
          style={styles.learnMoreButton}
          onPress={() => setShowSalesModal(true)}
        >
          <Text style={styles.learnMoreText}>Learn More About MediCare Pro</Text>
        </Pressable>
        
        {loginMode === 'staff' && (
          <View style={styles.demoContainer}>
            <Text style={styles.demoTitle}>🎯 Demo Access Credentials</Text>
            <View style={styles.credentialsGrid}>
              <View style={styles.credentialCard}>
                <Text style={styles.credentialRole}>👨‍⚕️ Paramedics</Text>
                <Text style={styles.demoId}>PARA001 - John Smith</Text>
                <Text style={styles.demoId}>PARA002 - Sarah Johnson</Text>
              </View>
              <View style={styles.credentialCard}>
                <Text style={styles.credentialRole}>👩‍⚕️ Medical Staff</Text>
                <Text style={styles.demoId}>NURSE001 - Emily Davis</Text>
                <Text style={styles.demoId}>DOC001 - Dr. Michael Brown</Text>
              </View>
              <View style={styles.credentialCard}>
                <Text style={styles.credentialRole}>👔 Supervisors</Text>
                <Text style={styles.demoId}>SUP001 - Lisa Wilson</Text>
              </View>
            </View>
            <Text style={styles.demoNote}>💡 Admin accounts use "Admin Only" login mode</Text>
          </View>
        )}
        
        {loginMode === 'admin' && (
          <View style={styles.adminHintContainer}>
            <Text style={styles.adminHintTitle}>🔐 Administrator Dashboard</Text>
            <Text style={styles.adminHintText}>System Password: &quot;admin123&quot;</Text>
            <Text style={styles.adminHintSubtext}>Or use Admin/Super Admin Corporation ID:</Text>
            <View style={styles.adminFeaturesList}>
              <Text style={styles.adminFeature}>• SUPER001 - Super Administrator</Text>
              <Text style={styles.adminFeature}>• ADMIN001 - System Administrator</Text>
            </View>
            <Text style={styles.adminHintSubtext}>🚀 Premium Admin Features:</Text>
            <View style={styles.adminFeaturesList}>
              <Text style={styles.adminFeature}>• 📊 Real-time Analytics Dashboard</Text>
              <Text style={styles.adminFeature}>• 👥 Staff Management & Permissions</Text>
              <Text style={styles.adminFeature}>• 📈 Performance Metrics & KPIs</Text>
              <Text style={styles.adminFeature}>• 🔍 Advanced Search & Filtering</Text>
              <Text style={styles.adminFeature}>• 📋 Comprehensive Report Export</Text>
              <Text style={styles.adminFeature}>• 🔒 Security & Audit Logs</Text>
            </View>
          </View>
        )}
        
        {/* Security and Debug Actions */}
        <View style={styles.debugContainer}>
          <Pressable
            style={[styles.debugButton, styles.securityButton]}
            onPress={() => setShowSecurityDashboard(true)}
          >
            <Shield size={16} color="#0066CC" />
            <Text style={[styles.debugButtonText, styles.securityButtonText]}>Security Dashboard</Text>
          </Pressable>
          
          <Pressable
            style={styles.debugButton}
            onPress={async () => {
              try {
                console.log('=== CLEARING ALL DATA FOR DEBUG ===');
                await AsyncStorage.clear();
                console.log('All AsyncStorage data cleared');
                
                // Reset store to initial state
                usePCRStore.setState({
                  currentSession: null,
                  isAdmin: false,
                  completedPCRs: [],
                  staffMembers: [],
                });
                
                // Re-initialize staff database and security
                await usePCRStore.getState().initializeStaffDatabase();
                await SecurityManager.initialize();
                
                alert('All data cleared and reset. You can now test login.');
                console.log('=== END CLEARING ALL DATA ===');
              } catch (error) {
                console.error('Error clearing data:', error);
                alert('Error clearing data: ' + error);
              }
            }}
          >
            <Text style={styles.debugButtonText}>🔧 Clear All Data</Text>
          </Pressable>
          
          <Pressable
            style={[styles.debugButton, styles.testButton]}
            onPress={async () => {
              try {
                console.log('=== TESTING LOGOUT VERIFICATION ===');
                const result = await verifyCompleteLogout();
                
                if (result.passed) {
                  alert('✅ Logout verification passed - System is clean');
                } else {
                  alert(`❌ Logout verification failed:\n${result.errors.join('\n')}`);
                }
              } catch (error) {
                console.error('Error testing logout:', error);
                alert('Error testing logout: ' + error);
              }
            }}
          >
            <TestTube size={16} color="#6b7280" />
            <Text style={styles.debugButtonText}>Test Logout State</Text>
          </Pressable>
          
          <Pressable
            style={[styles.debugButton, styles.warningButton]}
            onPress={async () => {
              try {
                console.log('=== CLEARING ALL ACCOUNT LOCKS ===');
                await BruteForceProtection.clearAllLocks();
                alert('✅ All account locks cleared successfully');
                console.log('=== END CLEARING ACCOUNT LOCKS ===');
              } catch (error) {
                console.error('Error clearing locks:', error);
                alert('Error clearing locks: ' + error);
              }
            }}
          >
            <Shield size={16} color="#f59e0b" />
            <Text style={[styles.debugButtonText, styles.warningButtonText]}>Clear Account Locks</Text>
          </Pressable>
        </View>
        
        {/* Account Lockout Warning */}
        {accountLocked && (
          <View style={styles.lockoutWarning}>
            <AlertTriangle size={20} color="#ef4444" />
            <Text style={styles.lockoutText}>
              Account temporarily locked due to multiple failed attempts.
              {lockoutTime > 0 && ` Try again in ${Math.ceil(lockoutTime / (60 * 1000))} minutes.`}
            </Text>
          </View>
        )}
        </View>
        
        {/* Security Dashboard Modal */}
        {showSecurityDashboard && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <SecurityDashboard onClose={() => setShowSecurityDashboard(false)} />
            </View>
          </View>
        )}
        
        {/* Sales Modal */}
        <SalesModal
          visible={showSalesModal}
          onClose={() => setShowSalesModal(false)}
        />
      </ResponsiveContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6f7',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0066CC',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  featuresPreview: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
    maxWidth: 400,
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 12,
  },
  featureItem: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 6,
    textAlign: 'left',
  },
  loginModeContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    padding: 4,
    width: '100%',
    maxWidth: 400,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modeButtonActive: {
    backgroundColor: '#0066CC',
  },
  modeButtonText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#0066CC',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  adminModeText: {
    color: '#DC2626',
  },
  inputContainer: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
    minHeight: 44,
    color: '#374151',
  },
  inputHint: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  errorContainer: {
    marginBottom: 16,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    textAlign: 'center',
  },
  loginButton: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#0066CC',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  learnMoreButton: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#0066CC',
  },
  learnMoreText: {
    color: '#0066CC',
    fontSize: 14,
    fontWeight: '600',
  },
  demoContainer: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
    maxWidth: 400,
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  credentialsGrid: {
    gap: 12,
    marginBottom: 16,
  },
  credentialCard: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  credentialRole: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0066CC',
    marginBottom: 8,
  },
  demoId: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 3,
    fontFamily: 'monospace',
  },
  demoNote: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  hintContainer: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0066CC',
  },
  hintText: {
    fontSize: 12,
    color: '#0066CC',
    textAlign: 'center',
  },
  hintSubtext: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  adminHintContainer: {
    backgroundColor: '#fef7ff',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
    width: '100%',
    maxWidth: 400,
  },
  adminHintTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8b5cf6',
    textAlign: 'center',
    marginBottom: 12,
  },
  adminHintText: {
    fontSize: 13,
    color: '#7c3aed',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 12,
  },
  adminHintSubtext: {
    fontSize: 12,
    color: '#6b46c1',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '500',
  },
  adminFeaturesList: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  adminFeature: {
    fontSize: 11,
    color: '#5b21b6',
    marginBottom: 4,
    paddingLeft: 8,
  },
  debugContainer: {
    marginTop: 20,
    gap: 8,
    width: '100%',
    maxWidth: 400,
  },
  debugButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  testButton: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  warningButton: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  warningButtonText: {
    color: '#f59e0b',
  },
  securityButton: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  debugButtonText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  securityButtonText: {
    color: '#0066CC',
  },
  lockoutWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginTop: 16,
    width: '100%',
    maxWidth: 400,
  },
  lockoutText: {
    fontSize: 14,
    color: '#ef4444',
    marginLeft: 8,
    flex: 1,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    width: '90%',
    maxWidth: 600,
    height: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
});

export default LoginScreen;