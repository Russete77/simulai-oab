import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { prisma } from '@/lib/db/prisma';
import { BookOpen, ArrowRight, Target, Brain, BarChart3 } from 'lucide-react';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Questões OAB Comentadas — 5.875 Questões Oficiais FGV com Gabarito e IA | Simulai',
  description: 'Resolva questões OAB comentadas com gabarito oficial e explicação por IA. 5.875 questões oficiais FGV de 2010 a 2026, organizadas por matéria, ano e dificuldade. Grátis!',
  keywords: [
    'questões OAB', 'questões OAB comentadas', 'questões OAB com gabarito',
    'questões OAB FGV', 'questões OAB 2026', 'questões OAB por matéria',
    'questões OAB grátis', 'banco de questões OAB', 'exercícios OAB',
  ],
  openGraph: {
    title: 'Questões OAB Comentadas com IA — Simulai OAB',
    description: 'Resolva 5.875 questões OAB oficiais com explicações por IA. Grátis!',
    url: 'https://simulaioab.com/questoes-oab',
    type: 'website',
  },
  alternates: {
    canonical: 'https://simulaioab.com/questoes-oab',
  },
};

const subjects = [
  { slug: 'etica', name: 'Ética e Estatuto da OAB', emoji: '⚖️' },
  { slug: 'constitucional', name: 'Direito Constitucional', emoji: '📜' },
  { slug: 'civil', name: 'Direito Civil', emoji: '🏠' },
  { slug: 'processo-civil', name: 'Direito Processual Civil', emoji: '📋' },
  { slug: 'penal', name: 'Direito Penal', emoji: '🔒' },
  { slug: 'processo-penal', name: 'Direito Processual Penal', emoji: '🔍' },
  { slug: 'trabalho', name: 'Direito do Trabalho', emoji: '👷' },
  { slug: 'processo-trabalho', name: 'Direito Processual do Trabalho', emoji: '⚙️' },
  { slug: 'administrativo', name: 'Direito Administrativo', emoji: '🏛️' },
  { slug: 'tributario', name: 'Direito Tributário', emoji: '💰' },
  { slug: 'empresarial', name: 'Direito Empresarial', emoji: '🏢' },
  { slug: 'consumidor', name: 'Direito do Consumidor', emoji: '🛒' },
  { slug: 'ambiental', name: 'Direito Ambiental', emoji: '🌿' },
  { slug: 'crianca-adolescente', name: 'Estatuto da Criança e Adolescente', emoji: '👶' },
  { slug: 'internacional', name: 'Direito Internacional', emoji: '🌍' },
  { slug: 'direitos-humanos', name: 'Direitos Humanos', emoji: '✊' },
];

