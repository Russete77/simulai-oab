'use client';

import Link from 'next/link';
import { Card, Button } from '@/components/ui';
import { BlogPost } from '@/content/blog';
import { Newspaper, Home, Clock, Calendar, ArrowRight } from 'lucide-react';
import { useState, useMemo } from 'react';

const categories = ['Todos', 'Estratégia', 'Matérias', 'Técnicas', 'Análise', 'Planejamento', 'Tecnologia'];

interface BlogPageClientProps {
  posts: BlogPost[];
}

export default function BlogPageClient({ posts }: BlogPageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const filteredPosts = useMemo(() => {
    if (selectedCategory === 'Todos') {
      return posts;
    }
    return posts.filter((post) => post.category === selectedCategory);
  }, [selectedCategory, posts]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-ink-2 mb-8">
        <Link href="/" className="hover:text-ink-1 transition-colors flex items-center gap-1">
          <Home className="w-4 h-4" />
          Início
        </Link>
        <span>/</span>
        <span className="text-ink-1">Blog</span>
      </nav>

      {/* Page Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-accent-soft border-accent mb-6">
          <Newspaper className="w-10 h-10 text-accent" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-ink-1 mb-4">Blog Simulai OAB</h1>
        <p className="text-lg text-ink-2 max-w-2xl mx-auto">
          Dicas, estratégias e conteúdos para você se preparar melhor para o Exame da OAB
        </p>
      </div>

      {/* Category Filter */}
      <div className="mb-10 flex flex-wrap gap-3 justify-center">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-surface text-ink-2 hover:bg-surface hover:text-ink-1 border'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {filteredPosts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`}>
            <Card
              variant="glass"
              className="h-full flex flex-col hover:border-accent/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
            >
              {/* Category Badge */}
              <div className="mb-4">
                <span className="inline-block px-3 py-1 rounded-lg bg-accent-soft border-accent text-accent text-xs font-semibold">
                  {post.category}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-ink-1 mb-3 line-clamp-2">
                {post.title}
              </h3>

              {/* Description */}
              <p className="text-ink-2 text-sm mb-4 line-clamp-2 flex-grow">
                {post.description}
              </p>

              {/* Meta Information */}
              <div className="flex items-center gap-4 text-xs text-ink-2 mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {post.readingTime} min
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(post.publishedAt).toLocaleDateString('pt-BR')}
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-xs text-ink-2 bg-surface-2 px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Read More Button */}
              <div className="mt-auto flex items-center gap-2 text-accent font-medium hover:text-accent transition-colors">
                Ler artigo <ArrowRight className="w-4 h-4" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {filteredPosts.length === 0 && (
        <Card variant="glass" className="border-2 border-accent text-center py-12">
          <Newspaper className="w-16 h-16 text-ink-2 mx-auto mb-4 opacity-50" />
          <p className="text-ink-2 text-lg">Nenhum artigo nesta categoria</p>
        </Card>
      )}

      {/* CTA Section */}
      <div className="mt-16 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-accent rounded-2xl p-8 sm:p-12">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-ink-1 mb-4">
            Aprenda e pratique ao mesmo tempo
          </h3>
          <p className="text-ink-2 mb-8 text-lg">
            Leia nossos artigos para entender estratégias de estudo e depois pratique com milhares de questões
            oficiais da OAB em nossa plataforma de simulados.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/practice">
              <Button variant="primary" size="lg" className="flex items-center gap-2">
                Começar a Praticar
                <ArrowRight className="w-4 h-4" />
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

      {/* SEO Internal Links */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border mt-8">
        <div className="grid md:grid-cols-3 gap-8 text-sm">
          <div>
            <h3 className="text-ink-1 font-semibold mb-3">Simulados OAB</h3>
            <div className="space-y-1">
              <Link href="/simulado-oab-online" className="block text-ink-2 hover:text-ink-1 transition-colors">Simulado OAB Online Grátis</Link>
              <Link href="/questoes-oab" className="block text-ink-2 hover:text-ink-1 transition-colors">Questões OAB Comentadas</Link>
              <Link href="/gabarito" className="block text-ink-2 hover:text-ink-1 transition-colors">Gabaritos OAB</Link>
              <Link href="/questao-do-dia" className="block text-ink-2 hover:text-ink-1 transition-colors">Questão do Dia</Link>
            </div>
          </div>
          <div>
            <h3 className="text-ink-1 font-semibold mb-3">Matérias Mais Cobradas</h3>
            <div className="space-y-1">
              <Link href="/materias/etica" className="block text-ink-2 hover:text-ink-1 transition-colors">Ética e Estatuto da OAB</Link>
              <Link href="/materias/constitucional" className="block text-ink-2 hover:text-ink-1 transition-colors">Direito Constitucional</Link>
              <Link href="/materias/civil" className="block text-ink-2 hover:text-ink-1 transition-colors">Direito Civil</Link>
              <Link href="/materias/penal" className="block text-ink-2 hover:text-ink-1 transition-colors">Direito Penal</Link>
              <Link href="/materias/processo-civil" className="block text-ink-2 hover:text-ink-1 transition-colors">Processo Civil</Link>
              <Link href="/materias/trabalho" className="block text-ink-2 hover:text-ink-1 transition-colors">Direito do Trabalho</Link>
            </div>
          </div>
          <div>
            <h3 className="text-ink-1 font-semibold mb-3">Sobre o Simulai</h3>
            <div className="space-y-1">
              <Link href="/como-funciona" className="block text-ink-2 hover:text-ink-1 transition-colors">Como Funciona</Link>
              <Link href="/pricing" className="block text-ink-2 hover:text-ink-1 transition-colors">Planos e Preços</Link>
              <Link href="/register" className="block text-ink-2 hover:text-ink-1 transition-colors">Criar Conta Grátis</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
