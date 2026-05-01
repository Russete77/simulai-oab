

export const revalidate = 3600;

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { prisma } from '@/lib/db/prisma';
import { Check, X, Home, ChevronRight, BookOpen, BarChart3 } from 'lucide-react';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * Parsear slug do gabarito
 * Formatos aceitos:
 *   "oab-42" → examYear deduzido, examPhase 1
 *   "oab-42-fase-1" → explícito
 *   "2024-1" → ano + fase
 */
function parseGabaritoSlug(slug: string): { examId: string; label: string; examNumber: number; phase: number } | null {
  // "oab-42" ou "oab-42-fase-1"
  const oabMatch = slug.match(/^oab-(\d+)(?:-fase-(\d))?$/);
  if (oabMatch) {
    const examNumber = parseInt(oabMatch[1]);
    const phase = parseInt(oabMatch[2] || '1');
    // OAB I foi 2010. Exame X: year = 2010 + floor((X-1)/3)
    // Mas na verdade são ~3 exames/ano. Simplificação: usar examNumber para buscar.
    return {
      examId: `oab-${examNumber}`,
      label: `OAB ${toRoman(examNumber)}`,
      examNumber,
      phase,
    };
  }

  // "2024-1"
  const yearMatch = slug.match(/^(\d{4})-(\d)$/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    const phase = parseInt(yearMatch[2]);
    return {
      examId: `${year}-0${phase}`,
      label: `OAB ${year} Fase ${phase}`,
      examNumber: 0,
      phase,
    };
  }

  return null;
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
  const parsed = parseGabaritoSlug(slug);

  if (!parsed) return { title: 'Gabarito não encontrado' };

  const title = `Gabarito ${parsed.label} - Respostas Oficiais Comentadas`;
  const description = `Gabarito completo do Exame ${parsed.label} com todas as respostas corretas, explicações detalhadas e estatísticas por matéria. Confira se você passou!`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://simulaioab.com/gabarito/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
    },
  };
}

export default async function GabaritoPage({ params }: PageProps) {
  const { slug } = await params;
  const parsed = parseGabaritoSlug(slug);

  if (!parsed) notFound();

  // Buscar questões do exame
  const questions = await prisma.question.findMany({
    where: {
      examId: parsed.examId,
      examPhase: parsed.phase,
      nullified: false,
    },
    include: {
      alternatives: {
        orderBy: { label: 'asc' },
      },
    },
    orderBy: { questionNumber: 'asc' },
  });

  // Se não encontrou pelo examId formatado, tentar buscar por examYear
  let allQuestions = questions;
  if (questions.length === 0 && parsed.examNumber > 0) {
    // Tentar buscar com padrão alternativo
    const altQuestions = await prisma.question.findMany({
      where: {
        examId: { contains: String(parsed.examNumber) },
        examPhase: parsed.phase,
        nullified: false,
      },
      include: {
        alternatives: {
          orderBy: { label: 'asc' },
        },
      },
      orderBy: { questionNumber: 'asc' },
    });
    allQuestions = altQuestions;
  }

  if (allQuestions.length === 0) notFound();

  // Estatísticas por matéria
  const subjectStats = allQuestions.reduce((acc, q) => {
    const sub = String(q.subject);
    if (!acc[sub]) acc[sub] = { total: 0, nullified: 0 };
    acc[sub].total++;
    return acc;
  }, {} as Record<string, { total: number; nullified: number }>);

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `Gabarito ${parsed.label}`,
    description: `Gabarito oficial do Exame ${parsed.label} com ${allQuestions.length} questões comentadas`,
    url: `https://simulaioab.com/gabarito/${slug}`,
    creator: { '@type': 'Organization', name: 'Simulai OAB' },
    temporalCoverage: allQuestions[0]?.examYear || '',
    variableMeasured: 'Respostas do Exame da OAB',
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://simulaioab.com' },
      { '@type': 'ListItem', position: 2, name: 'Gabaritos', item: 'https://simulaioab.com/gabarito' },
      { '@type': 'ListItem', position: 3, name: `Gabarito ${parsed.label}`, item: `https://simulaioab.com/gabarito/${slug}` },
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
              <li><Link href="/gabarito" className="hover:text-ink-1 transition">Gabaritos</Link></li>
              <li><ChevronRight className="w-3 h-3" /></li>
              <li className="text-ink-1 font-medium">{parsed.label}</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-ink-1 mb-3">
              Gabarito {parsed.label} — Fase {parsed.phase}
            </h1>
            <p className="text-lg text-gray-400">
              {allQuestions.length} questões com gabarito oficial e explicações com IA
            </p>
          </div>

          {/* Resumo por matéria */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-ink-1 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-accent" />
              Distribuição por matéria
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Object.entries(subjectStats)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([subject, stats]) => (
                  <div key={subject} className="bg-surface-2 border rounded-xl p-3">
                    <p className="text-sm text-gray-400">{SUBJECT_NAMES[subject] || subject}</p>
                    <p className="text-xl font-bold text-ink-1">{stats.total}</p>
                    <p className="text-xs text-gray-500">questões</p>
                  </div>
                ))}
            </div>
          </section>

          {/* Tabela de gabarito */}
          <section>
            <h2 className="text-xl font-bold text-ink-1 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-green-500" />
              Gabarito completo
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border text-left">
                    <th className="py-3 px-4 text-sm font-semibold text-gray-400 w-16">#</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-400">Matéria</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-400 text-center w-24">Resposta</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-400 text-center w-32">Praticar</th>
                  </tr>
                </thead>
                <tbody>
                  {allQuestions.map((q) => {
                    const correct = q.alternatives.find((a) => a.isCorrect);
                    return (
                      <tr key={q.id} className="border-b border-divider hover:bg-surface-2 transition">
                        <td className="py-3 px-4 text-sm text-gray-300 font-mono">{q.questionNumber}</td>
                        <td className="py-3 px-4 text-sm text-gray-300">
                          {SUBJECT_NAMES[String(q.subject)] || String(q.subject)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {q.nullified ? (
                            <span className="text-yellow-400 text-sm font-medium">Anulada</span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-green-500/10 text-green-500 rounded-lg font-bold text-sm">
                              {correct?.label || '—'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Link
                            href={`/questoes/${q.id}`}
                            className="text-accent hover:text-accent text-sm font-medium transition"
                          >
                            Ver questão
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* CTA */}
          <section className="mt-12 text-center">
            <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-ink-1 mb-3">
                Quer praticar as questões deste exame?
              </h2>
              <p className="text-gray-400 mb-6">
                Faça um simulado completo com as {allQuestions.length} questões do {parsed.label} e veja sua nota estimada.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-500 transition"
              >
                Começar simulado grátis
              </Link>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
