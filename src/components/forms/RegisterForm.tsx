'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { registerSchema } from '@/app/helpers/validation'
import { RegisterData } from '@/types/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

interface RegisterFormProps {
  onSubmit: (userData: RegisterData) => Promise<void>
  isLoading?: boolean
}

type RegisterFormData = RegisterData & {
  confirmPassword: string
  acceptTerms: boolean
}

export default function RegisterForm({ onSubmit, isLoading = false }: RegisterFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [acceptTerms, setAcceptTerms] = useState(false)

  const formSchema = registerSchema.and(z.object({
    acceptTerms: z.boolean().refine((val: boolean) => val === true, {
      message: 'Devi accettare i termini e condizioni'
    })
  }))

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(formSchema)
  })

  const password = watch('password')

  const handleFormSubmit = async (data: RegisterFormData) => {
    setError(null)
    
    if (!acceptTerms) {
      setError('Devi accettare i termini e condizioni per procedere')
      return
    }

    try {
      const { confirmPassword, acceptTerms, ...registerData } = data
      await onSubmit(registerData)
      toast.success('Registrazione completata con successo!')
    } catch (err: any) {
      const errorMessage = err.message || 'Errore durante la registrazione'
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }

  const isFormLoading = isLoading || isSubmitting

  // Password strength indicator
  const getPasswordStrength = (password: string): { strength: number; text: string; color: string } => {
    if (!password) return { strength: 0, text: '', color: '' }
    
    let strength = 0
    if (password.length >= 6) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^a-zA-Z\d]/.test(password)) strength++

    const levels = [
      { text: 'Molto debole', color: 'text-red-500' },
      { text: 'Debole', color: 'text-orange-500' },
      { text: 'Discreta', color: 'text-yellow-500' },
      { text: 'Buona', color: 'text-blue-500' },
      { text: 'Forte', color: 'text-green-500' }
    ]

    return { strength, ...levels[Math.min(strength, 4)] }
  }

  const passwordStrength = getPasswordStrength(password || '')

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Registrati
        </CardTitle>
        <CardDescription className="text-center">
          Crea un nuovo account per iniziare ad abbreviare i tuoi URL
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="mario123"
              disabled={isFormLoading}
              {...register('username')}
              className={errors.username ? 'border-red-500' : ''}
            />
            {errors.username && (
              <p className="text-sm text-red-500">{errors.username.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Solo lettere, numeri e underscore. Min 3 caratteri.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="mario@esempio.com"
              disabled={isFormLoading}
              {...register('email')}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="La tua password"
              disabled={isFormLoading}
              {...register('password')}
              className={errors.password ? 'border-red-500' : ''}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
            {password && (
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      passwordStrength.strength === 1 ? 'bg-red-500 w-1/5' :
                      passwordStrength.strength === 2 ? 'bg-orange-500 w-2/5' :
                      passwordStrength.strength === 3 ? 'bg-yellow-500 w-3/5' :
                      passwordStrength.strength === 4 ? 'bg-blue-500 w-4/5' :
                      passwordStrength.strength === 5 ? 'bg-green-500 w-full' : 'w-0'
                    }`}
                  />
                </div>
                <span className={`text-xs ${passwordStrength.color}`}>
                  {passwordStrength.text}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Conferma Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Ripeti la password"
              disabled={isFormLoading}
              {...register('confirmPassword')}
              className={errors.confirmPassword ? 'border-red-500' : ''}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="acceptTerms"
              checked={acceptTerms}
              onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
              disabled={isFormLoading}
            />
            <Label htmlFor="acceptTerms" className="text-sm">
              Accetto i{' '}
              <a href="/terms" className="text-primary hover:underline">
                termini e condizioni
              </a>{' '}
              e la{' '}
              <a href="/privacy" className="text-primary hover:underline">
                privacy policy
              </a>
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isFormLoading || !acceptTerms}
          >
            {isFormLoading ? 'Registrazione in corso...' : 'Registrati'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Hai già un account?{' '}
            <a 
              href="/login" 
              className="font-medium text-primary hover:underline"
            >
              Accedi qui
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
