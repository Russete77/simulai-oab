

// Questões de provas passadas são imutáveis — 7 dias de cache corta o egress
// do Supabase (5.875 páginas revalidando a cada 1h sob crawl estouravam o free tier)
export const revalidate = 604800;

import { cache } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Card, Button } from '@/components/ui';
import { prisma } from '@/lib/db/prisma';
import { BookOpen, Calendar, Hash, Lock, ArrowRight, Home } from 'lucide-react';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

// Mapeamento de subjects para português
const SUBJECT_NAMES: Record<string, string> = {
  ETHICS: 'Ética',
  CONSTITUTIONAL: 'Constitucional',
  CIVIL: 'Civil',
  CIVIL_PROCEDURE: 'Processo Civil',
  CRIMINAL: 'Penal',
  CRIMINAL_PROCEDURE: 'Processo Penal',
  LABOUR: 'Trabalho',
  LABOUR_PROCEDURE: 'Processo Trabalho',
  ADMINISTRATIVE: 'Administrativo',
  TAXES: 'Tributário',
  BUSINESS: 'Empresarial',
  CONSUMER: 'Consumidor',
  ENVIRONMENTAL: 'Ambiental',
  CHILDREN: 'Criança e Adolescente',
  INTERNATIONAL: 'Internacional',
  HUMAN_RIGHTS: 'Direitos Humanos',
  GENERAL: 'Geral',
};

// Mapeamento de subjects para slugs
const SUBJECT_SLUGS: Record<string, string> = {
  ETHICS: 'etica',
  CONSTITUTIONAL: 'constitucional',
  CIVIL: 'civil',
  CIVIL_PROCEDURE: 'processo-civil',
  CRIMINAL: 'penal',
  CRIMINAL_PROCEDURE: 'processo-penal',
  LABOUR: 'trabalho',
  LABOUR_PROCEDURE: 'processo-trabalho',
  ADMINISTRATIVE: 'administrativo',
  TAXES: 'tributario',
  BUSINESS: 'empresarial',
  CONSUMER: 'consumidor',
  ENVIRONMENTAL: 'ambiental',
  CHILDREN: 'crianca-adolescente',
  INTERNATIONAL: 'internacional',
  HUMAN_RIGHTS: 'direitos-humanos',
  GENERAL: 'geral',
};

// Dedup por render: generateMetadata e a página buscam a mesma questão —
// sem cache() são 2 queries idênticas por página gerada.
const getQuestion = cache(getQuestionUncached);

async function getQuestionUncached(id: string) {
  const question = await prisma.question.findUnique({
    where: { id },
    include: {
      alternatives: {
        orderBy: { label: 'asc' },
      },
    },
  });

  return question;
}

// Pré-gera no build (SSG) as questões dos exames mais recentes — o maior volume
// de tráfego SEO. As demais continuam servidas via ISR on-demand, porque
// `dynamicParams` é true por padrão. Isso evita milhares de cold-renders quando
// o Googlebot rastreia URLs de questões antigas, sem estourar o tempo de build.
export async function generateStaticParams() {
  const currentYear = new Date().getFullYear();
  const recentQuestions = await prisma.question.findMany({
    where: { nullified: false, examYear: { gte: currentYear - 3 } },
    select: { id: true },
    orderBy: { examYear: 'desc' },
    take: 200, // só o exame mais recente pré-gerado; resto vira ISR on-demand (economiza build + egress)
  });
  return recentQuestions.map((q) => ({ id: q.id }));
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const question = await getQuestion(params.id);

  if (!question) {
    return {
      title: 'Questão não encontrada - Simulai OAB',
    };
  }

  const subjectName = SUBJECT_NAMES[question.subject] || question.subject;
  const title = `Questão ${question.questionNumber} de ${subjectName} — OAB ${question.examYear} (Fase ${question.examPhase})`;
  // Limpar HTML e truncar statement para descrição SEO
  const cleanStatement = question.statement.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const description = `Resolva a questão ${question.questionNumber} de ${subjectName} do Exame OAB ${question.examYear} com gabarito comentado e explicação com IA. ${cleanStatement.substring(0, 120)}...`;

  return {
    title,
    description,
    keywords: [
      'questão OAB',
      `questão ${subjectName} OAB`,
      `OAB ${question.examYear}`,
      `questão ${question.questionNumber} OAB ${question.examYear}`,
      subjectName,
      'gabarito OAB',
      'prova OAB comentada',
    ],
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://www.simulaioab.com/questoes/${params.id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `https://www.simulaioab.com/questoes/${params.id}`,
    },
  };
}

