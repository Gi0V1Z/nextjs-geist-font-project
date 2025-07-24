import { User } from './auth'

export interface ShortUrl {
  id: number
  longUrl: string
  shortCode: string
  expirationDate?: string
  clicksTotal: number
  user: User
  createdAt: string
  updatedAt: string
  isExpired?: boolean
}

export interface CreateUrlRequest {
  longUrl: string
  customCode?: string
  expirationDate?: string
}

export interface UrlClick {
  id: number
  timestamp: string
  shortUrl: ShortUrl
  ipAddress?: string
  userAgent?: string
}

export interface UrlAnalytics {
  totalClicks: number
  dailyClicks: DailyClick[]
  recentClicks: UrlClick[]
}

export interface DailyClick {
  date: string
  clicks: number
}

export interface QRCodeData {
  qrCode: string
  shortUrl: string
}
