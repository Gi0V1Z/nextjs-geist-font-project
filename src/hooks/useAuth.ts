'use client'

import { useState, useEffect } from 'react'
import { AuthState, LoginCredentials, RegisterData } from '@/types/auth'
import { authManager, redirectToLogin, redirectToDashboard } from '@/app/helpers/auth'
import { initializeSocketConnection, cleanupSocketConnection } from '@/app/helpers/socket'

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>(authManager.getState())

  useEffect(() => {
    const unsubscribe = authManager.subscribe((state) => {
      setAuthState(state)
      
      // Handle socket connection based on auth state
      if (state.isAuthenticated) {
        initializeSocketConnection()
      } else {
        cleanupSocketConnection()
      }
    })

    return unsubscribe
  }, [])

  const login = async (credentials: LoginCredentials) => {
    try {
      await authManager.login(credentials)
      redirectToDashboard()
    } catch (error) {
      throw error
    }
  }

  const register = async (userData: RegisterData) => {
    try {
      await authManager.register(userData)
      redirectToDashboard()
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    authManager.logout()
    redirectToLogin()
  }

  const refreshUser = async () => {
    try {
      await authManager.refreshUser()
    } catch (error) {
      // User will be logged out automatically in authManager
      throw error
    }
  }

  return {
    ...authState,
    login,
    register,
    logout,
    refreshUser,
    isTokenExpired: () => authManager.isTokenExpired()
  }
}

// Hook for protected routes
export const useRequireAuth = () => {
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      redirectToLogin()
    }
  }, [isAuthenticated, isLoading])

  return { isAuthenticated, isLoading }
}

// Hook for guest routes (login, register)
export const useGuestOnly = () => {
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      redirectToDashboard()
    }
  }, [isAuthenticated, isLoading])

  return { isAuthenticated, isLoading }
}
