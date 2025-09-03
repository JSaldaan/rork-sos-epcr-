import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { LogOut } from 'lucide-react-native';
import { useLogout } from '@/hooks/useLogout';

interface LogoutButtonProps {
  variant?: 'button' | 'tab' | 'header' | 'floating' | 'minimal';
  showText?: boolean;
  iconSize?: number;
  color?: string;
  backgroundColor?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  showConfirmation?: boolean;
  style?: any;
  confirmTitle?: string;
  confirmMessage?: string;
  testID?: string;
}

/**
 * Universal logout button that works from any screen or form
 */
export const LogoutButton: React.FC<LogoutButtonProps> = ({
  variant = 'button',
  showText = true,
  iconSize = 20,
  color,
  backgroundColor,
  position = 'top-right',
  showConfirmation = true,
  style,
  confirmTitle,
  confirmMessage,
  testID,
}) => {
  const { logout, isLoggingOut, isLoggedIn, currentSession } = useLogout();

  // Set default colors based on variant
  const getDefaultColor = () => {
    switch (variant) {
      case 'header':
        return '#FFFFFF';
      case 'floating':
        return '#FFFFFF';
      default:
        return '#FF3B30';
    }
  };

  const getDefaultBackgroundColor = () => {
    switch (variant) {
      case 'header':
        return 'rgba(255, 255, 255, 0.15)';
      case 'floating':
        return '#FF3B30';
      case 'button':
        return '#FFEBEE';
      default:
        return 'transparent';
    }
  };

  const finalColor = color || getDefaultColor();
  const finalBackgroundColor = backgroundColor || getDefaultBackgroundColor();

  const handleLogout = () => {
    logout({
      showConfirmation,
      confirmTitle,
      confirmMessage,
    });
  };

  // Don't render if no session (user not logged in)
  if (!isLoggedIn()) {
    return null;
  }

  const getButtonStyle = () => {
    const baseStyle = [
      styles[variant],
      { backgroundColor: finalBackgroundColor },
      isLoggingOut && styles.disabled,
    ];

    if (variant === 'floating') {
      const positionStyle = styles[position];
      return [baseStyle, positionStyle, style];
    }

    return [baseStyle, style];
  };

  const getButtonText = () => {
    if (isLoggingOut) {
      return 'Logging out...';
    }
    
    switch (variant) {
      case 'minimal':
        return 'Exit';
      default:
        return 'Logout';
    }
  };

  const renderContent = () => (
    <>
      <LogOut size={iconSize} color={finalColor} />
      {showText && (
        <Text style={[styles.text, { color: finalColor }]}>
          {getButtonText()}
        </Text>
      )}
    </>
  );

  if (variant === 'floating') {
    return (
      <View style={styles.floatingContainer}>
        <TouchableOpacity
          style={getButtonStyle()}
          onPress={handleLogout}
          disabled={isLoggingOut}
          testID={testID || `logout-${variant}`}
          accessibilityLabel={`Logout ${currentSession?.name || 'user'}`}
          accessibilityHint="Logs out and returns to login screen"
        >
          {renderContent()}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={handleLogout}
      disabled={isLoggingOut}
      testID={testID || `logout-${variant}`}
      accessibilityLabel={`Logout ${currentSession?.name || 'user'}`}
      accessibilityHint="Logs out and returns to login screen"
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
    borderLeftWidth: 1,
    borderLeftColor: '#E5E5E5',
  },
  floating: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  minimal: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    gap: 4,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
  floatingContainer: {
    position: 'absolute',
    zIndex: 1000,
  },
  'top-right': {
    top: 60,
    right: 20,
  },
  'top-left': {
    top: 60,
    left: 20,
  },
  'bottom-right': {
    bottom: 100,
    right: 20,
  },
  'bottom-left': {
    bottom: 100,
    left: 20,
  },
});