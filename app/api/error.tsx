'use client'

import { useEffect } from 'react'

export default function APIError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('API error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md space-y-4 text-center">
        <h2 className="text-2xl font-bold">Erro na API</h2>
        <p className="text-muted-foreground">
          Ocorreu um erro ao processar sua requisição.
        </p>
        <button
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
