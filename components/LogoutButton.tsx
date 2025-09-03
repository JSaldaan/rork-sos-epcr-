import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, ViewStyle, TextStyle } from 'react-native';
import { LogOut } from 'lucide-react-native';
import { performCompleteLogout } from '@/utils/auth';
import { usePCRStore } from '@/store/pcrStore';

interface LogoutButtonProps {
  style?: ViewStyle;
  textStyle?: TextStyle;
  iconSize?: number;
  iconColor?: string;
  showText?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  onLogoutStart?: () => void;
  onLogoutComplete?: () => void;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  style,
  textStyle,
  iconSize = 20,
  iconColor,
  showText = true,
  variant = 'danger',
  onLogoutStart,
  onLogoutComplete,
}) => {
  const { currentSession, isLoggingOut, addAuditLog } = usePCRStore();

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          button: styles.primaryButton,
          text: styles.primaryText,
          defaultIconColor: '#fff',
        };
      case 'secondary':
        return {
          button: styles.secondaryButton,
          text: styles.secondaryText,
          defaultIconColor: '#666',
        };
      case 'danger':
      default:
        return {
          button: styles.dangerButton,
          text: styles.dangerText,
          defaultIconColor: '#FF3B30',
        };
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) {
      console.log('Logout already in progress, ignoring button press');
      return;
    }

    Alert.alert(
      'Confirm Logout',
      `Are you sure you want to logout${currentSession ? ` ${currentSession.name}` : ''}? All unsaved data will be lost.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('=== LOGOUT BUTTON: Starting logout process ===');
              onLogoutStart?.();
              
              // Add audit log before logout
              if (currentSession) {
                await addAuditLog(
                  'USER_LOGOUT',
                  'System',
                  currentSession.corporationId,
                  `User ${currentSession.name} (${currentSession.role}) initiated logout`
                );
              }
              
              // Perform complete logout
              const result = await performCompleteLogout();
              
              if (result.success) {
                console.log('✅ LOGOUT BUTTON: Logout successful');
                onLogoutComplete?.();
              } else {
                console.error('❌ LOGOUT BUTTON: Logout failed:', result.error);
                Alert.alert(
                  'Logout Error',
                  'There was an issue logging out completely. Please try again or restart the app.',
                  [{ text: 'OK' }]
                );
              }
            } catch (error) {
              console.error('❌ LOGOUT BUTTON: Logout error:', error);
              // Force logout even if there's an error
              try {
                await performCompleteLogout();
              } catch (forceError) {
                console.error('❌ LOGOUT BUTTON: Force logout also failed:', forceError);
                Alert.alert(
                  'Logout Error',
                  'Failed to logout properly. Please restart the app.',
                  [{ text: 'OK' }]
                );
              }
            }
          },
        },
      ]
    );
  };

  const variantStyles = getVariantStyles();
  const finalIconColor = iconColor || variantStyles.defaultIconColor;

  return (
    <TouchableOpacity
      style={[variantStyles.button, style]}
      onPress={handleLogout}
      disabled={isLoggingOut}
      activeOpacity={0.7}
    >
      <LogOut size={iconSize} color={finalIconColor} />
      {showText && (
        <Text style={[variantStyles.text, textStyle]}>
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0066CC',
    borderRadius: 8,
    gap: 8,
  },
  primaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    gap: 8,
  },
  secondaryText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
    gap: 8,
  },
  dangerText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
});