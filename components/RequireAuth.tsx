import React, { useEffect } from 'react';
import { router, useSegments } from 'expo-router';
import { usePCRStore } from '@/store/pcrStore';
import { useLogout } from '@/hooks/useLogout';

interface RequireAuthProps {
  children: React.ReactNode;
  redirectTo?: string;
  allowedRoles?: string[];
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
}

/**
 * Route guard component that protects screens from unauthorized access
 * Automatically redirects to login if no valid session exists
 * Supports role-based access control
 */
export const RequireAuth: React.FC<RequireAuthProps> = ({
  children,
  redirectTo = '/login',
  allowedRoles,
  requireAdmin = false,
  requireSuperAdmin = false,
}) => {
  const { currentSession, isAdmin } = usePCRStore();
  const segments = useSegments();
  const { emergencyLogout } = useLogout();

  useEffect(() => {
    const checkAuth = () => {
      console.log('🔒 RequireAuth: Checking authentication...');
      console.log('Current session:', currentSession);
      console.log('Is admin:', isAdmin);
      console.log('Current segments:', segments);

      // Check if user is logged in
      if (!currentSession) {
        console.log('❌ No active session found, redirecting to login');
        router.replace('/login');
        return;
      }

      // Check super admin requirement
      if (requireSuperAdmin && currentSession.role !== 'SuperAdmin') {
        console.log('❌ Super admin access required, current role:', currentSession.role);
        emergencyLogout('Insufficient privileges - Super Admin required');
        return;
      }

      // Check admin requirement
      if (requireAdmin && !isAdmin && currentSession.role !== 'Admin' && currentSession.role !== 'SuperAdmin') {
        console.log('❌ Admin access required, current role:', currentSession.role);
        emergencyLogout('Insufficient privileges - Admin required');
        return;
      }

      // Check specific role requirements
      if (allowedRoles && allowedRoles.length > 0) {
        const hasAllowedRole = allowedRoles.includes(currentSession.role);
        if (!hasAllowedRole) {
          console.log('❌ Role not allowed, current role:', currentSession.role, 'allowed:', allowedRoles);
          emergencyLogout(`Insufficient privileges - Required roles: ${allowedRoles.join(', ')}`);
          return;
        }
      }

      console.log('✅ Authentication check passed');
    };

    // Small delay to prevent conflicts with navigation
    const timeoutId = setTimeout(checkAuth, 100);
    
    return () => clearTimeout(timeoutId);
  }, [currentSession, isAdmin, segments, redirectTo, allowedRoles, requireAdmin, requireSuperAdmin, emergencyLogout]);

  // Don't render children if not authenticated
  if (!currentSession) {
    return null;
  }

  // Don't render if role requirements not met
  if (requireSuperAdmin && currentSession.role !== 'SuperAdmin') {
    return null;
  }

  if (requireAdmin && !isAdmin && currentSession.role !== 'Admin' && currentSession.role !== 'SuperAdmin') {
    return null;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(currentSession.role)) {
    return null;
  }

  return <>{children}</>;
};

/**
 * Higher-order component version of RequireAuth
 */
export const withRequireAuth = <P extends object>(
  Component: React.ComponentType<P>,
  authOptions?: Omit<RequireAuthProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <RequireAuth {...authOptions}>
      <Component {...props} />
    </RequireAuth>
  );
  
  WrappedComponent.displayName = `withRequireAuth(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

/**
 * Hook to check if current user has specific permissions
 */
export const useAuthCheck = () => {
  const { currentSession, isAdmin } = usePCRStore();

  const hasRole = (role: string) => {
    return currentSession?.role === role;
  };

  const hasAnyRole = (roles: string[]) => {
    return roles.some(role => currentSession?.role === role);
  };

  const isAuthenticated = () => {
    return !!currentSession;
  };

  const isSuperAdmin = () => {
    return currentSession?.role === 'SuperAdmin';
  };

  const isAdminUser = () => {
    return isAdmin || currentSession?.role === 'Admin' || currentSession?.role === 'SuperAdmin';
  };

  const canAccess = (requiredRoles?: string[], requireAdmin?: boolean, requireSuperAdmin?: boolean) => {
    if (!currentSession) return false;
    
    if (requireSuperAdmin && !isSuperAdmin()) return false;
    if (requireAdmin && !isAdminUser()) return false;
    if (requiredRoles && !hasAnyRole(requiredRoles)) return false;
    
    return true;
  };

  return {
    currentSession,
    hasRole,
    hasAnyRole,
    isAuthenticated,
    isSuperAdmin,
    isAdminUser,
    canAccess,
  };
};