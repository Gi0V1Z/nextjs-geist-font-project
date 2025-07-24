export interface User {
  id: number
  username: string
  email: string
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  jwt: string
  user: User
}

export interface LoginCredentials {
  identifier: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}
