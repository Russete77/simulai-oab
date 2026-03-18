// Force dynamic rendering (não tentar SSG no build)
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache por 1 hora

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

async function getQuestion(id: string) {
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
      url: `https://simulaioab.com/questoes/${params.id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `https://simulaioab.com/questoes/${params.id}`,
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

      <div className="min-h-screen bg-navy-950">
        <Header />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-navy-400 mb-6">
            <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
              <Home className="w-4 h-4" />
              Início
            </Link>
            <span>/</span>
            <Link href={`/materias/${subjectSlug}`} className="hover:text-white transition-colors">
              {subjectName}
            </Link>
            <span>/</span>
            <span className="text-white">Questão {question.questionNumber}</span>
          </nav>

          {/* Metadados */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-navy-900/80 backdrop-blur-xl border border-white/10 rounded-lg">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-white">{subjectName}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-navy-900/80 backdrop-blur-xl border border-white/10 rounded-lg">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-white">Exame {question.examId}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-navy-900/80 backdrop-blur-xl border border-white/10 rounded-lg">
              <Hash className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-white">Questão {question.questionNumber}</span>
            </div>
          </div>

          {/* Questão */}
          <Card variant="glass" className="mb-6">
            <h1 className="text-xl font-semibold text-white mb-6">
              Questão {question.questionNumber} de {subjectName} — OAB {question.examYear}
            </h1>
            <p className="text-white/90 leading-relaxed whitespace-pre-wrap">{question.statement}</p>
          </Card>

          {/* Alternativas */}
          <Card variant="glass" className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-6">Alternativas</h2>
            <div className="space-y-4">
              {question.alternatives.map((alt) => (
                <div
                  key={alt.id}
                  className="p-4 bg-navy-800/50 border border-navy-700 rounded-xl"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-400 font-semibold">{alt.label}</span>
                    </div>
                    <p className="text-white/90 leading-relaxed flex-1">{alt.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Paywall - Resposta bloqueada */}
          <Card variant="glass" className="border-2 border-blue-500/30">
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <Lock className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Resposta Correta Bloqueada
              </h3>
              <p className="text-navy-300 mb-6 max-w-md mx-auto">
                Crie sua conta gratuita para ver a resposta correta e acessar milhares de questões oficiais da OAB
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/register">
                  <Button variant="primary" size="lg" className="flex items-center gap-2">
                    Criar Conta Grátis
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
          <div className="mt-8 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-2xl p-6 sm:p-8">
            <div className="max-w-3xl mx-auto text-center">
              <h3 className="text-2xl font-bold text-white mb-3">
                Pratique com +10.000 questões oficiais
              </h3>
              <p className="text-navy-300 mb-6">
                Acesse todas as questões de todos os exames da OAB, com estatísticas detalhadas,
                explicações com IA e simulados personalizados
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/register">
                  <Button variant="primary" size="lg">
                    Começar Gratuitamente
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
