import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { usePCRStore } from '@/store/pcrStore';
import { Shield, Users } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
      // Validate the corporation ID and login directly
      const success = await staffLogin(corporationId.trim().toUpperCase());
      if (success) {
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
        if (adminLogin('admin123')) {
          console.log('System admin login successful, redirecting to tabs');
          router.replace('/(tabs)');
        } else {
          setLoginError('System admin login failed');
        }
      } else {
        // Check if it's a staff member with admin/super admin role using corporation ID as password
        const success = await staffLogin(password.trim().toUpperCase());
        if (success) {
          console.log('Admin staff login successful, redirecting to tabs');
          router.replace('/(tabs)');
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
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
            <Users size={screenWidth < 400 ? 18 : 20} color={loginMode === 'staff' ? '#fff' : '#0066CC'} />
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
            <Shield size={screenWidth < 400 ? 18 : 20} color={loginMode === 'admin' ? '#fff' : '#DC2626'} />
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
          <Text style={styles.debugButtonText}>🔧 Clear All Data (Debug)</Text>
        </Pressable>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6f7',
  },
  scrollContainer: {
    flexGrow: 1,
    minHeight: screenHeight,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Math.max(16, screenWidth * 0.04),
    minHeight: screenHeight - 100,
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  loginTitle: {
    fontSize: Math.min(28, screenWidth * 0.07),
    fontWeight: 'bold',
    color: '#0066CC',
    marginTop: 16,
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: Math.min(16, screenWidth * 0.04),
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: Math.min(32, screenHeight * 0.04),
  },
  loginModeContainer: {
    flexDirection: 'row',
    marginBottom: Math.min(24, screenHeight * 0.03),
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    padding: 4,
    width: '100%',
    maxWidth: Math.min(400, screenWidth * 0.9),
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
    fontSize: Math.max(10, Math.min(12, screenWidth * 0.03)),
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
    maxWidth: Math.min(400, screenWidth * 0.9),
    marginBottom: Math.min(16, screenHeight * 0.02),
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
    paddingHorizontal: Math.min(16, screenWidth * 0.04),
    paddingVertical: Math.min(12, screenHeight * 0.015),
    fontSize: Math.min(16, screenWidth * 0.04),
    backgroundColor: '#fff',
    marginBottom: 8,
    minHeight: Math.max(44, screenHeight * 0.055),
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
    maxWidth: Math.min(400, screenWidth * 0.9),
    backgroundColor: '#0066CC',
    paddingVertical: Math.min(12, screenHeight * 0.015),
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: Math.min(24, screenHeight * 0.03),
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
    padding: Math.min(16, screenWidth * 0.04),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    width: '100%',
    maxWidth: Math.min(400, screenWidth * 0.9),
    marginBottom: Math.min(16, screenHeight * 0.02),
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
    padding: Math.min(16, screenWidth * 0.04),
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    width: '100%',
    maxWidth: Math.min(400, screenWidth * 0.9),
    marginBottom: Math.min(16, screenHeight * 0.02),
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
  debugButton: {
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  debugButtonText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  


});

export default LoginScreen;