export default async function QuestionPage(props: PageProps) {
  const params = await props.params;
  const question = await getQuestion(params.id);

  if (!question) {
    notFound();
  }

  const subjectName = SUBJECT_NAMES[question.subject] || question.subject;
  const subjectSlug = SUBJECT_SLUGS[question.subject] || 'geral';

  // JSON-LD para SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: `Questão OAB ${question.examId} - Questão ${question.questionNumber}`,
    about: {
      '@type': 'Thing',
      name: subjectName,
    },
    educationalLevel: 'Professional',
    assesses: 'Exame da Ordem dos Advogados do Brasil',
    text: question.statement,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-bg">
        <Header />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-ink-2 mb-6">
            <Link href="/" className="hover:text-ink-1 transition-colors flex items-center gap-1">
              <Home className="w-4 h-4" />
              Início
            </Link>
            <span>/</span>
            <Link href={`/materias/${subjectSlug}`} className="hover:text-ink-1 transition-colors">
              {subjectName}
            </Link>
            <span>/</span>
            <span className="text-ink-1">Questão {question.questionNumber}</span>
          </nav>

          {/* Metadados */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface border rounded-lg">
              <BookOpen className="w-4 h-4 text-accent" />
              <span className="text-sm text-ink-1">{subjectName}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface border rounded-lg">
              <Calendar className="w-4 h-4 text-accent" />
              <span className="text-sm text-ink-1">Exame {question.examId}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface border rounded-lg">
              <Hash className="w-4 h-4 text-accent" />
              <span className="text-sm text-ink-1">Questão {question.questionNumber}</span>
            </div>
          </div>

          {/* Questão */}
          <Card variant="glass" className="mb-6">
            <h1 className="text-xl font-semibold text-ink-1 mb-6">
              Questão {question.questionNumber} de {subjectName} — OAB {question.examYear}
            </h1>
            <p className="text-ink-1/90 leading-relaxed whitespace-pre-wrap">{question.statement}</p>
          </Card>

          {/* Alternativas */}
          <Card variant="glass" className="mb-6">
            <h2 className="text-xl font-semibold text-ink-1 mb-6">Alternativas</h2>
            <div className="space-y-4">
              {question.alternatives.map((alt) => (
                <div
                  key={alt.id}
                  className="p-4 bg-surface-2 border rounded-xl"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent-soft border-accent flex items-center justify-center flex-shrink-0">
                      <span className="text-accent font-semibold">{alt.label}</span>
                    </div>
                    <p className="text-ink-1/90 leading-relaxed flex-1">{alt.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Paywall - Resposta bloqueada */}
          <Card variant="glass" className="border-2 border-accent">
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-soft border-accent flex items-center justify-center">
                <Lock className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-2xl font-bold text-ink-1 mb-2">
                Resposta Correta Bloqueada
              </h3>
              <p className="text-ink-2 mb-6 max-w-md mx-auto">
                Faça o diagnóstico grátis e descubra sua chance de passar, além de ver a resposta correta e acessar milhares de questões oficiais da OAB
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/diagnostico">
                  <Button variant="primary" size="lg" className="flex items-center gap-2">
                    Fazer Diagnóstico Grátis
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="ghost" size="lg">
                    Já tenho conta
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* CTA Adicional */}
          <div className="mt-8 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-accent rounded-2xl p-6 sm:p-8">
            <div className="max-w-3xl mx-auto text-center">
              <h3 className="text-2xl font-bold text-ink-1 mb-3">
                Pratique com +10.000 questões oficiais
              </h3>
              <p className="text-ink-2 mb-6">
                Acesse todas as questões de todos os exames da OAB, com estatísticas detalhadas,
                explicações com IA e simulados personalizados
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/diagnostico">
                  <Button variant="primary" size="lg">
                    Fazer Diagnóstico Grátis
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="ghost" size="lg">
                    Ver Planos
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
