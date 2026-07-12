import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync token with axios headers
  const setAuthHeader = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  // Check login status on reload
  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem('mock_interview_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          setAuthHeader(parsed.token);

          // Verify token validity with backend profile endpoint
          const res = await axios.get('/api/user/profile');
          if (res.data.success) {
            // Keep user profile up to date
            const updatedUser = { ...parsed, name: res.data.data.profile.name, email: res.data.data.profile.email, role: res.data.data.profile.role };
            setUser(updatedUser);
            localStorage.setItem('mock_interview_user', JSON.stringify(updatedUser));
          }
        } catch (error) {
          console.error('Session verification failed, logging out:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      if (res.data.success) {
        const userData = res.data.data;
        setUser(userData);
        setAuthHeader(userData.token);
        localStorage.setItem('mock_interview_user', JSON.stringify(userData));
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please check credentials.'
      };
    }
  };

  const register = async (name, email, password, confirmPassword) => {
    try {
      const res = await axios.post('/api/auth/register', { name, email, password, confirmPassword });
      if (res.data.success) {
        const userData = res.data.data;
        setUser(userData);
        setAuthHeader(userData.token);
        localStorage.setItem('mock_interview_user', JSON.stringify(userData));
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed.'
      };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout request failed:', err);
    }
    setUser(null);
    setAuthHeader(null);
    localStorage.removeItem('mock_interview_user');
  };

  const updateProfileInContext = (updatedData) => {
    if (user) {
      const newUser = { ...user, ...updatedData };
      setUser(newUser);
      localStorage.setItem('mock_interview_user', JSON.stringify(newUser));
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfileInContext
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
