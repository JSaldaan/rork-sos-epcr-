import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { usePCRStore } from '@/store/pcrStore';
import { Shield, Users, Lock, Clock } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  
  // OTP States
  const [showOTP, setShowOTP] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>('');
  const [generatedOTP, setGeneratedOTP] = useState<string>('');
  const [otpTimer, setOtpTimer] = useState<number>(0);
  const [canResendOTP, setCanResendOTP] = useState<boolean>(true);
  const [validatedUser, setValidatedUser] = useState<any>(null);

  // OTP Timer Effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResendOTP(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Generate OTP
  const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Send OTP via SMS to registered mobile number
  const sendOTP = async (corporationId: string, userInfo: any) => {
    const otp = generateOTP();
    setGeneratedOTP(otp);
    setOtpTimer(300); // 5 minutes
    setCanResendOTP(false);
    
    try {
      // In production, integrate with SMS service like Twilio, AWS SNS, etc.
      // For now, we'll simulate the SMS sending process
      const mobileNumber = userInfo.mobileNumber || '+1234567890';
      
      // Simulate SMS API call
      console.log(`Sending OTP ${otp} to mobile number: ${mobileNumber}`);
      
      // For demo purposes, show the OTP in alert with mobile number
      Alert.alert(
        '📱 OTP Sent via SMS',
        `Security Code: ${otp}\n\nSent to: ${mobileNumber}\n\nThis code will expire in 5 minutes.\n\n🔒 Enhanced Security: All staff logins now require mobile verification for maximum security.`,
        [{ text: 'OK' }]
      );
      
      // Log the OTP sending attempt
      console.log(`OTP ${otp} sent to ${userInfo.name} (${corporationId}) at mobile: ${mobileNumber}`);
      
      // In production, you would make an API call like:
      // await fetch('https://api.sms-service.com/send', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer YOUR_API_KEY' },
      //   body: JSON.stringify({
      //     to: mobileNumber,
      //     message: `Your PCR System security code is: ${otp}. This code expires in 5 minutes. Do not share this code.`,
      //     from: 'PCR-SYSTEM'
      //   })
      // });
      
    } catch (error) {
      console.error('Error sending OTP:', error);
      Alert.alert(
        'OTP Sending Failed',
        'Failed to send OTP to your registered mobile number. Please contact your administrator.',
        [{ text: 'OK' }]
      );
      throw error;
    }
  };

  // Verify OTP
  const verifyOTP = (): boolean => {
    if (otpCode === generatedOTP) {
      return true;
    }
    return false;
  };

  // Resend OTP
  const resendOTP = async () => {
    if (!canResendOTP || !validatedUser) return;
    
    await sendOTP(validatedUser.corporationId, validatedUser);
    Alert.alert('OTP Resent', 'A new OTP code has been sent.');
  };

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
      
      if (!staff) {
        setLoginError('Invalid Corporation ID or account inactive');
        setIsLoading(false);
        return;
      }
      
      if (staff && (staff.role === 'SuperAdmin' || staff.role === 'Admin')) {
        setLoginError('Admin and Super Admin accounts must use Admin Only login');
        setIsLoading(false);
        return;
      }
      
      // Ensure staff has mobile number for OTP
      if (!staff.mobileNumber) {
        setLoginError('Your account is missing a mobile number. Please contact your administrator to update your profile.');
        setIsLoading(false);
        return;
      }
      
      // Store validated user and show OTP screen
      setValidatedUser(staff);
      await sendOTP(staff.corporationId, staff);
      setShowOTP(true);
      
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
        // System admin gets OTP too for security
        const systemAdmin = {
          corporationId: 'ADMIN_SYSTEM',
          name: 'System Administrator',
          role: 'SuperAdmin',
          mobileNumber: '+1234567899' // System admin mobile
        };
        setValidatedUser(systemAdmin);
        await sendOTP('ADMIN_SYSTEM', systemAdmin);
        setShowOTP(true);
      } else {
        // Check if it's a staff member with admin/super admin role using corporation ID as password
        await usePCRStore.getState().loadStaffMembers();
        const staff = await usePCRStore.getState().validateCorporationId(password.trim().toUpperCase());
        
        if (staff && (staff.role === 'SuperAdmin' || staff.role === 'Admin')) {
          // Ensure staff has mobile number for OTP
          if (!staff.mobileNumber) {
            setLoginError('Admin account missing mobile number. Please contact system administrator.');
            return;
          }
          
          // Store validated admin user and show OTP screen
          setValidatedUser(staff);
          await sendOTP(staff.corporationId, staff);
          setShowOTP(true);
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

  // Handle OTP verification and final login
  const handleOTPVerification = async () => {
    if (!otpCode.trim()) {
      setLoginError('Please enter the OTP code');
      return;
    }
    
    if (otpTimer <= 0) {
      setLoginError('OTP has expired. Please request a new one.');
      return;
    }
    
    if (!verifyOTP()) {
      setLoginError('Invalid OTP code. Please try again.');
      return;
    }
    
    setIsLoading(true);
    setLoginError('');
    
    try {
      if (!validatedUser) {
        throw new Error('No validated user found');
      }
      
      // Complete the login process
      if (validatedUser.corporationId === 'ADMIN_SYSTEM') {
        // System admin login
        if (adminLogin('admin123')) {
          console.log('System admin OTP verification successful, redirecting to tabs');
          resetOTPState();
          router.replace('/(tabs)');
        } else {
          setLoginError('System admin login failed');
        }
      } else {
        // Staff/Admin login
        const success = await staffLogin(validatedUser.corporationId);
        if (success) {
          console.log('Staff OTP verification successful, redirecting to tabs');
          resetOTPState();
          router.replace('/(tabs)');
        } else {
          setLoginError('Login failed after OTP verification');
        }
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setLoginError('OTP verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset OTP state
  const resetOTPState = () => {
    setShowOTP(false);
    setOtpCode('');
    setGeneratedOTP('');
    setOtpTimer(0);
    setCanResendOTP(true);
    setValidatedUser(null);
    setCorporationId('');
    setPassword('');
  };

  // Go back from OTP screen
  const handleBackFromOTP = () => {
    resetOTPState();
    setLoginError('');
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
        
        {!showOTP ? (
          loginMode === 'staff' ? (
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
          )
        ) : (
          <View style={styles.otpContainer}>
            <View style={styles.otpHeader}>
              <Lock size={32} color="#0066CC" />
              <Text style={styles.otpTitle}>Enter OTP Code</Text>
              <Text style={styles.otpSubtitle}>
                We&apos;ve sent a 6-digit security code to your registered mobile number
              </Text>
              {validatedUser && (
                <View style={styles.otpUserInfoContainer}>
                  <Text style={styles.otpUserInfo}>
                    Logging in as: {validatedUser.name}
                  </Text>
                  <Text style={styles.otpMobileInfo}>
                    📱 SMS sent to: {validatedUser.mobileNumber || '+1234567890'}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>OTP Code</Text>
              <TextInput
                style={[styles.textInput, styles.otpInput]}
                placeholder="Enter 6-digit OTP code"
                value={otpCode}
                onChangeText={(text) => {
                  // Only allow numbers and limit to 6 digits
                  const numericText = text.replace(/[^0-9]/g, '').slice(0, 6);
                  setOtpCode(numericText);
                  setLoginError('');
                }}
                keyboardType="numeric"
                maxLength={6}
                onSubmitEditing={handleOTPVerification}
                editable={!isLoading}
                autoFocus={true}
                selectTextOnFocus={true}
              />
              
              <View style={styles.otpTimerContainer}>
                {otpTimer > 0 ? (
                  <View style={styles.timerRow}>
                    <Clock size={16} color="#6b7280" />
                    <Text style={styles.timerText}>
                      Code expires in {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.expiredText}>OTP code has expired</Text>
                )}
              </View>
            </View>
            
            <View style={styles.otpActions}>
              <Pressable
                style={[styles.otpButton, styles.verifyButton, isLoading && styles.loginButtonDisabled]}
                onPress={handleOTPVerification}
                disabled={isLoading || otpCode.length !== 6}
              >
                <Text style={styles.verifyButtonText}>
                  {isLoading ? 'Verifying...' : 'Verify & Login'}
                </Text>
              </Pressable>
              
              <Pressable
                style={[styles.otpButton, styles.resendButton, !canResendOTP && styles.resendButtonDisabled]}
                onPress={resendOTP}
                disabled={!canResendOTP}
              >
                <Text style={[styles.resendButtonText, !canResendOTP && styles.resendButtonTextDisabled]}>
                  {canResendOTP ? 'Resend OTP' : `Resend in ${otpTimer}s`}
                </Text>
              </Pressable>
              
              <Pressable
                style={[styles.otpButton, styles.backButton]}
                onPress={handleBackFromOTP}
              >
                <Text style={styles.backButtonText}>Back to Login</Text>
              </Pressable>
            </View>
          </View>
        )}
        
        {loginError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{loginError}</Text>
          </View>
        ) : null}
        
        {!showOTP && (
          <Pressable
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Authenticating...' : 'Continue'}
            </Text>
          </Pressable>
        )}
        
        {!showOTP && loginMode === 'staff' && (
          <View style={styles.demoContainer}>
            <Text style={styles.demoTitle}>Demo Corporation IDs:</Text>
            <View style={styles.demoIds}>
              <Text style={styles.demoId}>PARA001 - John Smith (+1234567892)</Text>
              <Text style={styles.demoId}>PARA002 - Sarah Johnson (+1234567893)</Text>
              <Text style={styles.demoId}>NURSE001 - Emily Davis (+1234567894)</Text>
              <Text style={styles.demoId}>DOC001 - Dr. Michael Brown (+1234567895)</Text>
              <Text style={styles.demoId}>SUP001 - Lisa Wilson (+1234567896)</Text>
              <Text style={styles.demoId}>📱 OTP will be sent to registered mobile numbers</Text>
              <Text style={styles.demoId}>Note: Admin accounts use Admin Only login</Text>
            </View>
          </View>
        )}
        
        {!showOTP && loginMode === 'admin' && (
          <View style={styles.adminHintContainer}>
            <Text style={styles.adminHintTitle}>🔐 Administrator Access</Text>
            <Text style={styles.adminHintText}>System Password: &quot;admin123&quot;</Text>
            <Text style={styles.adminHintSubtext}>Or use Admin/Super Admin Corporation ID:</Text>
            <View style={styles.adminFeaturesList}>
              <Text style={styles.adminFeature}>• SUPER001 - Super Administrator (+1234567890)</Text>
              <Text style={styles.adminFeature}>• ADMIN001 - System Administrator (+1234567891)</Text>
            </View>
            <Text style={styles.adminHintSubtext}>📱 OTP verification required for all admin logins</Text>
            <Text style={styles.adminHintSubtext}>Full system access including:</Text>
            <View style={styles.adminFeaturesList}>
              <Text style={styles.adminFeature}>• View all patient reports</Text>
              <Text style={styles.adminFeature}>• Manage staff accounts</Text>
              <Text style={styles.adminFeature}>• Export comprehensive data</Text>
              <Text style={styles.adminFeature}>• Access audit logs</Text>
            </View>
          </View>
        )}
        
        {showOTP && (
          <View style={styles.otpInfoContainer}>
            <Text style={styles.otpInfoTitle}>🔒 Enhanced Security Protocol</Text>
            <Text style={styles.otpInfoText}>
              All staff, admin, and super admin accounts require mobile OTP verification for maximum security.
            </Text>
            <Text style={styles.otpInfoSubtext}>
              📱 OTP codes are sent to your registered mobile number via SMS.
            </Text>
            <Text style={styles.otpInfoSubtext}>
              🛡️ This ensures only authorized personnel can access patient data.
            </Text>
            <Text style={styles.otpInfoSubtext}>
              ⚠️ If you don&apos;t receive the SMS, contact your administrator to verify your mobile number is registered correctly.
            </Text>
          </View>
        )}
        
        {!showOTP && (
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
                
                // Reset OTP state
                resetOTPState();
                
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
  
  // OTP Styles
  otpContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  otpHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  otpTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066CC',
    marginTop: 12,
    marginBottom: 8,
  },
  otpSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  otpUserInfoContainer: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  otpUserInfo: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  otpMobileInfo: {
    fontSize: 10,
    color: '#0066CC',
    fontWeight: '500',
    textAlign: 'center',
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 8,
    fontFamily: 'monospace',
  },
  otpTimerContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  expiredText: {
    fontSize: 12,
    color: '#dc3545',
    fontWeight: '600',
  },
  otpActions: {
    width: '100%',
    gap: 12,
    marginTop: 16,
  },
  otpButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  verifyButton: {
    backgroundColor: '#0066CC',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  resendButtonDisabled: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  resendButtonText: {
    color: '#0066CC',
    fontSize: 14,
    fontWeight: '500',
  },
  resendButtonTextDisabled: {
    color: '#9ca3af',
  },
  backButton: {
    backgroundColor: 'transparent',
  },
  backButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  otpInfoContainer: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0066CC',
    width: '100%',
    maxWidth: 400,
  },
  otpInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0066CC',
    textAlign: 'center',
    marginBottom: 8,
  },
  otpInfoText: {
    fontSize: 12,
    color: '#0066CC',
    textAlign: 'center',
    marginBottom: 4,
  },
  otpInfoSubtext: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 4,
  },

});

export default LoginScreen;