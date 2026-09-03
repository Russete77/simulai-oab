'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { Loader2, ArrowRight, Check, CalendarX } from 'lucide-react';
import { Button } from '@/components/ui';
import {
  CICLO_PADRAO,
  ciclo,
  formatarBRL,
  porMesCentavos,
  type CicloChave,
} from '@/lib/stripe/plan';

interface Assinatura {
  /** Tem data de fim marcada: o acesso acaba e o cartão não é cobrado. */
  terminando: boolean;
  acessoAte: string | null;
}

function formatarDia(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
  });
}

interface AssinarButtonProps {
  children?: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  /** Ciclo escolhido, levado adiante para /assinar. Padrão: mensal. */
  ciclo?: CicloChave;
}

/**
 * Leva o usuário ao pagamento, que acontece dentro do app em /assinar.
 *
 * Quem JÁ é assinante não vê oferta: vê que já tem plano e um caminho para
 * gerenciá-lo. Antes o botão convidava a assinar de novo, e a pessoa só
 * descobria que já tinha plano depois de chegar na tela de pagamento.
 *
 * O primeiro render é DETERMINÍSTICO — sempre a oferta, nunca um estado de
 * carregamento. O servidor não tem como saber se a pessoa assina, então
 * qualquer estado intermediário aqui vira erro de hidratação. A troca para
 * "já é assinante" acontece depois, quando a consulta responde no cliente.
 */
export function AssinarButton({
  children,
  className,
  fullWidth,
  variant = 'primary',
  size = 'lg',
  ciclo: cicloEscolhido = CICLO_PADRAO,
}: AssinarButtonProps) {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const c = ciclo(cicloEscolhido);
  const rotulo =
    children ?? `Assinar por ${formatarBRL(porMesCentavos(c))}/mês`;
  const [carregando, setCarregando] = useState(false);
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    let vivo = true;
    fetch('/api/billing/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (vivo && d?.assinante) {
          setAssinatura({
            terminando: Boolean(d.cancelaNoFimDoPeriodo),
            acessoAte: d.acessoAte ?? null,
          });
        }
      })
      .catch(() => {
        // Falhou a consulta: mantém a oferta. Errar para o lado de deixar
        // assinar é melhor que bloquear quem quer pagar — /assinar devolve
        // 409 e trata o caso de qualquer forma.
      });

    return () => {
      vivo = false;
    };
  }, [isLoaded, isSignedIn]);

  const assinar = () => {
    if (!isSignedIn) {
      const destino = `/assinar?ciclo=${cicloEscolhido}`;
      router.push(`/register?next=${encodeURIComponent(destino)}`);
      return;
    }
    setCarregando(true);
    // O ciclo vai na URL: a tela de pagamento abre já no que a pessoa
    // escolheu aqui, em vez de pedir a mesma decisão duas vezes.
    router.push(`/assinar?ciclo=${cicloEscolhido}`);
  };

  const largura = fullWidth ? 'w-full' : undefined;

  // Quem já tem plano não vê oferta. Mas quem cancelou e está no período
  // final também não é "assinante e pronto": precisa saber que o acesso tem
  // data para acabar, e onde desfazer isso.
  if (assinatura?.terminando) {
    return (
      <div className={largura}>
        <div className="flex items-center justify-center gap-2 h-12 px-6 rounded-md bg-warning-soft border border-warning/30 text-sm font-medium text-ink-1 text-center">
          <CalendarX className="w-4 h-4 text-warning shrink-0" />
          {assinatura.acessoAte
            ? `Seu acesso vai até ${formatarDia(assinatura.acessoAte)}`
            : 'Sua assinatura não vai renovar'}
        </div>
        <p className="text-center mt-3">
          <Link
            href="/dashboard/assinatura"
            className="text-sm text-accent hover:underline"
          >
            Reativar assinatura
          </Link>
        </p>
      </div>
    );
  }

  if (assinatura) {
    return (
      <div className={largura}>
        <div className="flex items-center justify-center gap-2 h-12 px-6 rounded-md bg-success-soft border border-success/30 text-sm font-medium text-ink-1">
          <Check className="w-4 h-4 text-success" />
          Você já é assinante
        </div>
        <p className="text-center mt-3">
          <Link
            href="/dashboard/assinatura"
            className="text-sm text-accent hover:underline"
          >
            Gerenciar assinatura
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className={largura}>
      <Button
        onClick={assinar}
        disabled={carregando}
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        className={className}
      >
        <span className="flex items-center justify-center gap-2">
          {carregando ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Abrindo...
            </>
          ) : (
            <>
              {rotulo}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </span>
      </Button>
    </div>
  );
}
