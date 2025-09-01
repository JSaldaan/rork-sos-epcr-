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
import { Shield, Users, Settings } from 'lucide-react-native';

const LoginScreen: React.FC = () => {
  const {
    adminLogin,
    staffLogin,
    currentSession,
    isAdmin,
  } = usePCRStore();
  
  const [password, setPassword] = useState<string>('');
  const [corporationId, setCorporationId] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [loginMode, setLoginMode] = useState<'staff' | 'admin' | 'superadmin'>('staff');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Check if user is already logged in and redirect
  useEffect(() => {
    if (currentSession || isAdmin) {
      console.log('User already logged in, redirecting to tabs');
      router.replace('/(tabs)');
    }
  }, [currentSession, isAdmin]);

  const handleStaffLogin = async () => {
    if (!corporationId.trim()) {
      setLoginError('Please enter your Corporation ID');
      return;
    }
    
    setIsLoading(true);
    setLoginError('');
    
    try {
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
  
  const handleAdminLogin = () => {
    if (adminLogin(password)) {
      setPassword('');
      setLoginError('');
      console.log('Admin login successful, redirecting to tabs');
      router.replace('/(tabs)');
    } else {
      setLoginError('Invalid admin password');
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
              Staff Login
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
            <Shield size={20} color={loginMode === 'admin' ? '#fff' : '#0066CC'} />
            <Text style={[styles.modeButtonText, loginMode === 'admin' && styles.modeButtonTextActive]}>
              Admin
            </Text>
          </Pressable>
          
          <Pressable
            style={[styles.modeButton, loginMode === 'superadmin' && styles.modeButtonActive]}
            onPress={() => {
              setLoginMode('superadmin');
              setLoginError('');
              setPassword('');
              setCorporationId('');
            }}
          >
            <Settings size={20} color={loginMode === 'superadmin' ? '#fff' : '#dc3545'} />
            <Text style={[styles.modeButtonText, loginMode === 'superadmin' && styles.modeButtonTextActive]}>
              Super Admin
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
        ) : loginMode === 'admin' ? (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Admin Password</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter admin password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setLoginError('');
              }}
              secureTextEntry
              autoCapitalize="none"
              onSubmitEditing={handleLogin}
              editable={!isLoading}
              clearButtonMode="while-editing"
              returnKeyType="go"
              selectTextOnFocus={true}
            />
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Super Admin Password</Text>
            <TextInput
              style={[styles.textInput, styles.superAdminInput]}
              placeholder="Enter super admin password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setLoginError('');
              }}
              secureTextEntry
              autoCapitalize="none"
              onSubmitEditing={handleLogin}
              editable={!isLoading}
              clearButtonMode="while-editing"
              returnKeyType="go"
              selectTextOnFocus={true}
            />
            <Text style={styles.superAdminHint}>
              Super Admin can manage staff Corporation IDs and system settings
            </Text>
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
              <Text style={styles.demoId}>ADMIN001 - System Admin</Text>
              <Text style={styles.demoId}>PARA001 - John Smith</Text>
              <Text style={styles.demoId}>PARA002 - Sarah Johnson</Text>
              <Text style={styles.demoId}>NURSE001 - Emily Davis</Text>
              <Text style={styles.demoId}>DOC001 - Dr. Michael Brown</Text>
              <Text style={styles.demoId}>SUP001 - Lisa Wilson</Text>
            </View>
          </View>
        )}
        
        {loginMode === 'admin' && (
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>Demo Password: &quot;admin123&quot;</Text>
            <Text style={styles.hintSubtext}>Admin can view and manage PCR reports</Text>
          </View>
        )}
        
        {loginMode === 'superadmin' && (
          <View style={[styles.hintContainer, styles.superAdminHintContainer]}>
            <Text style={[styles.hintText, styles.superAdminHintText]}>Demo Password: &quot;superadmin2024&quot;</Text>
            <Text style={[styles.hintSubtext, styles.superAdminHintSubtext]}>Super Admin has full system access including staff management</Text>
          </View>
        )}
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
  superAdminInput: {
    borderColor: '#dc3545',
    borderWidth: 2,
  },
  superAdminHint: {
    fontSize: 12,
    color: '#dc3545',
    textAlign: 'center',
    fontWeight: '500',
  },
  superAdminHintContainer: {
    backgroundColor: '#fef2f2',
    borderLeftColor: '#dc3545',
  },
  superAdminHintText: {
    color: '#dc3545',
    fontWeight: '600',
  },
  superAdminHintSubtext: {
    color: '#dc3545',
    fontWeight: '500',
  },
});

export default LoginScreen;