/**
 * Sitemap dinâmico ÚNICO (sem paginação)
 *
 * Gera sitemap.xml com todas as URLs do site.
 * Com ~6.000 URLs estamos dentro do limite de 50.000 URLs / 50MB do Google.
 *
 * Se ultrapassar 50.000 URLs no futuro, migrar para generateSitemaps().
 */

import { MetadataRoute } from 'next';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { getAllBlogPosts } from '@/content/blog';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.simulaioab.com';

// As duas queries pesadas (groupBy de exames e findMany de ~6.000 questões)
// são cacheadas por 24h. Sem isso, cada hit do crawler em /sitemap.xml puxava
// todas as linhas do banco. Revalida diariamente para refletir novas questões.
const getExamsForSitemap = unstable_cache(
  async () =>
    prisma.question.groupBy({
      by: ['examId'],
      where: { nullified: false },
    }),
  ['sitemap-exams'],
  { revalidate: 86400, tags: ['sitemap'] }
);

const getQuestionsForSitemap = unstable_cache(
  async () =>
    prisma.question.findMany({
      select: { id: true, updatedAt: true },
      where: { nullified: false },
      orderBy: { examYear: 'desc' },
    }),
  ['sitemap-questions'],
  { revalidate: 86400, tags: ['sitemap'] }
);

// Matérias disponíveis
const subjects = [
  'etica', 'constitucional', 'civil', 'processo-civil',
  'penal', 'processo-penal', 'trabalho', 'processo-trabalho',
  'administrativo', 'tributario', 'empresarial', 'consumidor',
  'ambiental', 'crianca-adolescente', 'internacional',
  'direitos-humanos', 'geral',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ==========================================
  // 1. Páginas estáticas (alta prioridade)
  // ==========================================
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/simulado-oab-online`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.95 },
    { url: `${baseUrl}/questoes-oab`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.95 },
    { url: `${baseUrl}/gabarito`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/diagnostico`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/proxima-prova-oab`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/como-funciona`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/questao-do-dia`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/leaderboard`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.6 },
    { url: `${baseUrl}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  // ==========================================
  // 2. Páginas de matérias (alta prioridade SEO)
  // ==========================================
  const subjectPages: MetadataRoute.Sitemap = subjects.map((subject) => ({
    url: `${baseUrl}/materias/${subject}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }));

  // ==========================================
  // 3. Gabaritos e simulados por exame
  // ==========================================
  const exams = await getExamsForSitemap();

  const gabaritoPages: MetadataRoute.Sitemap = exams.map((exam) => ({
    url: `${baseUrl}/gabarito/${exam.examId}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const simuladoPages: MetadataRoute.Sitemap = exams.map((exam) => ({
    url: `${baseUrl}/simulado/${exam.examId}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // ==========================================
  // 4. Blog posts
  // ==========================================
  const blogPosts = getAllBlogPosts();
  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(post.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // ==========================================
  // 5. Questões individuais (volume alto, prioridade média)
  // ==========================================
  const questions = await getQuestionsForSitemap();

  const questionPages: MetadataRoute.Sitemap = questions.map((q) => ({
    url: `${baseUrl}/questoes/${q.id}`,
    lastModified: new Date(q.updatedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...subjectPages,
    ...gabaritoPages,
    ...simuladoPages,
    ...blogPages,
    ...questionPages,
  ];
}
