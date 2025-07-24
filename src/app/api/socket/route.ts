import { NextRequest, NextResponse } from 'next/server'
import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'

// Global socket server instance
let io: SocketIOServer | null = null

// Initialize Socket.IO server
const initializeSocket = (server: HTTPServer) => {
  if (io) return io

  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  })

  // Authentication middleware
  io.use((socket: any, next: any) => {
    const token = socket.handshake.auth.token
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'))
    }

    // Here you would verify the JWT token
    // For now, we'll accept any token (implement proper JWT verification in production)
    try {
      // const decoded = jwt.verify(token, process.env.JWT_SECRET)
      // socket.userId = decoded.id
      
      // For demo purposes, extract user ID from token payload
      const payload = JSON.parse(atob(token.split('.')[1]))
      socket.data.userId = payload.id || payload.sub
      
      next()
    } catch (err) {
      next(new Error('Authentication error: Invalid token'))
    }
  })

  // Connection handling
  io.on('connection', (socket: any) => {
    const userId = socket.data.userId
    console.log(`User ${userId} connected with socket ${socket.id}`)

    // Join user-specific room
    socket.join(`user_${userId}`)

    // Handle room joining
    socket.on('joinRoom', (data: any) => {
      const { room } = data
      socket.join(room)
      console.log(`Socket ${socket.id} joined room: ${room}`)
    })

    // Handle room leaving
    socket.on('leaveRoom', (data: any) => {
      const { room } = data
      socket.leave(room)
      console.log(`Socket ${socket.id} left room: ${room}`)
    })

    // Handle custom events
    socket.on('requestUserStats', () => {
      // Emit user statistics (this would typically fetch from database)
      socket.emit('userStats', {
        totalUrls: 0, // Replace with actual data
        totalClicks: 0, // Replace with actual data
        activeUrls: 0 // Replace with actual data
      })
    })

    // Handle disconnection
    socket.on('disconnect', (reason: any) => {
      console.log(`User ${userId} disconnected: ${reason}`)
    })

    // Send welcome message
    socket.emit('connected', {
      message: 'Successfully connected to real-time updates',
      socketId: socket.id
    })
  })

  return io
}

// Utility function to emit events to specific users
export const emitToUser = (userId: number, event: string, data: any) => {
  if (io) {
    io.to(`user_${userId}`).emit(event, data)
  }
}

// Utility function to emit click updates
export const emitClickUpdate = (userId: number, shortUrlId: number, newClickCount: number) => {
  emitToUser(userId, 'clickUpdate', {
    shortUrlId,
    newClickCount,
    timestamp: new Date().toISOString()
  })
}

// Utility function to emit URL creation
export const emitUrlCreated = (userId: number, shortUrl: any) => {
  emitToUser(userId, 'urlCreated', {
    shortUrl,
    timestamp: new Date().toISOString()
  })
}

// Utility function to emit URL deletion
export const emitUrlDeleted = (userId: number, shortUrlId: number) => {
  emitToUser(userId, 'urlDeleted', {
    shortUrlId,
    timestamp: new Date().toISOString()
  })
}

// HTTP handlers for Next.js API route
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Socket.IO server status',
    connected: io ? io.engine.clientsCount : 0,
    status: 'running'
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, data } = body

    if (!io) {
      return NextResponse.json(
        { error: 'Socket server not initialized' },
        { status: 500 }
      )
    }

    switch (action) {
      case 'clickUpdate':
        emitClickUpdate(userId, data.shortUrlId, data.newClickCount)
        break
      
      case 'urlCreated':
        emitUrlCreated(userId, data.shortUrl)
        break
      
      case 'urlDeleted':
        emitUrlDeleted(userId, data.shortUrlId)
        break
      
      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: `Event ${action} emitted to user ${userId}`
    })

  } catch (error: any) {
    console.error('Socket API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export the socket instance for use in other parts of the application
export { io }

// Note: In a production environment, you would typically run the Socket.IO server
// separately or integrate it with your main Next.js server. This implementation
// provides a basic setup for development purposes.
