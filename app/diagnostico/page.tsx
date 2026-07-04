import { getCurrentUser } from '@/lib/auth';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Card, Button } from '@/components/ui';
import { Target, Gauge, Sparkles, CheckCircle2 } from 'lucide-react';
import { DiagnosticoStart } from './diagnostico-client';

export const metadata: Metadata = {
  title: 'Diagnóstico grátis — descubra sua chance de passar na OAB | Simulai OAB',
  description:
    'Simulado diagnóstico gratuito com 20 questões oficiais da FGV. Descubra sua nota projetada na 1ª fase da OAB e onde focar seus estudos. Sem cartão de crédito.',
};

export const dynamic = 'force-dynamic';

const STEPS = [
  {
    icon: Target,
    title: '20 questões oficiais',
    body: 'Questões reais da FGV, na proporção da prova de verdade.',
  },
  {
    icon: Gauge,
    title: 'Sua chance de passar',
    body: 'Nota projetada na prova de 80 questões e distância até o corte de 40.',
  },
  {
    icon: Sparkles,
    title: 'IA explica seus erros',
    body: '3 explicações grátis com base legal, dica de memorização e pegadinhas.',
  },
];

export default async function DiagnosticoPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-bg">
      {/* Nav mínima */}
      <nav className="border-b bg-surface">
        <div className="container-page flex h-16 items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight text-ink-1">
            Simulai <span className="text-accent">OAB</span>
          </Link>
          {!user && (
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Entrar
              </Button>
            </Link>
          )}
        </div>
      </nav>

      <main className="container-page py-16 max-w-3xl mx-auto">
        <header className="text-center mb-12">
          <p className="text-eyebrow mb-3">Diagnóstico gratuito</p>
          <h1 className="text-4xl font-semibold tracking-tight text-ink-1 mb-4">
            Você passaria na OAB <span className="text-accent">hoje</span>?
          </h1>
          <p className="text-ink-2 text-lg max-w-xl mx-auto">
            Responda 20 questões oficiais da FGV e descubra sua nota projetada,
            suas matérias fracas e o que fazer para fechar o gap até a aprovação.
          </p>
        </header>

        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          {STEPS.map((s) => (
            <Card key={s.title}>
              <div className="w-9 h-9 rounded-md bg-accent-soft text-accent flex items-center justify-center mb-3">
                <s.icon className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-ink-1 mb-1">{s.title}</h3>
              <p className="text-sm text-ink-2">{s.body}</p>
            </Card>
          ))}
        </div>

        <Card>
          <div className="py-4">
            {user ? (
              <DiagnosticoStart />
            ) : (
              <div className="text-center">
                <p className="text-sm text-ink-2 mb-4">
                  Crie sua conta grátis para fazer o diagnóstico — leva 30 segundos.
                </p>
                <Link href="/register?redirect_url=/diagnostico">
                  <Button size="lg">Criar conta e começar</Button>
                </Link>
                <div className="flex items-center justify-center gap-4 mt-4 text-xs text-ink-3">
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-success" /> Sem cartão
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-success" /> Resultado na hora
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-success" /> Questões oficiais FGV
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
