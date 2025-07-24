import QRCode from 'qrcode'
import { QRCodeData } from '@/types/url'

export class QRCodeGenerator {
  private static defaultOptions = {
    width: 256,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M' as const
  }

  static async generateQRCode(
    url: string, 
    options?: Partial<typeof QRCodeGenerator.defaultOptions>
  ): Promise<string> {
    try {
      const qrOptions = { ...QRCodeGenerator.defaultOptions, ...options }
      const qrCodeDataURL = await QRCode.toDataURL(url, qrOptions)
      return qrCodeDataURL
    } catch (error) {
      console.error('Error generating QR code:', error)
      throw new Error('Errore nella generazione del QR code')
    }
  }

  static async generateQRCodeBuffer(
    url: string,
    options?: Partial<typeof QRCodeGenerator.defaultOptions>
  ): Promise<Buffer> {
    try {
      const qrOptions = { ...QRCodeGenerator.defaultOptions, ...options }
      const buffer = await QRCode.toBuffer(url, qrOptions)
      return buffer
    } catch (error) {
      console.error('Error generating QR code buffer:', error)
      throw new Error('Errore nella generazione del QR code')
    }
  }

  static async generateSVG(url: string): Promise<string> {
    try {
      const svg = await QRCode.toString(url, { 
        type: 'svg',
        width: 256,
        margin: 2
      })
      return svg
    } catch (error) {
      console.error('Error generating QR code SVG:', error)
      throw new Error('Errore nella generazione del QR code SVG')
    }
  }

  static downloadQRCode(dataURL: string, filename: string = 'qrcode.png'): void {
    try {
      const link = document.createElement('a')
      link.download = filename
      link.href = dataURL
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading QR code:', error)
      throw new Error('Errore nel download del QR code')
    }
  }

  static copyQRCodeToClipboard(dataURL: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Convert data URL to blob
        fetch(dataURL)
          .then(res => res.blob())
          .then(blob => {
            const item = new ClipboardItem({ 'image/png': blob })
            navigator.clipboard.write([item])
              .then(() => resolve())
              .catch(reject)
          })
          .catch(reject)
      } catch (error) {
        reject(new Error('Errore nella copia del QR code'))
      }
    })
  }

  static getQRCodeInfo(url: string): {
    url: string
    length: number
    estimatedSize: string
  } {
    return {
      url,
      length: url.length,
      estimatedSize: url.length < 100 ? 'Piccolo' : url.length < 300 ? 'Medio' : 'Grande'
    }
  }

  static validateQRCodeUrl(url: string): { isValid: boolean; error?: string } {
    if (!url || url.trim().length === 0) {
      return { isValid: false, error: 'URL non può essere vuoto' }
    }

    if (url.length > 2000) {
      return { isValid: false, error: 'URL troppo lungo per il QR code' }
    }

    try {
      new URL(url)
      return { isValid: true }
    } catch {
      return { isValid: false, error: 'URL non valido' }
    }
  }
}

// Utility functions for API routes
export const generateQRCodeForAPI = async (url: string): Promise<QRCodeData> => {
  const validation = QRCodeGenerator.validateQRCodeUrl(url)
  if (!validation.isValid) {
    throw new Error(validation.error)
  }

  const qrCode = await QRCodeGenerator.generateQRCode(url)
  
  return {
    qrCode,
    shortUrl: url
  }
}

// Custom styling options
export const qrCodeStyles = {
  default: {
    width: 256,
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' }
  },
  small: {
    width: 128,
    margin: 1,
    color: { dark: '#000000', light: '#FFFFFF' }
  },
  large: {
    width: 512,
    margin: 4,
    color: { dark: '#000000', light: '#FFFFFF' }
  },
  branded: {
    width: 256,
    margin: 2,
    color: { dark: '#1a1a1a', light: '#f8f9fa' }
  }
}

// Helper for batch QR code generation
export const generateMultipleQRCodes = async (
  urls: string[]
): Promise<QRCodeData[]> => {
  const results = await Promise.allSettled(
    urls.map(url => generateQRCodeForAPI(url))
  )

  return results
    .filter((result): result is PromiseFulfilledResult<QRCodeData> => 
      result.status === 'fulfilled'
    )
    .map(result => result.value)
}

// QR code analytics helper
export const getQRCodeAnalytics = (qrCodeData: QRCodeData) => {
  const url = qrCodeData.shortUrl
  return {
    url,
    qrCodeSize: qrCodeData.qrCode.length,
    estimatedScanTime: url.length < 50 ? 'Veloce' : url.length < 100 ? 'Medio' : 'Lento',
    complexity: url.length < 50 ? 'Bassa' : url.length < 100 ? 'Media' : 'Alta'
  }
}
