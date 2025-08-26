/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the application.
 * Implements JWT-based authentication with secure storage and proper state management.
 * 
 * Features:
 * - User authentication state management
 * - Login/logout functionality
 * - Token persistence
 * - Role-based access control support
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { authAPI } from '../utils/api';

// Create the authentication context
const AuthContext = createContext();

/**
 * Custom hook to use the authentication context
 * @returns {Object} Authentication context values and methods
 */
export const useAuth = () => {
  return useContext(AuthContext);
};

/**
 * Authentication Provider Component
 * Manages authentication state and provides methods to login, logout, etc.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
const AuthProvider = ({ children }) => {
  /**
   * Initialize user state from localStorage if available
   * This ensures authentication persists across page refreshes
   */
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email");
    const role = localStorage.getItem("userRole");
    const userId = localStorage.getItem("userId");
    
    return token && email ? { email, role, userId } : null;
  });
  
  const [loading, setLoading] = useState(true);

  /**
   * Effect to check token validity on mount
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        
        if (token) {
          const email = localStorage.getItem("email");
          const role = localStorage.getItem("userRole");
          const userId = localStorage.getItem("userId");
          
          if (email) {
            setUser({ email, role, userId });
          } else {
            // If email is missing but token exists, something is wrong
            // Clear authentication data
            handleLogout();
          }
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        handleLogout();
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  /**
   * Handles user login
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @param {string} role - User's role (optional)
   * @returns {Promise<Object>} User data
   */
  const login = async (email, password, role) => {
    try {
      const data = await authAPI.login(email, password, role);
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('email', email);
      
      setUser({ email, role: data.role, userId: data.userId });
      return data;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Handles user signup
   * @param {string} fullName - User's full name
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @param {string} role - User's role (optional)
   * @returns {Promise<Object>} User data
   */
  const signup = async (fullName, email, password, role = 'user') => {
    try {
      const data = await authAPI.register(fullName, email, password, role);
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('userRole', role);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('email', email);
      
      setUser({ email, role, userId: data.userId });
      return data;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Handles user logout
   * Clears authentication data and resets state
   */
  const handleLogout = () => {
    // Clear all auth-related data from localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    localStorage.removeItem("email");
    
    // Reset user state
    setUser(null);
  };

  /**
   * Handles password reset request
   * @param {string} email - User's email
   * @returns {Promise<void>}
   */
  const resetPassword = async (email) => {
    return authAPI.forgotPassword(email);
  };

  /**
   * Checks if the current user has a specific role
   * @param {string} requiredRole - Role to check for
   * @returns {boolean} Whether user has the required role
   */
  const hasRole = (requiredRole) => {
    const userRole = localStorage.getItem("userRole");
    return userRole === requiredRole;
  };

  /**
   * Context value with authentication state and methods
   */
  const value = {
    user,
    loading,
    login,
    signup,
    logout: handleLogout,
    resetPassword,
    hasRole,
    isAdmin: () => hasRole("admin"),
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
