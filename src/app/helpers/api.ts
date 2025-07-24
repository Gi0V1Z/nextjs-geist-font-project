import { ApiResponse, ApiError, StrapiError } from '@/types/api'
import { AuthResponse, LoginCredentials, RegisterData, User } from '@/types/auth'
import { ShortUrl, CreateUrlRequest, UrlAnalytics } from '@/types/url'

const API_BASE_URL = process.env.NEXT_PUBLIC_STRAPI_BACKEND_URL || 'http://localhost:1337'

class ApiClient {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token')
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData: StrapiError = await response.json().catch(() => ({
        error: {
          status: response.status,
          name: 'NetworkError',
          message: 'Network error occurred'
        }
      }))
      
      throw new ApiError(
        errorData.error.message || 'An error occurred',
        errorData.error.status || response.status
      )
    }

    return response.json()
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    })

    return this.handleResponse<AuthResponse>(response)
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/local/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })

    return this.handleResponse<AuthResponse>(response)
  }

  async getMe(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
      headers: this.getAuthHeaders()
    })

    return this.handleResponse(response)
  }

  // URL endpoints
  async createShortUrl(urlData: CreateUrlRequest): Promise<ApiResponse<ShortUrl>> {
    const response = await fetch(`${API_BASE_URL}/api/short-urls`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ data: urlData })
    })

    return this.handleResponse<ApiResponse<ShortUrl>>(response)
  }

  async getUserUrls(): Promise<ApiResponse<ShortUrl[]>> {
    const response = await fetch(`${API_BASE_URL}/api/short-urls?populate=user&filters[user][id][$eq]=${this.getCurrentUserId()}`, {
      headers: this.getAuthHeaders()
    })

    return this.handleResponse<ApiResponse<ShortUrl[]>>(response)
  }

  async getUrlByShortCode(shortCode: string): Promise<ApiResponse<ShortUrl>> {
    const response = await fetch(`${API_BASE_URL}/api/short-urls?filters[shortCode][$eq]=${shortCode}&populate=user`, {
      headers: this.getAuthHeaders()
    })

    return this.handleResponse<ApiResponse<ShortUrl>>(response)
  }

  async recordClick(shortUrlId: number): Promise<void> {
    await fetch(`${API_BASE_URL}/api/short-urls/${shortUrlId}/click`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    })
  }

  async getUrlAnalytics(shortUrlId: number): Promise<UrlAnalytics> {
    const response = await fetch(`${API_BASE_URL}/api/short-urls/${shortUrlId}/analytics`, {
      headers: this.getAuthHeaders()
    })

    return this.handleResponse<UrlAnalytics>(response)
  }

  async checkCustomCodeAvailability(customCode: string): Promise<{ available: boolean }> {
    const response = await fetch(`${API_BASE_URL}/api/short-urls/check-code/${customCode}`, {
      headers: this.getAuthHeaders()
    })

    return this.handleResponse<{ available: boolean }>(response)
  }

  async deleteShortUrl(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/short-urls/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new ApiError('Failed to delete URL', response.status)
    }
  }

  private getCurrentUserId(): number {
    const userStr = localStorage.getItem('auth_user')
    if (!userStr) throw new Error('User not authenticated')
    return JSON.parse(userStr).id
  }
}

export const apiClient = new ApiClient()
