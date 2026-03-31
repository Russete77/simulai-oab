'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log do erro para serviço de monitoramento (ex: Sentry)
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="mx-auto max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter text-foreground">
            Ops! Algo deu errado
          </h1>
          <p className="text-muted-foreground">
            Encontramos um erro inesperado. Não se preocupe, já estamos trabalhando para resolver!
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="rounded-lg bg-destructive/10 p-4 text-left">
            <p className="text-sm font-mono text-destructive break-all">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            onClick={reset}
            size="lg"
            className="w-full sm:w-auto"
          >
            Tentar novamente
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
          >
            Voltar ao início
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Se o problema persistir, entre em contato com nosso suporte.
        </p>
      </div>
    </div>
  )
}
