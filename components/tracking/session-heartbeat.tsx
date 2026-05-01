'use client';

/**
 * SessionHeartbeat — componente invisível que bate em /api/internal/heartbeat
 * a cada 60s enquanto a aba está visível E o usuário está autenticado.
 *
 * Montar em `app/layout.tsx` dentro do ClerkProvider (ou em layouts de rotas
 * autenticadas). Não renderiza nada.
 *
 * Por que não usar só o lastActiveAt do Clerk?
 *  - Clerk atualiza lastActiveAt em ações auth (login, API call autenticada).
 *  - Não reflete tempo ATIVO contínuo com aba aberta.
 *  - Este heartbeat dá granularidade de 60s pra medir engajamento real.
 */

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

const INTERVAL_MS = 60_000; // 1 min

export function SessionHeartbeat() {
  const { isSignedIn, sessionId } = useAuth();
  const pathname = usePathname();
  const firstBeatRef = useRef(true);

  useEffect(() => {
    if (!isSignedIn) return;

    let cancelled = false;

    const beat = async () => {
      if (cancelled) return;
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return; // não conta tempo quando aba está em background
      }
      try {
        await fetch('/api/internal/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          body: JSON.stringify({
            currentPath: pathname,
            clerkSessionId: sessionId ?? undefined,
            firstOfSession: firstBeatRef.current,
          }),
        });
        firstBeatRef.current = false;
      } catch {
        // silencioso — tracking não é crítico
      }
    };

    // Primeira batida imediata
    beat();
    const intervalId = setInterval(beat, INTERVAL_MS);

    // Beat ao trocar de página
    const onVisible = () => {
      if (document.visibilityState === 'visible') beat();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [isSignedIn, sessionId, pathname]);

  return null;
}