export default async function QuestoesOabPage() {
  let totalQuestions = 5875;
  let countMap: Record<string, number> = {};
  try {
    totalQuestions = await prisma.question.count({ where: { nullified: false } });

    // Get count per subject
    const subjectCounts = await prisma.question.groupBy({
      by: ['subject'],
      where: { nullified: false },
      _count: { id: true },
    });

    countMap = Object.fromEntries(subjectCounts.map(s => [s.subject, s._count.id]));
  } catch (error) {
    console.error('Erro ao buscar dados para questoes-oab:', error);
  }

  const SUBJECT_DB_MAP: Record<string, string> = {
    'etica': 'ETHICS', 'constitucional': 'CONSTITUTIONAL', 'civil': 'CIVIL',
    'processo-civil': 'CIVIL_PROCEDURE', 'penal': 'CRIMINAL', 'processo-penal': 'CRIMINAL_PROCEDURE',
    'trabalho': 'LABOUR', 'processo-trabalho': 'LABOUR_PROCEDURE', 'administrativo': 'ADMINISTRATIVE',
    'tributario': 'TAXES', 'empresarial': 'BUSINESS', 'consumidor': 'CONSUMER',
    'ambiental': 'ENVIRONMENTAL', 'crianca-adolescente': 'CHILDREN', 'internacional': 'INTERNATIONAL',
    'direitos-humanos': 'HUMAN_RIGHTS',
  };

  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://simulaioab.com' },
      { '@type': 'ListItem', position: 2, name: 'Questões OAB', item: 'https://simulaioab.com/questoes-oab' },
    ],
  };

  const jsonLdFaq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Quantas questões OAB tem no Simulai?',
        acceptedAnswer: { '@type': 'Answer', text: `O Simulai tem ${totalQuestions} questões oficiais da FGV, cobrindo todos os exames de 2010 a 2026 em 17 matérias.` },
      },
      {
        '@type': 'Question',
        name: 'As questões OAB são comentadas?',
        acceptedAnswer: { '@type': 'Answer', text: 'Sim! Todas as questões possuem gabarito oficial. No plano Pro, a IA gera explicações detalhadas com fundamentação legal para cada questão.' },
      },
      {
        '@type': 'Question',
        name: 'Posso filtrar questões OAB por matéria?',
        acceptedAnswer: { '@type': 'Answer', text: 'Sim! Você pode acessar questões por qualquer uma das 17 matérias, filtrar por ano do exame e ver estatísticas de dificuldade de cada questão.' },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }} />

      <div className="min-h-screen bg-bg">
        <Header />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="flex items-center gap-2 text-sm text-ink-2 mb-8">
            <Link href="/" className="hover:text-ink-1 transition-colors">Início</Link>
            <span>/</span>
            <span className="text-ink-1">Questões OAB</span>
          </nav>

          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-ink-1 mb-6">
              Questões OAB Comentadas — {totalQuestions.toLocaleString('pt-BR')} Questões Oficiais FGV
            </h1>
            <p className="text-xl text-ink-2 max-w-3xl mx-auto">
              Resolva questões oficiais da OAB/FGV de 2010 a 2026 com gabarito comentado e explicações por Inteligência Artificial. Organize seus estudos por matéria e acompanhe sua evolução.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-ink-1 mb-6">Questões por Matéria</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-12">
            {subjects.map((subject) => {
              const dbKey = SUBJECT_DB_MAP[subject.slug];
              const count = dbKey ? countMap[dbKey] || 0 : 0;
              return (
                <Link
                  key={subject.slug}
                  href={`/materias/${subject.slug}`}
                  className="flex items-center justify-between bg-surface border rounded-xl p-4 hover:border-accent/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{subject.emoji}</span>
                    <div>
                      <div className="text-ink-1 font-medium group-hover:text-accent transition-colors">{subject.name}</div>
                      <div className="text-sm text-ink-2">{count} questões disponíveis</div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-ink-2 group-hover:text-accent transition-colors" />
                </Link>
              );
            })}
          </div>

          {/* Conteúdo SEO */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-ink-1 mb-4">Como Estudar com Questões OAB</h2>
            <div className="bg-surface border rounded-xl p-8 prose prose-invert max-w-none">
              <p className="text-ink-1 text-lg leading-relaxed mb-4">
                Resolver questões é a estratégia mais eficaz para aprovação no Exame da OAB. A banca FGV tem um padrão consistente de cobrança que pode ser identificado praticando com questões de exames anteriores. O Simulai OAB reúne todas as {totalQuestions.toLocaleString('pt-BR')} questões oficiais já aplicadas pela FGV, organizadas por matéria, ano e dificuldade.
              </p>
              <p className="text-ink-1 text-lg leading-relaxed mb-4">
                Cada questão no Simulai pode ser resolvida com cronômetro, simulando as condições reais da prova. Após responder, você recebe o gabarito oficial e, no plano Pro, uma explicação detalhada gerada por IA que inclui a fundamentação legal, a doutrina aplicável e a jurisprudência relevante. É como ter um professor particular disponível 24 horas por dia.
              </p>
              <p className="text-ink-1 text-lg leading-relaxed">
                Para maximizar seus estudos, recomendamos: comece pelas matérias com maior peso na prova (Ética, Constitucional, Civil e Penal), pratique pelo menos 20 questões por dia, e use o modo Revisão de Erros para focar nos seus pontos fracos. O dashboard de performance do Simulai mostra exatamente onde você precisa melhorar.
              </p>
            </div>
          </section>

          {/* Links internos */}
          <section className="grid md:grid-cols-3 gap-6 mb-12">
            <Link href="/simulado-oab-online" className="bg-surface border rounded-xl p-6 hover:border-accent/50 transition-all group">
              <Target className="w-8 h-8 text-accent mb-3" />
              <h3 className="text-lg font-semibold text-ink-1 mb-2 group-hover:text-accent transition-colors">Simulados OAB</h3>
              <p className="text-ink-2 text-sm">Faça simulados completos com cronômetro real</p>
            </Link>
            <Link href="/gabarito" className="bg-surface border rounded-xl p-6 hover:border-accent/50 transition-all group">
              <BookOpen className="w-8 h-8 text-green-400 mb-3" />
              <h3 className="text-lg font-semibold text-ink-1 mb-2 group-hover:text-green-400 transition-colors">Gabaritos OAB</h3>
              <p className="text-ink-2 text-sm">Confira gabaritos de todos os exames</p>
            </Link>
            <Link href="/blog" className="bg-surface border rounded-xl p-6 hover:border-accent/50 transition-all group">
              <Brain className="w-8 h-8 text-purple-400 mb-3" />
              <h3 className="text-lg font-semibold text-ink-1 mb-2 group-hover:text-purple-400 transition-colors">Blog OAB</h3>
              <p className="text-ink-2 text-sm">Dicas e estratégias de estudo</p>
            </Link>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="text-2xl font-bold text-ink-1 mb-6">Perguntas Frequentes sobre Questões OAB</h2>
            <div className="space-y-4">
              {[
                { q: 'Quantas questões OAB tem no banco do Simulai?', a: `São ${totalQuestions.toLocaleString('pt-BR')} questões oficiais da FGV, cobrindo todos os exames de 2010 a 2026 em 17 matérias.` },
                { q: 'As questões são comentadas?', a: 'Sim! Todas possuem gabarito oficial. No plano Pro, a IA gera explicações com fundamentação legal para cada questão.' },
                { q: 'Posso filtrar questões por matéria?', a: 'Sim! Acesse qualquer uma das 17 matérias, filtre por ano do exame e veja estatísticas de dificuldade.' },
                { q: 'As questões são atualizadas?', a: 'Sim! O banco é atualizado automaticamente a cada novo exame da OAB aplicado pela FGV.' },
              ].map((faq, i) => (
                <details key={i} className="bg-surface border rounded-xl p-4 group">
                  <summary className="text-ink-1 font-medium cursor-pointer list-none flex items-center justify-between">
                    {faq.q}
                    <ArrowRight className="w-4 h-4 text-ink-2 transform group-open:rotate-90 transition-transform" />
                  </summary>
                  <p className="text-ink-2 mt-3 leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
