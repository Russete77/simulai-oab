

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
import {
  BookOpen,
  Calendar,
  Hash,
  ArrowRight,
  Home,
  Check,
  X,
  Lightbulb,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import {
  lerExplicacao,
  temConteudo,
  explicacaoEmTexto,
} from '@/lib/questoes/explicacao';

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
      // A explicação SAI na página. Antes ficava atrás de cadastro, e o
      // resultado é que o Google via só o enunciado da FGV — o mesmo texto
      // que outros vinte sites publicam, e neles com o gabarito. Dava
      // "Rastreada, mas não indexada" em 3.673 das 5.875 páginas.
      aiExplanation: true,
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

  // A descrição prometia "gabarito comentado" enquanto a resposta estava
  // atrás de cadastro. Agora que ela aparece na página, a promessa passa a
  // ser verdadeira — e dizer a letra da correta melhora o clique.
  const letraCorreta = question.alternatives.find((a) => a.isCorrect)?.label;
  const description = letraCorreta
    ? `Gabarito: alternativa ${letraCorreta}. Questão ${question.questionNumber} de ${subjectName} do Exame OAB ${question.examYear}, comentada com fundamento legal. ${cleanStatement.substring(0, 100)}...`
    : `Questão ${question.questionNumber} de ${subjectName} do Exame OAB ${question.examYear} com gabarito comentado. ${cleanStatement.substring(0, 120)}...`;

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

  const correta = question.alternatives.find((a) => a.isCorrect) ?? null;
  const explicacao = lerExplicacao(question.aiExplanation?.explanation);
  const temExplicacao = temConteudo(explicacao);

  // Dado estruturado de "practice problem". O tipo Quiz com hasPart/Question
  // e acceptedAnswer é o formato documentado pelo Google para questões de
  // prova — antes era um Quiz solto, sem resposta, que não descreve nada
  // além do enunciado e não concorre a resultado enriquecido.
  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Quiz',
    name: `Questão ${question.questionNumber} de ${subjectName} — OAB ${question.examId}`,
    about: { '@type': 'Thing', name: `Exame da OAB — ${subjectName}` },
    educationalLevel: 'Professional',
    hasPart: {
      '@type': 'Question',
      eduQuestionType: 'Multiple choice',
      learningResourceType: 'Practice problem',
      name: `Questão ${question.questionNumber} de ${subjectName} — OAB ${question.examId}`,
      text: question.statement,
      ...(correta && {
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${correta.label}) ${correta.text}`,
          ...(temExplicacao && {
            answerExplanation: {
              '@type': 'Comment',
              text: explicacaoEmTexto(explicacao),
            },
          }),
        },
      }),
      suggestedAnswer: question.alternatives
        .filter((a) => !a.isCorrect)
        .map((a) => ({
          '@type': 'Answer',
          text: `${a.label}) ${a.text}`,
        })),
    },
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
              {question.alternatives.map((alt) => {
                const acertou = alt.isCorrect;
                const porQueErrada = explicacao?.incorretas.find(
                  (i) => i.alternativa.toUpperCase() === alt.label.toUpperCase()
                )?.motivo;

                return (
                  <div
                    key={alt.id}
                    className={
                      acertou
                        ? 'p-4 rounded-xl border border-success/40 bg-success-soft'
                        : 'p-4 rounded-xl border bg-surface-2'
                    }
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={[
                          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                          acertou
                            ? 'bg-success text-white'
                            : 'bg-accent-soft border-accent text-accent',
                        ].join(' ')}
                      >
                        {acertou ? (
                          <Check className="w-4 h-4" strokeWidth={3} />
                        ) : (
                          <span className="font-semibold">{alt.label}</span>
                        )}
                      </div>

                      <div className="flex-1">
                        <p className="text-ink-1/90 leading-relaxed">{alt.text}</p>

                        {acertou && (
                          <p className="mt-2 text-sm font-semibold text-success">
                            Alternativa {alt.label} — resposta correta
                          </p>
                        )}

                        {/* O porquê de cada errada é o que diferencia esta
                            página do enunciado solto que os outros sites
                            publicam. */}
                        {!acertou && porQueErrada && (
                          <p className="mt-2 flex items-start gap-1.5 text-sm text-ink-2">
                            <X className="w-3.5 h-3.5 text-danger shrink-0 mt-0.5" />
                            <span>{porQueErrada}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Gabarito comentado — aberto de propósito. É o que faz esta
              página valer mais que o enunciado publicado em outros sites, e
              é a única razão pela qual o Google indexaria. O paywall foi
              para o que é nosso e ninguém copia: IA, estatística, simulado. */}
          {temExplicacao && explicacao && (
            <Card variant="glass" className="mb-6">
              <h2 className="text-xl font-semibold text-ink-1 mb-5">
                Gabarito comentado
              </h2>

              {explicacao.resumo && (
                <p className="text-ink-1/90 leading-relaxed mb-5">
                  {explicacao.resumo}
                </p>
              )}

              {explicacao.motivoCorreta && (
                <div className="p-4 rounded-xl border border-success/30 bg-success-soft mb-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-success mb-1.5">
                    <Check className="w-4 h-4" strokeWidth={3} />
                    Por que a alternativa {correta?.label} está correta
                  </p>
                  <p className="text-ink-1/90 leading-relaxed">
                    {explicacao.motivoCorreta}
                  </p>
                </div>
              )}

              {/* O fundamento legal está ESCONDIDO de propósito.
                  As 5.857 explicações foram geradas por gpt-4o-mini, que
                  raciocina bem sobre o enunciado que tem na frente mas
                  inventa número de artigo — 477 delas caem em "Art. 5º da
                  CF", o curinga de quando o modelo não sabe. Das duas que
                  conferi à mão, as duas citavam artigo errado.
                  Em página de Direito, artigo errado custa mais caro que
                  artigo nenhum: o leitor é advogado e percebe na hora.
                  O resto da explicação continua — raciocínio impreciso o
                  leitor perdoa, citação falsa não.
                  Volta quando as citações forem validadas contra a lei.
                  Ver _PLANO-CLAUDE/AUDITORIA-BANCO-QUESTOES.md */}

              {explicacao.dica && (
                <div className="flex items-start gap-2.5 p-4 rounded-xl border bg-surface-2 mb-4">
                  <Lightbulb className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-ink-3 mb-0.5">
                      Dica
                    </p>
                    <p className="text-ink-1/90 leading-relaxed">{explicacao.dica}</p>
                  </div>
                </div>
              )}

              {explicacao.pegadinhas.length > 0 && (
                <div className="flex items-start gap-2.5 p-4 rounded-xl border bg-surface-2">
                  <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-ink-3 mb-1">
                      Pegadinhas
                    </p>
                    <ul className="space-y-1">
                      {explicacao.pegadinhas.map((p) => (
                        <li key={p} className="text-ink-1/90 leading-relaxed">
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* O convite agora é pelo que o gabarito NÃO entrega. Prometer o
              que já está acima da dobra queimaria a confiança de quem
              acabou de ler a resposta de graça. */}
          <Card variant="glass" className="border border-accent/40">
            <div className="max-w-2xl mx-auto text-center py-4">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-accent-soft border border-accent/30 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-ink-1 mb-2">
                Entendeu esta. E as outras 5.874?
              </h3>
              <p className="text-ink-2 mb-6 leading-relaxed">
                Descubra em quais matérias você erra mais, treine simulados no
                formato da prova e pergunte à IA o que ficou em aberto nesta
                questão.
              </p>

              <ul className="grid sm:grid-cols-3 gap-3 text-left mb-7">
                {[
                  'Simulados cronometrados no formato da FGV',
                  'Suas estatísticas por matéria e ponto fraco',
                  'Chat com IA para tirar dúvida da questão',
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-ink-2 p-3 rounded-lg bg-surface-2 border"
                  >
                    <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/diagnostico">
                  <Button variant="primary" size="lg">
                    <span className="flex items-center gap-2">
                      Fazer diagnóstico grátis
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </Button>
                </Link>
                <Link href={`/materias/${subjectSlug}`}>
                  <Button variant="ghost" size="lg">
                    Mais questões de {subjectName}
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
