/**
 * ProtectedRoute Component
 * 
 * A higher-order component that protects routes requiring authentication.
 * Implements role-based access control and redirects unauthenticated users
 * to the login page with return path preservation.
 */

import React from 'react';

import {
  Navigate,
  useLocation,
} from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';

/**
 * ProtectedRoute Component
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render when authenticated
 * @param {string} [props.requiredRole] - Optional role required to access the route
 * @returns {React.ReactElement} Protected route component
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, hasRole } = useAuth();
  const location = useLocation();

  /**
   * Check if user is authenticated using both context and localStorage
   * This dual-check approach ensures reliability across page refreshes
   */
  const isAuthenticated = !!user || !!localStorage.getItem("token");
  
  // If not authenticated, redirect to login with return path
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  /**
   * If role is required, check if user has the role
   * This implements role-based access control (RBAC)
   */
  if (requiredRole) {
    // Check role from context or localStorage
    const userRole = localStorage.getItem("userRole");
    const hasRequiredRole = hasRole ? hasRole(requiredRole) : userRole === requiredRole;
    
    if (!hasRequiredRole) {
      // Redirect to appropriate dashboard based on user's role
      const redirectPath = userRole === "admin" ? "/admin/dashboard" : "/user/dashboard";
      
      return <Navigate to={redirectPath} replace />;
    }
  }
  
  // User is authenticated and has required role (if specified)
  return children;
};

export default ProtectedRoute;
