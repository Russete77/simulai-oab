import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Brain, BarChart3, Zap, Trophy, BookOpen, MessageSquare, Target, Clock, ArrowRight, Play, CheckCircle, Star, Smartphone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Como Funciona o Simulai OAB — Plataforma de Simulados com IA para OAB',
  description: 'Conheça o Simulai OAB: plataforma de simulados para o Exame da OAB com 5.605 questões oficiais FGV, explicações por IA, gamificação e predição de aprovação. Saiba como funciona.',
  keywords: [
    'simulai OAB', 'como funciona simulado OAB', 'plataforma simulado OAB',
    'app OAB', 'estudar para OAB', 'preparação OAB online',
  ],
  openGraph: {
    title: 'Como Funciona o Simulai OAB',
    description: 'Plataforma de simulados para OAB com IA integrada, gamificação e predição de aprovação.',
    url: 'https://simulaioab.com/como-funciona',
  },
  alternates: {
    canonical: 'https://simulaioab.com/como-funciona',
  },
};

export default function ComoFuncionaPage() {
  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://simulaioab.com' },
      { '@type': 'ListItem', position: 2, name: 'Como Funciona', item: 'https://simulaioab.com/como-funciona' },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }} />

      <div className="min-h-screen bg-navy-950">
        <Header />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="flex items-center gap-2 text-sm text-navy-400 mb-8">
            <Link href="/" className="hover:text-white transition-colors">Início</Link>
            <span>/</span>
            <span className="text-white">Como Funciona</span>
          </nav>

          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 text-center">
            Como Funciona o Simulai OAB
          </h1>
          <p className="text-xl text-navy-300 text-center max-w-3xl mx-auto mb-16">
            A plataforma mais inteligente para passar no Exame da OAB. Conheça cada recurso e entenda por que o Simulai é diferente de tudo que existe.
          </p>

          {/* Steps */}
          <div className="space-y-12 mb-16">
            {[
              { step: 1, title: 'Crie sua conta grátis', desc: 'Cadastro rápido por email ou Google. Sem cartão de crédito. Em segundos você já está fazendo seu primeiro simulado.', icon: Play },
              { step: 2, title: 'Escolha seu modo de estudo', desc: 'Simulado Completo (80q), Adaptativo (40q), Rápido (20q), Revisão de Erros ou Por Matéria. Cada modo atende uma necessidade diferente.', icon: Target },
              { step: 3, title: 'Resolva questões oficiais FGV', desc: '5.605 questões reais de 2010 a 2025, com cronômetro e navegação idênticos à prova real. Nada de questões inventadas.', icon: BookOpen },
              { step: 4, title: 'Receba explicações com IA', desc: 'Após cada questão, a IA explica a resposta com fundamentação legal, doutrina e jurisprudência. Tire dúvidas no chat inteligente 24/7.', icon: Brain },
              { step: 5, title: 'Acompanhe sua evolução', desc: 'Dashboard de performance por matéria, predição de aprovação, ranking entre estudantes e 20+ conquistas para desbloquear.', icon: BarChart3 },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                  <span className="text-blue-400 font-bold text-lg">{item.step}</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{item.title}</h2>
                  <p className="text-navy-300 text-lg leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Features Grid */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Recursos do Simulai OAB</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Brain, title: 'IA Integrada', desc: 'Explicações detalhadas e chat inteligente com professor virtual 24/7' },
                { icon: Trophy, title: 'Gamificação', desc: '20+ conquistas, ranking, streaks e sistema de XP para manter a motivação' },
                { icon: BarChart3, title: 'Analytics', desc: 'Dashboard de performance por matéria com predição de aprovação' },
                { icon: Smartphone, title: 'PWA Mobile', desc: 'Funciona como app no celular sem baixar da loja. Suporte offline.' },
                { icon: Clock, title: 'Cronômetro Real', desc: '4 horas para 80 questões, igual à prova real da OAB' },
                { icon: Star, title: 'Questões Oficiais', desc: '5.605 questões FGV de 2010 a 2025, atualizadas a cada exame' },
              ].map((feature, i) => (
                <div key={i} className="bg-navy-900/50 border border-white/10 rounded-xl p-6">
                  <feature.icon className="w-8 h-8 text-blue-400 mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-navy-400 text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="text-center bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-12">
            <h2 className="text-3xl font-bold text-white mb-4">Pronto para Começar?</h2>
            <p className="text-navy-300 text-lg mb-8">Crie sua conta grátis e faça seu primeiro simulado agora.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-500 hover:to-purple-500 transition-all text-lg">
                <Play className="w-5 h-5" /> Criar Conta Grátis
              </Link>
              <Link href="/simulado-oab-online" className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all text-lg">
                Ver Simulados <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
