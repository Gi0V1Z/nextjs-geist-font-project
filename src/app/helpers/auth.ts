import { User, AuthState, LoginCredentials, RegisterData } from '@/types/auth'
import { apiClient } from './api'

class AuthManager {
  private static instance: AuthManager
  private authState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false
  }
  private listeners: ((state: AuthState) => void)[] = []

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager()
    }
    return AuthManager.instance
  }

  constructor() {
    this.initializeAuth()
  }

  private initializeAuth() {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token')
      const userStr = localStorage.getItem('auth_user')
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr)
          this.authState = {
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          }
        } catch (error) {
          this.clearAuth()
        }
      }
    }
  }

  subscribe(listener: (state: AuthState) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.authState))
  }

  private updateState(updates: Partial<AuthState>) {
    this.authState = { ...this.authState, ...updates }
    this.notifyListeners()
  }

  getState(): AuthState {
    return { ...this.authState }
  }

  async login(credentials: LoginCredentials): Promise<void> {
    this.updateState({ isLoading: true })
    
    try {
      const response = await apiClient.login(credentials)
      
      localStorage.setItem('auth_token', response.jwt)
      localStorage.setItem('auth_user', JSON.stringify(response.user))
      
      this.updateState({
        user: response.user,
        token: response.jwt,
        isAuthenticated: true,
        isLoading: false
      })
    } catch (error) {
      this.updateState({ isLoading: false })
      throw error
    }
  }

  async register(userData: RegisterData): Promise<void> {
    this.updateState({ isLoading: true })
    
    try {
      const response = await apiClient.register(userData)
      
      localStorage.setItem('auth_token', response.jwt)
      localStorage.setItem('auth_user', JSON.stringify(response.user))
      
      this.updateState({
        user: response.user,
        token: response.jwt,
        isAuthenticated: true,
        isLoading: false
      })
    } catch (error) {
      this.updateState({ isLoading: false })
      throw error
    }
  }

  logout(): void {
    this.clearAuth()
    this.updateState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false
    })
  }

  private clearAuth(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }
  }

  async refreshUser(): Promise<void> {
    if (!this.authState.isAuthenticated) return
    
    try {
      const user = await apiClient.getMe()
      localStorage.setItem('auth_user', JSON.stringify(user))
      this.updateState({ user })
    } catch (error) {
      // Token might be expired, logout user
      this.logout()
      throw error
    }
  }

  isTokenExpired(): boolean {
    const token = this.authState.token
    if (!token) return true
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return Date.now() >= payload.exp * 1000
    } catch {
      return true
    }
  }

  getCurrentUser(): User | null {
    return this.authState.user
  }

  getToken(): string | null {
    return this.authState.token
  }

  isAuthenticated(): boolean {
    return this.authState.isAuthenticated && !this.isTokenExpired()
  }
}

export const authManager = AuthManager.getInstance()

// Utility functions
export const requireAuth = () => {
  if (!authManager.isAuthenticated()) {
    throw new Error('Authentication required')
  }
}

export const redirectToLogin = () => {
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}

export const redirectToDashboard = () => {
  if (typeof window !== 'undefined') {
    window.location.href = '/dashboard'
  }
}
