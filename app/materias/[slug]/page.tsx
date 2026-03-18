// Force dynamic rendering (não tentar SSG no build)
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache por 1 hora

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Card, Button } from '@/components/ui';
import { prisma } from '@/lib/db/prisma';
import { BookOpen, TrendingUp, Target, ArrowRight, Home } from 'lucide-react';
import { Subject } from '@prisma/client';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Mapeamento de slugs para subjects do banco
const SLUG_TO_SUBJECT: Record<string, Subject> = {
  'etica': 'ETHICS',
  'constitucional': 'CONSTITUTIONAL',
  'civil': 'CIVIL',
  'processo-civil': 'CIVIL_PROCEDURE',
  'penal': 'CRIMINAL',
  'processo-penal': 'CRIMINAL_PROCEDURE',
  'trabalho': 'LABOUR',
  'processo-trabalho': 'LABOUR_PROCEDURE',
  'administrativo': 'ADMINISTRATIVE',
  'tributario': 'TAXES',
  'empresarial': 'BUSINESS',
  'consumidor': 'CONSUMER',
  'ambiental': 'ENVIRONMENTAL',
  'crianca-adolescente': 'CHILDREN',
  'internacional': 'INTERNATIONAL',
  'direitos-humanos': 'HUMAN_RIGHTS',
  'geral': 'GENERAL',
};

// Nomes amigáveis das matérias
const SUBJECT_NAMES: Record<string, string> = {
  'etica': 'Ética e Estatuto da OAB',
  'constitucional': 'Direito Constitucional',
  'civil': 'Direito Civil',
  'processo-civil': 'Direito Processual Civil',
  'penal': 'Direito Penal',
  'processo-penal': 'Direito Processual Penal',
  'trabalho': 'Direito do Trabalho',
  'processo-trabalho': 'Direito Processual do Trabalho',
  'administrativo': 'Direito Administrativo',
  'tributario': 'Direito Tributário',
  'empresarial': 'Direito Empresarial',
  'consumidor': 'Direito do Consumidor',
  'ambiental': 'Direito Ambiental',
  'crianca-adolescente': 'Estatuto da Criança e do Adolescente',
  'internacional': 'Direito Internacional',
  'direitos-humanos': 'Direitos Humanos',
  'geral': 'Conhecimentos Gerais',
};

// Descrições das matérias para SEO
const SUBJECT_DESCRIPTIONS: Record<string, string> = {
  'etica': 'Questões sobre Ética Profissional, Estatuto da OAB e Código de Ética e Disciplina da OAB',
  'constitucional': 'Questões sobre Direito Constitucional: princípios, direitos fundamentais, organização do Estado',
  'civil': 'Questões sobre Direito Civil: pessoas, bens, fatos jurídicos, obrigações, contratos',
  'processo-civil': 'Questões sobre Direito Processual Civil: CPC, procedimentos, recursos, execução',
  'penal': 'Questões sobre Direito Penal: crimes, penas, teoria do delito, parte especial',
  'processo-penal': 'Questões sobre Direito Processual Penal: CPP, inquérito, ação penal, provas',
  'trabalho': 'Questões sobre Direito do Trabalho: CLT, contrato de trabalho, direitos trabalhistas',
  'processo-trabalho': 'Questões sobre Direito Processual do Trabalho: dissídios, recursos, execução trabalhista',
  'administrativo': 'Questões sobre Direito Administrativo: administração pública, atos administrativos, licitações',
  'tributario': 'Questões sobre Direito Tributário: tributos, CTN, obrigações tributárias, crédito tributário',
  'empresarial': 'Questões sobre Direito Empresarial: empresa, sociedades, títulos de crédito, falência',
  'consumidor': 'Questões sobre Direito do Consumidor: CDC, relações de consumo, responsabilidade',
  'ambiental': 'Questões sobre Direito Ambiental: meio ambiente, recursos naturais, crimes ambientais',
  'crianca-adolescente': 'Questões sobre Estatuto da Criança e do Adolescente: ECA, direitos, medidas protetivas',
  'internacional': 'Questões sobre Direito Internacional: tratados, organizações internacionais, direito diplomático',
  'direitos-humanos': 'Questões sobre Direitos Humanos: declarações, pactos, sistemas de proteção',
  'geral': 'Questões de conhecimentos gerais relevantes para o Exame da OAB',
};

