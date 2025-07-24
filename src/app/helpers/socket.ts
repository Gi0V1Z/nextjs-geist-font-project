import { io, Socket } from 'socket.io-client'
import { SocketEvent } from '@/types/api'
import { authManager } from './auth'

class SocketManager {
  private static instance: SocketManager
  private socket: Socket | null = null
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private listeners: Map<string, Set<Function>> = new Map()

  static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager()
    }
    return SocketManager.instance
  }

  connect(): void {
    if (this.socket?.connected) return

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:8000'
    const token = authManager.getToken()

    if (!token) {
      console.warn('No auth token available for socket connection')
      return
    }

    this.socket = io(socketUrl, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true
    })

    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id)
      this.isConnected = true
      this.reconnectAttempts = 0
      this.emit('connection', { connected: true })
    })

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      this.isConnected = false
      this.emit('connection', { connected: false, reason })
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.handleReconnect()
      }
    })

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      this.isConnected = false
      this.emit('error', { error: error.message })
      this.handleReconnect()
    })

    // Custom event listeners
    this.socket.on('clickUpdate', (data) => {
      this.emit('clickUpdate', data)
    })

    this.socket.on('urlCreated', (data) => {
      this.emit('urlCreated', data)
    })

    this.socket.on('urlDeleted', (data) => {
      this.emit('urlDeleted', data)
    })

    this.socket.on('userStats', (data) => {
      this.emit('userStats', data)
    })
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      this.emit('maxReconnectAttemptsReached', {})
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`)

    setTimeout(() => {
      if (!this.isConnected) {
        this.connect()
      }
    }, delay)
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
      this.listeners.clear()
    }
  }

  // Event subscription system
  on(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    
    this.listeners.get(event)!.add(callback)

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event)
      if (eventListeners) {
        eventListeners.delete(callback)
        if (eventListeners.size === 0) {
          this.listeners.delete(event)
        }
      }
    }
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in socket event listener for ${event}:`, error)
        }
      })
    }
  }

  // Send events to server
  sendEvent(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    } else {
      console.warn('Socket not connected, cannot send event:', event)
    }
  }

  // Utility methods
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true
  }

  getSocketId(): string | undefined {
    return this.socket?.id
  }

  // Join/leave rooms
  joinRoom(room: string): void {
    this.sendEvent('joinRoom', { room })
  }

  leaveRoom(room: string): void {
    this.sendEvent('leaveRoom', { room })
  }

  // User-specific methods
  joinUserRoom(): void {
    const user = authManager.getCurrentUser()
    if (user) {
      this.joinRoom(`user_${user.id}`)
    }
  }

  leaveUserRoom(): void {
    const user = authManager.getCurrentUser()
    if (user) {
      this.leaveRoom(`user_${user.id}`)
    }
  }
}

export const socketManager = SocketManager.getInstance()

// React hook for socket connection
export const useSocket = () => {
  const connect = () => socketManager.connect()
  const disconnect = () => socketManager.disconnect()
  const isConnected = () => socketManager.isSocketConnected()
  const on = (event: string, callback: Function) => socketManager.on(event, callback)
  const sendEvent = (event: string, data: any) => socketManager.sendEvent(event, data)

  return {
    connect,
    disconnect,
    isConnected,
    on,
    sendEvent,
    joinUserRoom: () => socketManager.joinUserRoom(),
    leaveUserRoom: () => socketManager.leaveUserRoom()
  }
}

// Specific event helpers
export const subscribeToClickUpdates = (callback: (data: any) => void) => {
  return socketManager.on('clickUpdate', callback)
}

export const subscribeToUrlCreated = (callback: (data: any) => void) => {
  return socketManager.on('urlCreated', callback)
}

export const subscribeToUrlDeleted = (callback: (data: any) => void) => {
  return socketManager.on('urlDeleted', callback)
}

export const subscribeToUserStats = (callback: (data: any) => void) => {
  return socketManager.on('userStats', callback)
}

export const subscribeToConnection = (callback: (data: { connected: boolean; reason?: string }) => void) => {
  return socketManager.on('connection', callback)
}

// Auto-connect when authenticated
export const initializeSocketConnection = () => {
  if (authManager.isAuthenticated()) {
    socketManager.connect()
    socketManager.joinUserRoom()
  }
}

// Auto-disconnect when logged out
export const cleanupSocketConnection = () => {
  socketManager.leaveUserRoom()
  socketManager.disconnect()
}
