import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';

export interface ProtectedRouteProps {
  children?: React.ReactNode;
  requireOnboarding?: boolean;
  requiredRole?: 'ADMIN' | 'USER';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireOnboarding = true,
  requiredRole,
}) => {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const onboardingCompleted = useAuthStore((state) => state.onboardingCompleted);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireOnboarding && !onboardingCompleted && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    const destination = user?.role === 'ADMIN' ? '/admin' : '/dashboard';
    return <Navigate to={destination} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
