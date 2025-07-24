import { z } from 'zod'

// URL validation schema
export const urlSchema = z.object({
  longUrl: z
    .string()
    .min(1, 'URL è richiesto')
    .url('Inserisci un URL valido')
    .refine(
      (url) => {
        try {
          const parsed = new URL(url)
          return ['http:', 'https:'].includes(parsed.protocol)
        } catch {
          return false
        }
      },
      'URL deve iniziare con http:// o https://'
    ),
  customCode: z
    .string()
    .optional()
    .refine(
      (code) => {
        if (!code) return true
        return /^[a-zA-Z0-9_-]+$/.test(code)
      },
      'Il codice può contenere solo lettere, numeri, trattini e underscore'
    )
    .refine(
      (code) => {
        if (!code) return true
        return code.length >= 3 && code.length <= 20
      },
      'Il codice deve essere tra 3 e 20 caratteri'
    ),
  expirationDate: z
    .string()
    .optional()
    .refine(
      (date) => {
        if (!date) return true
        const expDate = new Date(date)
        const now = new Date()
        return expDate > now
      },
      'La data di scadenza deve essere nel futuro'
    )
})

// Auth validation schemas
export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Email o username richiesto')
    .refine(
      (value) => {
        // Check if it's email or username
        return value.includes('@') 
          ? z.string().email().safeParse(value).success
          : value.length >= 3
      },
      'Inserisci un email valido o username (min 3 caratteri)'
    ),
  password: z
    .string()
    .min(6, 'Password deve essere almeno 6 caratteri')
})

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username deve essere almeno 3 caratteri')
    .max(20, 'Username non può superare 20 caratteri')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username può contenere solo lettere, numeri e underscore'
    ),
  email: z
    .string()
    .min(1, 'Email è richiesta')
    .email('Inserisci un email valido'),
  password: z
    .string()
    .min(6, 'Password deve essere almeno 6 caratteri')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password deve contenere almeno una lettera minuscola, maiuscola e un numero'
    ),
  confirmPassword: z
    .string()
    .min(1, 'Conferma password è richiesta')
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Le password non corrispondono',
    path: ['confirmPassword']
  }
)

// Utility functions
export const validateUrl = (url: string): { isValid: boolean; error?: string } => {
  const result = urlSchema.pick({ longUrl: true }).safeParse({ longUrl: url })
  return {
    isValid: result.success,
    error: result.success ? undefined : result.error.errors[0]?.message
  }
}

export const validateCustomCode = (code: string): { isValid: boolean; error?: string } => {
  if (!code) return { isValid: true }
  
  const result = urlSchema.pick({ customCode: true }).safeParse({ customCode: code })
  return {
    isValid: result.success,
    error: result.success ? undefined : result.error.errors[0]?.message
  }
}

export const validateExpirationDate = (date: string): { isValid: boolean; error?: string } => {
  if (!date) return { isValid: true }
  
  const result = urlSchema.pick({ expirationDate: true }).safeParse({ expirationDate: date })
  return {
    isValid: result.success,
    error: result.success ? undefined : result.error.errors[0]?.message
  }
}

// Form validation helpers
export const getFieldError = (errors: any, fieldName: string): string | undefined => {
  return errors?.[fieldName]?.message
}

export const hasFieldError = (errors: any, fieldName: string): boolean => {
  return !!errors?.[fieldName]
}

// Custom code availability check
export const isValidCustomCode = (code: string): boolean => {
  if (!code) return true
  
  // Check length
  if (code.length < 3 || code.length > 20) return false
  
  // Check characters
  if (!/^[a-zA-Z0-9_-]+$/.test(code)) return false
  
  // Reserved words
  const reservedWords = [
    'api', 'admin', 'dashboard', 'login', 'register', 'logout',
    'home', 'about', 'contact', 'help', 'support', 'terms',
    'privacy', 'www', 'mail', 'ftp', 'blog', 'shop', 'store'
  ]
  
  return !reservedWords.includes(code.toLowerCase())
}

// Date formatting helpers
export const formatExpirationDate = (date: string): string => {
  return new Date(date).toLocaleString('it-IT', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const isExpired = (expirationDate?: string): boolean => {
  if (!expirationDate) return false
  return new Date(expirationDate) < new Date()
}

// URL helpers
export const generateShortCode = (length: number = 6): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const getShortUrlDisplay = (shortCode: string): string => {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'
  
  return `${baseUrl}/${shortCode}`
}
