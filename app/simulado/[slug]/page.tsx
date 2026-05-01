

export const revalidate = 3600;

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { prisma } from '@/lib/db/prisma';
import { Play, Home, ChevronRight, Clock, BookOpen, Target, BarChart3 } from 'lucide-react';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

function toRoman(num: number): string {
  const romanNumerals: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let result = '';
  for (const [value, numeral] of romanNumerals) {
    while (num >= value) {
      result += numeral;
      num -= value;
    }
  }
  return result;
}

function parseSimuladoSlug(slug: string): { examId: string; label: string; examNumber: number; phase: number } | null {
  const oabMatch = slug.match(/^oab-(\d+)(?:-fase-(\d))?$/);
  if (oabMatch) {
    const examNumber = parseInt(oabMatch[1]);
    const phase = parseInt(oabMatch[2] || '1');
    return { examId: `oab-${examNumber}`, label: `OAB ${toRoman(examNumber)}`, examNumber, phase };
  }

  const yearMatch = slug.match(/^(\d{4})-(\d)$/);
  if (yearMatch) {
    return {
      examId: `${yearMatch[1]}-0${yearMatch[2]}`,
      label: `OAB ${yearMatch[1]}`,
      examNumber: 0,
      phase: parseInt(yearMatch[2]),
    };
  }

  return null;
}

const SUBJECT_NAMES: Record<string, string> = {
  ETHICS: 'Ética e Estatuto',
  CONSTITUTIONAL: 'Constitucional',
  CIVIL: 'Civil',
  CIVIL_PROCEDURE: 'Processo Civil',
  CRIMINAL: 'Penal',
  CRIMINAL_PROCEDURE: 'Processo Penal',
  LABOUR: 'Trabalho',
  LABOUR_PROCEDURE: 'Processo do Trabalho',
  ADMINISTRATIVE: 'Administrativo',
  TAXES: 'Tributário',
  BUSINESS: 'Empresarial',
  CONSUMER: 'Consumidor',
  ENVIRONMENTAL: 'Ambiental',
  CHILDREN: 'ECA',
  INTERNATIONAL: 'Internacional',
  HUMAN_RIGHTS: 'Direitos Humanos',
  GENERAL: 'Geral',
};

export async function generateStaticParams() {
  const exams = await prisma.question.groupBy({
    by: ['examId'],
    where: { nullified: false },
  });
  return exams.map((exam) => ({ slug: exam.examId }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseSimuladoSlug(slug);

  if (!parsed) return { title: 'Simulado não encontrado' };

  const title = `Simulado ${parsed.label} - Prova Completa Online Grátis`;
  const description = `Faça o simulado completo do Exame ${parsed.label} com questões oficiais da FGV, explicações com IA e resultado instantâneo. Teste seus conhecimentos agora!`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://simulaioab.com/simulado/${slug}`,
    },
    openGraph: { title, description, type: 'website' },
  };
}

