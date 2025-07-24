'use client'

import { useState } from 'react'
import { ShortUrl } from '@/types/url'
import { formatExpirationDate, isExpired, getShortUrlDisplay } from '@/app/helpers/validation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

interface UrlListProps {
  urls: ShortUrl[]
  isLoading?: boolean
  onDelete?: (id: number) => Promise<void>
  onViewAnalytics?: (url: ShortUrl) => void
  onViewQRCode?: (url: ShortUrl) => void
}

export default function UrlList({ 
  urls, 
  isLoading = false, 
  onDelete,
  onViewAnalytics,
  onViewQRCode
}: UrlListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleDelete = async (id: number) => {
    if (!onDelete) return

    setDeletingId(id)
    try {
      await onDelete(id)
      toast.success('URL eliminato con successo!')
    } catch (error) {
      toast.error('Errore nell\'eliminazione dell\'URL')
    } finally {
      setDeletingId(null)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('URL copiato negli appunti!')
    } catch (error) {
      toast.error('Errore nella copia dell\'URL')
    }
  }

  const openUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>I tuoi URL</CardTitle>
          <CardDescription>Caricamento in corso...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (urls.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>I tuoi URL</CardTitle>
          <CardDescription>Non hai ancora creato nessun URL abbreviato</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Usa il form sopra per creare il tuo primo URL abbreviato!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const activeUrls = urls.filter(url => !isExpired(url.expirationDate))
  const expiredUrls = urls.filter(url => isExpired(url.expirationDate))

  return (
    <div className="space-y-6">
      {/* Active URLs */}
      <Card>
        <CardHeader>
          <CardTitle>URL Attivi ({activeUrls.length})</CardTitle>
          <CardDescription>
            I tuoi URL abbreviati funzionanti
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeUrls.length === 0 ? (
            <Alert>
              <AlertDescription>
                Nessun URL attivo al momento
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL Originale</TableHead>
                    <TableHead>URL Breve</TableHead>
                    <TableHead>Click</TableHead>
                    <TableHead>Scadenza</TableHead>
                    <TableHead>Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeUrls.map((url) => (
                    <TableRow key={url.id}>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="truncate font-medium">{url.longUrl}</p>
                          <p className="text-xs text-gray-500">
                            Creato: {new Date(url.createdAt).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {url.shortCode}
                          </code>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(getShortUrlDisplay(url.shortCode))}
                            >
                              Copia
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openUrl(getShortUrlDisplay(url.shortCode))}
                            >
                              Apri
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {url.clicksTotal}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {url.expirationDate ? (
                          <span className="text-sm">
                            {formatExpirationDate(url.expirationDate)}
                          </span>
                        ) : (
                          <Badge variant="outline">Mai</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          {onViewAnalytics && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onViewAnalytics(url)}
                            >
                              Analytics
                            </Button>
                          )}
                          {onViewQRCode && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onViewQRCode(url)}
                            >
                              QR Code
                            </Button>
                          )}
                          {onDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={deletingId === url.id}
                                >
                                  {deletingId === url.id ? 'Eliminando...' : 'Elimina'}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Sei sicuro di voler eliminare questo URL? 
                                    Questa azione non può essere annullata.
                                    <br /><br />
                                    <strong>URL:</strong> {url.longUrl}
                                    <br />
                                    <strong>Codice:</strong> {url.shortCode}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(url.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Elimina
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expired URLs */}
      {expiredUrls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>URL Scaduti ({expiredUrls.length})</CardTitle>
            <CardDescription>
              URL che hanno superato la data di scadenza
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL Originale</TableHead>
                    <TableHead>URL Breve</TableHead>
                    <TableHead>Click Totali</TableHead>
                    <TableHead>Scaduto il</TableHead>
                    <TableHead>Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expiredUrls.map((url) => (
                    <TableRow key={url.id} className="opacity-60">
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="truncate font-medium">{url.longUrl}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {url.shortCode}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {url.clicksTotal}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-red-600">
                          {url.expirationDate && formatExpirationDate(url.expirationDate)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          {onViewAnalytics && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onViewAnalytics(url)}
                            >
                              Analytics
                            </Button>
                          )}
                          {onDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={deletingId === url.id}
                                >
                                  {deletingId === url.id ? 'Eliminando...' : 'Elimina'}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Sei sicuro di voler eliminare questo URL scaduto?
                                    <br /><br />
                                    <strong>URL:</strong> {url.longUrl}
                                    <br />
                                    <strong>Codice:</strong> {url.shortCode}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(url.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Elimina
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
