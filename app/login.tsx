import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { usePCRStore } from '@/store/pcrStore';
import { Shield, Users, AlertTriangle } from 'lucide-react-native';
import { textStyles, fonts } from '@/constants/fonts';
import { colors, iosColors } from '@/constants/colors';

// Simplified login without complex security features for iOS compatibility

import { ResponsiveContainer } from '@/components/ResponsiveLayout';



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


  // Simplified initialization for iOS compatibility
  useEffect(() => {
    console.log('Login screen initialized');
    // Pre-load staff database on login screen for faster login
    if (Platform.OS === 'ios') {
      usePCRStore.getState().initializeStaffDatabase().catch(() => {
        console.log('Staff DB pre-load failed, will retry on login');
      });
    }
  }, []);

  const handleStaffLogin = async () => {
    const trimmedId = corporationId.trim().toUpperCase();
    
    if (!trimmedId) {
      setLoginError('Please enter your Corporation ID');
      return;
    }
    
    // Basic validation
    if (trimmedId.length < 4) {
      setLoginError('Corporation ID must be at least 4 characters');
      return;
    }
    
    setIsLoading(true);
    setLoginError('');
    
    try {
      console.log('Staff login attempt:', trimmedId);
      
      // Load staff members and validate with timeout for iOS
      const loadPromise = usePCRStore.getState().loadStaffMembers();
      if (Platform.OS === 'ios') {
        await Promise.race([
          loadPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
      } else {
        await loadPromise;
      }
      
      const staff = await usePCRStore.getState().validateCorporationId(trimmedId);
      
      if (staff && (staff.role === 'SuperAdmin' || staff.role === 'Admin')) {
        setLoginError('Admin accounts must use Admin Only login');
        setIsLoading(false);
        return;
      }
      
      const success = await staffLogin(trimmedId);
      
      if (success) {
        setCorporationId('');
        setLoginError('');
        console.log('Staff login successful');
        // Small delay for iOS to process state changes
        setTimeout(() => {
          router.replace('/(tabs)');
        }, Platform.OS === 'ios' ? 100 : 0);
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
    const trimmedPassword = password.trim();
    
    if (!trimmedPassword) {
      setLoginError('Please enter admin credentials');
      return;
    }
    
    setIsLoading(true);
    setLoginError('');
    
    try {
      console.log('Admin login attempt');
      
      // Check if it's the system admin password
      if (trimmedPassword === 'admin123') {
        if (adminLogin(trimmedPassword)) {
          setPassword('');
          setLoginError('');
          console.log('System admin login successful');
          // Small delay for iOS to process state changes
          setTimeout(() => {
            router.replace('/(tabs)');
          }, Platform.OS === 'ios' ? 100 : 0);
        } else {
          setLoginError('System admin login failed');
        }
      } else {
        // Check if it's a staff member with admin role
        const upperPassword = trimmedPassword.toUpperCase();
        
        if (upperPassword.length < 4) {
          setLoginError('Invalid admin credentials format');
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
            console.log('Admin staff login successful');
            // Small delay for iOS to process state changes
            setTimeout(() => {
              router.replace('/(tabs)');
            }, Platform.OS === 'ios' ? 100 : 0);
          } else {
            setLoginError('Admin login failed');
          }
        } else {
          setLoginError('Invalid admin credentials');
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
      <StatusBar 
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'default'}
        backgroundColor={Platform.OS === 'android' ? '#f5f6f7' : undefined}
      />
      <ResponsiveContainer maxWidth="small" padding="large" centered>
        <View style={styles.loginContainer}>
          <View style={styles.loginHeader}>
          <View style={styles.logoSection}>
            <Shield size={56} color="#0066CC" />
            <Text style={styles.brandTitle}>MediCare Pro</Text>
            <Text style={styles.brandSubtitle}>Professional ePCR System</Text>
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
        

        

        

        

        

        </View>

        

      </ResponsiveContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Platform.OS === 'ios' ? iosColors.systemBackground : '#f5f6f7',
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
    ...textStyles.largeTitle,
    color: '#0066CC',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    ...textStyles.caption1,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: fonts.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
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
    ...textStyles.caption1,
    fontWeight: fonts.weights.semibold,
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
    ...textStyles.labelText,
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...textStyles.inputText,
    backgroundColor: '#fff',
    marginBottom: 8,
    minHeight: 44,
    color: '#374151',
  },
  inputHint: {
    ...textStyles.caption1,
    color: '#6b7280',
    textAlign: 'center',
  },
  errorContainer: {
    marginBottom: 16,
  },
  errorText: {
    ...textStyles.errorText,
    color: '#dc3545',
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
    ...textStyles.buttonText,
    color: '#fff',
  },


  hintContainer: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0066CC',
  },
  hintText: {
    ...textStyles.caption1,
    color: '#0066CC',
    textAlign: 'center',
  },
  hintSubtext: {
    ...textStyles.caption2,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
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
    ...textStyles.subheadline,
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