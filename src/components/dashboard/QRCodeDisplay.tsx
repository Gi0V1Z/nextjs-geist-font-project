'use client'

import { useState, useEffect } from 'react'
import { ShortUrl, QRCodeData } from '@/types/url'
import { getShortUrlDisplay } from '@/app/helpers/validation'
import { QRCodeGenerator } from '@/app/helpers/qr'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface QRCodeDisplayProps {
  url: ShortUrl
  isOpen?: boolean
  onClose?: () => void
}

export default function QRCodeDisplay({ url, isOpen, onClose }: QRCodeDisplayProps) {
  const [qrCodeData, setQrCodeData] = useState<QRCodeData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const shortUrl = getShortUrlDisplay(url.shortCode)

  const generateQRCode = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Try using API route first
      const response = await fetch('/api/generate-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: shortUrl })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setQrCodeData(result.data)
        } else {
          throw new Error(result.error || 'Errore nella generazione del QR code')
        }
      } else {
        // Fallback to client-side generation
        const qrCode = await QRCodeGenerator.generateQRCode(shortUrl)
        setQrCodeData({ qrCode, shortUrl })
      }
    } catch (err: any) {
      console.error('QR Code generation error:', err)
      setError(err.message || 'Errore nella generazione del QR code')
      toast.error('Errore nella generazione del QR code')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      generateQRCode()
    }
  }, [isOpen, shortUrl])

  const downloadQRCode = () => {
    if (!qrCodeData) return

    try {
      QRCodeGenerator.downloadQRCode(
        qrCodeData.qrCode, 
        `qr-${url.shortCode}.png`
      )
      toast.success('QR Code scaricato!')
    } catch (error) {
      toast.error('Errore nel download del QR Code')
    }
  }

  const copyQRCode = async () => {
    if (!qrCodeData) return

    try {
      await QRCodeGenerator.copyQRCodeToClipboard(qrCodeData.qrCode)
      toast.success('QR Code copiato negli appunti!')
    } catch (error) {
      toast.error('Errore nella copia del QR Code')
    }
  }

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl)
      toast.success('URL copiato negli appunti!')
    } catch (error) {
      toast.error('Errore nella copia dell\'URL')
    }
  }

  const shareUrl = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'URL Abbreviato',
          text: `Guarda questo link: ${url.longUrl}`,
          url: shortUrl
        })
      } catch (error) {
        // User cancelled sharing or error occurred
        copyUrl()
      }
    } else {
      copyUrl()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code per {url.shortCode}</DialogTitle>
          <DialogDescription>
            Scansiona il QR code per accedere rapidamente al tuo link
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* URL Info */}
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium">URL Originale:</p>
              <p className="text-sm text-gray-600 break-all">{url.longUrl}</p>
            </div>
            <div>
              <p className="text-sm font-medium">URL Breve:</p>
              <div className="flex items-center space-x-2">
                <code className="text-sm bg-gray-100 px-2 py-1 rounded flex-1">
                  {shortUrl}
                </code>
                <Button size="sm" variant="outline" onClick={copyUrl}>
                  Copia
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* QR Code Display */}
          <div className="text-center space-y-4">
            {isLoading && (
              <div className="flex flex-col items-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm text-gray-600">Generazione QR Code...</p>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {qrCodeData && !isLoading && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img 
                    src={qrCodeData.qrCode} 
                    alt={`QR Code per ${url.shortCode}`}
                    className="border rounded-lg shadow-sm"
                  />
                </div>

                {/* QR Code Actions */}
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button size="sm" onClick={downloadQRCode}>
                    Scarica PNG
                  </Button>
                  <Button size="sm" variant="outline" onClick={copyQRCode}>
                    Copia Immagine
                  </Button>
                  <Button size="sm" variant="outline" onClick={shareUrl}>
                    Condividi
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* URL Stats */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{url.clicksTotal}</p>
              <p className="text-sm text-gray-600">Click Totali</p>
            </div>
            <div>
              <p className="text-sm font-medium">
                {url.expirationDate ? (
                  <>
                    <Badge variant="outline">
                      Scade il {new Date(url.expirationDate).toLocaleDateString('it-IT')}
                    </Badge>
                  </>
                ) : (
                  <Badge variant="secondary">Nessuna Scadenza</Badge>
                )}
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Come usare il QR Code:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Apri l'app fotocamera del tuo smartphone</li>
              <li>• Punta la fotocamera verso il QR code</li>
              <li>• Tocca la notifica che appare per aprire il link</li>
              <li>• Oppure usa un'app dedicata per la scansione QR</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Standalone QR Code component for inline display
export function InlineQRCode({ url, size = 'small' }: { 
  url: ShortUrl
  size?: 'small' | 'medium' | 'large' 
}) {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const shortUrl = getShortUrlDisplay(url.shortCode)

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32'
  }

  useEffect(() => {
    const generateQR = async () => {
      setIsLoading(true)
      try {
        const qrCodeDataURL = await QRCodeGenerator.generateQRCode(shortUrl, {
          width: size === 'small' ? 64 : size === 'medium' ? 96 : 128
        })
        setQrCode(qrCodeDataURL)
      } catch (error) {
        console.error('Error generating inline QR code:', error)
      } finally {
        setIsLoading(false)
      }
    }

    generateQR()
  }, [shortUrl, size])

  if (isLoading) {
    return (
      <div className={`${sizeClasses[size]} bg-gray-100 rounded flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!qrCode) {
    return (
      <div className={`${sizeClasses[size]} bg-gray-100 rounded flex items-center justify-center`}>
        <span className="text-xs text-gray-500">QR</span>
      </div>
    )
  }

  return (
    <img 
      src={qrCode} 
      alt={`QR Code per ${url.shortCode}`}
      className={`${sizeClasses[size]} border rounded`}
    />
  )
}
