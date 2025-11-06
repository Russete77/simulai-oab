/**
 * Sitemap dinâmico
 *
 * Gera sitemap.xml para melhorar indexação por buscadores
 * Atualizado para incluir apenas páginas públicas + questões + matérias
 */

import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://simulaioab.com';
  
  const sitemap: MetadataRoute.Sitemap = [];

  // ==========================================
  // 1. Páginas estáticas públicas
  // ==========================================
  sitemap.push(
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
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
  );

  // ==========================================
  // 2. Páginas de matérias públicas
  // ==========================================
  const subjects = [
    'etica',
    'constitucional',
    'civil',
    'processo-civil',
    'penal',
    'processo-penal',
    'trabalho',
    'processo-trabalho',
    'administrativo',
    'tributario',
    'empresarial',
    'consumidor',
    'ambiental',
    'crianca-adolescente',
    'internacional',
    'direitos-humanos',
    'geral',
  ];

  subjects.forEach(subject => {
    sitemap.push({
      url: `${baseUrl}/materias/${subject}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  // ==========================================
  // 3. Páginas individuais de questões (SEO!)
  // ==========================================
  try {
    // Buscar todas as questões (apenas IDs para performance)
    const questions = await prisma.question.findMany({
      select: {
        id: true,
        updatedAt: true,
        subject: true,
      },
      where: {
        nullified: false, // Não incluir questões anuladas
      },
      orderBy: {
        examYear: 'desc',
      },
    });

    questions.forEach(question => {
      sitemap.push({
        url: `${baseUrl}/questoes/${question.id}`,
        lastModified: question.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    });
  } catch (error) {
    console.error('Erro ao gerar sitemap de questões:', error);
    // Em caso de erro, continua sem as questões
  }

  // ==========================================
  // 4. Páginas de blog (quando implementarmos)
  // ==========================================
  // TODO: Adicionar URLs de blog quando criar o sistema de blog
  // sitemap.push({
  //   url: `${baseUrl}/blog`,
  //   lastModified: new Date(),
  //   changeFrequency: 'daily',
  //   priority: 0.8,
  // });

  return sitemap;
}
