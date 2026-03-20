import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { prisma } from '@/lib/db/prisma';
import { Play, BookOpen, Brain, BarChart3, Clock, Target, ArrowRight, CheckCircle, Star, Users, Zap } from 'lucide-react';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Simulado OAB Online Grátis 2026 — 5.605 Questões Oficiais com IA | Simulai',
  description: 'Faça simulados OAB online grátis com 5.605 questões oficiais FGV (2010-2025). Explicações por IA, cronômetro real, 5 modos de estudo, predição de aprovação e gamificação. A plataforma mais completa para passar na OAB.',
  keywords: [
    'simulado OAB', 'simulado OAB online', 'simulado OAB grátis', 'simulado OAB 2026',
    'questões OAB', 'prova OAB', 'exame OAB simulado', 'teste OAB online',
    'simulado OAB com gabarito', 'simulado OAB comentado', 'simulado OAB FGV',
  ],
  openGraph: {
    title: 'Simulado OAB Online Grátis 2026 — Simulai OAB',
    description: 'Faça simulados com 5.605 questões oficiais FGV. IA explica cada questão. Comece grátis!',
    url: 'https://simulaioab.com/simulado-oab-online',
    type: 'website',
  },
  alternates: {
    canonical: 'https://simulaioab.com/simulado-oab-online',
  },
};

const subjects = [
  { slug: 'etica', name: 'Ética e Estatuto da OAB', icon: '⚖️' },
  { slug: 'constitucional', name: 'Direito Constitucional', icon: '📜' },
  { slug: 'civil', name: 'Direito Civil', icon: '🏠' },
  { slug: 'processo-civil', name: 'Processo Civil', icon: '📋' },
  { slug: 'penal', name: 'Direito Penal', icon: '🔒' },
  { slug: 'processo-penal', name: 'Processo Penal', icon: '🔍' },
  { slug: 'trabalho', name: 'Direito do Trabalho', icon: '👷' },
  { slug: 'administrativo', name: 'Direito Administrativo', icon: '🏛️' },
  { slug: 'tributario', name: 'Direito Tributário', icon: '💰' },
  { slug: 'empresarial', name: 'Direito Empresarial', icon: '🏢' },
  { slug: 'consumidor', name: 'Direito do Consumidor', icon: '🛒' },
];

async function getPageData() {
  try {
    const totalQuestions = await prisma.question.count({ where: { nullified: false } });
    const groupResult = await prisma.question.groupBy({
      by: ['examId'],
      where: { nullified: false },
    });
    const examIds = groupResult.map((e) => e.examId);
    return { totalQuestions, examIds };
  } catch (error) {
    console.error('Erro ao buscar dados para simulado-oab-online:', error);
    return { totalQuestions: 5605, examIds: [] as string[] };
  }
}

