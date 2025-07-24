'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { urlSchema, validateCustomCode } from '@/app/helpers/validation'
import { CreateUrlRequest } from '@/types/url'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

interface UrlShorteningFormProps {
  onSubmit: (urlData: CreateUrlRequest) => Promise<void>
  onCheckCustomCode?: (code: string) => Promise<boolean>
  isLoading?: boolean
}

export default function UrlShorteningForm({ 
  onSubmit, 
  onCheckCustomCode,
  isLoading = false 
}: UrlShorteningFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [useCustomCode, setUseCustomCode] = useState(false)
  const [useExpiration, setUseExpiration] = useState(false)
  const [customCodeStatus, setCustomCodeStatus] = useState<{
    checking: boolean
    available: boolean | null
    message: string
  }>({
    checking: false,
    available: null,
    message: ''
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<CreateUrlRequest>({
    resolver: zodResolver(urlSchema)
  })

  const customCode = watch('customCode')

  // Check custom code availability
  useEffect(() => {
    if (!useCustomCode || !customCode || !onCheckCustomCode) return

    const checkCode = async () => {
      const validation = validateCustomCode(customCode)
      if (!validation.isValid) {
        setCustomCodeStatus({
          checking: false,
          available: false,
          message: validation.error || 'Codice non valido'
        })
        return
      }

      setCustomCodeStatus(prev => ({ ...prev, checking: true }))

      try {
        const available = await onCheckCustomCode(customCode)
        setCustomCodeStatus({
          checking: false,
          available,
          message: available 
            ? 'Codice disponibile!' 
            : 'Codice già in uso, scegline un altro'
        })
      } catch (error) {
        setCustomCodeStatus({
          checking: false,
          available: false,
          message: 'Errore nella verifica del codice'
        })
      }
    }

    const timeoutId = setTimeout(checkCode, 500) // Debounce
    return () => clearTimeout(timeoutId)
  }, [customCode, useCustomCode, onCheckCustomCode])

  const handleFormSubmit = async (data: CreateUrlRequest) => {
    setError(null)

    // Clean up data based on switches
    const submitData: CreateUrlRequest = {
      longUrl: data.longUrl,
      ...(useCustomCode && data.customCode && { customCode: data.customCode }),
      ...(useExpiration && data.expirationDate && { expirationDate: data.expirationDate })
    }

    // Validate custom code availability before submit
    if (useCustomCode && submitData.customCode && !customCodeStatus.available) {
      setError('Il codice personalizzato non è disponibile')
      return
    }

    try {
      await onSubmit(submitData)
      toast.success('URL abbreviato creato con successo!')
      
      // Reset form
      setValue('longUrl', '')
      setValue('customCode', '')
      setValue('expirationDate', '')
      setUseCustomCode(false)
      setUseExpiration(false)
      setCustomCodeStatus({ checking: false, available: null, message: '' })
    } catch (err: any) {
      const errorMessage = err.message || 'Errore nella creazione dell\'URL'
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }

  const isFormLoading = isLoading || isSubmitting

  // Generate minimum date for expiration (current time + 1 hour)
  const getMinExpirationDate = () => {
    const now = new Date()
    now.setHours(now.getHours() + 1)
    return now.toISOString().slice(0, 16) // Format for datetime-local input
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Abbrevia un nuovo URL</CardTitle>
        <CardDescription>
          Inserisci un URL lungo per ottenere una versione abbreviata
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Long URL Input */}
          <div className="space-y-2">
            <Label htmlFor="longUrl">URL da abbreviare *</Label>
            <Input
              id="longUrl"
              type="url"
              placeholder="https://esempio.com/pagina-molto-lunga"
              disabled={isFormLoading}
              {...register('longUrl')}
              className={errors.longUrl ? 'border-red-500' : ''}
            />
            {errors.longUrl && (
              <p className="text-sm text-red-500">{errors.longUrl.message}</p>
            )}
          </div>

          {/* Custom Code Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="useCustomCode"
                checked={useCustomCode}
                onCheckedChange={setUseCustomCode}
                disabled={isFormLoading}
              />
              <Label htmlFor="useCustomCode">Usa codice personalizzato</Label>
            </div>

            {useCustomCode && (
              <div className="space-y-2">
                <Label htmlFor="customCode">Codice personalizzato</Label>
                <Input
                  id="customCode"
                  type="text"
                  placeholder="MioLink2024"
                  disabled={isFormLoading}
                  {...register('customCode')}
                  className={errors.customCode ? 'border-red-500' : ''}
                />
                {errors.customCode && (
                  <p className="text-sm text-red-500">{errors.customCode.message}</p>
                )}
                
                {/* Custom code status */}
                {customCode && (
                  <div className="flex items-center space-x-2">
                    {customCodeStatus.checking ? (
                      <div className="text-sm text-gray-500">Verifica in corso...</div>
                    ) : (
                      <div className={`text-sm ${
                        customCodeStatus.available === true 
                          ? 'text-green-600' 
                          : customCodeStatus.available === false 
                          ? 'text-red-600' 
                          : 'text-gray-500'
                      }`}>
                        {customCodeStatus.message}
                      </div>
                    )}
                  </div>
                )}
                
                <p className="text-xs text-gray-500">
                  3-20 caratteri. Solo lettere, numeri, trattini e underscore.
                </p>
              </div>
            )}
          </div>

          {/* Expiration Date Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="useExpiration"
                checked={useExpiration}
                onCheckedChange={setUseExpiration}
                disabled={isFormLoading}
              />
              <Label htmlFor="useExpiration">Imposta data di scadenza</Label>
            </div>

            {useExpiration && (
              <div className="space-y-2">
                <Label htmlFor="expirationDate">Data e ora di scadenza</Label>
                <Input
                  id="expirationDate"
                  type="datetime-local"
                  min={getMinExpirationDate()}
                  disabled={isFormLoading}
                  {...register('expirationDate')}
                  className={errors.expirationDate ? 'border-red-500' : ''}
                />
                {errors.expirationDate && (
                  <p className="text-sm text-red-500">{errors.expirationDate.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  Il link smetterà di funzionare dopo questa data
                </p>
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isFormLoading || (useCustomCode && !customCodeStatus.available)}
          >
            {isFormLoading ? 'Creazione in corso...' : 'Abbrevia URL'}
          </Button>
        </form>

        {/* Info Section */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Come funziona:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Inserisci un URL valido (deve iniziare con http:// o https://)</li>
            <li>• Opzionalmente scegli un codice personalizzato</li>
            <li>• Imposta una data di scadenza se necessario</li>
            <li>• Il tuo URL abbreviato sarà disponibile immediatamente</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
