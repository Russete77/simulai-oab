import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card, Button } from '@/components/ui';
import { getBlogPost, getAllBlogPosts } from '@/content/blog';
import { Home, ArrowLeft, Clock, Calendar, ArrowRight } from 'lucide-react';
import { ShareButton } from './share-button';

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const allPosts = getAllBlogPosts();
  return allPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return {
      title: 'Artigo não encontrado',
      description: 'O artigo que você procura não existe.',
    };
  }

  return {
    title: `${post.title} - Simulai OAB`,
    description: post.description,
    keywords: [...post.tags, 'OAB', 'blog'],
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      url: `https://simulaioab.com/blog/${post.slug}`,
      siteName: 'Simulai OAB',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  const allPosts = getAllBlogPosts();

  if (!post) {
    notFound();
  }

  // Get related posts (same category, different post)
  const relatedPosts = allPosts
    .filter((p) => p.category === post.category && p.slug !== post.slug)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-navy-950">
      <Header />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-navy-400 mb-8">
          <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
            <Home className="w-4 h-4" />
            Início
          </Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors flex items-center gap-1">
            Blog
          </Link>
          <span>/</span>
          <span className="text-white truncate">{post.title}</span>
        </nav>

        {/* Back Button */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Blog
        </Link>

        {/* Article Header */}
        <div className="mb-8">
          {/* Category Badge */}
          <div className="mb-4">
            <span className="inline-block px-4 py-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 text-sm font-semibold">
              {post.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            {post.title}
          </h1>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-6 text-navy-300 mb-8">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString('pt-BR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              {post.readingTime} min de leitura
            </div>
            <div className="text-sm">
              Por <span className="font-semibold text-white">{post.author}</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-xl text-navy-300 mb-8 italic">
            {post.description}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-12">
          {post.tags.map((tag) => (
            <a
              key={tag}
              href={`/blog?tag=${encodeURIComponent(tag)}`}
              className="px-3 py-1 rounded-lg bg-navy-900/50 border border-navy-800 text-navy-300 text-sm hover:border-blue-500 hover:text-blue-400 transition-colors"
            >
              #{tag}
            </a>
          ))}
        </div>

        {/* Content */}
        <Card variant="glass" className="mb-12 p-8">
          <div
            className="prose prose-invert max-w-none text-navy-100"
            dangerouslySetInnerHTML={{ __html: post.content }}
            style={{
              '--tw-prose-body': 'rgb(209, 213, 219)',
              '--tw-prose-headings': 'rgb(255, 255, 255)',
              '--tw-prose-strong': 'rgb(255, 255, 255)',
              '--tw-prose-links': 'rgb(59, 130, 246)',
              '--tw-prose-hr': 'rgb(30, 41, 59)',
              '--tw-prose-th-borders': 'rgb(71, 85, 105)',
              '--tw-prose-td-borders': 'rgb(71, 85, 105)',
            } as React.CSSProperties}
          />
        </Card>

        {/* Share Section */}
        <div className="mb-12 pb-12 border-b border-navy-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Compartilhe este artigo
              </h3>
              <p className="text-navy-300">
                Ajude outros candidatos a se preparar melhor para a OAB
              </p>
            </div>
            <ShareButton slug={post.slug} title={post.title} />
          </div>
        </div>

        {/* Author Info */}
        <Card variant="glass" className="mb-12 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
              <div className="text-blue-400 font-bold">S</div>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-1">
                {post.author}
              </h4>
              <p className="text-navy-300 text-sm">
                Plataforma de prática e simulados para o Exame da OAB. Criamos conteúdo educativo de qualidade
                para ajudar candidatos a conquistar sua aprovação.
              </p>
            </div>
          </div>
        </Card>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold text-white mb-8">
              Artigos Relacionados
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {relatedPosts.map((relatedPost) => (
                <Link key={relatedPost.slug} href={`/blog/${relatedPost.slug}`}>
                  <Card
                    variant="glass"
                    className="h-full flex flex-col hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  >
                    <div className="mb-4">
                      <span className="inline-block px-3 py-1 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-semibold">
                        {relatedPost.category}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2 line-clamp-2">
                      {relatedPost.title}
                    </h4>
                    <p className="text-navy-300 text-sm mb-4 line-clamp-2 flex-grow">
                      {relatedPost.description}
                    </p>
                    <div className="flex items-center gap-2 text-blue-400 font-medium hover:text-blue-300 transition-colors mt-auto">
                      Ler mais <ArrowRight className="w-4 h-4" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA Section */}
        <Card variant="glass" className="border-2 border-blue-500/30 p-8 sm:p-12">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-white mb-4">
              Pronto para começar sua preparação?
            </h3>
            <p className="text-lg text-navy-300 mb-8 max-w-2xl mx-auto">
              Coloque em prática o que aprendeu neste artigo com milhares de questões oficiais da OAB,
              simulados personalizados e análise inteligente de desempenho.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/practice">
                <Button variant="primary" size="lg" className="flex items-center gap-2">
                  Começar a Praticar
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/blog">
                <Button variant="ghost" size="lg">
                  Ver Mais Artigos
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Related Content & CTA */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-8 text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-3">Pratique com Simulados OAB</h2>
            <p className="text-navy-300 mb-6">Coloque seus conhecimentos em prática com 5.605 questões oficiais FGV e explicações por IA.</p>
            <Link href="/simulado-oab-online" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-500 hover:to-purple-500 transition-all">
              Começar Simulado Grátis
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/questoes-oab" className="bg-navy-900/50 border border-white/10 rounded-xl p-4 hover:border-blue-500/50 transition-all">
              <div className="text-white font-medium">Questões OAB Comentadas</div>
              <div className="text-sm text-navy-400">5.605 questões organizadas por matéria</div>
            </Link>
            <Link href="/gabarito" className="bg-navy-900/50 border border-white/10 rounded-xl p-4 hover:border-blue-500/50 transition-all">
              <div className="text-white font-medium">Gabaritos OAB</div>
              <div className="text-sm text-navy-400">Todos os exames com respostas comentadas</div>
            </Link>
          </div>
        </div>
      </article>

      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: post.title,
            description: post.description,
            image: post.image || 'https://simulaioab.com/og-image.png',
            datePublished: post.publishedAt,
            dateModified: post.updatedAt || post.publishedAt,
            author: {
              '@type': 'Organization',
              name: post.author,
              url: 'https://simulaioab.com',
            },
            publisher: {
              '@type': 'Organization',
              name: 'Simulai OAB',
              logo: {
                '@type': 'ImageObject',
                url: 'https://simulaioab.com/logo.png',
              },
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `https://simulaioab.com/blog/${post.slug}`,
            },
            keywords: post.tags.join(', '),
            articleBody: post.content.replace(/<[^>]*>/g, ''),
          }),
        }}
      />
    </div>
  );
}
