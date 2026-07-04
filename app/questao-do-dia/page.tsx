import { Metadata } from 'next';
import { Header } from '@/components/layout/header';
import { DailyQuestionCard } from '@/components/daily-question/daily-question-card';
import { Card, Button } from '@/components/ui';
import Link from 'next/link';
import { ArrowLeft, BarChart3, BookOpen, Trophy, Flame, Share2 } from 'lucide-react';

const today = new Date().toLocaleDateString('pt-BR', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export const metadata: Metadata = {
  title: `Questão do Dia OAB - ${new Date().toLocaleDateString('pt-BR')}`,
  description:
    'Responda a questão do dia do Exame da OAB. Pratique todos os dias com uma questão selecionada aleatoriamente.',
};

export default function QuestaoDoDiaPage() {
  return (
    <div className="min-h-screen bg-bg">
      <Header />

      <main className="container-narrow py-10">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink-1 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar ao Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
          <div>
            <p className="text-eyebrow mb-2">Questão diária</p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink-1">
              Questão do dia
            </h1>
            <p className="text-ink-2 mt-1.5 capitalize">{today}</p>
          </div>
          <Link href="/analytics">
            <Button variant="secondary" size="sm">
              <BarChart3 className="w-3.5 h-3.5" />
              Ver Analytics
            </Button>
          </Link>
        </div>

        {/* Daily Question Card */}
        <div className="mb-10">
          <DailyQuestionCard />
        </div>

        {/* Tips */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-md bg-accent-soft text-accent flex items-center justify-center shrink-0">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink-1">Mantenha a sequência</h3>
                <p className="text-sm text-ink-2 mt-1">
                  Responder todo dia mantém sua streak. Cada dia conta nas estatísticas.
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-md bg-accent-soft text-accent flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink-1">Questão diferente todo dia</h3>
                <p className="text-sm text-ink-2 mt-1">
                  Selecionada aleatoriamente do banco oficial de 5.875 questões.
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-md bg-accent-soft text-accent flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink-1">Conta nas suas estatísticas</h3>
                <p className="text-sm text-ink-2 mt-1">
                  Acertos e erros entram no seu desempenho geral e nos analytics.
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-md bg-accent-soft text-accent flex items-center justify-center shrink-0">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink-1">Compartilhe</h3>
                <p className="text-sm text-ink-2 mt-1">
                  Convide amigos a responderem a mesma questão e compare resultados.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
