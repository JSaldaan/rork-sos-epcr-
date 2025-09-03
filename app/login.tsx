import React, { useState } from 'react';
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
import { Shield, Users, TestTube } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { verifyCompleteLogout } from '@/utils/auth';

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

  // Don't auto-redirect if user is already logged in
  // Let them stay on login page and manually navigate to tabs if they want
  // This ensures the app always starts from login page

  const handleStaffLogin = async () => {
    if (!corporationId.trim()) {
      setLoginError('Please enter your Corporation ID');
      return;
    }
    
    setIsLoading(true);
    setLoginError('');
    
    try {
      // First validate the corporation ID to check role
      await usePCRStore.getState().loadStaffMembers();
      const staff = await usePCRStore.getState().validateCorporationId(corporationId.trim().toUpperCase());
      
      if (staff && (staff.role === 'SuperAdmin' || staff.role === 'Admin')) {
        setLoginError('Admin and Super Admin accounts must use Admin Only login');
        setIsLoading(false);
        return;
      }
      
      const success = await staffLogin(corporationId.trim().toUpperCase());
      if (success) {
        setCorporationId('');
        setLoginError('');
        console.log('Staff login successful, redirecting to tabs');
        router.replace('/(tabs)');
      } else {
        setLoginError('Invalid Corporation ID or account inactive');
      }
    } catch (error) {
      console.error('Staff login error:', error);
      setLoginError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAdminLogin = async () => {
    if (!password.trim()) {
      setLoginError('Please enter admin credentials');
      return;
    }
    
    setIsLoading(true);
    setLoginError('');
    
    try {
      // Check if it's the system admin password
      if (password === 'admin123') {
        if (adminLogin(password)) {
          setPassword('');
          setLoginError('');
          console.log('System admin login successful, redirecting to tabs');
          router.replace('/(tabs)');
        } else {
          setLoginError('System admin login failed');
        }
      } else {
        // Check if it's a staff member with admin/super admin role using corporation ID as password
        await usePCRStore.getState().loadStaffMembers();
        const staff = await usePCRStore.getState().validateCorporationId(password.trim().toUpperCase());
        
        if (staff && (staff.role === 'SuperAdmin' || staff.role === 'Admin')) {
          const success = await staffLogin(password.trim().toUpperCase());
          if (success) {
            setPassword('');
            setLoginError('');
            console.log('Admin staff login successful, redirecting to tabs');
            router.replace('/(tabs)');
          } else {
            setLoginError('Admin login failed');
          }
        } else {
          setLoginError('Invalid admin credentials. Use system password or admin Corporation ID');
        }
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setLoginError('Admin login failed. Please try again.');
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
      <View style={styles.loginContainer}>
        <View style={styles.loginHeader}>
          <Shield size={48} color="#0066CC" />
          <Text style={styles.loginTitle}>PCR System</Text>
          <Text style={styles.loginSubtitle}>Electronic Patient Care Record</Text>
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
        
        {loginMode === 'staff' && (
          <View style={styles.demoContainer}>
            <Text style={styles.demoTitle}>Demo Corporation IDs:</Text>
            <View style={styles.demoIds}>
              <Text style={styles.demoId}>PARA001 - John Smith</Text>
              <Text style={styles.demoId}>PARA002 - Sarah Johnson</Text>
              <Text style={styles.demoId}>NURSE001 - Emily Davis</Text>
              <Text style={styles.demoId}>DOC001 - Dr. Michael Brown</Text>
              <Text style={styles.demoId}>SUP001 - Lisa Wilson</Text>
              <Text style={styles.demoId}>Note: Admin accounts use Admin Only login</Text>
            </View>
          </View>
        )}
        
        {loginMode === 'admin' && (
          <View style={styles.adminHintContainer}>
            <Text style={styles.adminHintTitle}>🔐 Administrator Access</Text>
            <Text style={styles.adminHintText}>System Password: &quot;admin123&quot;</Text>
            <Text style={styles.adminHintSubtext}>Or use Admin/Super Admin Corporation ID:</Text>
            <View style={styles.adminFeaturesList}>
              <Text style={styles.adminFeature}>• SUPER001 - Super Administrator</Text>
              <Text style={styles.adminFeature}>• ADMIN001 - System Administrator</Text>
            </View>
            <Text style={styles.adminHintSubtext}>Full system access including:</Text>
            <View style={styles.adminFeaturesList}>
              <Text style={styles.adminFeature}>• View all patient reports</Text>
              <Text style={styles.adminFeature}>• Manage staff accounts</Text>
              <Text style={styles.adminFeature}>• Export comprehensive data</Text>
              <Text style={styles.adminFeature}>• Access audit logs</Text>
            </View>
          </View>
        )}
        
        {/* Debug buttons - remove in production */}
        <View style={styles.debugContainer}>
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
                
                // Re-initialize staff database
                await usePCRStore.getState().initializeStaffDatabase();
                
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
        </View>
      </View>
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
  loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0066CC',
    marginTop: 16,
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
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
  demoContainer: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    width: '100%',
    maxWidth: 400,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  demoIds: {
    alignItems: 'flex-start',
  },
  demoId: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontFamily: 'monospace',
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
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    width: '100%',
    maxWidth: 400,
  },
  adminHintTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 8,
  },
  adminHintText: {
    fontSize: 12,
    color: '#DC2626',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
  },
  adminHintSubtext: {
    fontSize: 11,
    color: '#7f1d1d',
    textAlign: 'center',
    marginBottom: 8,
  },
  adminFeaturesList: {
    alignItems: 'flex-start',
  },
  adminFeature: {
    fontSize: 10,
    color: '#991b1b',
    marginBottom: 2,
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
  debugButtonText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default LoginScreen;