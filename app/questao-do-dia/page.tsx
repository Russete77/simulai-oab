import { Metadata } from 'next';
import { Header } from '@/components/layout/header';
import { DailyQuestionCard } from '@/components/daily-question/daily-question-card';
import { Button } from '@/components/ui';
import Link from 'next/link';
import { ArrowLeft, BarChart3 } from 'lucide-react';

const today = new Date().toLocaleDateString('pt-BR', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export const metadata: Metadata = {
  title: `Questão do Dia OAB - ${new Date().toLocaleDateString('pt-BR')}`,
  description: 'Responda a questão do dia do Exame da OAB. Pratique todos os dias com uma questão selecionada aleatoriamente.',
  openGraph: {
    title: `Questão do Dia OAB - ${new Date().toLocaleDateString('pt-BR')}`,
    description: 'Responda a questão do dia do Exame da OAB e melhore seu desempenho.',
    type: 'website',
    locale: 'pt_BR',
  },
};



export default function QuestãoDoDiaPage() {
  return (
    <div className="min-h-screen bg-navy-950">
      <Header />

      <main id="main-content" role="main" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb and Back Button */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/dashboard">
              <Button variant="ghost" className="mb-4 flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar ao Dashboard
              </Button>
            </Link>
            <h1 className="text-4xl font-bold text-white mb-2">Questão do Dia</h1>
            <p className="text-navy-600 capitalize">{today}</p>
          </div>
          <Link href="/analytics">
            <Button variant="outline" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Ver Analytics
            </Button>
          </Link>
        </div>

        {/* Daily Question Card */}
        <div className="mb-8">
          <DailyQuestionCard />
        </div>

        {/* Info Section */}
        <div className="bg-navy-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Dica do Dia</h2>
          <div className="space-y-3 text-navy-300">
            <p>
              • Responda a <strong>Questão do Dia</strong> todos os dias para manter uma sequência consistente de estudo
            </p>
            <p>
              • Cada dia, uma questão diferente é selecionada de forma aleatória para você treinar
            </p>
            <p>
              • Sua resposta será contabilizada em suas estatísticas gerais de desempenho
            </p>
            <p>
              • Compartilhe seu resultado com amigos e crie uma competição saudável de estudo
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-2">Pratique Mais</h3>
            <p className="text-navy-600 mb-4">Faça mais questões e acelere seu aprendizado</p>
            <Link href="/practice" className="inline-block">
              <Button variant="primary" className="w-full">
                Ir para Prática
              </Button>
            </Link>
          </div>

          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-2">Acompanhe Seu Progresso</h3>
            <p className="text-navy-600 mb-4">Veja estatísticas detalhadas de seu desempenho</p>
            <Link href="/analytics" className="inline-block">
              <Button variant="primary" className="w-full bg-gradient-to-r from-amber-600 to-orange-600">
                Ver Analytics
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
