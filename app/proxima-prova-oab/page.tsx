import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { OABCountdown } from '@/components/countdown/oab-countdown';

export const metadata: Metadata = {
  title: 'Quando é o próximo Exame da OAB? Contagem regressiva | Simulai OAB',
  description:
    'Data oficial do próximo Exame de Ordem (OAB), contagem regressiva em tempo real e o que fazer com o tempo que falta até a 1ª fase. Diagnóstico grátis com 20 questões oficiais da FGV.',
  alternates: { canonical: '/proxima-prova-oab' },
};

export const revalidate = 3600;

export default function ProximaProvaOabPage() {
  return (
    <div className="min-h-screen bg-bg">
      <nav className="border-b bg-surface">
        <div className="container-page flex h-16 items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight text-ink-1">
            Simulai <span className="text-accent">OAB</span>
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="sm">Entrar</Button>
          </Link>
        </div>
      </nav>

      <main className="container-page py-16 max-w-2xl mx-auto">
        <header className="text-center mb-10">
          <p className="text-eyebrow mb-3">Calendário oficial FGV/OAB</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink-1 mb-4">
            Quando é o próximo Exame da OAB?
          </h1>
          <p className="text-ink-2 text-lg max-w-xl mx-auto">
            A data já está marcada. A sua preparação para a 1ª fase ainda não —
            faça um diagnóstico grátis de 20 questões oficiais e descubra sua
            chance de passar hoje.
          </p>
        </header>

        <OABCountdown
          ctas={[
            { href: '/diagnostico', label: 'Fazer diagnóstico grátis', variant: 'primary' },
            { href: '/pricing', label: 'Ver planos', variant: 'secondary' },
          ]}
        />

        <div className="mt-10 text-center">
          <Link href="/diagnostico">
            <Button size="lg">Fazer diagnóstico grátis</Button>
          </Link>
          <p className="text-xs text-ink-3 mt-3">
            Sem cartão de crédito · Resultado na hora · Questões oficiais FGV
          </p>
        </div>
      </main>
    </div>
  );
}
