'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema } from '@/app/helpers/validation'
import { LoginCredentials } from '@/types/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => Promise<void>
  isLoading?: boolean
}

export default function LoginForm({ onSubmit, isLoading = false }: LoginFormProps) {
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema)
  })

  const handleFormSubmit = async (data: LoginCredentials) => {
    setError(null)
    
    try {
      await onSubmit(data)
      toast.success('Login effettuato con successo!')
    } catch (err: any) {
      const errorMessage = err.message || 'Errore durante il login'
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }

  const isFormLoading = isLoading || isSubmitting

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Accedi
        </CardTitle>
        <CardDescription className="text-center">
          Inserisci le tue credenziali per accedere al tuo account
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
            <Label htmlFor="identifier">Email o Username</Label>
            <Input
              id="identifier"
              type="text"
              placeholder="mario@esempio.com o mario123"
              disabled={isFormLoading}
              {...register('identifier')}
              className={errors.identifier ? 'border-red-500' : ''}
            />
            {errors.identifier && (
              <p className="text-sm text-red-500">{errors.identifier.message}</p>
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
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isFormLoading}
          >
            {isFormLoading ? 'Accesso in corso...' : 'Accedi'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Non hai un account?{' '}
            <a 
              href="/register" 
              className="font-medium text-primary hover:underline"
            >
              Registrati qui
            </a>
          </p>
        </div>

        <div className="mt-4 text-center">
          <a 
            href="/forgot-password" 
            className="text-sm text-gray-600 hover:underline"
          >
            Password dimenticata?
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
