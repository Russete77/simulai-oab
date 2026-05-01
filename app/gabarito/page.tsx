

export const revalidate = 3600;

import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { prisma } from '@/lib/db/prisma';
import { FileText, ChevronRight, Home } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Gabaritos OAB - Todos os Exames com Respostas Comentadas',
  description: 'Gabaritos oficiais de todos os Exames da OAB com respostas corretas, explicações detalhadas com IA e estatísticas por matéria. De 2010 até o exame mais recente.',
  alternates: {
    canonical: 'https://simulaioab.com/gabarito',
  },
  openGraph: {
    title: 'Gabaritos OAB - Todos os Exames',
    description: 'Gabaritos oficiais de todos os Exames da OAB com respostas e explicações.',
  },
};

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

export default async function GabaritosIndexPage() {
  // Buscar exames únicos com contagem de questões
  const exams = await prisma.question.groupBy({
    by: ['examId', 'examYear', 'examPhase'],
    _count: { id: true },
    where: { nullified: false },
    orderBy: [{ examYear: 'desc' }, { examPhase: 'asc' }],
  });

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Gabaritos OAB',
    description: 'Lista de gabaritos oficiais de todos os Exames da OAB',
    url: 'https://simulaioab.com/gabarito',
    numberOfItems: exams.length,
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://simulaioab.com' },
      { '@type': 'ListItem', position: 2, name: 'Gabaritos OAB', item: 'https://simulaioab.com/gabarito' },
    ],
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'O que é um gabarito da OAB?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Um gabarito da OAB é a lista oficial de respostas corretas para cada questão do Exame de Ordem dos Advogados do Brasil. O Simulai OAB fornece gabaritos completos para todos os exames com explicações detalhadas de cada resposta.',
        },
      },
      {
        '@type': 'Question',
        name: 'Como usar os gabaritos para estudar?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Os gabaritos do Simulai OAB podem ser usados para verificar suas respostas após fazer um simulado, entender os padrões da banca FGV, revisar questões difíceis com explicações com IA, e comparar sua performance com a média dos candidatos.',
        },
      },
      {
        '@type': 'Question',
        name: 'Onde encontro gabaritos de todos os exames da OAB?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No Simulai OAB você encontra gabaritos oficiais de todos os Exames da OAB desde 2010, organizados por exame e fase, com respostas comentadas, explicações com inteligência artificial e estatísticas detalhadas por matéria.',
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <div className="min-h-screen bg-bg">
        <Header />

        <main id="main-content" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-sm text-gray-400">
              <li><Link href="/" className="hover:text-ink-1 transition"><Home className="w-4 h-4" /></Link></li>
              <li><ChevronRight className="w-3 h-3" /></li>
              <li className="text-ink-1 font-medium">Gabaritos</li>
            </ol>
          </nav>

          <h1 className="text-3xl sm:text-4xl font-bold text-ink-1 mb-3">
            Gabaritos OAB — Todos os Exames
          </h1>
          <p className="text-lg text-gray-400 mb-10">
            Confira o gabarito oficial de cada prova da OAB, com {exams.reduce((sum, e) => sum + e._count.id, 0).toLocaleString('pt-BR')} questões comentadas e explicadas com IA.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam) => {
              // Extrair número do exame do examId (formato "oab-42" ou "2024-01")
              const examNumMatch = exam.examId.match(/oab-(\d+)/);
              const examNum = examNumMatch ? parseInt(examNumMatch[1]) : 0;
              const slug = examNum > 0 ? `oab-${examNum}` : `${exam.examYear}-${exam.examPhase}`;
              const label = examNum > 0 ? `OAB ${toRoman(examNum)}` : `OAB ${exam.examYear}`;

              return (
                <Link
                  key={exam.examId}
                  href={`/gabarito/${slug}`}
                  className="group bg-surface-2 border rounded-xl p-5 hover:bg-surface-2 hover:border-accent transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <FileText className="w-6 h-6 text-accent" />
                    <span className="text-xs text-gray-500">{exam.examYear}</span>
                  </div>
                  <h2 className="text-lg font-bold text-ink-1 group-hover:text-accent transition mb-1">
                    Gabarito {label}
                  </h2>
                  <p className="text-sm text-gray-400">
                    Fase {exam.examPhase} — {exam._count.id} questões
                  </p>
                </Link>
              );
            })}
          </div>
        </main>
      </div>
    </>
  );
}