export default async function SimuladoPage({ params }: PageProps) {
  const { slug } = await params;
  const parsed = parseSimuladoSlug(slug);

  if (!parsed) notFound();

  // Buscar questões do exame
  let questions = await prisma.question.findMany({
    where: {
      examId: parsed.examId,
      examPhase: parsed.phase,
      nullified: false,
    },
    include: { alternatives: true },
    orderBy: { questionNumber: 'asc' },
  });

  // Fallback: buscar por contains
  if (questions.length === 0 && parsed.examNumber > 0) {
    questions = await prisma.question.findMany({
      where: {
        examId: { contains: String(parsed.examNumber) },
        examPhase: parsed.phase,
        nullified: false,
      },
      include: { alternatives: true },
      orderBy: { questionNumber: 'asc' },
    });
  }

  if (questions.length === 0) notFound();

  const subjectStats = questions.reduce((acc, q) => {
    const sub = String(q.subject);
    if (!acc[sub]) acc[sub] = 0;
    acc[sub]++;
    return acc;
  }, {} as Record<string, number>);

  const estimatedMinutes = questions.length * 3; // ~3 min por questão

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: `Simulado ${parsed.label}`,
    description: `Simulado completo do Exame ${parsed.label} com ${questions.length} questões oficiais`,
    url: `https://simulaioab.com/simulado/${slug}`,
    educationalAlignment: {
      '@type': 'AlignmentObject',
      alignmentType: 'educationalLevel',
      targetName: 'Exame de Ordem dos Advogados do Brasil',
    },
    numberOfQuestions: questions.length,
    provider: { '@type': 'Organization', name: 'Simulai OAB' },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://simulaioab.com' },
      { '@type': 'ListItem', position: 2, name: 'Simulados', item: 'https://simulaioab.com/simulations' },
      { '@type': 'ListItem', position: 3, name: `Simulado ${parsed.label}`, item: `https://simulaioab.com/simulado/${slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="min-h-screen bg-bg">
        <Header />

        <main id="main-content" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-sm text-gray-400">
              <li><Link href="/" className="hover:text-ink-1 transition"><Home className="w-4 h-4" /></Link></li>
              <li><ChevronRight className="w-3 h-3" /></li>
              <li><Link href="/simulations" className="hover:text-ink-1 transition">Simulados</Link></li>
              <li><ChevronRight className="w-3 h-3" /></li>
              <li className="text-ink-1 font-medium">{parsed.label}</li>
            </ol>
          </nav>

          <h1 className="text-3xl sm:text-4xl font-bold text-ink-1 mb-3">
            Simulado {parsed.label} — Prova Completa
          </h1>
          <p className="text-lg text-gray-400 mb-8">
            Reproduza a prova oficial do Exame {parsed.label} (Fase {parsed.phase}) com questões reais da FGV
          </p>

          {/* Stats cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            <div className="bg-surface-2 border rounded-xl p-4 text-center">
              <BookOpen className="w-5 h-5 text-accent mx-auto mb-2" />
              <p className="text-2xl font-bold text-ink-1">{questions.length}</p>
              <p className="text-xs text-gray-400">Questões</p>
            </div>
            <div className="bg-surface-2 border rounded-xl p-4 text-center">
              <Clock className="w-5 h-5 text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-ink-1">{Math.floor(estimatedMinutes / 60)}h{estimatedMinutes % 60 > 0 ? `${estimatedMinutes % 60}min` : ''}</p>
              <p className="text-xs text-gray-400">Duração estimada</p>
            </div>
            <div className="bg-surface-2 border rounded-xl p-4 text-center">
              <Target className="w-5 h-5 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-ink-1">{Math.ceil(questions.length * 0.5)}</p>
              <p className="text-xs text-gray-400">Mín. p/ aprovar (50%)</p>
            </div>
            <div className="bg-surface-2 border rounded-xl p-4 text-center">
              <BarChart3 className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-ink-1">{Object.keys(subjectStats).length}</p>
              <p className="text-xs text-gray-400">Matérias</p>
            </div>
          </div>

          {/* Distribuição por matéria */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-ink-1 mb-4">Distribuição por matéria</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Object.entries(subjectStats)
                .sort((a, b) => b[1] - a[1])
                .map(([subject, count]) => (
                  <div key={subject} className="bg-surface-2 border rounded-lg p-3 flex items-center justify-between">
                    <span className="text-sm text-gray-300">{SUBJECT_NAMES[subject] || subject}</span>
                    <span className="text-sm font-bold text-ink-1">{count}</span>
                  </div>
                ))}
            </div>
          </section>

          {/* CTA principal */}
          <section className="text-center">
            <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border rounded-2xl p-10">
              <h2 className="text-2xl font-bold text-ink-1 mb-3">
                Pronto para testar seus conhecimentos?
              </h2>
              <p className="text-gray-400 mb-6 max-w-lg mx-auto">
                Crie sua conta grátis e faça este simulado completo com correção instantânea, explicações com IA e ranking comparativo.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition text-lg"
              >
                <Play className="w-5 h-5" />
                Iniciar simulado grátis
              </Link>
              <p className="text-sm text-gray-500 mt-3">Sem cartão de crédito necessário</p>
            </div>
          </section>

          {/* Link para gabarito */}
          <section className="mt-8 text-center">
            <Link
              href={`/gabarito/${slug}`}
              className="text-accent hover:text-accent text-sm font-medium transition"
            >
              Ver gabarito do {parsed.label} →
            </Link>
          </section>
        </main>
      </div>
    </>
  );
}
