import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Card, Badge } from '@/components/ui';
import {
  Check,
  ArrowRight,
  Brain,
  BarChart3,
  Zap,
  Shield,
  Sparkles,
  Target,
  MessageSquare,
  FileText,
  Smartphone,
  ChevronDown,
} from 'lucide-react';

export default function Home() {
  const jsonLdWebApp = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Simulai OAB',
    url: 'https://simulaioab.com',
    description: 'Plataforma de simulados para o Exame da OAB com IA integrada. 5.605 questões oficiais de 2010 a 2025.',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    offers: [
      { '@type': 'Offer', price: '19.90', priceCurrency: 'BRL', name: 'Essencial Mensal' },
      { '@type': 'Offer', price: '89.90', priceCurrency: 'BRL', name: 'Pro Mensal' },
    ],
    featureList: 'Simulados OAB, Questões comentadas com IA, Chat inteligente, Gamificação, Analytics de performance, PWA offline',
    screenshot: 'https://simulaioab.com/logo.png',
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
          text: 'Plano Essencial R$ 19,90/mês com acesso a todas as 5.605 questões, simulados ilimitados e analytics. Plano Pro R$ 89,90/mês inclui IA integrada com explicações detalhadas e chat. Garantia de 7 dias.',
        },
      },
      {
        '@type': 'Question',
        name: 'Quantas questões o Simulai OAB tem?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '5.605 questões oficiais da OAB/FGV cobrindo todos os exames de 2010 a 2025, em 17 matérias. Atualizado a cada novo exame.',
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebApp) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }} />

      <div className="min-h-screen bg-bg">
        <Header />

        {/* HERO */}
        <section className="container-page pt-16 pb-24 sm:pt-24 sm:pb-32">
          <div className="max-w-3xl mx-auto text-center animate-fade-up">
            <Badge variant="accent" className="mb-6">
              <Sparkles className="w-3 h-3" />
              IA integrada · 5.605 questões oficiais
            </Badge>

            <h1 className="text-display mb-6">
              Passe na OAB estudando<br />
              <span className="text-accent">do jeito certo.</span>
            </h1>

            <p className="text-lg text-ink-2 max-w-2xl mx-auto leading-relaxed mb-10">
              Plataforma com 5.605 questões oficiais da FGV de 2010 a 2025, simulados adaptativos,
              analytics por matéria e (no Pro) explicações por IA. Sem distração. Só o necessário pra passar.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link href="/register">
                <button className="inline-flex items-center gap-2 h-12 px-6 rounded-md bg-accent text-accent-fg font-medium shadow-sm hover:bg-accent-hover transition-all">
                  Criar conta
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="#features">
                <button className="inline-flex items-center gap-2 h-12 px-6 rounded-md border bg-surface text-ink-1 font-medium hover:bg-surface-2 transition-all">
                  Ver como funciona
                </button>
              </Link>
            </div>

            <p className="text-xs text-ink-3 mt-6">
              Garantia de 7 dias · Cancele quando quiser · Sem fidelidade
            </p>
          </div>

          {/* Stats strip */}
          <div className="max-w-3xl mx-auto mt-20 grid grid-cols-3 gap-4 sm:gap-8">
            {[
              { num: '5.605', label: 'Questões oficiais FGV' },
              { num: '2010-25', label: 'Histórico completo' },
              { num: '17', label: 'Matérias cobertas' },
            ].map((s, i) => (
              <div
                key={s.num}
                className="text-center animate-fade-up"
                style={{ '--stagger': i + 1, '--stagger-step': '80ms' } as React.CSSProperties}
              >
                <div className="text-2xl sm:text-3xl font-semibold text-ink-1 tracking-tight text-mono-tabular">
                  {s.num}
                </div>
                <div className="text-xs sm:text-sm text-ink-3 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* TRUST DIVIDER */}
        <hr className="hairline container-page" />

        {/* FEATURES */}
        <section id="features" className="container-page py-24 sm:py-32">
          <div className="max-w-2xl mb-16">
            <p className="text-eyebrow mb-3">O que tem dentro</p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink-1 mb-4">
              Tudo o que você precisa pra passar.<br />
              <span className="text-ink-3">Nada que você não precisa.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: Target,
                title: '5.605 questões oficiais',
                body: 'Banco completo da FGV de 2010 a 2025, com gabarito e estatísticas de acerto da banca.',
              },
              {
                icon: Brain,
                title: 'Explicações por IA',
                body: 'No Pro, cada questão tem comentário gerado por IA especializada em Direito brasileiro.',
              },
              {
                icon: MessageSquare,
                title: 'Chat com IA',
                body: 'Tire dúvida em tempo real sobre qualquer questão ou conceito. Como ter um professor 24/7.',
              },
              {
                icon: BarChart3,
                title: 'Analytics por matéria',
                body: 'Veja seus pontos fracos por área, evolução semanal e probabilidade de aprovação.',
              },
              {
                icon: Zap,
                title: 'Simulados adaptativos',
                body: 'O sistema escolhe automaticamente as questões com base nas suas dificuldades.',
              },
              {
                icon: FileText,
                title: 'Revisão inteligente (SRS)',
                body: 'Sistema de repetição espaçada que traz de volta o que você errou na hora certa.',
              },
              {
                icon: Sparkles,
                title: 'Flashcards e desafios',
                body: 'Sessões curtas pra reforço, desafios semanais com ranking e gamificação leve.',
              },
              {
                icon: Smartphone,
                title: 'Funciona offline',
                body: 'Instale como app (PWA) no celular ou desktop. Estude no metrô, sincroniza depois.',
              },
              {
                icon: Shield,
                title: 'Sem fidelidade',
                body: 'Cancele em 1 clique quando quiser. Garantia de 7 dias com devolução total.',
              },
            ].map((f, i) => (
              <Card
                key={f.title}
                className="animate-fade-up"
                interactive
              >
                <div className="w-9 h-9 rounded-md bg-accent-soft text-accent flex items-center justify-center mb-4">
                  <f.icon className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-ink-1 mb-1.5">{f.title}</h3>
                <p className="text-sm text-ink-2 leading-relaxed">{f.body}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="como-funciona" className="bg-surface-2 border-y">
          <div className="container-page py-24 sm:py-32">
            <div className="max-w-2xl mb-16">
              <p className="text-eyebrow mb-3">Como funciona</p>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink-1">
                Comece em 60 segundos.
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl">
              {[
                {
                  step: '01',
                  title: 'Crie sua conta',
                  body: 'Cadastro em 30s com email ou Google. Sem cartão necessário pra começar.',
                },
                {
                  step: '02',
                  title: 'Escolha seu plano',
                  body: 'Essencial pra estudar com seriedade ou Pro pra ter IA do seu lado.',
                },
                {
                  step: '03',
                  title: 'Estude e passe',
                  body: 'Resolva, revise, evolua. Acompanhe seu progresso em tempo real.',
                },
              ].map((s, i) => (
                <div
                  key={s.step}
                  className="animate-fade-up"
                  style={{ '--stagger': i + 1, '--stagger-step': '100ms' } as React.CSSProperties}
                >
                  <div className="text-eyebrow text-accent mb-3 text-mono-tabular">{s.step}</div>
                  <h3 className="text-lg font-semibold text-ink-1 mb-2">{s.title}</h3>
                  <p className="text-ink-2 leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING TEASER */}
        <section className="container-page py-24 sm:py-32">
          <div className="max-w-2xl mb-12 text-center mx-auto">
            <p className="text-eyebrow mb-3">Planos</p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink-1 mb-4">
              Mensal direto. Cancele quando quiser.
            </h2>
            <p className="text-ink-2">
              Garantia de 7 dias com devolução total.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            <Card className="flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-ink-1">Essencial</h3>
                <p className="text-sm text-ink-2 mt-1">Tudo pra estudar com seriedade</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-semibold tracking-tight text-ink-1">R$ 19,90</span>
                <span className="text-sm text-ink-3 ml-1">/mês</span>
              </div>
              <ul className="space-y-2.5 mb-8 text-sm text-ink-2 flex-1">
                {[
                  '5.605 questões oficiais',
                  'Simulados ilimitados',
                  'Analytics avançado',
                  'Flashcards e revisão SRS',
                  'PWA offline',
                ].map((i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
              <Link href="/pricing" className="mt-auto">
                <button className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md border bg-surface text-ink-1 text-sm font-medium hover:bg-surface-2 transition-all">
                  Ver detalhes
                </button>
              </Link>
            </Card>

            <Card variant="highlighted" className="flex flex-col relative">
              <div className="flex items-baseline justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-ink-1">Pro</h3>
                  <p className="text-sm text-ink-2 mt-1">Com IA integrada</p>
                </div>
                <Badge variant="accent">popular</Badge>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-semibold tracking-tight text-ink-1">R$ 89,90</span>
                <span className="text-sm text-ink-3 ml-1">/mês</span>
              </div>
              <ul className="space-y-2.5 mb-8 text-sm text-ink-2 flex-1">
                {[
                  'Tudo do Essencial',
                  'Explicações por IA ilimitadas',
                  'Chat com IA',
                  'Coaching virtual',
                  'Relatórios em PDF',
                ].map((i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
              <Link href="/pricing" className="mt-auto">
                <button className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-accent text-accent-fg text-sm font-medium hover:bg-accent-hover shadow-sm transition-all">
                  Assinar Pro
                </button>
              </Link>
            </Card>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="bg-surface-2 border-y">
          <div className="container-narrow py-24">
            <div className="mb-12">
              <p className="text-eyebrow mb-3">Dúvidas frequentes</p>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink-1">
                Perguntas comuns.
              </h2>
            </div>

            <div className="space-y-2">
              {[
                {
                  q: 'Quanto custa?',
                  a: 'Essencial R$ 19,90/mês com tudo liberado (questões, simulados, analytics, flashcards). Pro R$ 89,90/mês adiciona IA integrada (explicações + chat). Garantia de 7 dias.',
                },
                {
                  q: 'Quantas questões tem?',
                  a: '5.605 questões oficiais da OAB/FGV cobrindo todos os exames de 2010 a 2025. Atualizado a cada novo exame.',
                },
                {
                  q: 'A IA é confiável?',
                  a: 'Sim. Especializada em Direito brasileiro, treinada com doutrina, jurisprudência e os exames anteriores. Cada explicação cita base legal.',
                },
                {
                  q: 'Funciona no celular?',
                  a: 'Sim. PWA — instala como app, funciona offline e sincroniza automático.',
                },
                {
                  q: 'Posso cancelar?',
                  a: 'A qualquer momento, em 1 clique, sem fidelidade. Devolução total nos primeiros 7 dias.',
                },
              ].map((item) => (
                <details key={item.q} className="group rounded-lg border bg-surface overflow-hidden">
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

        {/* FINAL CTA */}
        <section className="container-page py-24 sm:py-32 text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink-1 mb-4 max-w-xl mx-auto">
            Pronto pra passar na próxima OAB?
          </h2>
          <p className="text-ink-2 mb-10 max-w-md mx-auto">
            Crie sua conta agora. Garantia de 7 dias.
          </p>
          <Link href="/register">
            <button className="inline-flex items-center gap-2 h-12 px-8 rounded-md bg-accent text-accent-fg font-medium shadow-sm hover:bg-accent-hover transition-all">
              Criar conta
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </section>

        {/* FOOTER */}
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
                <Link href="/pricing" className="text-ink-2 hover:text-ink-1">Planos</Link>
                <Link href="/blog" className="text-ink-2 hover:text-ink-1">Blog</Link>
                <Link href="/como-funciona" className="text-ink-2 hover:text-ink-1">Como funciona</Link>
                <Link href="/terms" className="text-ink-2 hover:text-ink-1">Termos</Link>
                <Link href="/privacy" className="text-ink-2 hover:text-ink-1">Privacidade</Link>
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
