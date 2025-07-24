export interface ApiResponse<T> {
  data: T
  meta?: {
    pagination?: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface StrapiError {
  error: {
    status: number
    name: string
    message: string
    details?: any
  }
}

export interface SocketEvent {
  type: 'CLICK_UPDATE' | 'URL_CREATED' | 'URL_DELETED'
  data: any
  userId: number
}

export interface ValidationError {
  field: string
  message: string
}
