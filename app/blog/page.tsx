import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Card, Button } from '@/components/ui';
import { Newspaper, Home, Clock, Calendar, ArrowRight } from 'lucide-react';
import { getAllBlogPosts } from '@/content/blog';
import BlogPageClient from './client';

export const metadata: Metadata = {
  title: 'Blog - Simulai OAB',
  description: 'Dicas, estratégias e conteúdos para você se preparar melhor para o Exame da OAB. Aprenda com especialistas em preparação para OAB.',
  keywords: ['blog OAB', 'dicas OAB', 'preparação OAB', 'estratégias OAB', 'como passar na OAB', 'simulai'],
  alternates: {
    canonical: 'https://www.simulaioab.com/blog',
  },
  openGraph: {
    title: 'Blog - Simulai OAB',
    description: 'Dicas, estratégias e conteúdos para você se preparar melhor para o Exame da OAB',
    type: 'website',
    url: 'https://www.simulaioab.com/blog',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog - Simulai OAB',
    description: 'Dicas, estratégias e conteúdos para você se preparar melhor para o Exame da OAB',
  },
};

export default function BlogPage() {
  const allPosts = getAllBlogPosts();

  return (
    <div className="min-h-screen bg-bg">
      <Header />
      <BlogPageClient posts={allPosts} />
    </div>
  );
}
