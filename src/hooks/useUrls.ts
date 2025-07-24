'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShortUrl, CreateUrlRequest, UrlAnalytics } from '@/types/url'
import { apiClient } from '@/app/helpers/api'
import { useSocket, subscribeToClickUpdates, subscribeToUrlCreated, subscribeToUrlDeleted } from '@/app/helpers/socket'
import { toast } from 'sonner'

export const useUrls = () => {
  const [urls, setUrls] = useState<ShortUrl[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const socket = useSocket()

  // Fetch user's URLs
  const fetchUrls = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await apiClient.getUserUrls()
      setUrls(Array.isArray(response.data) ? response.data : [])
    } catch (err: any) {
      setError(err.message || 'Errore nel caricamento degli URL')
      toast.error('Errore nel caricamento degli URL')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Create new short URL
  const createUrl = useCallback(async (urlData: CreateUrlRequest): Promise<ShortUrl | null> => {
    try {
      const response = await apiClient.createShortUrl(urlData)
      const newUrl = response.data
      
      setUrls(prev => [newUrl, ...prev])
      toast.success('URL abbreviato creato con successo!')
      
      return newUrl
    } catch (err: any) {
      toast.error(err.message || 'Errore nella creazione dell\'URL')
      throw err
    }
  }, [])

  // Delete URL
  const deleteUrl = useCallback(async (id: number) => {
    try {
      await apiClient.deleteShortUrl(id)
      setUrls(prev => prev.filter(url => url.id !== id))
      toast.success('URL eliminato con successo!')
    } catch (err: any) {
      toast.error(err.message || 'Errore nell\'eliminazione dell\'URL')
      throw err
    }
  }, [])

  // Check custom code availability
  const checkCustomCode = useCallback(async (customCode: string): Promise<boolean> => {
    try {
      const response = await apiClient.checkCustomCodeAvailability(customCode)
      return response.available
    } catch (err: any) {
      console.error('Error checking custom code:', err)
      return false
    }
  }, [])

  // Get URL analytics
  const getAnalytics = useCallback(async (shortUrlId: number): Promise<UrlAnalytics | null> => {
    try {
      return await apiClient.getUrlAnalytics(shortUrlId)
    } catch (err: any) {
      toast.error('Errore nel caricamento delle analytics')
      return null
    }
  }, [])

  // Update URL click count (from socket events)
  const updateUrlClicks = useCallback((urlId: number, newClickCount: number) => {
    setUrls(prev => prev.map(url => 
      url.id === urlId 
        ? { ...url, clicksTotal: newClickCount }
        : url
    ))
  }, [])

  // Socket event handlers
  useEffect(() => {
    const unsubscribeClickUpdate = subscribeToClickUpdates((data: any) => {
      if (data.shortUrlId && data.newClickCount !== undefined) {
        updateUrlClicks(data.shortUrlId, data.newClickCount)
        
        // Show toast notification for real-time updates
        const url = urls.find(u => u.id === data.shortUrlId)
        if (url) {
          toast.info(`Nuovo click su "${url.shortCode}"! Total: ${data.newClickCount}`)
        }
      }
    })

    const unsubscribeUrlCreated = subscribeToUrlCreated((data: any) => {
      if (data.shortUrl) {
        setUrls(prev => {
          // Check if URL already exists to avoid duplicates
          const exists = prev.some(url => url.id === data.shortUrl.id)
          if (!exists) {
            return [data.shortUrl, ...prev]
          }
          return prev
        })
      }
    })

    const unsubscribeUrlDeleted = subscribeToUrlDeleted((data: any) => {
      if (data.shortUrlId) {
        setUrls(prev => prev.filter(url => url.id !== data.shortUrlId))
      }
    })

    return () => {
      unsubscribeClickUpdate()
      unsubscribeUrlCreated()
      unsubscribeUrlDeleted()
    }
  }, [updateUrlClicks, urls])

  // Initial fetch
  useEffect(() => {
    fetchUrls()
  }, [fetchUrls])

  // Utility functions
  const getUrlByShortCode = useCallback((shortCode: string): ShortUrl | undefined => {
    return urls.find(url => url.shortCode === shortCode)
  }, [urls])

  const getTotalClicks = useCallback((): number => {
    return urls.reduce((total, url) => total + url.clicksTotal, 0)
  }, [urls])

  const getActiveUrls = useCallback((): ShortUrl[] => {
    const now = new Date()
    return urls.filter(url => {
      if (!url.expirationDate) return true
      return new Date(url.expirationDate) > now
    })
  }, [urls])

  const getExpiredUrls = useCallback((): ShortUrl[] => {
    const now = new Date()
    return urls.filter(url => {
      if (!url.expirationDate) return false
      return new Date(url.expirationDate) <= now
    })
  }, [urls])

  const refreshUrls = useCallback(() => {
    fetchUrls()
  }, [fetchUrls])

  return {
    urls,
    isLoading,
    error,
    createUrl,
    deleteUrl,
    checkCustomCode,
    getAnalytics,
    refreshUrls,
    getUrlByShortCode,
    getTotalClicks,
    getActiveUrls,
    getExpiredUrls,
    updateUrlClicks
  }
}

// Hook for single URL management
export const useUrl = (shortCode: string) => {
  const [url, setUrl] = useState<ShortUrl | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUrl = useCallback(async () => {
    if (!shortCode) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await apiClient.getUrlByShortCode(shortCode)
      const urlData = Array.isArray(response.data) ? response.data[0] : response.data
      setUrl(urlData || null)
    } catch (err: any) {
      setError(err.message || 'URL non trovato')
      setUrl(null)
    } finally {
      setIsLoading(false)
    }
  }, [shortCode])

  const recordClick = useCallback(async () => {
    if (!url) return

    try {
      await apiClient.recordClick(url.id)
      setUrl(prev => prev ? { ...prev, clicksTotal: prev.clicksTotal + 1 } : null)
    } catch (err: any) {
      console.error('Error recording click:', err)
    }
  }, [url])

  useEffect(() => {
    fetchUrl()
  }, [fetchUrl])

  return {
    url,
    isLoading,
    error,
    recordClick,
    refreshUrl: fetchUrl
  }
}
