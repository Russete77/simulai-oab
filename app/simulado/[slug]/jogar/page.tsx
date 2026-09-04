import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { prisma } from '@/lib/db/prisma';
import { Home, ChevronRight, Info } from 'lucide-react';
import {
  SimuladoJogo,
  type QuestaoJogo,
} from '@/components/simulado/simulado-jogo';
import {
  lerSlugDoExame,
  nomeDaMateria,
  CORTE_APROVACAO,
} from '@/lib/simulado/exame';

// Provas passadas são imutáveis — 7 dias de cache, mesmo motivo da página do
// exame ao lado: 44 simulados revalidando sob crawl estouravam o egress.
export const revalidate = 604800;

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Só os exames mais recentes entram no build. O resto vira ISR sob demanda —
 * pré-gerar 44 páginas de 80 questões cada custa tempo de build e egress sem
 * necessidade, já que a cauda de exames antigos recebe pouco tráfego.
 */
export async function generateStaticParams() {
  const exames = await prisma.question.groupBy({
    by: ['examId'],
    where: { nullified: false },
    orderBy: { examId: 'desc' },
    take: 3,
  });
  return exames.map((e) => ({ slug: e.examId }));
}

async function buscarQuestoes(examId: string): Promise<QuestaoJogo[]> {
  const questoes = await prisma.question.findMany({
    where: { examId, nullified: false },
    orderBy: { questionNumber: 'asc' },
    select: {
      id: true,
      questionNumber: true,
      subject: true,
      statement: true,
      alternatives: {
        orderBy: { label: 'asc' },
        select: { label: true, text: true, isCorrect: true },
      },
    },
  });

  return questoes.map((q) => ({
    id: q.id,
    numero: q.questionNumber,
    materia: nomeDaMateria(q.subject),
    enunciado: q.statement,
    // O gabarito viaja para o cliente de propósito: as respostas já são
    // públicas em /questoes/[id] desde que abrimos o gabarito comentado, e
    // corrigir no servidor exigiria uma rota autenticada — a parede que
    // esta página existe para derrubar.
    alternativas: q.alternatives.map((a) => ({
      label: a.label,
      texto: a.text,
      correta: a.isCorrect,
    })),
  }));
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const exame = lerSlugDoExame(slug);
  if (!exame) return { title: 'Simulado não encontrado — Simulai OAB' };

  const title = `Simulado ${exame.label} Online Grátis — Prova Completa Sem Cadastro`;
  const description = `Faça o simulado da ${exame.label} com as questões oficiais da FGV, aqui mesmo e sem criar conta. Correção na hora, nota projetada na escala de 80 e gabarito comentado de cada questão.`;

  return {
    title,
    description,
    alternates: { canonical: `https://www.simulaioab.com/simulado/${slug}/jogar` },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://www.simulaioab.com/simulado/${slug}/jogar`,
    },
  };
}

export default async function JogarSimuladoPage(props: PageProps) {
  const { slug } = await props.params;
  const exame = lerSlugDoExame(slug);
  if (!exame) notFound();

  const questoes = await buscarQuestoes(exame.examId);
  if (questoes.length === 0) notFound();

  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Quiz',
    name: `Simulado ${exame.label} — OAB 1ª Fase`,
    description: `Simulado completo da ${exame.label} com ${questoes.length} questões oficiais da FGV, com correção imediata.`,
    about: { '@type': 'Thing', name: 'Exame da Ordem dos Advogados do Brasil' },
    educationalLevel: 'Professional',
    numberOfQuestions: questoes.length,
    isAccessibleForFree: true,
    url: `https://www.simulaioab.com/simulado/${slug}/jogar`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-bg">
        <Header />

        <main id="main-content" role="main" className="container-page py-8 max-w-3xl">
          <nav aria-label="Trilha" className="flex items-center gap-2 text-sm text-ink-2 mb-6">
            <Link href="/" className="hover:text-ink-1 transition-colors flex items-center gap-1">
              <Home className="w-4 h-4" />
              Início
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href={`/simulado/${slug}`} className="hover:text-ink-1 transition-colors">
              {exame.label}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-ink-1">Simulado</span>
          </nav>

          <header className="mb-6">
            <h1 className="text-3xl font-semibold tracking-tight text-ink-1 mb-2">
              Simulado {exame.label}
            </h1>
            <p className="text-ink-2 leading-relaxed">
              {questoes.length} questões oficiais da FGV. Responde aqui mesmo, sem
              criar conta — a correção sai na hora, com a nota projetada para a
              escala de 80 e o corte de {CORTE_APROVACAO}.
            </p>
          </header>

          <div className="flex items-start gap-2.5 p-3.5 rounded-lg border bg-surface-2 mb-6">
            <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <p className="text-sm text-ink-2 leading-relaxed">
              Seu progresso fica salvo neste navegador — dá para fechar e voltar
              depois. Nada é enviado para lugar nenhum.
            </p>
          </div>

          <SimuladoJogo slug={slug} rotuloExame={exame.label} questoes={questoes} />
        </main>
      </div>
    </>
  );
}