async function getSubjectData(slug: string) {
  const subject = SLUG_TO_SUBJECT[slug];
  if (!subject) return null;

  // Buscar estatísticas da matéria
  const [totalQuestions, questions] = await Promise.all([
    prisma.question.count({
      where: { subject },
    }),
    prisma.question.findMany({
      where: { subject },
      include: {
        alternatives: {
          orderBy: { label: 'asc' },
        },
      },
      orderBy: [
        { examYear: 'desc' },
        { examPhase: 'desc' },
        { questionNumber: 'asc' },
      ],
      take: 20, // Apenas primeiras 20 para teaser
    }),
  ]);

  // Calcular taxa média de acerto (se houver dados)
  const avgSuccessRate = questions
    .filter((q) => q.successRate !== null)
    .reduce((acc, q) => acc + (q.successRate || 0), 0) / questions.length;

  return {
    subject,
    name: SUBJECT_NAMES[slug],
    description: SUBJECT_DESCRIPTIONS[slug],
    totalQuestions,
    avgSuccessRate: avgSuccessRate || 0,
    questions,
  };
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const data = await getSubjectData(params.slug);

  if (!data) {
    return {
      title: 'Matéria não encontrada - Simulai OAB',
    };
  }

  const title = `${data.name} - Questões OAB | Simulai OAB`;
  const description = `${data.description}. ${data.totalQuestions} questões disponíveis. Prepare-se para o Exame da OAB.`;

  return {
    title,
    description,
    keywords: [
      'OAB',
      data.name,
      'questões OAB',
      'simulado OAB',
      'prova OAB',
      'preparação OAB',
      'exame OAB',
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://simulaioab.com/materias/${params.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function SubjectPage(props: PageProps) {
  const params = await props.params;
  const data = await getSubjectData(params.slug);

  if (!data) {
    notFound();
  }

  // JSON-LD para SEO
  const jsonLdCourse = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: `Questões OAB - ${data.name}`,
    description: data.description,
    provider: { '@type': 'Organization', name: 'Simulai OAB', url: 'https://simulaioab.com' },
    numberOfCredits: data.totalQuestions,
    educationalLevel: 'Graduação em Direito',
    hasPart: { '@type': 'Quiz', name: `Simulado de ${data.name}`, numberOfQuestions: data.totalQuestions },
  };

  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://simulaioab.com' },
      { '@type': 'ListItem', position: 2, name: data.name, item: `https://simulaioab.com/materias/${params.slug}` },
    ],
  };

  const jsonLdFaq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Quantas questões de ${data.name} caem na OAB?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `O Simulai OAB possui ${data.totalQuestions} questões oficiais de ${data.name} cobradas em provas da OAB de 2010 até o exame mais recente. A distribuição varia por exame, mas ${data.name} é uma matéria recorrente na 1ª fase.`,
        },
      },
      {
        '@type': 'Question',
        name: `Como estudar ${data.name} para a OAB?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Pratique com questões reais da FGV organizadas por matéria. O Simulai OAB oferece explicações detalhadas com IA para cada questão, ajudando a entender a lógica da banca e os temas mais cobrados em ${data.name}.`,
        },
      },
      {
        '@type': 'Question',
        name: `Qual a taxa de acerto média em ${data.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `A taxa de acerto varia por questão. No Simulai OAB, você pode acompanhar sua taxa de acerto em ${data.name} e compará-la com a média dos outros estudantes para identificar seus pontos fracos.`,
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdCourse) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }} />
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
          <span className="text-white">{data.name}</span>
        </nav>

        {/* Header da matéria */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{data.name}</h1>
              <p className="text-navy-300">{data.description}</p>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card variant="glass">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{data.totalQuestions}</p>
                <p className="text-sm text-navy-400">Questões Totais</p>
              </div>
            </div>
          </Card>

          <Card variant="glass">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-600/20 border border-green-500/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {data.avgSuccessRate > 0 ? `${data.avgSuccessRate.toFixed(0)}%` : 'N/A'}
                </p>
                <p className="text-sm text-navy-400">Taxa de Acerto</p>
              </div>
            </div>
          </Card>

          <Card variant="glass">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{data.questions.length}</p>
                <p className="text-sm text-navy-400">Visualização</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Lista de questões (preview) */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Questões Recentes</h2>
          <div className="space-y-4">
            {data.questions.map((question) => (
              <Link key={question.id} href={`/questoes/${question.id}`}>
                <Card variant="glass" className="hover:border-blue-500/50 transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-lg text-sm text-blue-400 font-medium">
                          {question.examId}
                        </span>
                        <span className="text-sm text-navy-400">
                          Questão {question.questionNumber}
                        </span>
                      </div>
                      <p className="text-white/90 leading-relaxed line-clamp-3">
                        {question.statement}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-navy-400 flex-shrink-0 mt-1" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA para criar conta */}
        <Card variant="glass" className="border-2 border-blue-500/30">
          <div className="text-center py-8">
            <h3 className="text-2xl font-bold text-white mb-2">
              Veja todas as {data.totalQuestions} questões
            </h3>
            <p className="text-navy-300 mb-6 max-w-md mx-auto">
              Crie sua conta gratuita e acesse todas as questões de {data.name} com respostas,
              explicações detalhadas e estatísticas de desempenho
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
              Estude de forma inteligente
            </h3>
            <p className="text-navy-300 mb-6">
              Simulados personalizados, revisão espaçada, estatísticas detalhadas e explicações
              com inteligência artificial para você aprovar de primeira
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/pricing">
                <Button variant="primary" size="lg">
                  Ver Planos
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" size="lg">
                  Conhecer Simulai
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ visível (duplica JSON-LD para UX + SEO) */}
        <section className="mt-12 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Perguntas frequentes sobre {data.name} na OAB</h2>
          <div className="space-y-4">
            <details className="bg-white/5 border border-white/10 rounded-xl p-5 group" open>
              <summary className="text-white font-medium cursor-pointer list-none flex items-center justify-between">
                Quantas questões de {data.name} caem na OAB?
                <span className="text-gray-500 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="text-gray-400 mt-3 text-sm leading-relaxed">
                O Simulai OAB possui {data.totalQuestions} questões oficiais de {data.name} cobradas em provas da OAB de 2010 até o exame mais recente. A distribuição varia por exame, mas {data.name} é uma matéria recorrente na 1ª fase.
              </p>
            </details>
            <details className="bg-white/5 border border-white/10 rounded-xl p-5 group">
              <summary className="text-white font-medium cursor-pointer list-none flex items-center justify-between">
                Como estudar {data.name} para a OAB?
                <span className="text-gray-500 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="text-gray-400 mt-3 text-sm leading-relaxed">
                Pratique com questões reais da FGV organizadas por matéria. O Simulai OAB oferece explicações detalhadas com IA para cada questão, ajudando a entender a lógica da banca e os temas mais cobrados em {data.name}.
              </p>
            </details>
            <details className="bg-white/5 border border-white/10 rounded-xl p-5 group">
              <summary className="text-white font-medium cursor-pointer list-none flex items-center justify-between">
                Qual a taxa de acerto média em {data.name}?
                <span className="text-gray-500 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="text-gray-400 mt-3 text-sm leading-relaxed">
                A taxa de acerto varia por questão. No Simulai OAB, você pode acompanhar sua taxa de acerto em {data.name} e compará-la com a média dos outros estudantes para identificar seus pontos fracos.
              </p>
            </details>
          </div>
        </section>

        {/* Internal links — Matérias relacionadas */}
        <section className="mt-8 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Estude também</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(SUBJECT_NAMES)
              .filter(([slug]) => slug !== params.slug)
              .slice(0, 8)
              .map(([slug, name]) => (
                <Link
                  key={slug}
                  href={`/materias/${slug}`}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white hover:border-blue-500/30 transition"
                >
                  {name}
                </Link>
              ))}
          </div>
        </section>
      </div>
    </div>
    </>
  );
}

// Gerar páginas estáticas para todas as matérias
export function generateStaticParams() {
  return Object.keys(SLUG_TO_SUBJECT).map((slug) => ({
    slug,
  }));
}
