import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui';
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
      { '@type': 'Offer', price: '0', priceCurrency: 'BRL', name: 'Gratuito' },
      { '@type': 'Offer', price: '19.99', priceCurrency: 'BRL', name: 'Essencial Mensal' },
      { '@type': 'Offer', price: '89.99', priceCurrency: 'BRL', name: 'Pro Mensal' },
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
        name: 'O Simulai OAB é gratuito?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sim! O plano gratuito inclui 1 simulado por mês e 5 questões por dia para você experimentar. Para questões e simulados ilimitados, o plano Essencial custa apenas R$ 19,99/mês. Para IA integrada com explicações e chat, o Pro custa R$ 89,99/mês.',
        },
      },
      {
        '@type': 'Question',
        name: 'Quantas questões o Simulai OAB tem?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'O Simulai OAB possui 5.605 questões oficiais da OAB/FGV, cobrindo todos os exames de 2010 a 2025, em 17 matérias. O banco é atualizado automaticamente a cada novo exame.',
        },
      },
      {
        '@type': 'Question',
        name: 'Como funciona a IA do Simulai OAB?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A IA gera explicações detalhadas para cada questão e você pode tirar dúvidas conversando com ela em tempo real, como um professor particular 24/7.',
        },
      },
      {
        '@type': 'Question',
        name: 'Posso cancelar a qualquer momento?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sim. Todos os planos podem ser cancelados a qualquer momento diretamente pelo painel da sua conta, sem multa ou fidelidade.',
        },
      },
      {
        '@type': 'Question',
        name: 'Funciona no celular?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sim. O Simulai OAB é um Progressive Web App (PWA) — funciona como um aplicativo nativo no seu celular sem precisar baixar da loja.',
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
    <div className="min-h-screen bg-[#0a0e27]">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 bg-gradient-to-b from-blue-950/20 via-transparent to-purple-950/10 pointer-events-none" />

      {/* ─────────────── NAVIGATION ─────────────── */}
      <nav className="fixed top-0 w-full bg-[#0a0e27]/80 backdrop-blur-xl border-b border-white/5 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="Simulai OAB"
                width={140}
                height={70}
                style={{ width: 'auto', height: 'auto' }}
                className="h-10"
              />
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link href="#como-funciona" className="text-gray-400 hover:text-white text-sm font-medium transition">
                Como funciona
              </Link>
              <Link href="#funcionalidades" className="text-gray-400 hover:text-white text-sm font-medium transition">
                Funcionalidades
              </Link>
              <Link href="/pricing" className="text-gray-400 hover:text-white text-sm font-medium transition">
                Assinar
              </Link>
              <Link href="#faq" className="text-gray-400 hover:text-white text-sm font-medium transition">
                FAQ
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-gray-300">
                  Entrar
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  Começar grátis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative">
        {/* ─────────────── HERO ─────────────── */}
        <section className="pt-28 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              O único com IA integrada
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight mb-6">
              Passe na OAB estudando{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                com inteligência
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
              5.605 questões oficiais da FGV de 2010 a 2025, explicações geradas por IA e analytics
              de performance por matéria. Tudo em uma plataforma.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link href="/register">
                <button className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] text-base flex items-center gap-2">
                  Criar conta grátis
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="#como-funciona">
                <button className="px-8 py-3.5 bg-white/5 hover:bg-white/10 text-gray-300 font-medium rounded-xl border border-white/10 hover:border-white/20 transition-all text-base">
                  Como funciona
                </button>
              </Link>
            </div>

            {/* Micro social proof */}
            <p className="text-gray-500 text-sm mt-6">
              Sem cartão de crédito. Experimente grátis com 5 questões/dia.
            </p>
          </div>
        </section>

        {/* ─────────────── STATS BAR ─────────────── */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 border-y border-white/5">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white">5.605</div>
                <div className="text-gray-500 text-sm mt-1">Questões oficiais FGV</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white">17</div>
                <div className="text-gray-500 text-sm mt-1">Matérias cobertas</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white">16</div>
                <div className="text-gray-500 text-sm mt-1">Anos de provas (2010–2025)</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white">5</div>
                <div className="text-gray-500 text-sm mt-1">Modos de simulado</div>
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────── COMO FUNCIONA ─────────────── */}
        <section id="como-funciona" className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Comece em 3 passos
              </h2>
              <p className="text-gray-400 text-lg">
                Da conta gratuita à aprovação
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="relative">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center text-lg font-bold mb-4">
                  1
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Crie sua conta</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Cadastro em 30 segundos com Google ou e-mail. Sem cartão de crédito, sem compromisso.
                </p>
              </div>

              <div className="relative">
                <div className="w-12 h-12 bg-purple-600 text-white rounded-xl flex items-center justify-center text-lg font-bold mb-4">
                  2
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Escolha seu modo de estudo</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Simulado completo (80q), adaptativo (40q), rápido (20q), revisão de erros (30q) ou por matéria (50q).
                </p>
              </div>

              <div className="relative">
                <div className="w-12 h-12 bg-green-600 text-white rounded-xl flex items-center justify-center text-lg font-bold mb-4">
                  3
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Evolua até a aprovação</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Acompanhe sua performance por matéria, corrija seus pontos fracos com a IA e veja sua evolução em tempo real.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────── DIFERENCIAL IA ─────────────── */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white/[0.02] border-y border-white/5">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 px-3 py-1.5 rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                Exclusivo
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                IA que explica, não só corrige
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Entenda o porquê de cada resposta com explicações detalhadas e tire dúvidas em tempo real
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Explicações com IA */}
              <div className="bg-navy-900/50 border border-white/5 rounded-2xl p-8">
                <div className="w-12 h-12 bg-blue-500/15 rounded-xl flex items-center justify-center mb-5">
                  <Brain className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Explicações por IA
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-5">
                  Cada questão recebe uma explicação detalhada gerada por GPT-4. Você entende não só qual é a certa,
                  mas por que cada alternativa está errada — com referência à lei e à doutrina.
                </p>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span>Explicação de todas as 5.605 questões</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span>Linguagem clara com fundamento jurídico</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span>Análise de cada alternativa individualmente</span>
                  </div>
                </div>
              </div>

              {/* Chat */}
              <div className="bg-navy-900/50 border border-white/5 rounded-2xl p-8">
                <div className="w-12 h-12 bg-purple-500/15 rounded-xl flex items-center justify-center mb-5">
                  <MessageSquare className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Chat com IA
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-5">
                  Ficou com dúvida? Pergunte diretamente à IA sobre a questão. Ela contextualiza a resposta
                  com base no enunciado e nas alternativas — como um professor particular disponível 24/7.
                </p>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span>Respostas contextualizadas à questão</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span>Disponível em todos os planos pagos</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span>Sem limite de conversas</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────── FUNCIONALIDADES ─────────────── */}
        <section id="funcionalidades" className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Preparação completa em uma plataforma
              </h2>
              <p className="text-gray-400 text-lg">
                Simulados, analytics, revisão inteligente e mais
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <FeatureCard
                icon={<FileText className="w-5 h-5 text-purple-400" />}
                iconBg="bg-purple-500/15"
                title="Simulados realistas"
                description="Mesma distribuição de questões por matéria da FGV. Formato idêntico ao exame real com cronômetro."
              />
              <FeatureCard
                icon={<BarChart3 className="w-5 h-5 text-blue-400" />}
                iconBg="bg-blue-500/15"
                title="Analytics por matéria"
                description="Performance detalhada em cada disciplina, evolução ao longo do tempo e predição de aprovação."
              />
              <FeatureCard
                icon={<Zap className="w-5 h-5 text-amber-400" />}
                iconBg="bg-amber-500/15"
                title="Revisão inteligente"
                description="O sistema identifica seus pontos fracos e recomenda questões específicas para você evoluir mais rápido."
              />
              <FeatureCard
                icon={<Target className="w-5 h-5 text-cyan-400" />}
                iconBg="bg-cyan-500/15"
                title="5 modos de estudo"
                description="Completo, adaptativo, rápido, revisão de erros e por matéria. Cada modo com propósito definido."
              />
              <FeatureCard
                icon={<Smartphone className="w-5 h-5 text-pink-400" />}
                iconBg="bg-pink-500/15"
                title="Funciona como app"
                description="Instale direto no celular como PWA. Sem loja de apps, sem downloads pesados."
              />
              <FeatureCard
                icon={<Shield className="w-5 h-5 text-green-400" />}
                iconBg="bg-green-500/15"
                title="Banco sempre atualizado"
                description="Novas questões adicionadas automaticamente após cada exame. Você nunca fica desatualizado."
              />
            </div>
          </div>
        </section>

        {/* ─────────────── PRICING PREVIEW ─────────────── */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white/[0.02] border-y border-white/5">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Planos que cabem no seu bolso
              </h2>
              <p className="text-gray-400 text-lg">
                Comece grátis e faça upgrade quando estiver pronto
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {/* Gratuito */}
              <div className="bg-navy-900/50 border border-white/5 rounded-2xl p-6">
                <div className="text-sm font-medium text-gray-400 mb-1">Gratuito</div>
                <div className="text-3xl font-bold text-white mb-1">R$ 0</div>
                <div className="text-gray-500 text-sm mb-5">para sempre</div>
                <div className="space-y-2.5 text-sm text-gray-300">
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-gray-500" />5 questões por dia</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-gray-500" />1 simulado/mês</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-gray-500" />100 questões no banco</div>
                </div>
              </div>

              {/* Essencial */}
              <div className="bg-navy-900/50 border border-blue-500/30 rounded-2xl p-6 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Mais popular
                </div>
                <div className="text-sm font-medium text-blue-400 mb-1">Essencial</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">R$ 19,99</span>
                  <span className="text-gray-500 text-sm">/mês</span>
                </div>
                <div className="text-gray-500 text-sm mb-5">recorrência mensal</div>
                <div className="space-y-2.5 text-sm text-gray-300">
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400" />Questões ilimitadas</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400" />Simulados ilimitados</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400" />5.605 questões (banco completo)</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400" />Analytics avançado</div>
                </div>
              </div>

              {/* Pro */}
              <div className="bg-navy-900/50 border border-purple-500/30 rounded-2xl p-6 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Com IA
                </div>
                <div className="text-sm font-medium text-purple-400 mb-1">Pro</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">R$ 89,99</span>
                  <span className="text-gray-500 text-sm">/mês</span>
                </div>
                <div className="text-gray-500 text-sm mb-5">recorrência mensal</div>
                <div className="space-y-2.5 text-sm text-gray-300">
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-400" />Tudo do Essencial</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-400" />Explicações por IA ilimitadas</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-400" />Chat com IA ilimitado</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-400" />Suporte prioritário</div>
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              <Link href="/pricing">
                <Button variant="primary" size="lg">
                  Ver detalhes dos planos
                </Button>
              </Link>
              <p className="text-gray-500 text-sm mt-3">
                Cancele quando quiser. Sem fidelidade.
              </p>
            </div>
          </div>
        </section>

        {/* ─────────────── FAQ ─────────────── */}
        <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Perguntas frequentes
              </h2>
            </div>

            <div className="space-y-3">
              <FaqItem
                question="O Simulai OAB é gratuito?"
                answer="Sim! O plano gratuito permite experimentar com 5 questões por dia e 1 simulado por mês. Para questões e simulados ilimitados, o Essencial custa R$ 19,99/mês. Para IA integrada, o Pro custa R$ 89,99/mês."
              />
              <FaqItem
                question="Quantas questões estão disponíveis?"
                answer="5.605 questões oficiais da OAB/FGV cobrindo todos os exames de 2010 a 2025, organizadas em 17 matérias. O banco é atualizado automaticamente após cada novo exame."
              />
              <FaqItem
                question="Como funciona a IA?"
                answer="A IA gera explicações detalhadas para cada questão analisando todas as alternativas com fundamentação jurídica. Nos planos pagos, você também pode conversar com a IA em tempo real para tirar dúvidas específicas sobre qualquer questão."
              />
              <FaqItem
                question="Posso cancelar a qualquer momento?"
                answer="Sim. Todos os planos podem ser cancelados diretamente pelo painel da sua conta, sem multa, sem fidelidade. Seu acesso continua até o fim do período já pago."
              />
              <FaqItem
                question="Funciona no celular?"
                answer="Sim. O Simulai OAB é um Progressive Web App (PWA) — funciona como aplicativo nativo no celular sem precisar baixar da loja. Basta acessar pelo navegador e instalar com um toque."
              />
            </div>
          </div>
        </section>

        {/* ─────────────── CTA FINAL ─────────────── */}
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-10 md:p-14 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Sua aprovação começa aqui
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
                Crie sua conta gratuita e comece a praticar com o banco mais completo de questões da OAB.
              </p>
              <Link href="/register">
                <button className="px-8 py-3.5 bg-white text-blue-600 font-bold rounded-xl hover:bg-gray-100 transition-all text-base">
                  Criar conta grátis
                </button>
              </Link>
              <p className="text-white/60 text-sm mt-4">
                Sem cartão de crédito. Upgrade quando quiser.
              </p>
            </div>
          </div>
        </section>

        {/* ─────────────── FOOTER ─────────────── */}
        <footer className="border-t border-white/5 py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
              <div>
                <Image
                  src="/logo.png"
                  alt="Simulai OAB"
                  width={120}
                  height={60}
                  style={{ width: 'auto', height: 'auto' }}
                  className="h-8 mb-3"
                />
                <p className="text-gray-500 text-sm">
                  Preparação inteligente para a OAB com IA integrada.
                </p>
              </div>

              <div>
                <h4 className="text-white font-semibold text-sm mb-3">Produto</h4>
                <ul className="space-y-2 text-gray-500 text-sm">
                  <li><Link href="/practice" className="hover:text-white transition">Praticar</Link></li>
                  <li><Link href="/simulations" className="hover:text-white transition">Simulados</Link></li>
                  <li><Link href="/analytics" className="hover:text-white transition">Analytics</Link></li>
                  <li><Link href="/pricing" className="hover:text-white transition">Assinar</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold text-sm mb-3">Legal</h4>
                <ul className="space-y-2 text-gray-500 text-sm">
                  <li><Link href="/privacy" className="hover:text-white transition">Privacidade</Link></li>
                  <li><Link href="/terms" className="hover:text-white transition">Termos de Uso</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold text-sm mb-3">Contato</h4>
                <ul className="space-y-2 text-gray-500 text-sm">
                  <li>suporte@simulaioab.com.br</li>
                </ul>
              </div>
            </div>

            <div className="border-t border-white/5 pt-6 text-center text-gray-600 text-sm">
              &copy; {new Date().getFullYear()} Simulai OAB. Todos os direitos reservados.
            </div>
          </div>
        </footer>
      </div>
    </div>
    </>
  );
}

/* ─────────────── SUBCOMPONENTS ─────────────── */

function FeatureCard({
  icon,
  iconBg,
  title,
  description,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white/[0.03] border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-colors">
      <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="text-base font-semibold text-white mb-1.5">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group bg-white/[0.03] border border-white/5 rounded-xl">
      <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
        <span className="text-white font-medium text-sm pr-4">{question}</span>
        <ChevronDown className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform flex-shrink-0" />
      </summary>
      <div className="px-5 pb-5 pt-0">
        <p className="text-gray-400 text-sm leading-relaxed">{answer}</p>
      </div>
    </details>
  );
}
