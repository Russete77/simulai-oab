import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui';
import { AssinarButton } from '@/components/billing/assinar-button';
import { HeroCountdown } from '@/components/countdown/hero-countdown';
import { ArrowRight, Check, ChevronDown } from 'lucide-react';

// A home não declarava canonical — e é a página mais linkada do site, a que
// mais corre risco de ser indexada sob o host errado. Relativo de propósito:
// resolve contra o `metadataBase` do layout, então existe UM lugar que decide
// o domínio, em vez de mais um endereço escrito à mão.
export const metadata = {
  alternates: { canonical: '/' },
};

export default function Home() {
  const jsonLdWebApp = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Simulai OAB',
    url: 'https://www.simulaioab.com',
    description:
      'Plataforma de simulados para o Exame da OAB com IA integrada. 5.875 questões oficiais de 2010 a 2026.',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    offers: [
      { '@type': 'Offer', price: '19.90', priceCurrency: 'BRL', name: 'Essencial Mensal' },
      { '@type': 'Offer', price: '89.90', priceCurrency: 'BRL', name: 'Pro Mensal' },
    ],
    featureList:
      'Simulados OAB, Questões comentadas com IA, Chat inteligente, Gamificação, Analytics de performance, PWA offline',
    screenshot: 'https://www.simulaioab.com/logo.png',
    author: { '@type': 'Organization', name: 'Simulai OAB' },
  };

  const jsonLdFaq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Quanto custa o Simulai OAB?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'R$ 9,99 por mês, no cartão, com tudo liberado: as 5.875 questões oficiais, simulados ilimitados, plano de estudos e explicações com IA. Sem fidelidade — cancele quando quiser.',
        },
      },
      {
        '@type': 'Question',
        name: 'Quantas questões o Simulai OAB tem?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '5.875 questões oficiais da OAB/FGV cobrindo todos os exames de 2010 a 2026, em 17 matérias. Atualizado a cada novo exame.',
        },
      },
      {
        '@type': 'Question',
        name: 'Como funciona a IA do Simulai OAB?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No plano Pro, cada questão tem explicação gerada por IA especializada em Direito brasileiro. Você também pode tirar dúvidas em tempo real com o chat — funciona como um professor 24/7.',
        },
      },
      {
        '@type': 'Question',
        name: 'Posso usar offline?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sim. O Simulai OAB é um PWA — instale como app no celular ou desktop e estude offline. Sincroniza automaticamente quando volta online.',
        },
      },
      {
        '@type': 'Question',
        name: 'Posso cancelar quando quiser?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sim, sem fidelidade. Cancela em 1 clique. E temos garantia de 7 dias — se não gostar, devolvemos 100% do valor pago.',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebApp) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
      />

      <div className="min-h-screen bg-bg">
        <Header />

        {/* ============================================================
            HERO — assimétrico, copy + countdown à esquerda, mockup à direita
        ============================================================ */}
        <section className="container-page pt-12 pb-16 sm:pt-20 sm:pb-24">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left: copy */}
            <div className="lg:col-span-7 animate-fade-up">
              <div className="mb-6">
                <HeroCountdown />
              </div>

              <h1 className="text-[40px] sm:text-[56px] lg:text-[64px] leading-[1.05] font-semibold tracking-[-0.025em] text-ink-1 mb-6">
                Você não precisa de
                <br className="hidden sm:block" /> mais 100 horas de aula.
                <br />
                <span className="text-ink-3">
                  Precisa de questão certa, na ordem certa.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-ink-2 max-w-xl leading-relaxed mb-8">
                5.875 questões oficiais da FGV. Algoritmo que aprende seus pontos
                fracos. IA que <em className="not-italic text-ink-1 font-medium">ensina</em>,
                não que entrega a resposta. Mensal, sem fidelidade.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-5">
                <Link href="/diagnostico">
                  <button className="inline-flex w-full sm:w-auto items-center justify-center gap-2 h-12 px-6 rounded-md bg-accent text-accent-fg font-medium shadow-sm hover:bg-accent-hover transition-all">
                    Descubra grátis sua chance de passar
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
                <Link
                  href="/pricing"
                  className="text-sm text-ink-2 hover:text-ink-1 transition-colors px-1 py-1.5"
                >
                  ou assinar direto · R$ 9,99/mês →
                </Link>
              </div>

              <p className="text-xs text-ink-3">
                Garantia de 7 dias · Cancele em 1 clique · Sem fidelidade
              </p>
            </div>

            {/* Right: product mockup */}
            <div className="lg:col-span-5 animate-fade-up" style={{ '--stagger': 2, '--stagger-step': '120ms' } as React.CSSProperties}>
              <ProductMock />
            </div>
          </div>

          {/* Specs strip — abaixo de tudo do hero, denso, tipográfico */}
          <div className="mt-20 pt-10 border-t">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-8 gap-x-6">
              {[
                { num: '5.875', label: 'Questões oficiais' },
                { num: '16 anos', label: 'Histórico FGV (2010–26)' },
                { num: '17', label: 'Matérias cobertas' },
                { num: '24/7', label: 'IA explicando' },
              ].map((s, i) => (
                <div key={s.num} style={{ '--stagger': i + 1, '--stagger-step': '60ms' } as React.CSSProperties} className="animate-fade-up">
                  <div className="text-2xl sm:text-3xl font-semibold text-ink-1 tracking-tight text-mono-tabular">
                    {s.num}
                  </div>
                  <div className="text-xs sm:text-sm text-ink-3 mt-1.5 leading-snug">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================
            PROBLEM — voz humana, dor específica de OAB
        ============================================================ */}
        <section className="bg-surface-2 border-y">
          <div className="container-narrow py-20 sm:py-24">
            <p className="text-eyebrow mb-4">O problema</p>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink-1 leading-snug mb-10 max-w-2xl">
              Quem reprova na OAB raramente é quem estudou pouco.<br />
              <span className="text-ink-3">É quem estudou errado.</span>
            </h2>

            <div className="space-y-5 max-w-2xl text-ink-2 leading-relaxed text-[17px]">
              <p>
                Você assiste 80 horas de videoaula sobre Civil. Faz 12 questões.
                Erra metade. Marca pra &ldquo;revisar depois&rdquo; e esquece. Na semana que
                vem o ciclo recomeça com Constitucional — e o Civil já evaporou.
              </p>
              <p>
                A FGV não pergunta o que está no resumo. Pergunta o que ela já
                cobrou em 2014, 2018 e 2023, com ajuste de pegadinha. Quem responde
                sabendo disso, passa. Quem trata como concurso genérico, treina
                pro errado.
              </p>
              <p>
                <span className="text-ink-1 font-medium">
                  O que falta não é mais conteúdo. É ter o conteúdo certo, na
                  ordem certa, com revisão na hora certa.
                </span>{' '}
                É isso que a gente faz.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================
            THREE PILLARS — alternados left/right, com mini-visual cada
        ============================================================ */}
        <section className="container-page py-20 sm:py-28">
          <div className="max-w-2xl mb-16">
            <p className="text-eyebrow mb-3">Como funciona</p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink-1 leading-tight">
              Três coisas, bem feitas.
            </h2>
          </div>

          <div className="space-y-20 sm:space-y-28">
            {/* Pillar 1 — Banco oficial */}
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-6 lg:order-1 order-2">
                <div className="text-eyebrow text-accent mb-4 text-mono-tabular">01</div>
                <h3 className="text-2xl sm:text-3xl font-semibold text-ink-1 tracking-tight mb-4">
                  Banco oficial.<br />
                  <span className="text-ink-3">Não inventamos questão.</span>
                </h3>
                <p className="text-ink-2 leading-relaxed mb-5">
                  Toda questão veio direto do exame oficial da FGV. De 2010 a 2026.
                  Com gabarito da banca, taxa de acerto histórica e classificação
                  por matéria, edital e tema.
                </p>
                <ul className="space-y-2 text-sm text-ink-2">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span>5.875 questões — 18 exames de 1ª fase</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span>17 matérias indexadas por edital</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span>Atualizado em cada novo exame</span>
                  </li>
                </ul>
              </div>
              <div className="lg:col-span-6 lg:order-2 order-1">
                <BankVisual />
              </div>
            </div>

            {/* Pillar 2 — IA que ensina */}
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-6 order-2 lg:order-1">
                <AIVisual />
              </div>
              <div className="lg:col-span-6 order-1 lg:order-2">
                <div className="text-eyebrow text-accent mb-4 text-mono-tabular">02</div>
                <h3 className="text-2xl sm:text-3xl font-semibold text-ink-1 tracking-tight mb-4">
                  IA que ensina.<br />
                  <span className="text-ink-3">Não que entrega a resposta.</span>
                </h3>
                <p className="text-ink-2 leading-relaxed mb-5">
                  Errou Constitucional? A IA aponta o artigo, explica o
                  raciocínio da banca, e te pergunta de volta. No Pro, você
                  conversa em tempo real — como ter um professor com paciência
                  infinita às 23h da noite.
                </p>
                <ul className="space-y-2 text-sm text-ink-2">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span>Explicação cita base legal e doutrina</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span>Chat especializado em Direito brasileiro</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span>Aponta a matéria em que você mais erra</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Pillar 3 — Revisão na hora certa */}
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-6 lg:order-1 order-2">
                <div className="text-eyebrow text-accent mb-4 text-mono-tabular">03</div>
                <h3 className="text-2xl sm:text-3xl font-semibold text-ink-1 tracking-tight mb-4">
                  Revisão na hora certa.<br />
                  <span className="text-ink-3">Antes de você esquecer.</span>
                </h3>
                <p className="text-ink-2 leading-relaxed mb-5">
                  Sistema de repetição espaçada (SRS) traz de volta o que você
                  errou — em 1 dia, 3 dias, 1 semana. Não é &ldquo;revisar depois&rdquo;. É
                  o algoritmo decidindo quando vai render mais.
                </p>
                <ul className="space-y-2 text-sm text-ink-2">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span>SRS adaptativo por dificuldade</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span>Plano de estudos baseado nos seus erros</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span>Estimativa de aprovação por matéria</span>
                  </li>
                </ul>
              </div>
              <div className="lg:col-span-6 lg:order-2 order-1">
                <SRSVisual />
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            EVERYTHING ELSE — densa, tipográfica, sem grid de cards
        ============================================================ */}
        <section className="bg-surface-2 border-y">
          <div className="container-page py-20">
            <p className="text-eyebrow mb-3">E também</p>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink-1 mb-10 max-w-xl leading-tight">
              Tudo o que faltou na sua última tentativa.
            </h2>
            <div className="grid sm:grid-cols-2 gap-x-12 gap-y-3 max-w-4xl">
              {[
                ['Simulados oficiais', 'Reprodução fiel do exame da FGV — 5h, 80 questões.'],
                ['Simulados adaptativos', 'Sistema escolhe questões pelo seu histórico.'],
                ['Simulados em grupo', 'Compita com amigos via link compartilhado.'],
                ['Analytics por matéria', 'Veja onde está fraco antes da prova.'],
                ['Plano de estudos', 'Cronograma diário ajustado pra próxima OAB.'],
                ['Filtro por matéria', 'Treine só onde você está fraco.'],
                ['Funciona offline', 'PWA — instala como app, sincroniza depois.'],
                ['Questão do dia', 'Uma por dia pra manter a sequência.'],
              ].map(([title, body]) => (
                <div key={title} className="flex items-start gap-3 py-2">
                  <div className="w-1 h-1 rounded-full bg-accent mt-2.5 shrink-0" />
                  <div>
                    <span className="text-ink-1 font-medium text-sm">{title}.</span>{' '}
                    <span className="text-ink-2 text-sm leading-relaxed">{body}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================
            PRICING — plano único
        ============================================================ */}
        <section className="container-page py-20 sm:py-28">
          <div className="max-w-2xl mb-10 mx-auto text-center">
            <p className="text-eyebrow mb-3">Plano</p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink-1 mb-4 leading-tight">
              R$ 9,99 por mês.<br />
              <span className="text-ink-3">Tudo dentro, sem versão de cima.</span>
            </h2>
            <p className="text-ink-2 text-sm">
              No cartão, renovando sozinho. Sem fidelidade — cancele em 2 cliques.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <Card variant="highlighted" className="flex flex-col">
              <div className="mb-6 flex items-baseline gap-1.5">
                <span className="text-5xl font-semibold tracking-tight text-ink-1 text-mono-tabular">
                  R$ 9,99
                </span>
                <span className="text-sm text-ink-3">/mês</span>
              </div>
              <ul className="space-y-2.5 mb-8 text-sm text-ink-2 flex-1">
                {[
                  '5.875 questões oficiais da FGV',
                  'Simulados ilimitados no formato do exame',
                  'Filtro por matéria',
                  'Plano de estudos personalizado',
                  'Explicações com IA',
                  'Acesso offline (PWA)',
                ].map((i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
              <AssinarButton fullWidth />
            </Card>
          </div>
        </section>

        {/* ============================================================
            FAQ
        ============================================================ */}
        <section id="faq" className="bg-surface-2 border-y">
          <div className="container-narrow py-20">
            <div className="mb-10">
              <p className="text-eyebrow mb-3">Dúvidas frequentes</p>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink-1">
                Perguntas comuns.
              </h2>
            </div>

            <div className="space-y-2">
              {[
                {
                  q: 'Quanto custa?',
                  a: 'R$ 9,99 por mês, no cartão. Um plano só, com tudo dentro: questões, simulados, plano de estudos, analytics e explicações com IA. Sem fidelidade.',
                },
                {
                  q: 'Quantas questões tem?',
                  a: '5.875 questões oficiais da OAB/FGV cobrindo todos os exames de 2010 a 2026. Atualizado a cada novo exame.',
                },
                {
                  q: 'A IA é confiável pra Direito?',
                  a: 'Sim. Especializada em Direito brasileiro, treinada com doutrina, jurisprudência e os exames anteriores. Cada explicação cita base legal. Você sempre vê de onde a resposta vem.',
                },
                {
                  q: 'Funciona no celular?',
                  a: 'Sim. PWA — instala como app no iOS e Android, funciona offline e sincroniza automático. Vibração e notificações de lembrete.',
                },
                {
                  q: 'Posso cancelar?',
                  a: 'A qualquer momento, em 1 clique, sem fidelidade. Devolução total nos primeiros 7 dias.',
                },
                {
                  q: 'Vai ter 2ª fase?',
                  a: 'Em breve. Hoje cobrimos 1ª fase completa. 2ª fase entra no roadmap após o próximo exame.',
                },
              ].map((item) => (
                <details
                  key={item.q}
                  className="group rounded-lg border bg-surface overflow-hidden"
                >
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none hover:bg-surface-2 transition-colors">
                    <span className="text-ink-1 font-medium">{item.q}</span>
                    <ChevronDown className="w-4 h-4 text-ink-3 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="px-5 pb-5 -mt-1 text-sm text-ink-2 leading-relaxed">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================
            FINAL CTA
        ============================================================ */}
        <section className="container-page py-20 sm:py-28">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-6 flex justify-center">
              <HeroCountdown />
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink-1 mb-4 leading-tight">
              A próxima OAB já tem data.<br />
              <span className="text-ink-3">A sua preparação ainda não.</span>
            </h2>
            <p className="text-ink-2 mb-8 max-w-md mx-auto">
              Comece em 30 segundos. R$ 9,99/mês. Cancele quando quiser.
            </p>
            <Link href="/register">
              <button className="inline-flex items-center gap-2 h-12 px-8 rounded-md bg-accent text-accent-fg font-medium shadow-sm hover:bg-accent-hover transition-all">
                Criar conta
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <p className="text-xs text-ink-3 mt-5">
              Garantia de 7 dias · Devolução total · Sem fidelidade
            </p>
          </div>
        </section>

        {/* ============================================================
            FOOTER
        ============================================================ */}
        <footer className="border-t bg-surface-2">
          <div className="container-page py-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <p className="text-sm font-semibold text-ink-1">Simulai OAB</p>
                <p className="text-xs text-ink-3 mt-1">
                  Plataforma de preparação para o Exame da OAB.
                </p>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <Link href="/pricing" className="text-ink-2 hover:text-ink-1">
                  Planos
                </Link>
                <Link href="/blog" className="text-ink-2 hover:text-ink-1">
                  Blog
                </Link>
                <Link href="/como-funciona" className="text-ink-2 hover:text-ink-1">
                  Como funciona
                </Link>
                <Link href="/terms" className="text-ink-2 hover:text-ink-1">
                  Termos
                </Link>
                <Link href="/privacy" className="text-ink-2 hover:text-ink-1">
                  Privacidade
                </Link>
              </div>
            </div>
            <hr className="hairline my-8" />
            <p className="text-xs text-ink-3">
              © {new Date().getFullYear()} Simulai OAB. Não somos vinculados à OAB ou FGV.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}

/* ============================================================================
   VISUAIS — SVG inline, leve, sem dependência. Cada um conta uma coisa.
   ============================================================================ */

/**
 * Mockup principal do hero — uma "questão sendo respondida + IA explicando".
 * Mostra os 2 features centrais (banco + IA) num único frame.
 */
function ProductMock() {
  return (
    <div className="relative">
      {/* Question card */}
      <div className="rounded-xl border bg-surface shadow-md overflow-hidden">
        {/* card header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-surface-2">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-accent-soft text-accent">
              Ética
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-surface text-ink-3 border">
              OAB 2024 · Q23
            </span>
          </div>
          <span className="text-[10px] text-ink-3 text-mono-tabular">02:47</span>
        </div>

        {/* statement */}
        <div className="px-5 py-4">
          <p className="text-[13px] text-ink-1 leading-relaxed mb-4">
            Determinado advogado, ao atender cliente cujos interesses já havia
            patrocinado em outra demanda contra a parte adversa, deverá observar…
          </p>

          {/* alternatives */}
          <div className="space-y-1.5 text-[12px]">
            <Alt letter="A" text="Aceitar a causa apenas se houver consentimento expresso de todas as partes." />
            <Alt letter="B" text="Recusar a causa por configurar conflito de interesses, ainda que o cliente anterior consinta." correct />
            <Alt letter="C" text="Aceitar livremente, pois cada cliente é representado em demanda autônoma." />
            <Alt letter="D" text="Submeter o caso à OAB para autorização formal." />
          </div>
        </div>

        {/* AI explanation panel */}
        <div className="border-t bg-surface-2 px-5 py-4">
          <div className="flex items-start gap-2 mb-2">
            <div className="w-5 h-5 rounded-full bg-accent text-accent-fg flex items-center justify-center text-[9px] font-semibold mt-0.5 shrink-0">
              ai
            </div>
            <div>
              <p className="text-[11px] text-ink-3 mb-1">
                Por que <span className="text-ink-1 font-medium">B</span> está correta:
              </p>
              <p className="text-[12px] text-ink-2 leading-relaxed">
                Art. 17, §1º do Código de Ética da OAB — patrocínio prévio contra
                a mesma parte gera impedimento{' '}
                <span className="text-ink-1 font-medium">absoluto</span>. Não há
                cura por consentimento.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating analytics chip */}
      <div className="absolute -bottom-4 -right-2 sm:-right-6 hidden sm:block">
        <div className="rounded-lg border bg-surface shadow-md px-3.5 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-3 bg-success rounded-sm" />
              <div className="w-1.5 h-4 bg-success rounded-sm" />
              <div className="w-1.5 h-2 bg-success/40 rounded-sm" />
              <div className="w-1.5 h-5 bg-success rounded-sm" />
              <div className="w-1.5 h-3 bg-success rounded-sm" />
            </div>
            <div>
              <p className="text-[10px] text-ink-3 leading-none mb-0.5">Ética</p>
              <p className="text-xs text-ink-1 font-semibold leading-none text-mono-tabular">
                82% acerto
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Alt({ letter, text, correct }: { letter: string; text: string; correct?: boolean }) {
  return (
    <div
      className={`flex items-start gap-2 px-2.5 py-1.5 rounded border ${
        correct
          ? 'border-success bg-success-soft'
          : 'border bg-surface'
      }`}
    >
      <span
        className={`w-5 h-5 rounded text-[10px] font-semibold flex items-center justify-center shrink-0 ${
          correct ? 'bg-success text-white' : 'bg-surface-2 text-ink-2'
        }`}
      >
        {letter}
      </span>
      <span className={`flex-1 leading-snug ${correct ? 'text-ink-1' : 'text-ink-2'}`}>
        {text}
      </span>
      {correct && (
        <svg
          className="w-3.5 h-3.5 text-success shrink-0 mt-0.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </div>
  );
}

/**
 * Visual do "Banco oficial" — uma timeline horizontal de exames OAB.
 */
function BankVisual() {
  const exams = [
    { year: '2010', count: '320' },
    { year: '2014', count: '420' },
    { year: '2018', count: '480' },
    { year: '2022', count: '480' },
    { year: '2025', count: '480' },
  ];
  return (
    <div className="rounded-xl border bg-surface p-6 sm:p-7 shadow-sm">
      <div className="text-eyebrow mb-1">5.875 questões</div>
      <div className="text-sm text-ink-2 mb-6">16 anos de FGV, em uma busca.</div>
      <div className="flex items-end gap-2 h-32 mb-3">
        {[34, 56, 72, 60, 88, 76, 92, 80, 96, 84, 100, 88, 96].map((h, i) => (
          <div
            key={i}
            className={`flex-1 rounded-sm ${
              i === 12 ? 'bg-accent' : 'bg-surface-2 border'
            }`}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-[10px] text-ink-3 text-mono-tabular border-t pt-3">
        {exams.map((e) => (
          <span key={e.year}>{e.year}</span>
        ))}
      </div>
      <div className="mt-4 inline-flex items-center gap-2 px-2.5 py-1 rounded bg-accent-soft text-accent text-[11px] font-medium">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent" />
        Inclui 2025 · 41º exame
      </div>
    </div>
  );
}

/**
 * Visual da IA — chat box estilizado com pergunta e explicação.
 */
function AIVisual() {
  return (
    <div className="rounded-xl border bg-surface p-6 sm:p-7 shadow-sm space-y-3">
      <div className="text-eyebrow mb-1">Chat IA</div>
      <div className="text-sm text-ink-2 mb-5">Explicação que aprofunda, não que entrega.</div>

      {/* user msg */}
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-lg bg-accent text-accent-fg px-3 py-2 text-[12px] leading-relaxed">
          Por que a alternativa B está certa? Achei que era A.
        </div>
      </div>

      {/* ai msg */}
      <div className="flex gap-2 items-start">
        <div className="w-6 h-6 rounded-full bg-accent-soft text-accent flex items-center justify-center text-[9px] font-semibold mt-0.5 shrink-0">
          ai
        </div>
        <div className="max-w-[85%] rounded-lg bg-surface-2 border px-3 py-2 text-[12px] text-ink-2 leading-relaxed">
          A é tentadora, mas a banca FGV historicamente cobra o{' '}
          <span className="text-ink-1 font-medium">impedimento absoluto</span> (Art. 17 §1º).
          Consentimento não cura. Quer que eu mostre 3 questões anteriores com mesmo padrão?
        </div>
      </div>

      {/* typing indicator */}
      <div className="flex gap-2 items-center pl-8 pt-1">
        <span className="w-1.5 h-1.5 rounded-full bg-ink-3 animate-pulse" />
        <span
          className="w-1.5 h-1.5 rounded-full bg-ink-3 animate-pulse"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-ink-3 animate-pulse"
          style={{ animationDelay: '300ms' }}
        />
        <span className="text-[10px] text-ink-3 ml-1">digitando…</span>
      </div>
    </div>
  );
}

/**
 * Visual do SRS — timeline de revisões espaçadas.
 */
function SRSVisual() {
  const reviews = [
    { day: 'Hoje', label: 'Errou', state: 'wrong' },
    { day: '+1d', label: 'Revisar', state: 'pending' },
    { day: '+3d', label: 'Revisar', state: 'pending' },
    { day: '+7d', label: 'Revisar', state: 'pending' },
    { day: '+21d', label: 'Domínio', state: 'mastered' },
  ];
  return (
    <div className="rounded-xl border bg-surface p-6 sm:p-7 shadow-sm">
      <div className="text-eyebrow mb-1">Repetição espaçada</div>
      <div className="text-sm text-ink-2 mb-6">
        Algoritmo decide a hora certa de você ver de novo.
      </div>
      <div className="space-y-2.5">
        {reviews.map((r, i) => {
          const stateClass =
            r.state === 'wrong'
              ? 'border-danger bg-danger-soft text-danger'
              : r.state === 'mastered'
                ? 'border-success bg-success-soft text-success'
                : 'border bg-surface-2 text-ink-3';
          return (
            <div key={i} className="flex items-center gap-3">
              <div className="text-[10px] text-ink-3 text-mono-tabular w-10 text-right shrink-0">
                {r.day}
              </div>
              <div className="flex-1 h-px bg-surface-2 border-t" />
              <div
                className={`text-[11px] font-medium px-2.5 py-1 rounded-md border ${stateClass}`}
              >
                {r.label}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-ink-3 mt-5 leading-relaxed border-t pt-4">
        Em 21 dias, o que você errou hoje vira reflexo.
      </p>
    </div>
  );
}
