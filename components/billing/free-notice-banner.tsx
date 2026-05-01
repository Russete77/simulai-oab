'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

/**
 * Banner persistente exibido no topo para usuários SEM ASSINATURA ATIVA.
 * Renderizado condicionalmente pelo layout quando Subscription.status
 * é INCOMPLETE/CANCELED/PAST_DUE (ou seja, gate.ts bloqueia).
 *
 * Não é importado em nenhum lugar atualmente — pronto pra uso quando
 * o layout precisar mostrar aviso de paywall sem bloquear toda a tela.
 */
export function FreeNoticeBanner() {
  return (
    <div className="relative w-full bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border-b border-amber-500/30 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3 text-center">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <p className="text-sm text-amber-100">
          Sua conta não tem plano ativo.{' '}
          <Link
            href="/pricing"
            className="font-semibold underline hover:text-ink-1 transition-colors"
          >
            Assine o PRO por R$ 89,99/mês
          </Link>{' '}
          e libere tudo agora.
        </p>
      </div>
    </div>
  );
}
