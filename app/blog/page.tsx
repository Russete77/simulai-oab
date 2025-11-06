import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Card, Button } from '@/components/ui';
import { Newspaper, Home, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog - Simulai OAB',
  description: 'Dicas, estratégias e conteúdos para você se preparar melhor para o Exame da OAB',
  keywords: ['blog OAB', 'dicas OAB', 'preparação OAB', 'estratégias OAB', 'como passar na OAB'],
  openGraph: {
    title: 'Blog - Simulai OAB',
    description: 'Dicas, estratégias e conteúdos para você se preparar melhor para o Exame da OAB',
    type: 'website',
    url: 'https://simulaioab.com/blog',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog - Simulai OAB',
    description: 'Dicas, estratégias e conteúdos para você se preparar melhor para o Exame da OAB',
  },
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-navy-950">
      <Header />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-navy-400 mb-6">
          <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
            <Home className="w-4 h-4" />
            Início
          </Link>
          <span>/</span>
          <span className="text-white">Blog</span>
        </nav>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-600/20 border border-blue-500/30 mb-6">
            <Newspaper className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Blog Simulai OAB</h1>
          <p className="text-xl text-navy-300 max-w-2xl mx-auto">
            Dicas, estratégias e conteúdos exclusivos para você se preparar melhor para o Exame da OAB
          </p>
        </div>

        {/* Coming Soon Card */}
        <Card variant="glass" className="border-2 border-blue-500/30">
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-2 border-blue-500/30 mb-6">
              <Newspaper className="w-12 h-12 text-blue-400" />
            </div>

            <h2 className="text-3xl font-bold text-white mb-3">
              Em Breve
            </h2>

            <p className="text-lg text-navy-300 mb-8 max-w-md mx-auto">
              Estamos preparando conteúdos incríveis para ajudar você a conquistar sua aprovação na OAB
            </p>

            <div className="space-y-4 max-w-lg mx-auto mb-8">
              <div className="flex items-start gap-3 text-left">
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                <p className="text-white/80">
                  Estratégias de estudo comprovadas para o Exame da OAB
                </p>
              </div>
              <div className="flex items-start gap-3 text-left">
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                <p className="text-white/80">
                  Análise de questões mais cobradas por matéria
                </p>
              </div>
              <div className="flex items-start gap-3 text-left">
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                <p className="text-white/80">
                  Dicas de revisão e gestão de tempo na prova
                </p>
              </div>
              <div className="flex items-start gap-3 text-left">
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                <p className="text-white/80">
                  Histórias de sucesso de aprovados usando Simulai
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register">
                <Button variant="primary" size="lg" className="flex items-center gap-2">
                  Começar a Estudar Agora
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" size="lg">
                  Voltar ao Início
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* CTA Section */}
        <div className="mt-8 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-2xl p-6 sm:p-8">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-white mb-3">
              Enquanto isso, comece a praticar
            </h3>
            <p className="text-navy-300 mb-6">
              Acesse milhares de questões oficiais da OAB, com simulados personalizados,
              estatísticas detalhadas e explicações com inteligência artificial
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/practice">
                <Button variant="primary" size="lg">
                  Praticar Questões
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="ghost" size="lg">
                  Ver Planos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