export default async function SimuladoOabOnlinePage() {
  const { totalQuestions, examIds } = await getPageData();

  const jsonLdCourse = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: 'Simulado OAB Online — Simulai OAB',
    description: `Simulados online para o Exame da OAB com ${totalQuestions} questões oficiais FGV. Explicações por IA, cronômetro real e predição de aprovação.`,
    provider: { '@type': 'Organization', name: 'Simulai OAB', url: 'https://simulaioab.com' },
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL', availability: 'https://schema.org/InStock' },
    educationalLevel: 'Advanced',
    inLanguage: 'pt-BR',
    hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'Online', courseWorkload: 'PT4H' },
  };

  const jsonLdFaq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Como funciona o simulado OAB online do Simulai?',
        acceptedAnswer: { '@type': 'Answer', text: `O Simulai OAB oferece simulados online com ${totalQuestions} questões oficiais da FGV, de 2010 até 2025. Você pode escolher entre 5 modos: Simulado Completo (80 questões como na prova real), Adaptativo (40 questões ajustadas ao seu nível), Rápido (20 questões), Revisão de Erros e Por Matéria. Cada questão tem explicação detalhada gerada por IA.` },
      },
      {
        '@type': 'Question',
        name: 'O simulado OAB do Simulai é grátis?',
        acceptedAnswer: { '@type': 'Answer', text: 'Sim! O plano gratuito permite fazer simulados e resolver questões diárias. Para acesso ilimitado com IA integrada e analytics completos, existem planos a partir de R$ 19,99/mês.' },
      },
      {
        '@type': 'Question',
        name: 'Quantas questões OAB tem no Simulai?',
        acceptedAnswer: { '@type': 'Answer', text: `São ${totalQuestions} questões oficiais da FGV, cobrindo todos os ${examIds.length} exames da OAB de 2010 a 2025, em 17 matérias. O banco é atualizado automaticamente a cada novo exame.` },
      },
      {
        '@type': 'Question',
        name: 'O simulado OAB tem gabarito comentado?',
        acceptedAnswer: { '@type': 'Answer', text: 'Sim! Cada questão possui gabarito oficial e, no plano Pro, explicação detalhada gerada por Inteligência Artificial, com fundamentação legal, doutrina e jurisprudência relevantes.' },
      },
      {
        '@type': 'Question',
        name: 'Como o Simulai compara com outros simulados OAB online?',
        acceptedAnswer: { '@type': 'Answer', text: `O Simulai OAB é a única plataforma com IA integrada para explicações e chat em tempo real. Com ${totalQuestions} questões (o maior banco do mercado), 5 modos de estudo, gamificação completa e predição de aprovação, oferece a preparação mais completa por um preço a partir de R$ 19,99/mês.` },
      },
      {
        '@type': 'Question',
        name: 'O simulado funciona no celular?',
        acceptedAnswer: { '@type': 'Answer', text: 'Sim! O Simulai OAB é um Progressive Web App (PWA) — funciona como um app nativo no celular sem precisar baixar da loja. Basta acessar simulaioab.com e adicionar à tela inicial.' },
      },
      {
        '@type': 'Question',
        name: 'Qual a taxa de aprovação de quem usa o Simulai?',
        acceptedAnswer: { '@type': 'Answer', text: 'Estudantes que fazem simulados regularmente têm taxa de aprovação significativamente maior na OAB. O Simulai oferece predição de aprovação baseada no seu desempenho, ajudando você a saber exatamente onde precisa melhorar.' },
      },
    ],
  };

  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://simulaioab.com' },
      { '@type': 'ListItem', position: 2, name: 'Simulado OAB Online', item: 'https://simulaioab.com/simulado-oab-online' },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdCourse) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }} />

      <div className="min-h-screen bg-navy-950">
        <Header />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-navy-400 mb-8">
            <Link href="/" className="hover:text-white transition-colors">Início</Link>
            <span>/</span>
            <span className="text-white">Simulado OAB Online</span>
          </nav>

          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Simulado OAB Online Grátis — {totalQuestions.toLocaleString('pt-BR')} Questões Oficiais
            </h1>
            <p className="text-xl text-navy-300 max-w-3xl mx-auto mb-8">
              A plataforma mais completa de simulados para o Exame da OAB. Questões oficiais FGV de 2010 a 2025 com explicações por Inteligência Artificial, cronômetro real e predição de aprovação.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-500 hover:to-purple-500 transition-all text-lg"
              >
                <Play className="w-5 h-5" />
                Começar Simulado Grátis
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all text-lg"
              >
                Ver Planos
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {[
              { icon: BookOpen, label: 'Questões Oficiais', value: totalQuestions.toLocaleString('pt-BR') },
              { icon: Target, label: 'Exames Cobertos', value: `${examIds.length}+` },
              { icon: Brain, label: 'Explicações com IA', value: 'Ilimitadas' },
              { icon: Users, label: 'Estudantes Ativos', value: '220+' },
            ].map((stat, i) => (
              <div key={i} className="bg-navy-900/50 border border-white/10 rounded-xl p-4 text-center">
                <stat.icon className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-navy-400">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* 5 Modos de Simulado */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              5 Modos de Simulado OAB para Cada Fase do Seu Estudo
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Simulado Completo', desc: '80 questões em 4 horas — idêntico à prova real da OAB/FGV. Cronômetro, navegação entre questões e resultado detalhado.', icon: Target },
                { title: 'Simulado Adaptativo', desc: '40 questões ajustadas ao seu nível. A IA seleciona questões mais relevantes para seus pontos fracos.', icon: Brain },
                { title: 'Simulado Rápido', desc: '20 questões em 1 hora. Perfeito para treinos diários e revisão antes da prova.', icon: Zap },
                { title: 'Revisão de Erros', desc: '30 questões que você errou anteriormente. Foque exatamente onde precisa melhorar.', icon: CheckCircle },
                { title: 'Simulado por Matéria', desc: '50 questões de uma matéria específica. Ideal para aprofundar em Constitucional, Civil, Penal e mais.', icon: BookOpen },
              ].map((mode, i) => (
                <div key={i} className="bg-navy-900/50 border border-white/10 rounded-xl p-6 hover:border-blue-500/50 transition-all">
                  <mode.icon className="w-8 h-8 text-blue-400 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">{mode.title}</h3>
                  <p className="text-navy-300 text-sm">{mode.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Por que fazer simulados */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-6">
              Por Que Fazer Simulados OAB é Essencial para Passar na Prova
            </h2>
            <div className="bg-navy-900/50 border border-white/10 rounded-xl p-8">
              <div className="prose prose-invert max-w-none">
                <p className="text-navy-200 text-lg leading-relaxed mb-4">
                  A prática com simulados é a estratégia mais eficaz para aprovação no Exame da OAB. Estudos mostram que candidatos que fazem simulados regularmente têm taxa de aprovação significativamente maior que aqueles que apenas leem a teoria. Isso acontece porque o simulado treina não apenas o conhecimento jurídico, mas também a gestão do tempo, o raciocínio sob pressão e a familiaridade com o estilo de questão da banca FGV.
                </p>
                <p className="text-navy-200 text-lg leading-relaxed mb-4">
                  O Exame da OAB exige 40 acertos em 80 questões (50%) na 1ª fase, cobrindo 17 matérias em apenas 4 horas. Sem prática com simulados completos, muitos candidatos perdem tempo em questões difíceis e não conseguem completar a prova. Com o Simulai OAB, você treina nas condições reais e identifica exatamente quais matérias precisa reforçar.
                </p>
                <p className="text-navy-200 text-lg leading-relaxed">
                  O diferencial do Simulai é a Inteligência Artificial integrada: cada questão conta com explicação detalhada gerada por IA, com fundamentação legal, doutrina e jurisprudência. Além disso, o chat inteligente funciona como um professor particular 24/7, tirando suas dúvidas em tempo real. Tudo isso com o maior banco de questões oficiais do mercado: {totalQuestions.toLocaleString('pt-BR')} questões de {examIds.length}+ exames.
                </p>
              </div>
            </div>
          </section>

          {/* Matérias disponíveis */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Simulados por Matéria — Todas as 17 Disciplinas da OAB
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((subject) => (
                <Link
                  key={subject.slug}
                  href={`/materias/${subject.slug}`}
                  className="flex items-center gap-3 bg-navy-900/50 border border-white/10 rounded-xl p-4 hover:border-blue-500/50 hover:bg-navy-900/80 transition-all group"
                >
                  <span className="text-2xl">{subject.icon}</span>
                  <div>
                    <div className="text-white font-medium group-hover:text-blue-400 transition-colors">{subject.name}</div>
                    <div className="text-sm text-navy-400">Ver questões →</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Exames disponíveis (internal linking) */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Simulados e Gabaritos de Todos os Exames da OAB
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Gabaritos Comentados</h3>
                <div className="space-y-2">
                  {examIds.slice(0, 10).map((examId) => (
                    <Link
                      key={examId}
                      href={`/gabarito/${examId}`}
                      className="block text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Gabarito {examId.toUpperCase()} →
                    </Link>
                  ))}
                  <Link href="/gabarito" className="block text-navy-400 hover:text-white transition-colors mt-2">
                    Ver todos os gabaritos →
                  </Link>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Simulados por Exame</h3>
                <div className="space-y-2">
                  {examIds.slice(0, 10).map((examId) => (
                    <Link
                      key={examId}
                      href={`/simulado/${examId}`}
                      className="block text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Simulado {examId.toUpperCase()} →
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Perguntas Frequentes sobre Simulados OAB Online
            </h2>
            <div className="space-y-4">
              {[
                { q: 'Como funciona o simulado OAB online do Simulai?', a: `O Simulai oferece simulados com ${totalQuestions.toLocaleString('pt-BR')} questões oficiais da FGV. Escolha entre 5 modos de estudo, responda com cronômetro real e receba explicações detalhadas por IA para cada questão.` },
                { q: 'O simulado OAB do Simulai é grátis?', a: 'Sim! O plano gratuito permite fazer simulados e resolver questões diárias. Para acesso ilimitado com IA integrada, existem planos a partir de R$ 19,99/mês.' },
                { q: 'Quantas questões OAB tem no banco?', a: `São ${totalQuestions.toLocaleString('pt-BR')} questões oficiais da FGV, de ${examIds.length}+ exames (2010-2025), em 17 matérias.` },
                { q: 'O simulado tem gabarito comentado?', a: 'Sim! Cada questão tem gabarito oficial. No plano Pro, a IA gera explicações detalhadas com fundamentação legal e jurisprudência.' },
                { q: 'Funciona no celular?', a: 'Sim! O Simulai é um PWA — funciona como app nativo no celular sem precisar baixar da loja.' },
                { q: 'Qual a diferença do Simulai para outros simulados?', a: 'O Simulai é o único com IA integrada para explicações em tempo real, maior banco de questões do mercado, 5 modos de estudo, gamificação completa e predição de aprovação.' },
                { q: 'Como a IA ajuda nos estudos?', a: 'A IA explica cada questão com fundamentação legal, identifica seus pontos fracos e funciona como professor particular 24/7 através do chat inteligente.' },
              ].map((faq, i) => (
                <details key={i} className="bg-navy-900/50 border border-white/10 rounded-xl p-4 group">
                  <summary className="text-white font-medium cursor-pointer list-none flex items-center justify-between">
                    {faq.q}
                    <ArrowRight className="w-4 h-4 text-navy-400 transform group-open:rotate-90 transition-transform" />
                  </summary>
                  <p className="text-navy-300 mt-3 leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
          </section>

          {/* CTA Final */}
          <section className="text-center bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Comece Seu Simulado OAB Agora — É Grátis!
            </h2>
            <p className="text-navy-300 text-lg mb-8 max-w-2xl mx-auto">
              Junte-se a centenas de estudantes que já estão se preparando com o Simulai OAB. Sem cartão de crédito, sem compromisso.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-500 hover:to-purple-500 transition-all text-lg"
            >
              <Play className="w-5 h-5" />
              Criar Conta Grátis e Começar
            </Link>
          </section>

          {/* Footer SEO links */}
          <footer className="mt-16 pt-8 border-t border-white/10">
            <div className="grid md:grid-cols-3 gap-8 text-sm">
              <div>
                <h3 className="text-white font-semibold mb-3">Simulados OAB</h3>
                <div className="space-y-1">
                  <Link href="/simulado-oab-online" className="block text-navy-400 hover:text-white transition-colors">Simulado OAB Online</Link>
                  <Link href="/gabarito" className="block text-navy-400 hover:text-white transition-colors">Gabaritos OAB</Link>
                  <Link href="/questao-do-dia" className="block text-navy-400 hover:text-white transition-colors">Questão do Dia</Link>
                </div>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-3">Matérias OAB</h3>
                <div className="space-y-1">
                  {subjects.slice(0, 6).map((s) => (
                    <Link key={s.slug} href={`/materias/${s.slug}`} className="block text-navy-400 hover:text-white transition-colors">{s.name}</Link>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-3">Blog OAB</h3>
                <div className="space-y-1">
                  <Link href="/blog/como-passar-na-oab-primeira-fase" className="block text-navy-400 hover:text-white transition-colors">Como passar na OAB</Link>
                  <Link href="/blog/materias-mais-cobradas-oab" className="block text-navy-400 hover:text-white transition-colors">Matérias mais cobradas</Link>
                  <Link href="/blog" className="block text-navy-400 hover:text-white transition-colors">Ver todo o blog →</Link>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
