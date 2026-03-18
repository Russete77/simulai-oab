/**
 * Sitemap dinâmico e paginado
 *
 * Gera sitemap.xml para melhorar indexação por buscadores.
 * Usa generateSitemaps() do Next.js para paginar automaticamente
 * (máx 1000 URLs por página de sitemap).
 */

import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db/prisma';
import { getAllBlogPosts } from '@/content/blog';

const QUESTIONS_PER_SITEMAP = 1000;
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://simulaioab.com';

// Matérias disponíveis
const subjects = [
  'etica', 'constitucional', 'civil', 'processo-civil',
  'penal', 'processo-penal', 'trabalho', 'processo-trabalho',
  'administrativo', 'tributario', 'empresarial', 'consumidor',
  'ambiental', 'crianca-adolescente', 'internacional',
  'direitos-humanos', 'geral',
];

/**
 * Gera índice de sitemaps paginados.
 * Sitemap 0 = páginas estáticas + matérias
 * Sitemap 1..N = questões (1000 por página)
 */
export async function generateSitemaps() {
  const totalQuestions = await prisma.question.count({
    where: { nullified: false },
  });

  const questionPages = Math.ceil(totalQuestions / QUESTIONS_PER_SITEMAP);

  // Página 0 = estáticas + matérias, páginas 1+ = questões
  return Array.from({ length: 1 + questionPages }, (_, i) => ({ id: i }));
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  // Next.js pode passar id como string — normalizar
  const pageId = Number(id);

  // ==========================================
  // Página 0: Estáticas + Matérias
  // ==========================================
  if (pageId === 0) {
    const staticPages: MetadataRoute.Sitemap = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 1,
      },
      {
        url: `${baseUrl}/pricing`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/register`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/login`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      },
      {
        url: `${baseUrl}/blog`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/terms`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.3,
      },
      {
        url: `${baseUrl}/privacy`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.3,
      },
    ];

    // Páginas de matérias
    const subjectPages: MetadataRoute.Sitemap = subjects.map((subject) => ({
      url: `${baseUrl}/materias/${subject}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    // Páginas de gabarito e simulado por exame
    const exams = await prisma.question.groupBy({
      by: ['examId'],
      where: { nullified: false },
    });

    const gabaritoPages: MetadataRoute.Sitemap = [
      {
        url: `${baseUrl}/gabarito`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      },
      ...exams.map((exam) => ({
        url: `${baseUrl}/gabarito/${exam.examId}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      })),
    ];

    const simuladoPages: MetadataRoute.Sitemap = exams.map((exam) => ({
      url: `${baseUrl}/simulado/${exam.examId}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }));

    // Blog posts
    const blogPosts = getAllBlogPosts();
    const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(post.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

    return [...staticPages, ...subjectPages, ...gabaritoPages, ...simuladoPages, ...blogPages];
  }

  // ==========================================
  // Páginas 1+: Questões (paginadas, 1000 por página)
  // ==========================================
  const questionPageIndex = pageId - 1; // Ajustar índice (id 1 = primeira página de questões)

  const questions = await prisma.question.findMany({
    select: {
      id: true,
      updatedAt: true,
    },
    where: {
      nullified: false,
    },
    orderBy: {
      examYear: 'desc',
    },
    skip: questionPageIndex * QUESTIONS_PER_SITEMAP,
    take: QUESTIONS_PER_SITEMAP,
  });

  return questions.map((question) => ({
    url: `${baseUrl}/questoes/${question.id}`,
    lastModified: question.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));
}
