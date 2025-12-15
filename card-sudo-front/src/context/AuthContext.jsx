import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Carrega usuário do localStorage ao iniciar
  useEffect(() => {
    const loadUser = async () => {
      console.log('AuthProvider: Iniciando carregamento...');
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          console.log('AuthProvider: Token encontrado, buscando perfil...');
          const response = await api.get('/wallet/auth/profile/');
          setUser(response.data.user);
          setWallet(response.data.wallet);
          setIsAuthenticated(true);
          console.log('AuthProvider: Perfil carregado com sucesso');
        } catch (error) {
          console.error('Erro ao carregar perfil:', error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      } else {
        console.log('AuthProvider: Sem token');
      }
      setLoading(false);
      console.log('AuthProvider: Loading = false');
    };
    loadUser();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await api.post('/wallet/auth/login/', { username, password });
      const { access, refresh } = response.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      // Busca perfil do usuário
      const profileResponse = await api.get('/wallet/auth/profile/');
      setUser(profileResponse.data.user);
      setWallet(profileResponse.data.wallet);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || 'Erro ao fazer login';
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/wallet/auth/register/', userData);
      const { tokens, user: newUser } = response.data;
      
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      
      setUser(newUser);
      setIsAuthenticated(true);
      
      // Busca wallet
      const profileResponse = await api.get('/wallet/auth/profile/');
      setWallet(profileResponse.data.wallet);
      
      return { success: true, message: response.data.message };
    } catch (error) {
      const errors = error.response?.data || { error: 'Erro ao registrar' };
      return { success: false, errors };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setWallet(null);
    setIsAuthenticated(false);
  };

  const refreshWallet = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api.get('/wallet/wallet/');
      setWallet(response.data);
    } catch (error) {
      console.error('Erro ao atualizar carteira:', error);
    }
  }, [isAuthenticated]);

  const value = {
    user,
    wallet,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshWallet,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
